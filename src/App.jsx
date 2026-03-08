import React, { useEffect, useState } from 'react';
import { useAblyGame } from './hooks/useAblyGame';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import Board from './components/Board';
import GameInfo from './components/GameInfo';

// Approximate natural dimensions of the game layout
const BOARD_NAT_W   = 830;  // board width in px
const SIDEBAR_W     = 260;  // GameInfo width in px
const LAYOUT_GAP    = 20;
const LANDSCAPE_NAT_W = BOARD_NAT_W + SIDEBAR_W + LAYOUT_GAP; // ~1110
const LANDSCAPE_NAT_H = 520;  // board + center strip height
const PORTRAIT_NAT_W  = BOARD_NAT_W;

function useResponsive() {
  const calc = () => {
    const portrait = window.innerHeight > window.innerWidth;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let scale;
    if (portrait) {
      scale = Math.min(1, (vw - 8) / PORTRAIT_NAT_W);
    } else {
      const sw = Math.min(1, (vw - 16) / LANDSCAPE_NAT_W);
      const sh = Math.min(1, (vh - 90) / LANDSCAPE_NAT_H);
      scale = Math.min(sw, sh);
    }
    return { portrait, scale: Math.max(0.3, scale) };
  };

  const [state, setState] = useState(calc);

  useEffect(() => {
    const update = () => setState(calc());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', () => setTimeout(update, 150));
    return () => window.removeEventListener('resize', update);
  }, []);

  return state;
}

export default function App() {
  const {
    gameState,
    playerColor,
    roomId,
    status,
    selectedPoint,
    validDestinations,
    movableSources,
    opponentConnected,
    chatMessages,
    isMyTurn,
    createRoom,
    joinRoom,
    handleRoll,
    handleSelectPoint,
    sendChat,
    handleRematch,
  } = useAblyGame();

  const { portrait, scale } = useResponsive();

  // Auto-join from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room && status === 'idle') {
      joinRoom(room.toUpperCase());
    }
  }, []);

  if (status === 'idle') {
    return <Lobby onCreateRoom={createRoom} onJoinRoom={joinRoom} />;
  }

  if (status === 'waiting') {
    return (
      <WaitingRoom
        roomId={roomId}
        playerColor={playerColor}
        onBack={() => window.location.reload()}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #1a0d04 0%, #0d0703 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: portrait ? 'flex-start' : 'center',
      padding: portrait ? '8px 4px' : '12px',
      fontFamily: 'Playfair Display, serif',
      overflow: 'auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: portrait ? 8 : 16,
        marginTop: portrait ? 4 : 0,
      }}>
        <div style={{ fontSize: portrait ? 20 : 28, filter: 'drop-shadow(0 2px 8px rgba(200,168,75,0.5))' }}>🎲</div>
        <h1 style={{
          margin: 0,
          fontSize: portrait ? 22 : 32,
          fontWeight: 900,
          color: '#e8d48c',
          letterSpacing: 6,
          textShadow: '0 2px 16px rgba(200,168,75,0.3)',
        }}>TAVLA</h1>
        <div style={{ fontSize: portrait ? 20 : 28, filter: 'drop-shadow(0 2px 8px rgba(200,168,75,0.5))', transform: 'scaleX(-1)' }}>🎲</div>
      </div>

      {/* Main game area — zoom scales layout cleanly (no dead-space issue) */}
      <div style={{
        display: 'flex',
        flexDirection: portrait ? 'column' : 'row',
        gap: portrait ? 12 : LAYOUT_GAP,
        alignItems: portrait ? 'center' : 'flex-start',
        zoom: scale,
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

      {/* Player orientation label */}
      <div style={{
        marginTop: 8,
        color: '#4a3820',
        fontSize: 10,
        fontFamily: 'Space Mono',
        letterSpacing: 2,
      }}>
        You are playing as {playerColor === 'white' ? '⬜ CREAM (moves right→left)' : '🟥 RED (moves left→right)'}
      </div>
    </div>
  );
}
