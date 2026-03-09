import { useEffect, useState } from 'react';
import { useAblyGame } from './hooks/useAblyGame';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import Board from './components/Board';
import GameInfo from './components/GameInfo';

// Board natural pixel dimensions (from Board.jsx layout constants)
// Width:  12 pts×54 + 11 gaps×2 + bar 60 + bearoff 55 + 3 inter-gaps×2 + felt-pad 12 + outer-pad 16 + border 6 = 823
// Height: top 180 + centre 30 + bottom 180 + row-margins 8 + felt-pad 16 + outer-pad 32 + border 6 = 452
const BOARD_W = 823;
const BOARD_H = 452;
const SIDEBAR_W = 240;
const GAP = 20;
const LANDSCAPE_W = BOARD_W + GAP + SIDEBAR_W; // 1083

// Target: board fills 2/3 of viewport height
const TARGET_H_RATIO = 2 / 3;

function useScale() {
  const compute = () => {
    const portrait = window.innerHeight > window.innerWidth;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Scale so board height = 2/3 of viewport
    const scaleByHeight = (vh * TARGET_H_RATIO) / BOARD_H;
    // Also constrain so total width fits
    const scaleByWidth  = portrait
      ? vw / BOARD_W          // portrait: board fills full width
      : vw / LANDSCAPE_W;     // landscape: board + sidebar fit

    const scale = Math.min(scaleByHeight, scaleByWidth, 2.0);
    return { portrait, scale: Math.max(0.2, scale) };
  };

  const [state, setState] = useState(compute);

  useEffect(() => {
    const update = () => setState(compute());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', () => setTimeout(update, 150));
    return () => window.removeEventListener('resize', update);
  }, []);

  return state;
}

export default function App() {
  const {
    gameState, playerColor, roomId, status,
    selectedPoint, validDestinations, movableSources,
    opponentConnected, chatMessages, isMyTurn,
    createRoom, joinRoom, handleRoll, handleSelectPoint,
    sendChat, handleRematch,
  } = useAblyGame();

  const { portrait, scale } = useScale();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room && status === 'idle') joinRoom(room.toUpperCase());
  }, []);

  if (status === 'idle')    return <Lobby onCreateRoom={createRoom} onJoinRoom={joinRoom} />;
  if (status === 'waiting') return <WaitingRoom roomId={roomId} playerColor={playerColor} onBack={() => window.location.reload()} />;

  return (
    /* Fullscreen fixed container — always centres content */
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'radial-gradient(ellipse at center, #1a0d04 0%, #0d0703 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: portrait ? 'auto' : 'hidden',
      fontFamily: 'Playfair Display, serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 8, flexShrink: 0,
      }}>
        <div style={{ fontSize: 20, filter: 'drop-shadow(0 2px 8px rgba(200,168,75,0.5))' }}>🎲</div>
        <h1 style={{
          margin: 0, fontSize: 24, fontWeight: 900,
          color: '#e8d48c', letterSpacing: 6,
          textShadow: '0 2px 16px rgba(200,168,75,0.3)',
        }}>TAVLA</h1>
        <div style={{ fontSize: 20, filter: 'drop-shadow(0 2px 8px rgba(200,168,75,0.5))', transform: 'scaleX(-1)' }}>🎲</div>
      </div>

      {/* Game area — zoom: scale makes board fill 2/3 of screen height */}
      <div style={{
        display: 'flex',
        flexDirection: portrait ? 'column' : 'row',
        gap: portrait ? 10 : GAP,
        alignItems: portrait ? 'center' : 'flex-start',
        zoom: scale,
        flexShrink: 0,
      }}>
        <Board
          gameState={gameState}
          selectedPoint={selectedPoint}
          validDestinations={validDestinations}
          movableSources={movableSources}
          playerColor={playerColor}
          isMyTurn={isMyTurn}
          onSelectPoint={handleSelectPoint}
        />
        <GameInfo
          gameState={gameState}
          playerColor={playerColor}
          isMyTurn={isMyTurn}
          onRoll={handleRoll}
          chatMessages={chatMessages}
          onSendChat={sendChat}
          onRematch={handleRematch}
          roomId={roomId}
          opponentConnected={opponentConnected}
          portrait={portrait}
        />
      </div>

      {/* Orientation label */}
      <div style={{
        marginTop: 6, flexShrink: 0,
        color: '#4a3820', fontSize: 10,
        fontFamily: 'Space Mono', letterSpacing: 2,
      }}>
        You are playing as {playerColor === 'white' ? '⬜ CREAM (moves right→left)' : '🟥 RED (moves left→right)'}
      </div>
    </div>
  );
}
