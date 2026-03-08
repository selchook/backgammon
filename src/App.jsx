import React, { useEffect } from 'react';
import { useAblyGame } from './hooks/useAblyGame';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import Board from './components/Board';
import GameInfo from './components/GameInfo';

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
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'Playfair Display, serif',
      gap: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 28, filter: 'drop-shadow(0 2px 8px rgba(200,168,75,0.5))' }}>🎲</div>
        <h1 style={{
          margin: 0,
          fontSize: 32,
          fontWeight: 900,
          color: '#e8d48c',
          letterSpacing: 6,
          textShadow: '0 2px 16px rgba(200,168,75,0.3)',
        }}>TAVLA</h1>
        <div style={{ fontSize: 28, filter: 'drop-shadow(0 2px 8px rgba(200,168,75,0.5))', transform: 'scaleX(-1)' }}>🎲</div>
      </div>

      {/* Main game area */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 20,
        alignItems: 'flex-start',
        maxWidth: '100%',
        overflow: 'auto',
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
        />
      </div>

      {/* Player orientation label */}
      <div style={{
        marginTop: 12,
        color: '#4a3820',
        fontSize: 11,
        fontFamily: 'Space Mono',
        letterSpacing: 2,
      }}>
        You are playing as {playerColor === 'white' ? '⬜ CREAM (moves right→left)' : '🟥 RED (moves left→right)'}
      </div>
    </div>
  );
}
