import { useState, useRef, useEffect } from 'react';
import { playDiceRoll, playWin } from '../utils/sounds';

function Die({ value, used }) {
  const dots = {
    1: [[50,50]],
    2: [[25,25],[75,75]],
    3: [[25,25],[50,50],[75,75]],
    4: [[25,25],[75,25],[25,75],[75,75]],
    5: [[25,25],[75,25],[50,50],[25,75],[75,75]],
    6: [[25,25],[75,25],[25,50],[75,50],[25,75],[75,75]],
  };
  return (
    <div style={{
      width: 44, height: 44,
      background: used ? 'rgba(30,30,30,0.5)' : 'linear-gradient(135deg, #f5f0e0, #e8dfc0)',
      borderRadius: 9,
      border: used ? '2px solid #333' : '2px solid #c8b870',
      position: 'relative',
      boxShadow: used ? 'none' : '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.8)',
      opacity: used ? 0.35 : 1,
      transition: 'all 0.3s ease',
      flexShrink: 0,
    }}>
      {value && dots[value] && dots[value].map(([x, y], i) => (
        <div key={i} style={{
          position: 'absolute', width: 8, height: 8, borderRadius: '50%',
          background: used ? '#555' : '#1a1208',
          left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)',
        }} />
      ))}
    </div>
  );
}

function ChatPanel({ messages, onSend }) {
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(180,140,60,0.2)',
      borderRadius: 10, display: 'flex', flexDirection: 'column', height: 180, overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {messages.length === 0 && (
          <div style={{ color: '#4a3820', fontSize: 11, fontFamily: 'Space Mono', textAlign: 'center', marginTop: 20 }}>
            No messages yet
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.sender === 'me' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              background: m.sender === 'me' ? 'linear-gradient(135deg, #8b6914, #c8a84b)' : 'rgba(255,255,255,0.08)',
              color: m.sender === 'me' ? '#1a0f02' : '#d0c090',
              padding: '4px 10px',
              borderRadius: m.sender === 'me' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              fontSize: 12, fontFamily: 'Crimson Text, serif', maxWidth: '75%',
            }}>{m.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid rgba(180,140,60,0.15)', padding: 6, gap: 6 }}>
        <input
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Message..."
          style={{ flex: 1, background: 'transparent', border: 'none', color: '#d0c090', fontSize: 12, fontFamily: 'Crimson Text, serif', outline: 'none' }}
        />
        <button onClick={handleSend} style={{
          background: 'rgba(200,168,75,0.2)', border: '1px solid rgba(200,168,75,0.3)',
          borderRadius: 6, color: '#c8a84b', padding: '4px 10px', cursor: 'pointer',
          fontSize: 12, fontFamily: 'Space Mono',
        }}>→</button>
      </div>
    </div>
  );
}

