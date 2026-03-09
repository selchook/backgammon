import React, { useState } from 'react';

export default function Lobby({ onCreateRoom, onJoinRoom }) {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(null); // 'create' | 'join' | null
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setLoading('create');
    setError('');
    try {
      await onCreateRoom();
    } catch (e) {
      setError(e.message || 'Failed to create room. Check your Ably API key.');
      setLoading(null);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { setError('Enter a room code'); return; }
    setLoading('join');
    setError('');
    try {
      await onJoinRoom(joinCode.trim().toUpperCase());
    } catch (e) {
      setError(e.message || 'Failed to join room. Check the code and your Ably API key.');
      setLoading(null);
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(180,140,60,0.4)',
    borderRadius: 8,
    color: '#f0e8d0',
    padding: '12px 16px',
    fontSize: 18,
    fontFamily: 'Space Mono, monospace',
    letterSpacing: 6,
    textTransform: 'uppercase',
    textAlign: 'center',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  const btnStyle = (primary, disabled) => ({
    padding: '14px 32px',
    borderRadius: 8,
    border: primary ? '1px solid #c8a84b' : '1px solid rgba(180,140,60,0.3)',
    background: primary
      ? 'linear-gradient(135deg, #8b6914, #c8a84b, #8b6914)'
      : 'rgba(255,255,255,0.04)',
    color: primary ? '#1a0f02' : '#a08040',
    fontFamily: 'Playfair Display, serif',
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    letterSpacing: 1,
    transition: 'all 0.2s ease',
    width: '100%',
  });

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #1a0d04 0%, #0d0703 100%)',
      fontFamily: 'Playfair Display, serif',
    }}>
      {/* Background texture */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        pointerEvents: 'none',
      }} />

      <div style={{
        background: 'linear-gradient(135deg, rgba(40,25,8,0.95), rgba(25,15,5,0.98))',
        border: '1px solid rgba(180,140,60,0.3)',
        borderRadius: 20,
        padding: '48px 40px',
        width: 420,
        maxWidth: '90vw',
        boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative corner */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, transparent, #c8a84b, transparent)',
        }} />

        {/* Logo / Title */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            fontSize: 64,
            lineHeight: 1,
            marginBottom: 8,
            filter: 'drop-shadow(0 4px 12px rgba(200,168,75,0.4))',
          }}>🎲</div>
          <h1 style={{
            margin: 0,
            fontSize: 42,
            fontWeight: 900,
            color: '#e8d48c',
            letterSpacing: 4,
            textShadow: '0 2px 20px rgba(200,168,75,0.4)',
          }}>Üstad Tito</h1>
          <p style={{
            margin: '6px 0 0',
            color: '#7a6030',
            fontSize: 13,
            letterSpacing: 6,
            fontFamily: 'Space Mono',
            textTransform: 'uppercase',
          }}>Online Multiplayer</p>
        </div>

        {/* Create Room */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={handleCreate}
            disabled={!!loading}
            style={btnStyle(true, !!loading)}
          >
            {loading === 'create' ? 'Connecting...' : '✦ Create New Game'}
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(180,140,60,0.2)' }} />
          <span style={{ color: '#6a5028', fontSize: 12, fontFamily: 'Space Mono', letterSpacing: 2 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(180,140,60,0.2)' }} />
        </div>

        {/* Join Room */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            style={inputStyle}
            placeholder="ROOM CODE"
            value={joinCode}
            maxLength={6}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            onFocus={e => e.target.style.borderColor = 'rgba(200,168,75,0.7)'}
            onBlur={e => e.target.style.borderColor = 'rgba(180,140,60,0.4)'}
          />
          <button
            onClick={handleJoin}
            disabled={!!loading}
            style={btnStyle(false, !!loading)}
          >
            {loading === 'join' ? 'Joining...' : 'Join Game →'}
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: 20,
            padding: '10px 16px',
            background: 'rgba(200,50,50,0.15)',
            border: '1px solid rgba(200,50,50,0.3)',
            borderRadius: 8,
            color: '#e88080',
            fontSize: 13,
            fontFamily: 'Space Mono',
            textAlign: 'center',
          }}>{error}</div>
        )}

        {/* Footer note */}
        <p style={{
          marginTop: 32,
          textAlign: 'center',
          color: '#4a3820',
          fontSize: 11,
          fontFamily: 'Space Mono',
          lineHeight: 1.6,
        }}>
          Requires VITE_ABLY_API_KEY environment variable
        </p>
      </div>
    </div>
  );
}
