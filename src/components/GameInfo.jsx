import React, { useState } from 'react';

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
      width: 52,
      height: 52,
      background: used
        ? 'rgba(30,30,30,0.5)'
        : 'linear-gradient(135deg, #f5f0e0, #e8dfc0)',
      borderRadius: 10,
      border: used ? '2px solid #333' : '2px solid #c8b870',
      position: 'relative',
      boxShadow: used
        ? 'none'
        : '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.8)',
      opacity: used ? 0.35 : 1,
      transition: 'all 0.3s ease',
      flexShrink: 0,
    }}>
      {value && dots[value] && dots[value].map(([x, y], i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 8, height: 8,
          borderRadius: '50%',
          background: used ? '#555' : '#1a1208',
          left: `${x}%`, top: `${y}%`,
          transform: 'translate(-50%,-50%)',
        }} />
      ))}
    </div>
  );
}

function ChatPanel({ messages, onSend }) {
  const [text, setText] = useState('');
  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(180,140,60,0.2)',
      borderRadius: 10,
      display: 'flex',
      flexDirection: 'column',
      height: 180,
      overflow: 'hidden',
    }}>
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {messages.length === 0 && (
          <div style={{ color: '#4a3820', fontSize: 11, fontFamily: 'Space Mono', textAlign: 'center', marginTop: 20 }}>
            No messages yet
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: m.sender === 'me' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              background: m.sender === 'me'
                ? 'linear-gradient(135deg, #8b6914, #c8a84b)'
                : 'rgba(255,255,255,0.08)',
              color: m.sender === 'me' ? '#1a0f02' : '#d0c090',
              padding: '4px 10px',
              borderRadius: m.sender === 'me' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              fontSize: 12,
              fontFamily: 'Crimson Text, serif',
              maxWidth: '75%',
            }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid rgba(180,140,60,0.15)', padding: 6, gap: 6 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Message..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#d0c090',
            fontSize: 12,
            fontFamily: 'Crimson Text, serif',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          style={{
            background: 'rgba(200,168,75,0.2)',
            border: '1px solid rgba(200,168,75,0.3)',
            borderRadius: 6,
            color: '#c8a84b',
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'Space Mono',
          }}
        >→</button>
      </div>
    </div>
  );
}

export default function GameInfo({
  gameState,
  playerColor,
  isMyTurn,
  onRoll,
  chatMessages,
  onSendChat,
  onRematch,
  roomId,
  opponentConnected,
}) {
  if (!gameState) return null;
  const { dice, phase, currentPlayer, winner, borneOff, bar } = gameState;

  const myScore = borneOff[playerColor] || 0;
  const oppScore = borneOff[playerColor === 'white' ? 'black' : 'white'] || 0;
  const myBar = bar[playerColor] || 0;
  const oppBar = bar[playerColor === 'white' ? 'black' : 'white'] || 0;

  const colorLabel = (c) => c === 'white' ? '⬜ Cream' : '🟥 Red';
  const myLabel = colorLabel(playerColor);
  const oppLabel = colorLabel(playerColor === 'white' ? 'black' : 'white');

  const isRolling = phase === 'rolling' && isMyTurn;
  const canRoll = isRolling && opponentConnected;

  const turnText = winner
    ? `${colorLabel(winner)} wins! 🎉`
    : isMyTurn
      ? phase === 'rolling' ? 'Your turn — Roll the dice!' : 'Your turn — Make a move'
      : `${colorLabel(currentPlayer)}'s turn`;

  const labelStyle = {
    fontSize: 10,
    color: '#6a5028',
    fontFamily: 'Space Mono',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  };

  const panelStyle = {
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(180,140,60,0.2)',
    borderRadius: 10,
    padding: '12px 14px',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      width: 240,
      flexShrink: 0,
    }}>
      {/* Room code */}
      <div style={{ ...panelStyle, textAlign: 'center' }}>
        <div style={labelStyle}>Room Code</div>
        <div style={{
          fontSize: 28,
          fontFamily: 'Space Mono',
          color: '#e8d48c',
          letterSpacing: 6,
          fontWeight: 700,
        }}>{roomId}</div>
        {!opponentConnected && (
          <div style={{ fontSize: 11, color: '#7a6030', fontFamily: 'Space Mono', marginTop: 4, animation: 'pulse 1.5s infinite' }}>
            Waiting for opponent...
          </div>
        )}
      </div>

      {/* Player info */}
      <div style={{ ...panelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={labelStyle}>You</div>
          <div style={{ color: '#e8d48c', fontFamily: 'Playfair Display', fontSize: 13, fontWeight: 700 }}>{myLabel}</div>
          <div style={{ color: '#c8a84b', fontFamily: 'Space Mono', fontSize: 11, marginTop: 2 }}>
            {myScore}/15 off {myBar > 0 ? `· ${myBar} on bar` : ''}
          </div>
        </div>
        <div style={{ color: '#4a3820', fontSize: 20 }}>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div style={labelStyle}>Opponent</div>
          <div style={{ color: '#e8d48c', fontFamily: 'Playfair Display', fontSize: 13, fontWeight: 700 }}>{oppLabel}</div>
          <div style={{ color: '#c8a84b', fontFamily: 'Space Mono', fontSize: 11, marginTop: 2 }}>
            {oppScore}/15 off {oppBar > 0 ? `· ${oppBar} on bar` : ''}
          </div>
        </div>
      </div>

      {/* Turn indicator */}
      <div style={{
        ...panelStyle,
        textAlign: 'center',
        borderColor: isMyTurn ? 'rgba(200,168,75,0.5)' : 'rgba(180,140,60,0.2)',
        background: isMyTurn ? 'rgba(200,168,75,0.08)' : 'rgba(0,0,0,0.25)',
        transition: 'all 0.3s ease',
      }}>
        <div style={{
          color: winner ? '#ffd700' : isMyTurn ? '#c8a84b' : '#6a5028',
          fontFamily: 'Crimson Text, serif',
          fontSize: 15,
          fontStyle: 'italic',
          lineHeight: 1.4,
        }}>{turnText}</div>
      </div>

      {/* Dice */}
      <div style={panelStyle}>
        <div style={labelStyle}>Dice</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', minHeight: 60, alignItems: 'center' }}>
          {dice.length === 0 ? (
            <div style={{ color: '#3a2810', fontFamily: 'Space Mono', fontSize: 11 }}>—</div>
          ) : (
            dice.map((d, i) => <Die key={i} value={d} used={false} />)
          )}
        </div>

        {canRoll && (
          <button
            onClick={onRoll}
            style={{
              marginTop: 10,
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #6b4a10, #c8a84b, #6b4a10)',
              border: '1px solid #c8a84b',
              borderRadius: 8,
              color: '#1a0f02',
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              letterSpacing: 1,
              boxShadow: '0 4px 16px rgba(200,168,75,0.3)',
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
            Click a checker to move
          </div>
        )}
      </div>

      {/* Rematch button */}
      {winner && (
        <button
          onClick={onRematch}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #1a4d2e, #2a7a48)',
            border: '1px solid #3a9a5a',
            borderRadius: 8,
            color: '#80ffa0',
            fontFamily: 'Playfair Display',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            letterSpacing: 1,
          }}
        >
          🔄 Rematch
        </button>
      )}

      {/* Chat */}
      <div>
        <div style={labelStyle}>Chat</div>
        <ChatPanel messages={chatMessages} onSend={onSendChat} />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
