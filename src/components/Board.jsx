import React, { useRef } from 'react';
import { playCheckerMove, playCheckerHit } from '../utils/sounds';

// ─── POINT TRIANGLE ──────────────────────────────────────────────────────────
function PointTriangle({
  pointNumber, isTop, color, checkers,
  isSelected, isValidDest, isMovable,
  onClick, onDragStart, onDrop,
}) {
  const w = 54;
  const h = 180;

  const triColor = color === 'dark'
    ? 'rgba(120, 60, 20, 0.9)'
    : 'rgba(30, 100, 60, 0.85)';

  const clipTop    = `polygon(0% 0%, 100% 0%, 50% 100%)`;
  const clipBottom = `polygon(50% 0%, 0% 100%, 100% 100%)`;

  // Highlight colours — much more visible now
  const overlayColor = isSelected  ? 'rgba(255,215,0,0.45)'
                     : isValidDest ? 'rgba(40,210,100,0.55)'
                     : isMovable   ? 'rgba(255,200,50,0.28)'
                     : null;

  const glowColor = isSelected  ? '#ffd700'
                  : isValidDest ? '#00e87a'
                  : isMovable   ? '#f1fa8c'
                  : 'transparent';

  const hasHighlight = isSelected || isValidDest || isMovable;

  return (
    <div
      onClick={onClick}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDrop && onDrop(pointNumber); }}
      style={{
        position: 'relative',
        width: w,
        height: h,
        cursor: isValidDest ? 'copy' : isMovable ? 'grab' : 'pointer',
        flexShrink: 0,
      }}
    >
      {/* Triangle */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        clipPath: isTop ? clipTop : clipBottom,
        background: triColor,
        filter: hasHighlight ? `drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 0 4px ${glowColor})` : 'none',
        transition: 'filter 0.2s ease',
      }} />

      {/* Highlight overlay on the triangle shape */}
      {overlayColor && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%',
          height: '100%',
          clipPath: isTop ? clipTop : clipBottom,
          background: overlayColor,
          animation: isValidDest ? 'pulse-dest 1s ease-in-out infinite' : undefined,
        }} />
      )}

      {/* Valid dest: dark border ring to make it unmissable */}
      {isValidDest && (
        <div style={{
          position: 'absolute',
          top: isTop ? 0 : 'auto',
          bottom: isTop ? 'auto' : 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid #00e87a',
          boxShadow: '0 0 12px #00e87a, inset 0 0 8px rgba(0,232,122,0.3)',
          animation: 'pulse-ring 1s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 20,
        }} />
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
      <div
        draggable={isMovable && checkers.length > 0}
        onDragStart={isMovable && checkers.length > 0
          ? (e) => { e.stopPropagation(); onDragStart && onDragStart(pointNumber); }
          : undefined}
        style={{
          position: 'absolute',
          top: isTop ? 0 : 'auto',
          bottom: isTop ? 'auto' : 0,
          left: 0,
          right: 0,
          height: '100%',
          cursor: isMovable && checkers.length > 0 ? 'grab' : 'default',
        }}
      >
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
            pointerEvents: 'none',
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
            pointerEvents: 'none',
          }}>{checkers.length}</div>
        )}
      </div>
    </div>
  );
}

