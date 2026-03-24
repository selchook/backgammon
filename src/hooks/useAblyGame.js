import { useState, useEffect, useRef, useCallback } from 'react';
import Ably from 'ably';
import { playDiceRoll, playCheckerMove, playCheckerHit, playNoMoves } from '../utils/sounds';
import {
  createInitialState, rollDice, applyMove, skipTurn,
  getValidMoves, getMovableSources, hasAnyMove, canBearOff, opponent
} from '../game/backgammon';

const generateRoomId = () => Math.random().toString(36).substr(2, 6).toUpperCase();
const generateClientId = () => `p-${Math.random().toString(36).substr(2, 8)}`;

// ─── PATH FINDER ──────────────────────────────────────────────────────────────
// DFS: find the shortest sequence of valid moves from `from` to reach `to`.
// Returns [{from, to, die}, ...] or null. Terminates because each step
// consumes one die (bounded depth = initial dice count, max 4).
function findMovePath(gs, from, to, player) {
  function dfs(state, curPt) {
    if (state.dice.length === 0) return null;
    for (const m of getValidMoves(state, curPt, player)) {
      if (m.to === to) return [{ from: curPt, to: m.to, die: m.die }];
      if (m.to < 1 || m.to > 24) continue; // can't continue from off-board
      const next = applyMove(state, curPt, m.to, m.die);
      if (next.phase !== 'moving' || next.currentPlayer !== player) continue;
      if (next.bar[player] > 0) continue; // must clear bar before continuing a board path
      const rest = dfs(next, m.to);
      if (rest) return [{ from: curPt, to: m.to, die: m.die }, ...rest];
    }
    return null;
  }
  return dfs(gs, from);
}

// Returns true only when canBearOff is true AND every available move is a bear-off (no board moves).
function allMovesAreBearOff(state, player) {
  if (!canBearOff(state, player)) return false;
  const sources = getMovableSources(state, player);
  if (sources.length === 0) return false;
  for (const src of sources) {
    for (const m of getValidMoves(state, src, player)) {
      if (m.to >= 1 && m.to <= 24) return false; // a board move exists
    }
  }
  return true;
}

// Greedily applies all bear-off moves until dice run out or turn ends.
function autoCollectAll(state, player) {
  let s = state;
  while (s.phase === 'moving' && s.currentPlayer === player) {
    const sources = getMovableSources(s, player);
    if (sources.length === 0) break;
    const from = sources[0];
    const moves = getValidMoves(s, from, player);
    if (moves.length === 0) break;
    s = applyMove(s, from, moves[0].to, moves[0].die);
  }
  return s;
}

