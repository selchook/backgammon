import { useState, useEffect, useRef, useCallback } from 'react';
import Ably from 'ably';
import {
  createInitialState, rollDice, applyMove, skipTurn,
  getValidMoves, getMovableSources, hasAnyMove, canBearOff
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
        setGameState(msg.data.state);
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

    const dice = rollDice();
    const newState = { ...gs, dice, phase: 'moving' };

    // If no moves possible, auto-skip
    if (!hasAnyMove(newState, gs.currentPlayer)) {
      const skipped = skipTurn(newState);
      gameStateRef.current = skipped;
      setGameState(skipped);
      setLastEvent({ type: 'no-moves' });
      publishState(skipped);
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

    // If clicking a valid destination → make the move
    if (selectedPoint !== null && validDestinations.some(d => d.to === point || (point === 'bearoff' && (d.to === 0 || d.to === 25)))) {
      const matchDest = validDestinations.find(d => {
        if (point === 'bearoff') return d.to === 0 || d.to === 25;
        return d.to === point;
      });
      if (!matchDest) return;

      const newState = applyMove(gs, selectedPoint, matchDest.to, matchDest.die);
      gameStateRef.current = newState;
      setGameState(newState);
      setSelectedPoint(null);
      setValidDestinations([]);
      publishState(newState);

      if (newState.phase === 'ended') setStatus('ended');
      return;
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
      // Invalid drop target — select the source so the player can tap a dest
      if (moves.length > 0) {
        setSelectedPoint(from);
        setValidDestinations(moves);
      }
      return;
    }

    const newState = applyMove(gs, from, match.to, match.die);
    gameStateRef.current = newState;
    setGameState(newState);
    setSelectedPoint(null);
    setValidDestinations([]);
    publishState(newState);
    if (newState.phase === 'ended') setStatus('ended');
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

  const isMyTurn = gameState?.currentPlayer === playerColor;
  const bearingOff = gameState ? canBearOff(gameState, playerColor) : false;

  return {
    gameState,
    playerColor,
    roomId,
    status,
    selectedPoint,
    validDestinations,
    movableSources,
    opponentConnected,
    chatMessages,
    lastEvent,
    isMyTurn,
    bearingOff,
    createRoom,
    joinRoom,
    handleRoll,
    handleSelectPoint,
    handleDirectMove,
    sendChat,
    handleRematch,
  };
}