// ─── BAR ─────────────────────────────────────────────────────────────────────
function Bar({ whiteCount, blackCount, selectedPoint, validDestinations, onClickBar, onDragStart, onDrop, currentPlayer, isMyTurn }) {
  const isSelected  = selectedPoint === 'bar';
  const myColor     = currentPlayer;
  const myCount     = myColor === 'white' ? whiteCount : blackCount;
  const isMovable   = isMyTurn && myCount > 0;
  const isValidDest = validDestinations.some(d => d.to === 'bar');

  return (
    <div
      onClick={() => isMyTurn && onClickBar()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDrop && onDrop('bar'); }}
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
        cursor: isMovable ? 'grab' : 'default',
        boxShadow: isSelected ? 'inset 0 0 20px rgba(255,215,0,0.4)' : 'inset 0 0 10px rgba(0,0,0,0.5)',
        transition: 'box-shadow 0.2s ease',
        flexShrink: 0,
        position: 'relative',
        zIndex: 5,
      }}
    >
      <div
        draggable={isMovable}
        onDragStart={isMovable ? (e) => { e.stopPropagation(); onDragStart && onDragStart('bar'); } : undefined}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
      >
        {Array.from({ length: blackCount }).map((_, i) => (
          <div key={i} style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #c0392b, #8b1a1a, #5c0f0f)',
            border: '2px solid #6b1010',
            boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }} />
        ))}
      </div>
      {(blackCount > 0 || whiteCount > 0) && (
        <div style={{ width: 40, height: 2, background: '#6b4a1a', opacity: 0.5 }} />
      )}
      <div
        draggable={isMovable}
        onDragStart={isMovable ? (e) => { e.stopPropagation(); onDragStart && onDragStart('bar'); } : undefined}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
      >
        {Array.from({ length: whiteCount }).map((_, i) => (
          <div key={i} style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #f5f0e8, #d4c8a8, #b8a87c)',
            border: '2px solid #a09060',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── BEAR-OFF TRAY ────────────────────────────────────────────────────────────
function BearOffTray({ whiteCount, blackCount, isValidDest, onClick, onDrop }) {
  return (
    <div
      onClick={onClick}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDrop && onDrop('bearoff'); }}
      style={{
        width: 55,
        height: '100%',
        background: 'linear-gradient(180deg, #0f1a0a, #1a2a10, #0f1a0a)',
        border: isValidDest ? '2px solid #00e87a' : '2px solid #3a5a2a',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: isValidDest ? 'copy' : 'default',
        boxShadow: isValidDest
          ? '0 0 18px rgba(0,232,122,0.7), inset 0 0 12px rgba(0,232,122,0.2)'
          : 'none',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        overflow: 'hidden',
        gap: 0,
        flexShrink: 0,
        animation: isValidDest ? 'pulse-ring 1s ease-in-out infinite' : undefined,
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
  const dropOccurred = useRef(false);

  const topRow    = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
  const bottomRow = [12, 11, 10,  9,  8,  7,  6,  5,  4,  3,  2,  1];

  const getCheckers = (pt) => {
    const p = points[pt];
    if (!p || !p.color || p.count === 0) return [];
    return Array(p.count).fill(p.color);
  };

  const isValidDest   = (pt) => validDestinations.some(d => d.to === pt);
  const isMovableSrc  = (pt) => movableSources.includes(pt);
  const isBearOffDest = validDestinations.some(d => d.to === 0 || d.to === 25);
  const pointColor    = (pt) => (pt % 2 === 0) ? 'light' : 'dark';

  const POINT_GAP = 2;

  // ─── Drag handlers ───
  const handleDragStart = (pt) => {
    dropOccurred.current = false;
    onSelectPoint(pt);
  };

  const handleDrop = (pt) => {
    dropOccurred.current = true;
    const destIsValid = pt === 'bearoff'
      ? validDestinations.some(d => d.to === 0 || d.to === 25)
      : validDestinations.some(d => d.to === pt);
    if (destIsValid) {
      playCheckerMove();
    }
    onSelectPoint(pt === 'bearoff' ? pt : pt);
  };

  const handleDragEnd = () => {
    if (!dropOccurred.current) {
      // Dropped on invalid area — deselect
      onSelectPoint(null);
    }
    dropOccurred.current = false;
  };

  return (
    <div
      onDragEnd={handleDragEnd}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #2c1a08 0%, #3d2510 50%, #2c1a08 100%)',
        borderRadius: 12,
        padding: '16px 8px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,220,100,0.1)',
        border: '3px solid #6b4a1a',
        position: 'relative',
        gap: 0,
      }}
    >
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
                isSelected={selectedPoint === pt}
                isValidDest={isValidDest(pt)}
                isMovable={isMovableSrc(pt)}
                onClick={() => onSelectPoint(pt)}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
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
            onDragStart={handleDragStart}
            onDrop={handleDrop}
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
                isSelected={selectedPoint === pt}
                isValidDest={isValidDest(pt)}
                isMovable={isMovableSrc(pt)}
                onClick={() => onSelectPoint(pt)}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
              />
            ))}
          </div>

          {/* Bear off tray */}
          <BearOffTray
            whiteCount={borneOff.white}
            blackCount={borneOff.black}
            isValidDest={isBearOffDest && isMyTurn}
            onClick={() => isBearOffDest && onSelectPoint('bearoff')}
            onDrop={handleDrop}
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
                isSelected={selectedPoint === pt}
                isValidDest={isValidDest(pt)}
                isMovable={isMovableSrc(pt)}
                onClick={() => onSelectPoint(pt)}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
              />
            ))}
          </div>

          {/* Bar bottom spacer */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleDrop('bar'); }}
            style={{ width: 60, height: 200, background: 'linear-gradient(180deg, #1a0f05 0%, #2a1a08 50%, #1a0f05 100%)', borderLeft: '3px solid #6b4a1a', borderRight: '3px solid #6b4a1a', flexShrink: 0 }}
          />

          {/* Right half: 6-1 */}
          <div style={{ display: 'flex', gap: POINT_GAP }}>
            {bottomRow.slice(6).map(pt => (
              <PointTriangle
                key={pt}
                pointNumber={pt}
                isTop={false}
                color={pointColor(pt)}
                checkers={getCheckers(pt)}
                isSelected={selectedPoint === pt}
                isValidDest={isValidDest(pt)}
                isMovable={isMovableSrc(pt)}
                onClick={() => onSelectPoint(pt)}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
              />
            ))}
          </div>

          {/* Bear off tray bottom spacer */}
          <div style={{ width: 55, flexShrink: 0 }} />
        </div>
      </div>

      <style>{`
        @keyframes pulse-dest {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 0.85; }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.8; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
