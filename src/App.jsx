import { useEffect, useState } from 'react';
import { useAblyGame } from './hooks/useAblyGame';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import Board from './components/Board';
import GameInfo from './components/GameInfo';

// Board natural pixel dimensions — must match Board.jsx P / L constants
const PORTRAIT_BW  = 586;  // portrait board width
const PORTRAIT_BH  = 672;  // portrait board height
const LANDSCAPE_BW = 802;  // landscape board width  (W >> H)
const LANDSCAPE_BH = 456;  // landscape board height
const SIDEBAR_W    = 240;
const GAP          = 20;
const LOGO_H       = 36;
// Total widths for scale calculation (board + gap + sidebar)
const LANDSCAPE_TW = LANDSCAPE_BW + GAP + SIDEBAR_W;  // 1062

function useLayout() {
  const compute = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const portrait        = vh > vw;
    const mobileLandscape = !portrait && vh < 520;

    let scale;
    if (portrait) {
      const availH = vh - LOGO_H;
      scale = Math.min(vw / PORTRAIT_BW, availH / PORTRAIT_BH);
    } else if (mobileLandscape) {
      // Use full vh — landscape board is wide so it fills the short screen
      scale = Math.min(vh / LANDSCAPE_BH, vw / LANDSCAPE_TW);
    } else {
      // Desktop / tablet landscape
      const availH = vh - LOGO_H;
      scale = Math.min(vw / LANDSCAPE_TW, availH / LANDSCAPE_BH);
    }

    return { portrait, mobileLandscape, scale: Math.min(2, Math.max(0.2, scale)) };
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

// ─── Fixed logo (top-left, always visible) ───────────────────────────────────
function Logo({ portrait }) {
  const fs = portrait ? 15 : 11;
  const ts = portrait ? 17 : 12;
  const ls = portrait ? 5  : 3;
  return (
    <div style={{
      position: 'fixed', top: portrait ? 8 : 5, left: portrait ? 12 : 8, zIndex: 200,
      display: 'flex', alignItems: 'center', gap: portrait ? 5 : 3,
      pointerEvents: 'none', userSelect: 'none',
    }}>
      <span style={{ fontSize: fs, filter: 'drop-shadow(0 1px 4px rgba(200,168,75,0.6))' }}>🎲</span>
      <span style={{
        fontSize: ts, fontWeight: 900, color: '#e8d48c',
        letterSpacing: ls, fontFamily: 'Playfair Display, serif',
        textShadow: '0 1px 8px rgba(200,168,75,0.4)',
      }}>Üstad Tito</span>
      <span style={{ fontSize: fs, filter: 'drop-shadow(0 1px 4px rgba(200,168,75,0.6))', transform: 'scaleX(-1)' }}>🎲</span>
    </div>
  );
}

// ─── Fullscreen toggle (top-right) ───────────────────────────────────────────
function FullscreenBtn() {
  const [full, setFull] = useState(false);

  useEffect(() => {
    const onChange = () => setFull(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const toggle = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch?.(() => {});
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document)?.catch?.(() => {});
    }
  };

  return (
    <button
      onClick={toggle}
      title={full ? 'Exit fullscreen' : 'Enter fullscreen'}
      style={{
        position: 'fixed', top: 8, right: 12, zIndex: 200,
        background: 'rgba(10,5,2,0.65)',
        border: '1px solid rgba(200,168,75,0.35)',
        borderRadius: 7,
        color: '#c8a84b',
        padding: '4px 9px',
        cursor: 'pointer',
        fontSize: 16,
        lineHeight: 1,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      {full ? '⊡' : '⛶'}
    </button>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const {
    gameState, playerColor, roomId, status,
    selectedPoint, validDestinations, movableSources,
    opponentConnected, chatMessages, isMyTurn,
    createRoom, joinRoom, handleRoll, handleSelectPoint, handleDirectMove,
    sendChat, handleRematch,
  } = useAblyGame();

  const { portrait, mobileLandscape, scale } = useLayout();

  // Auto-join from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room && status === 'idle') joinRoom(room.toUpperCase());
  }, []);

  if (status === 'idle')    return <Lobby onCreateRoom={createRoom} onJoinRoom={joinRoom} />;
  if (status === 'waiting') return <WaitingRoom roomId={roomId} playerColor={playerColor} onBack={() => window.location.reload()} />;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
      background: 'radial-gradient(ellipse at center, #1a0d04 0%, #0d0703 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      // Portrait: allow scrolling so GameInfo below the board is reachable
      overflowY: portrait ? 'auto' : 'hidden',
      overflowX: 'hidden',
      fontFamily: 'Playfair Display, serif',
    }}>
      <Logo portrait={portrait} />
      <FullscreenBtn />

      {/* Game area — zoom scales whole layout cleanly */}
      <div style={{
        display: 'flex',
        flexDirection: (portrait || mobileLandscape) ? (portrait ? 'column' : 'row') : 'row',
        gap: portrait ? 10 : GAP,
        alignItems: portrait ? 'center' : 'flex-start',
        zoom: scale,
        flexShrink: 0,
        marginTop: portrait ? LOGO_H : 0,
      }}>
        <Board
          gameState={gameState}
          selectedPoint={selectedPoint}
          validDestinations={validDestinations}
          movableSources={movableSources}
          playerColor={playerColor}
          isMyTurn={isMyTurn}
          onSelectPoint={handleSelectPoint}
          onDirectMove={handleDirectMove}
          landscape={!portrait}
        />
        <GameInfo
          gameState={gameState}
          playerColor={playerColor}
          isMyTurn={isMyTurn}
          onRoll={handleRoll}
          chatMessages={chatMessages}
          onSendChat={sendChat}
          onRematch={handleRematch}
          opponentConnected={opponentConnected}
          portrait={portrait}
          boardH={portrait ? undefined : LANDSCAPE_BH}
        />
      </div>
    </div>
  );
}
