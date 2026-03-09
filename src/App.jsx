import { useEffect, useState } from 'react';
import { useAblyGame } from './hooks/useAblyGame';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import Board from './components/Board';
import GameInfo from './components/GameInfo';

// Precise board dimensions (derived from Board.jsx constants):
//   12 pts × 54px + 11 gaps × 2px + bar 60px + bearoff 55px + 3 inter-gaps × 2px
//   + felt padding 12px + outer padding 16px + border 6px = 823px wide
//   top 180 + centre 30 + bottom 180 + margins 8 + felt pad 16 + outer pad 32 + border 6 = 452px tall
const BOARD_W = 823;
const BOARD_H = 452;
const SIDEBAR_W = 240;
const GAP = 20;
const LANDSCAPE_W = BOARD_W + GAP + SIDEBAR_W; // 1083
const LANDSCAPE_H = BOARD_H;

function useScale() {
  const compute = () => {
    const portrait = window.innerHeight > window.innerWidth;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const HEADER_H = 48;  // title bar height
    const LABEL_H  = 22;  // orientation label at bottom
    const padding  = portrait ? 4 : 8;

    let scale;
    if (portrait) {
      // Fill width; vertical scroll handles the stacked GameInfo
      scale = (vw - padding * 2) / BOARD_W;
    } else {
      // Fill both axes — remove the cap so board expands on large screens too
      const sw = (vw - padding * 2) / LANDSCAPE_W;
      const sh = (vh - HEADER_H - LABEL_H - padding * 2) / LANDSCAPE_H;
      scale = Math.min(sw, sh);
    }
    return { portrait, scale: Math.min(2, Math.max(0.3, scale)) };
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
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #1a0d04 0%, #0d0703 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: portrait ? 'flex-start' : 'center',
      padding: portrait ? '4px' : '8px',
      fontFamily: 'Playfair Display, serif',
      overflow: portrait ? 'auto' : 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: portrait ? 6 : 10,
        marginTop: portrait ? 4 : 0,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 22, filter: 'drop-shadow(0 2px 8px rgba(200,168,75,0.5))' }}>🎲</div>
        <h1 style={{
          margin: 0, fontSize: 26, fontWeight: 900,
          color: '#e8d48c', letterSpacing: 6,
          textShadow: '0 2px 16px rgba(200,168,75,0.3)',
        }}>TAVLA</h1>
        <div style={{ fontSize: 22, filter: 'drop-shadow(0 2px 8px rgba(200,168,75,0.5))', transform: 'scaleX(-1)' }}>🎲</div>
      </div>

      {/* Game area — zoom scales without layout dead-space issues */}
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
