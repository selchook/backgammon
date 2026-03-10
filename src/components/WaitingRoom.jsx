import { useState } from 'react';

export default function WaitingRoom({ roomId, playerColor, onBack }) {
  const shareUrl  = `${window.location.origin}?room=${roomId}`;
  const shareText = `Join me for a game of Tavla! Room code: ${roomId}`;

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Üstad Tito', text: shareText, url: shareUrl }); }
      catch (_) { /* user cancelled */ }
    } else {
      copyUrl();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #1a0d04 0%, #0d0703 100%)',
      fontFamily: 'Playfair Display, serif',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(40,25,8,0.95), rgba(25,15,5,0.98))',
        border: '1px solid rgba(180,140,60,0.3)',
        borderRadius: 20,
        padding: '48px 40px',
        width: 420,
        maxWidth: '90vw',
        boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 3s linear infinite' }}>⏳</div>

        <h2 style={{ margin: '0 0 8px', color: '#e8d48c', fontSize: 28, letterSpacing: 2 }}>
          Waiting for Opponent
        </h2>
        <p style={{ color: '#7a6030', fontFamily: 'Crimson Text', fontSize: 16, fontStyle: 'italic', margin: '0 0 32px' }}>
          You are playing as {playerColor === 'white' ? '⬜ Cream' : '🟥 Red'}
        </p>

        {/* Room code */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(180,140,60,0.3)',
          borderRadius: 12,
          padding: '20px',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, color: '#6a5028', fontFamily: 'Space Mono', letterSpacing: 3, marginBottom: 10 }}>ROOM CODE</div>
          <div style={{ fontSize: 48, fontFamily: 'Space Mono', color: '#e8d48c', letterSpacing: 12, fontWeight: 700 }}>
            {roomId}
          </div>
        </div>

        {/* Copy buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button onClick={copyCode} style={{ ...btnStyle, color: copiedCode ? '#5de87a' : '#a08040', borderColor: copiedCode ? 'rgba(93,232,122,0.5)' : 'rgba(180,140,60,0.3)' }}>
            {copiedCode ? '✓ Copied!' : '📋 Copy Code'}
          </button>
          <button onClick={copyUrl} style={{ ...btnStyle, color: copiedLink ? '#5de87a' : '#a08040', borderColor: copiedLink ? 'rgba(93,232,122,0.5)' : 'rgba(180,140,60,0.3)' }}>
            {copiedLink ? '✓ Copied!' : '🔗 Copy Link'}
          </button>
        </div>

        {/* Share sheet */}
        <button
          onClick={share}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            padding: '11px 16px',
            marginBottom: 24,
            background: 'rgba(200,168,75,0.08)',
            border: '1px solid rgba(200,168,75,0.35)',
            borderRadius: 8,
            color: '#c8a84b',
            fontFamily: 'Playfair Display',
            fontSize: 14,
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ fontSize: 18 }}>↗</span> Share Invite
        </button>

        <p style={{ color: '#4a3820', fontFamily: 'Space Mono', fontSize: 11, lineHeight: 1.6, margin: 0 }}>
          Share the code with your opponent.<br />
          The game will start automatically when they join.
        </p>

        <button
          onClick={onBack}
          style={{ ...btnStyle, marginTop: 24, width: '100%', color: '#7a6030' }}
        >
          ← Back to Lobby
        </button>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}

const btnStyle = {
  flex: 1,
  padding: '10px 16px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(180,140,60,0.3)',
  borderRadius: 8,
  color: '#a08040',
  fontFamily: 'Playfair Display',
  fontSize: 13,
  cursor: 'pointer',
  transition: 'color 0.2s, border-color 0.2s',
};