export function useAblyGame() {
  const [gameState, setGameState] = useState(null);
  const [playerColor, setPlayerColor] = useState(null); // 'white' | 'black'
  const [roomId, setRoomId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | waiting | playing | ended
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [validDestinations, setValidDestinations] = useState([]);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [autoCollect, setAutoCollect] = useState(false);

  const ablyRef = useRef(null);
  const channelRef = useRef(null);
  const clientId = useRef(generateClientId());
  const playerColorRef = useRef(null);
  const gameStateRef = useRef(null);
  const moveHistory = useRef([]); // states before each move this turn
  const autoCollectRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { playerColorRef.current = playerColor; }, [playerColor]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { autoCollectRef.current = autoCollect; }, [autoCollect]);

  const initAbly = useCallback(async () => {
    const key = import.meta.env.VITE_ABLY_API_KEY;
    if (!key) throw new Error('VITE_ABLY_API_KEY is not set');

    const ably = new Ably.Realtime({ key, clientId: clientId.current });
    ablyRef.current = ably;
    await new Promise((resolve, reject) => {
      ably.connection.on('connected', resolve);
      ably.connection.on('failed', reject);
    });
    return ably;
  }, []);

  const publishState = useCallback((state, eventName = 'state-sync') => {
    channelRef.current?.publish(eventName, { state });
  }, []);

  const subscribeToChannel = useCallback((channel, color) => {
    // Opponent joined
    channel.subscribe('player-join', (msg) => {
      if (msg.data.clientId !== clientId.current) {
        setOpponentConnected(true);
        setLastEvent({ type: 'join' });
        // If we're white (host), start the game
        if (playerColorRef.current === 'white') {
          const initial = createInitialState();
          gameStateRef.current = initial;
          setGameState(initial);
          setStatus('playing');
          channel.publish('game-start', { state: initial });
        }
      }
    });

    // Game started (for black/joiner)
    channel.subscribe('game-start', (msg) => {
      if (color === 'black') {
        setOpponentConnected(true);
        setGameState(msg.data.state);
        setStatus('playing');
      }
    });

    // State sync (moves, rolls)
    channel.subscribe('state-sync', (msg) => {
      if (msg.clientId !== clientId.current) {
        const incoming = msg.data.state;
        const prev = gameStateRef.current;
        // Opponent just rolled — play dice sound
        if (incoming.dice?.length > 0 && prev?.dice?.length === 0) {
          playDiceRoll();
        } else if (prev?.dice?.length > 0 && incoming.dice?.length < prev.dice.length) {
          // Opponent moved — detect if one of MY pieces was hit (sent to bar)
          const me = playerColorRef.current;
          if (me && incoming.bar[me] > (prev?.bar[me] ?? 0)) {
            playCheckerHit();
          } else {
            playCheckerMove();
          }
        }
        setGameState(incoming);
        setSelectedPoint(null);
        setValidDestinations([]);
      }
    });

    // Chat
    channel.subscribe('chat', (msg) => {
      if (msg.clientId !== clientId.current) {
        setChatMessages(prev => [...prev, { sender: 'opponent', text: msg.data.text, ts: Date.now() }]);
      }
    });
  }, []);

  // ─── CREATE ROOM ─────────────────────────────────────────────────────────
  const createRoom = useCallback(async () => {
    const ably = await initAbly();
    const id = generateRoomId();
    const channel = ably.channels.get(`backgammon-${id}`);
    channelRef.current = channel;

    setRoomId(id);
    setPlayerColor('white');
    playerColorRef.current = 'white';
    setStatus('waiting');

    // Attach before subscribing so the server confirms our subscription
    // before we publish — prevents missing messages on slow connections.
    await channel.attach();
    subscribeToChannel(channel, 'white');

    // Announce ourselves
    await channel.publish('player-join', { clientId: clientId.current, color: 'white' });

    return id;
  }, [initAbly, subscribeToChannel]);

  // ─── JOIN ROOM ────────────────────────────────────────────────────────────
  const joinRoom = useCallback(async (id) => {
    const ably = await initAbly();
    const channel = ably.channels.get(`backgammon-${id}`);
    channelRef.current = channel;

    setRoomId(id);
    setPlayerColor('black');
    playerColorRef.current = 'black';
    setStatus('waiting');

    // Attach first so our game-start subscription is live before we publish
    // player-join. Without this, white can respond with game-start before
    // black's subscription is registered server-side (race on mobile).
    await channel.attach();
    subscribeToChannel(channel, 'black');

    await channel.publish('player-join', { clientId: clientId.current, color: 'black' });
  }, [initAbly, subscribeToChannel]);

  // ─── ROLL DICE ────────────────────────────────────────────────────────────
  const handleRoll = useCallback(() => {
    const gs = gameStateRef.current;
    if (!gs || gs.phase !== 'rolling') return;
    if (gs.currentPlayer !== playerColorRef.current) return;

    moveHistory.current = []; // new turn — clear undo history
    const dice = rollDice();
    const newState = { ...gs, dice, phase: 'moving' };

    // If no moves possible, play beep, show dice briefly then auto-skip
    if (!hasAnyMove(newState, gs.currentPlayer)) {
      playNoMoves();
      gameStateRef.current = newState;
      setGameState(newState);
      publishState(newState);
      setTimeout(() => {
        const skipped = skipTurn(newState);
        gameStateRef.current = skipped;
        setGameState(skipped);
        setLastEvent({ type: 'no-moves' });
        publishState(skipped);
      }, 1200);
      return;
    }

    // Auto-collect: toggle on and every available move is a bear-off
    if (autoCollectRef.current && allMovesAreBearOff(newState, gs.currentPlayer)) {
      gameStateRef.current = newState;
      setGameState(newState);
      publishState(newState); // show dice briefly before collecting
      setTimeout(() => {
        const final = autoCollectAll(newState, gs.currentPlayer);
        gameStateRef.current = final;
        setGameState(final);
        publishState(final);
        if (final.phase === 'ended') setStatus('ended');
      }, 700);
      return;
    }

    gameStateRef.current = newState;
    setGameState(newState);
    publishState(newState);
  }, [publishState]);

  // ─── SELECT POINT ─────────────────────────────────────────────────────────
  const handleSelectPoint = useCallback((point) => {
    const gs = gameStateRef.current;
    if (!gs || gs.phase !== 'moving') return;
    if (gs.currentPlayer !== playerColorRef.current) return;

    // Tap same selected piece → deselect
    if (point === selectedPoint) {
      setSelectedPoint(null);
      setValidDestinations([]);
      return;
    }

    // If clicking a valid destination → make the move
    if (selectedPoint !== null && validDestinations.some(d => d.to === point || (point === 'bearoff' && (d.to === 0 || d.to === 25)))) {
      const matchDest = validDestinations.find(d => {
        if (point === 'bearoff') return d.to === 0 || d.to === 25;
        return d.to === point;
      });
      if (!matchDest) return;

      const isHit = typeof matchDest.to === 'number' && gs.points[matchDest.to]?.color === opponent(gs.currentPlayer) && gs.points[matchDest.to].count === 1;
      isHit ? playCheckerHit() : playCheckerMove();
      moveHistory.current.push(gs); // save state before move for undo
      const newState = applyMove(gs, selectedPoint, matchDest.to, matchDest.die);
      gameStateRef.current = newState;
      setGameState(newState);
      setSelectedPoint(null);
      setValidDestinations([]);
      publishState(newState);

      if (newState.phase === 'ended') setStatus('ended');
      return;
    }

    // Multi-die combined move: tap a blue-ring destination (board point)
    if (selectedPoint !== null && typeof point === 'number') {
      const path = findMovePath(gs, selectedPoint, point, gs.currentPlayer);
      if (path && path.length >= 2) {
        const isHit = gs.points[point]?.color === opponent(gs.currentPlayer) && gs.points[point].count === 1;
        isHit ? playCheckerHit() : playCheckerMove();
        moveHistory.current.push(gs);
        let state = gs;
        for (const step of path) state = applyMove(state, step.from, step.to, step.die);
        gameStateRef.current = state;
        setGameState(state);
        setSelectedPoint(null);
        setValidDestinations([]);
        publishState(state);
        if (state.phase === 'ended') setStatus('ended');
        return;
      }
    }

    // Multi-die combined bear-off: tap the bear-off tray when no single die reaches it
    // e.g. piece on 5 with dice [2,3] → move 5→3 then bear off 3 with die 3
    if (selectedPoint !== null && point === 'bearoff') {
      const bearPt = gs.currentPlayer === 'white' ? 0 : 25;
      const path = findMovePath(gs, selectedPoint, bearPt, gs.currentPlayer);
      if (path && path.length >= 1) {
        playCheckerMove();
        moveHistory.current.push(gs);
        let state = gs;
        for (const step of path) state = applyMove(state, step.from, step.to, step.die);
        gameStateRef.current = state;
        setGameState(state);
        setSelectedPoint(null);
        setValidDestinations([]);
        publishState(state);
        if (state.phase === 'ended') setStatus('ended');
        return;
      }
    }

    // If clicking a bar when we have checkers there
    if (point === 'bar') {
      if (gs.bar[gs.currentPlayer] > 0) {
        const moves = getValidMoves(gs, 'bar', gs.currentPlayer);
        setSelectedPoint('bar');
        setValidDestinations(moves);
      }
      return;
    }

    // Select a piece
    if (
      typeof point === 'number' &&
      gs.points[point]?.color === gs.currentPlayer &&
      gs.points[point].count > 0 &&
      gs.bar[gs.currentPlayer] === 0
    ) {
      const moves = getValidMoves(gs, point, gs.currentPlayer);
      if (moves.length > 0) {
        setSelectedPoint(point);
        setValidDestinations(moves);
      } else {
        setSelectedPoint(null);
        setValidDestinations([]);
      }
      return;
    }

    // Deselect
    setSelectedPoint(null);
    setValidDestinations([]);
  }, [selectedPoint, validDestinations, publishState]);

  // ─── DIRECT MOVE (for touch drag — bypasses stale closure) ───────────────
  // Uses only refs, never reads selectedPoint/validDestinations from closure.
  const handleDirectMove = useCallback((from, to) => {
    const gs = gameStateRef.current;
    const player = playerColorRef.current;
    if (!gs || gs.phase !== 'moving' || gs.currentPlayer !== player) return;

    const moves = getValidMoves(gs, from, player);
    const match = moves.find(d =>
      to === 'bearoff' ? (d.to === 0 || d.to === 25) : d.to === to
    );

    if (!match) {
      // Try combined multi-dice move (drag to blue-ring board destination)
      if (typeof to === 'number') {
        const path = findMovePath(gs, from, to, player);
        if (path && path.length >= 2) {
          const isHit = gs.points[to]?.color === opponent(player) && gs.points[to].count === 1;
          isHit ? playCheckerHit() : playCheckerMove();
          moveHistory.current.push(gs);
          let state = gs;
          for (const step of path) state = applyMove(state, step.from, step.to, step.die);
          gameStateRef.current = state;
          setGameState(state);
          setSelectedPoint(null);
          setValidDestinations([]);
          publishState(state);
          if (state.phase === 'ended') setStatus('ended');
          return;
        }
      }
      // Try combined multi-dice bear-off (e.g. piece on 5, dice [2,3] → 5→3 then 3→off)
      if (to === 'bearoff') {
        const bearPt = player === 'white' ? 0 : 25;
        const path = findMovePath(gs, from, bearPt, player);
        if (path && path.length >= 1) {
          playCheckerMove();
          moveHistory.current.push(gs);
          let state = gs;
          for (const step of path) state = applyMove(state, step.from, step.to, step.die);
          gameStateRef.current = state;
          setGameState(state);
          setSelectedPoint(null);
          setValidDestinations([]);
          publishState(state);
          if (state.phase === 'ended') setStatus('ended');
          return;
        }
      }
      // Invalid drop target — select the source so the player can tap a dest
      if (moves.length > 0) {
        setSelectedPoint(from);
        setValidDestinations(moves);
      }
      return;
    }

    const isHit = typeof match.to === 'number' && gs.points[match.to]?.color === opponent(player) && gs.points[match.to].count === 1;
    isHit ? playCheckerHit() : playCheckerMove();
    moveHistory.current.push(gs); // save state before move for undo
    const newState = applyMove(gs, from, match.to, match.die);
    gameStateRef.current = newState;
    setGameState(newState);
    setSelectedPoint(null);
    setValidDestinations([]);
    publishState(newState);
    if (newState.phase === 'ended') setStatus('ended');
  }, [publishState]);

  // ─── UNDO MOVE ────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (moveHistory.current.length === 0) return;
    const prev = moveHistory.current.pop();
    gameStateRef.current = prev;
    setGameState(prev);
    setSelectedPoint(null);
    setValidDestinations([]);
    publishState(prev);
  }, [publishState]);

  // ─── SEND CHAT ────────────────────────────────────────────────────────────
  const sendChat = useCallback((text) => {
    if (!channelRef.current || !text.trim()) return;
    setChatMessages(prev => [...prev, { sender: 'me', text, ts: Date.now() }]);
    channelRef.current.publish('chat', { text });
  }, []);

  // ─── REMATCH ─────────────────────────────────────────────────────────────
  const handleRematch = useCallback(() => {
    const winner = gameStateRef.current?.winner;
    const newState = { ...createInitialState(), ...(winner ? { currentPlayer: winner } : {}) };
    gameStateRef.current = newState;
    setGameState(newState);
    setStatus('playing');
    setSelectedPoint(null);
    setValidDestinations([]);
    publishState(newState, 'game-start');
    channelRef.current?.publish('game-start', { state: newState });
  }, [publishState]);

  // ─── COMPUTED ─────────────────────────────────────────────────────────────
  const movableSources = gameState && gameState.phase === 'moving' && gameState.currentPlayer === playerColor
    ? getMovableSources(gameState, playerColor)
    : [];

  // Combined destinations: all board points reachable only by using 2+ dice in sequence.
  // Works for doubles (4 dice) — explores all depths recursively.
  const combinedDests = (() => {
    if (!selectedPoint || !gameState || gameState.phase !== 'moving' || gameState.currentPlayer !== playerColor) return [];
    if (validDestinations.length === 0 || gameState.dice.length < 2) return [];
    const singleDests = new Set(validDestinations.map(m => m.to));
    const combined = new Set();
    // Recursively explore moves from intermediate positions, adding any new board points found
    function explore(state, from) {
      for (const m of getValidMoves(state, from, playerColor)) {
        if (m.to < 1 || m.to > 24) continue;
        if (!singleDests.has(m.to)) combined.add(m.to);
        const next = applyMove(state, from, m.to, m.die);
        if (next.phase !== 'moving' || next.currentPlayer !== playerColor) continue;
        if (next.dice.length >= 1) explore(next, m.to);
      }
    }
    for (const fd of validDestinations) {
      if (fd.to < 1 || fd.to > 24) continue;
      const after = applyMove(gameState, selectedPoint, fd.to, fd.die);
      if (after.phase !== 'moving' || after.currentPlayer !== playerColor) continue;
      if (after.bar[playerColor] > 0) continue; // remaining bar pieces must be entered first
      explore(after, fd.to);
    }
    // Check if a multi-die path to bear-off exists (e.g. piece on 5, dice [2,3] → 5→3→off)
    const bearPt = playerColor === 'white' ? 0 : 25;
    if (!singleDests.has(bearPt) && canBearOff(gameState, playerColor)) {
      const path = findMovePath(gameState, selectedPoint, bearPt, playerColor);
      if (path && path.length >= 1) combined.add('bearoff');
    }
    return [...combined];
  })();

  const isMyTurn = gameState?.currentPlayer === playerColor;
  const bearingOff = gameState ? canBearOff(gameState, playerColor) : false;
  const canUndo = moveHistory.current.length > 0 && gameState?.phase === 'moving' && isMyTurn;

  return {
    gameState,
    playerColor,
    roomId,
    status,
    selectedPoint,
    validDestinations,
    movableSources,
    combinedDests,
    opponentConnected,
    chatMessages,
    lastEvent,
    isMyTurn,
    bearingOff,
    canUndo,
    autoCollect,
    setAutoCollect,
    createRoom,
    joinRoom,
    handleRoll,
    handleSelectPoint,
    handleDirectMove,
    handleUndo,
    sendChat,
    handleRematch,
  };
}
