import React, { useMemo } from 'react';

// ─── CHECKER ──────────────────────────────────────────────────────────────────
function Checker({ color, index, total, isOnBar }) {
  const stackOffset = isOnBar ? index * 28 : index * 22;
  const maxStack = 5;
  const scale = total > maxStack ? 0.82 : 1;

  return (
    <div
      style={{
        position: 'absolute',
        width: isOnBar ? 34 : 38,
        height: isOnBar ? 34 : 38,
        borderRadius: '50%',
        bottom: stackOffset,
        left: '50%',
        transform: `translateX(-50%) scale(${scale})`,
        background: color === 'white'
          ? 'radial-gradient(circle at 35% 35%, #f5f0e8, #d4c8a8, #b8a87c)'
          : 'radial-gradient(circle at 35% 35%, #c0392b, #8b1a1a, #5c0f0f)',
        boxShadow: color === 'white'
          ? '0 3px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.6)'
          : '0 3px 8px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,100,100,0.3)',
        border: color === 'white' ? '2px solid #a09060' : '2px solid #6b1010',
        zIndex: 10 + index,
        cursor: 'pointer',
        transition: 'transform 0.15s ease',
      }}
    />
  );
}

// ─── POINT TRIANGLE ──────────────────────────────────────────────────────────
function PointTriangle({ index, isTop, color, checkers, isSelected, isValidDest, isMovable, onClick, pointNumber }) {
  const w = 54;
  const h = 180;
  const triColor = color === 'dark'
    ? 'rgba(120, 60, 20, 0.9)'
    : 'rgba(30, 100, 60, 0.85)';
  const triColorAlt = color === 'dark'
    ? 'rgba(90, 40, 10, 0.9)'
    : 'rgba(20, 70, 45, 0.85)';

  const clipTop = `polygon(0% 0%, 100% 0%, 50% 100%)`;
  const clipBottom = `polygon(50% 0%, 0% 100%, 100% 100%)`;

  const glowColor = isSelected ? '#ffd700' : isValidDest ? '#50fa7b' : isMovable ? '#f1fa8c' : 'transparent';
  const glowIntensity = isSelected || isValidDest || isMovable ? 1 : 0;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: w,
        height: h,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {/* Triangle */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%',
          height: '100%',
          clipPath: isTop ? clipTop : clipBottom,
          background: triColor,
          filter: glowIntensity ? `drop-shadow(0 0 8px ${glowColor})` : 'none',
          transition: 'filter 0.2s ease',
        }}
      />
      {/* Glow overlay */}
      {glowIntensity > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%',
            height: '100%',
            clipPath: isTop ? clipTop : clipBottom,
            background: `${glowColor}33`,
          }}
        />
      )}

      {/* Point number label */}
      <div style={{
        position: 'absolute',
        [isTop ? 'top' : 'bottom']: -20,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 10,
        color: '#a89060',
        fontFamily: 'Space Mono, monospace',
        userSelect: 'none',
        opacity: 0.7,
      }}>{pointNumber}</div>

      {/* Checkers */}
      <div style={{
        position: 'absolute',
        top: isTop ? 0 : 'auto',
        bottom: isTop ? 'auto' : 0,
        left: 0,
        right: 0,
        height: '100%',
      }}>
        {checkers.map((c, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 38,
            height: 38,
            borderRadius: '50%',
            [isTop ? 'top' : 'bottom']: i * 22,
            left: '50%',
            transform: 'translateX(-50%)',
            background: c === 'white'
              ? 'radial-gradient(circle at 35% 35%, #f5f0e8, #d4c8a8, #b8a87c)'
              : 'radial-gradient(circle at 35% 35%, #c0392b, #8b1a1a, #5c0f0f)',
            boxShadow: c === 'white'
              ? '0 3px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.6)'
              : '0 3px 8px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,100,100,0.3)',
            border: c === 'white' ? '2px solid #a09060' : '2px solid #6b1010',
            zIndex: 10 + i,
          }} />
        ))}
        {/* Count badge when > 5 */}
        {checkers.length > 5 && (
          <div style={{
            position: 'absolute',
            [isTop ? 'top' : 'bottom']: 4 * 22 + 8,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a1a1a',
            color: '#ffd700',
            fontSize: 11,
            fontFamily: 'Space Mono',
            fontWeight: 700,
            borderRadius: 10,
            padding: '1px 6px',
            zIndex: 30,
          }}>{checkers.length}</div>
        )}
      </div>
    </div>
  );
}

