import { useState, useEffect, useRef, useCallback } from 'react';
import Ably from 'ably';
import { playDiceRoll, playCheckerMove, playCheckerHit } from '../utils/sounds';
import {
  createInitialState, rollDice, applyMove, skipTurn,
  getValidMoves, getMovableSources, hasAnyMove, canBearOff, opponent
} from '../game/backgammon';

const generateRoomId = () => Math.random().toString(36).substr(2, 6).toUpperCase();
const generateClientId = () => `p-${Math.random().toString(36).substr(2, 8)}`;

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

  const ablyRef = useRef(null);
  const channelRef = useRef(null);
  const clientId = useRef(generateClientId());
  const playerColorRef = useRef(null);
  const gameStateRef = useRef(null);
  const moveHistory = useRef([]); // states before each move this turn

  // Keep refs in sync
  useEffect(() => { playerColorRef.current = playerColor; }, [playerColor]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

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

    // If no moves possible, show dice briefly then auto-skip
    if (!hasAnyMove(newState, gs.currentPlayer)) {
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

    // Combined (two-dice) move: tap a blue-ring destination
    if (selectedPoint !== null && typeof point === 'number' && gs.dice.length === 2) {
      for (const firstMove of validDestinations) {
        if (firstMove.to < 1 || firstMove.to > 24) continue;
        const mid = applyMove(gs, selectedPoint, firstMove.to, firstMove.die);
        if (mid.phase !== 'moving' || mid.currentPlayer !== playerColorRef.current) continue;
        const secondMoves = getValidMoves(mid, firstMove.to, playerColorRef.current);
        const secondMatch = secondMoves.find(m => m.to === point);
        if (secondMatch) {
          const isHit = gs.points[point]?.color === opponent(gs.currentPlayer) && gs.points[point].count === 1;
          isHit ? playCheckerHit() : playCheckerMove();
          moveHistory.current.push(gs);
          const final = applyMove(mid, firstMove.to, secondMatch.to, secondMatch.die);
          gameStateRef.current = final;
          setGameState(final);
          setSelectedPoint(null);
          setValidDestinations([]);
          publishState(final);
          if (final.phase === 'ended') setStatus('ended');
          return;
        }
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
      // Try combined two-dice move (drag to blue-ring destination)
      if (typeof to === 'number' && gs.dice.length === 2) {
        for (const firstMove of moves) {
          if (firstMove.to < 1 || firstMove.to > 24) continue;
          const mid = applyMove(gs, from, firstMove.to, firstMove.die);
          if (mid.phase !== 'moving' || mid.currentPlayer !== player) continue;
          const secondMoves = getValidMoves(mid, firstMove.to, player);
          const secondMatch = secondMoves.find(m => m.to === to);
          if (secondMatch) {
            const isHit = gs.points[to]?.color === opponent(player) && gs.points[to].count === 1;
            isHit ? playCheckerHit() : playCheckerMove();
            moveHistory.current.push(gs);
            const final = applyMove(mid, firstMove.to, secondMatch.to, secondMatch.die);
            gameStateRef.current = final;
            setGameState(final);
            setSelectedPoint(null);
            setValidDestinations([]);
            publishState(final);
            if (final.phase === 'ended') setStatus('ended');
            return;
          }
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
    const newState = createInitialState();
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

  // Two-dice combined destinations for the selected piece (reachable only by using both dice in sequence)
  const combinedDests = (() => {
    if (!selectedPoint || !gameState || gameState.phase !== 'moving' || gameState.currentPlayer !== playerColor) return [];
    if (validDestinations.length === 0 || gameState.dice.length < 2) return [];
    const singleDests = new Set(validDestinations.map(m => m.to));
    const combined = new Set();
    for (const firstMove of validDestinations) {
      if (firstMove.to < 1 || firstMove.to > 24) continue; // skip bear-off intermediates
      const after = applyMove(gameState, selectedPoint, firstMove.to, firstMove.die);
      if (after.phase !== 'moving' || after.currentPlayer !== playerColor) continue;
      for (const sm of getValidMoves(after, firstMove.to, playerColor)) {
        if (!singleDests.has(sm.to) && sm.to >= 1 && sm.to <= 24) combined.add(sm.to);
      }
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