export default function GameInfo({
  gameState, playerColor, isMyTurn, onRoll,
  chatMessages, onSendChat, onRematch,
  opponentConnected, portrait,
}) {
  if (!gameState) return null;
  const { dice, phase, currentPlayer, winner, borneOff, bar } = gameState;

  const prevWinnerRef = useRef(null);
  useEffect(() => {
    if (winner && winner !== prevWinnerRef.current) playWin();
    prevWinnerRef.current = winner;
  }, [winner]);

  const myScore  = borneOff[playerColor] || 0;
  const oppScore = borneOff[playerColor === 'white' ? 'black' : 'white'] || 0;
  const myBar    = bar[playerColor] || 0;
  const oppBar   = bar[playerColor === 'white' ? 'black' : 'white'] || 0;

  const colorLabel = (c) => c === 'white' ? '⬜ Cream' : '🟥 Red';
  const myLabel    = colorLabel(playerColor);
  const oppLabel   = colorLabel(playerColor === 'white' ? 'black' : 'white');

  const canRoll  = phase === 'rolling' && isMyTurn && opponentConnected;
  const turnText = winner
    ? `${colorLabel(winner)} wins! 🎉`
    : isMyTurn
      ? phase === 'rolling' ? 'Your turn — Roll the dice!' : 'Your turn — Make a move'
      : `${colorLabel(currentPlayer)}'s turn`;

  const handleRoll = () => { playDiceRoll(); onRoll(); };

  const labelStyle = {
    fontSize: 10, color: '#6a5028', fontFamily: 'Space Mono',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4,
  };
  const panelStyle = {
    background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(180,140,60,0.2)',
    borderRadius: 10, padding: '12px 14px',
    boxSizing: 'border-box', overflow: 'hidden',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: portrait ? 'row' : 'column',
      flexWrap: portrait ? 'wrap' : 'nowrap',
      gap: 14,
      width: portrait ? '100%' : 240,
      maxWidth: portrait ? '100%' : 240,
      flexShrink: 0,
      boxSizing: 'border-box',
      minWidth: 0,
    }}>
      {/* Merged Score + Turn panel */}
      <div style={{
        ...panelStyle,
        borderColor: winner ? 'rgba(255,215,0,0.5)' : isMyTurn ? 'rgba(200,168,75,0.5)' : 'rgba(180,140,60,0.2)',
        transition: 'border-color 0.3s ease',
        flex: portrait ? '1 1 240px' : 'unset',
      }}>
        {/* Player rows */}
        <div style={{ display: 'flex', gap: 6 }}>
          {/* You */}
          <div style={{
            flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 8,
            background: isMyTurn && !winner ? 'rgba(200,168,75,0.15)' : 'rgba(0,0,0,0.15)',
            border: isMyTurn && !winner ? '1px solid rgba(200,168,75,0.45)' : '1px solid rgba(255,255,255,0.04)',
            transition: 'all 0.3s ease',
          }}>
            <div style={{ ...labelStyle, marginBottom: 3 }}>
              {isMyTurn && !winner ? '▶ You' : 'You'}
            </div>
            <div style={{ color: '#e8d48c', fontFamily: 'Playfair Display', fontSize: 12, fontWeight: 700 }}>{myLabel}</div>
            <div style={{ color: '#c8a84b', fontFamily: 'Space Mono', fontSize: 10, marginTop: 3 }}>{myScore}/15 off</div>
            {myBar > 0 && <div style={{ color: '#ff9080', fontFamily: 'Space Mono', fontSize: 10 }}>{myBar} bar</div>}
          </div>

          {/* VS */}
          <div style={{ display: 'flex', alignItems: 'center', color: '#4a3820', fontSize: 13, flexShrink: 0, paddingTop: 6 }}>vs</div>

          {/* Opponent */}
          <div style={{
            flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 8,
            background: !isMyTurn && !winner ? 'rgba(200,168,75,0.15)' : 'rgba(0,0,0,0.15)',
            border: !isMyTurn && !winner ? '1px solid rgba(200,168,75,0.45)' : '1px solid rgba(255,255,255,0.04)',
            transition: 'all 0.3s ease',
          }}>
            <div style={{ ...labelStyle, marginBottom: 3 }}>
              {!isMyTurn && !winner ? '▶ Opp' : 'Opp'}
            </div>
            <div style={{ color: '#e8d48c', fontFamily: 'Playfair Display', fontSize: 12, fontWeight: 700 }}>{oppLabel}</div>
            <div style={{ color: '#c8a84b', fontFamily: 'Space Mono', fontSize: 10, marginTop: 3 }}>{oppScore}/15 off</div>
            {oppBar > 0 && <div style={{ color: '#ff9080', fontFamily: 'Space Mono', fontSize: 10 }}>{oppBar} bar</div>}
          </div>
        </div>

        {/* Turn status */}
        <div style={{
          marginTop: 10, paddingTop: 8,
          borderTop: '1px solid rgba(180,140,60,0.15)',
          textAlign: 'center',
          color: winner ? '#ffd700' : isMyTurn ? '#c8a84b' : '#6a5028',
          fontFamily: 'Crimson Text, serif', fontSize: 14, fontStyle: 'italic', lineHeight: 1.3,
        }}>
          {turnText}
        </div>
      </div>

      {/* Dice */}
      <div style={{ ...panelStyle, flex: portrait ? '1 1 200px' : 'unset' }}>
        <div style={labelStyle}>Dice</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', minHeight: 52, alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
          {dice.length === 0
            ? <div style={{ color: '#3a2810', fontFamily: 'Space Mono', fontSize: 11 }}>—</div>
            : dice.map((d, i) => <Die key={i} value={d} used={false} />)
          }
        </div>
        {canRoll && (
          <button onClick={handleRoll} style={{
            marginTop: 10, width: '100%', padding: '12px',
            background: 'linear-gradient(135deg, #6b4a10, #c8a84b, #6b4a10)',
            border: '1px solid #c8a84b', borderRadius: 8,
            color: '#1a0f02', fontFamily: 'Playfair Display, serif',
            fontWeight: 700, fontSize: 15, cursor: 'pointer',
            letterSpacing: 1, boxShadow: '0 4px 16px rgba(200,168,75,0.3)',
            transition: 'all 0.2s ease',
          }}
            onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
          >
            🎲 Roll Dice
          </button>
        )}
        {phase === 'moving' && isMyTurn && (
          <div style={{ marginTop: 8, color: '#7a6030', fontSize: 11, fontFamily: 'Space Mono', textAlign: 'center' }}>
            Click or drag a checker to move
          </div>
        )}
      </div>

      {/* Rematch */}
      {winner && (
        <button onClick={onRematch} style={{
          width: '100%', padding: '14px',
          background: 'linear-gradient(135deg, #1a4d2e, #2a7a48)',
          border: '1px solid #3a9a5a', borderRadius: 8,
          color: '#80ffa0', fontFamily: 'Playfair Display', fontWeight: 700,
          fontSize: 15, cursor: 'pointer', letterSpacing: 1,
          flex: portrait ? '1 1 auto' : 'unset',
        }}>🔄 Rematch</button>
      )}

      {/* Chat */}
      <div style={{ flex: portrait ? '1 1 100%' : 'unset' }}>
        <div style={labelStyle}>Chat</div>
        <ChatPanel messages={chatMessages} onSend={onSendChat} />
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
    </div>
  );
}