// ─── BAR ─────────────────────────────────────────────────────────────────────
function Bar({ whiteCount, blackCount, selectedPoint, validDestinations, onClickBar, currentPlayer, isMyTurn }) {
  const isSelected = selectedPoint === 'bar';
  const myColor = currentPlayer;
  const hasMyCheckers = myColor === 'white' ? whiteCount > 0 : blackCount > 0;
  const isMovable = isMyTurn && hasMyCheckers;

  return (
    <div
      onClick={() => isMyTurn && onClickBar()}
      style={{
        width: 60,
        height: '100%',
        background: 'linear-gradient(180deg, #1a0f05 0%, #2a1a08 50%, #1a0f05 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderLeft: '3px solid #6b4a1a',
        borderRight: '3px solid #6b4a1a',
        cursor: isMovable ? 'pointer' : 'default',
        boxShadow: isSelected ? 'inset 0 0 20px rgba(255,215,0,0.3)' : 'inset 0 0 10px rgba(0,0,0,0.5)',
        transition: 'box-shadow 0.2s ease',
        flexShrink: 0,
        position: 'relative',
        zIndex: 5,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {Array.from({ length: blackCount }).map((_, i) => (
          <div key={i} style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #c0392b, #8b1a1a, #5c0f0f)',
            border: '2px solid #6b1010',
            boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
          }} />
        ))}
      </div>
      {(blackCount > 0 || whiteCount > 0) && (
        <div style={{ width: 40, height: 2, background: '#6b4a1a', opacity: 0.5 }} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {Array.from({ length: whiteCount }).map((_, i) => (
          <div key={i} style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #f5f0e8, #d4c8a8, #b8a87c)',
            border: '2px solid #a09060',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── BEAR-OFF TRAY ────────────────────────────────────────────────────────────
function BearOffTray({ whiteCount, blackCount, isValidDest, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 55,
        height: '100%',
        background: 'linear-gradient(180deg, #0f1a0a, #1a2a10, #0f1a0a)',
        border: '2px solid #3a5a2a',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: isValidDest ? 'pointer' : 'default',
        boxShadow: isValidDest ? '0 0 16px rgba(80,250,123,0.5)' : 'none',
        transition: 'box-shadow 0.2s ease',
        overflow: 'hidden',
        gap: 0,
        flexShrink: 0,
      }}
    >
      {/* Black borne off (top) */}
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4, gap: 2 }}>
        {Array.from({ length: Math.min(blackCount, 8) }).map((_, i) => (
          <div key={i} style={{ width: 28, height: 10, borderRadius: 5, background: 'radial-gradient(#c0392b, #5c0f0f)', border: '1px solid #6b1010', flexShrink: 0 }} />
        ))}
        {blackCount > 8 && <div style={{ color: '#ffd700', fontSize: 11, fontFamily: 'Space Mono' }}>{blackCount}</div>}
      </div>
      <div style={{ width: '80%', height: 1, background: '#3a5a2a' }} />
      {/* White borne off (bottom) */}
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', justifyContent: 'flex-start', paddingBottom: 4, gap: 2 }}>
        {Array.from({ length: Math.min(whiteCount, 8) }).map((_, i) => (
          <div key={i} style={{ width: 28, height: 10, borderRadius: 5, background: 'radial-gradient(#f5f0e8, #b8a87c)', border: '1px solid #a09060', flexShrink: 0 }} />
        ))}
        {whiteCount > 8 && <div style={{ color: '#ffd700', fontSize: 11, fontFamily: 'Space Mono' }}>{whiteCount}</div>}
      </div>
    </div>
  );
}

// ─── MAIN BOARD ──────────────────────────────────────────────────────────────
export default function Board({ gameState, selectedPoint, validDestinations, movableSources, playerColor, isMyTurn, onSelectPoint }) {
  if (!gameState) return null;

  const { points, bar, borneOff, currentPlayer } = gameState;

  // Board layout (from viewer's fixed perspective — white at bottom, black at top):
  // Top row left→right:  13,14,15,16,17,18 | BAR | 19,20,21,22,23,24
  // Bottom row left→right: 12,11,10,9,8,7 | BAR |  6, 5, 4, 3, 2, 1
  const topRow = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
  const bottomRow = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  const getCheckers = (pt) => {
    const p = points[pt];
    if (!p || !p.color || p.count === 0) return [];
    return Array(p.count).fill(p.color);
  };

  const isSelected = (pt) => selectedPoint === pt;
  const isValidDest = (pt) => validDestinations.some(d => d.to === pt);
  const isMovableSrc = (pt) => movableSources.includes(pt);
  const isBearOffDest = validDestinations.some(d => d.to === 0 || d.to === 25);

  const pointColor = (pt) => (pt % 2 === 0) ? 'light' : 'dark';

  const POINT_W = 54;
  const POINT_GAP = 2;
  const ROW_H = 200;

  const rowStyle = {
    display: 'flex',
    flexDirection: 'row',
    gap: POINT_GAP,
    height: ROW_H,
    alignItems: 'flex-start',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #2c1a08 0%, #3d2510 50%, #2c1a08 100%)',
      borderRadius: 12,
      padding: '16px 8px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,220,100,0.1)',
      border: '3px solid #6b4a1a',
      position: 'relative',
      gap: 0,
    }}>
      {/* Board felt area */}
      <div style={{
        background: 'linear-gradient(180deg, #1a4d2e 0%, #153d24 100%)',
        borderRadius: 8,
        padding: '8px 6px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        border: '2px solid #0d2a18',
        boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.4)',
      }}>

        {/* Top half row (points 13-24) */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: POINT_GAP, alignItems: 'flex-start', marginBottom: 4 }}>
          {/* Left half: 13-18 */}
          <div style={{ display: 'flex', gap: POINT_GAP }}>
            {topRow.slice(0, 6).map(pt => (
              <PointTriangle
                key={pt}
                pointNumber={pt}
                isTop={true}
                color={pointColor(pt)}
                checkers={getCheckers(pt)}
                isSelected={isSelected(pt)}
                isValidDest={isValidDest(pt)}
                isMovable={isMovableSrc(pt)}
                onClick={() => onSelectPoint(pt)}
              />
            ))}
          </div>

          {/* Bar */}
          <Bar
            whiteCount={bar.white}
            blackCount={bar.black}
            selectedPoint={selectedPoint}
            validDestinations={validDestinations}
            onClickBar={() => onSelectPoint('bar')}
            currentPlayer={currentPlayer}
            isMyTurn={isMyTurn}
          />

          {/* Right half: 19-24 */}
          <div style={{ display: 'flex', gap: POINT_GAP }}>
            {topRow.slice(6).map(pt => (
              <PointTriangle
                key={pt}
                pointNumber={pt}
                isTop={true}
                color={pointColor(pt)}
                checkers={getCheckers(pt)}
                isSelected={isSelected(pt)}
                isValidDest={isValidDest(pt)}
                isMovable={isMovableSrc(pt)}
                onClick={() => onSelectPoint(pt)}
              />
            ))}
          </div>

          {/* Bear off tray */}
          <BearOffTray
            whiteCount={borneOff.white}
            blackCount={borneOff.black}
            isValidDest={isBearOffDest && isMyTurn}
            onClick={() => isBearOffDest && onSelectPoint('bearoff')}
          />
        </div>

        {/* Center strip */}
        <div style={{
          height: 30,
          background: 'linear-gradient(90deg, #0d2a18, #0f3020, #0d2a18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid #1a5030',
          borderBottom: '1px solid #1a5030',
        }}>
          <div style={{ color: '#3a7a50', fontSize: 13, fontFamily: 'Playfair Display', letterSpacing: 8, opacity: 0.7 }}>
            ✦ TAVLA ✦
          </div>
        </div>

        {/* Bottom half row (points 12-1) */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: POINT_GAP, alignItems: 'flex-end', marginTop: 4 }}>
          {/* Left half: 12-7 */}
          <div style={{ display: 'flex', gap: POINT_GAP }}>
            {bottomRow.slice(0, 6).map(pt => (
              <PointTriangle
                key={pt}
                pointNumber={pt}
                isTop={false}
                color={pointColor(pt)}
                checkers={getCheckers(pt)}
                isSelected={isSelected(pt)}
                isValidDest={isValidDest(pt)}
                isMovable={isMovableSrc(pt)}
                onClick={() => onSelectPoint(pt)}
              />
            ))}
          </div>

          {/* Bar bottom */}
          <div style={{ width: 60, height: 200, background: 'linear-gradient(180deg, #1a0f05 0%, #2a1a08 50%, #1a0f05 100%)', borderLeft: '3px solid #6b4a1a', borderRight: '3px solid #6b4a1a', flexShrink: 0 }} />

          {/* Right half: 6-1 */}
          <div style={{ display: 'flex', gap: POINT_GAP }}>
            {bottomRow.slice(6).map(pt => (
              <PointTriangle
                key={pt}
                pointNumber={pt}
                isTop={false}
                color={pointColor(pt)}
                checkers={getCheckers(pt)}
                isSelected={isSelected(pt)}
                isValidDest={isValidDest(pt)}
                isMovable={isMovableSrc(pt)}
                onClick={() => onSelectPoint(pt)}
              />
            ))}
          </div>

          {/* Bear off tray bottom spacer */}
          <div style={{ width: 55, flexShrink: 0 }} />
        </div>
      </div>
    </div>
  );
}
