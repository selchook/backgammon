import { useRef, useEffect } from 'react';


// ── Layout constants ─────────────────────────────────────────────────────────
// Portrait board: H(672) > W(586)
const P = {
  POINT_W: 36, POINT_H: 290, CHECKER: 30, STEP: 20,
  BAR_W: 50, BAR_CHECKER: 28, BEAROFF_W: 44, POINT_GAP: 2,
};
// Landscape board: W(~800) > H(~450)
const L = {
  POINT_W: 52, POINT_H: 180, CHECKER: 40, STEP: 26,
  BAR_W: 62, BAR_CHECKER: 38, BEAROFF_W: 56, POINT_GAP: 2,
};
// Kept for any direct references below
const POINT_GAP = 2;

// Creates a circular canvas for use as an HTML5 drag image (avoids rectangular ghost)
function makeDragCanvas(color, size) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  c.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(size * 0.35, size * 0.35, 0, size / 2, size / 2, size / 2);
  if (color === 'white') {
    g.addColorStop(0, '#f5f0e8'); g.addColorStop(0.5, '#d4c8a8'); g.addColorStop(1, '#b8a87c');
  } else {
    g.addColorStop(0, '#c0392b'); g.addColorStop(0.5, '#8b1a1a'); g.addColorStop(1, '#5c0f0f');
  }
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = color === 'white' ? '#a09060' : '#6b1010';
  ctx.lineWidth = 2; ctx.stroke();
  setTimeout(() => document.body.removeChild(c), 0);
  return c;
}

// ─── POINT TRIANGLE ──────────────────────────────────────────────────────────
function PointTriangle({
  pointNumber, isTop, color, checkers,
  isSelected, isValidDest, isCombinedDest, isMovable,
  onClick, onDragStart, onMouseDown, onDrop, d,
}) {
  const topCheckerRef = useRef(null);
  const { POINT_W, POINT_H, CHECKER, STEP } = d;

  const triColor = color === 'dark'
    ? 'rgba(190, 80, 15, 0.95)'
    : 'rgba(220, 200, 100, 0.85)';

  const clipTop    = `polygon(0% 0%, 100% 0%, 50% 100%)`;
  const clipBottom = `polygon(50% 0%, 0% 100%, 100% 100%)`;

  const overlayColor = isSelected      ? 'rgba(255,215,0,0.45)'
                     : isValidDest     ? 'rgba(40,210,100,0.55)'
                     : isCombinedDest  ? 'rgba(40,160,255,0.30)'
                     : isMovable       ? 'rgba(255,200,50,0.28)'
                     : null;

  const glowColor = isSelected      ? '#ffd700'
                  : isValidDest     ? '#00e87a'
                  : isCombinedDest  ? '#40a0ff'
                  : isMovable       ? '#f1fa8c'
                  : 'transparent';

  const hasHighlight = isSelected || isValidDest || isCombinedDest || isMovable;

  return (
    <div
      data-point={pointNumber}
      onClick={onClick}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDrop && onDrop(pointNumber); }}
      style={{
        position: 'relative',
        width: POINT_W,
        height: POINT_H,
        cursor: isValidDest ? 'copy' : 'pointer',
        flexShrink: 0,
        touchAction: 'none',
      }}
    >
      {/* Triangle */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        clipPath: isTop ? clipTop : clipBottom,
        background: triColor,
        filter: hasHighlight
          ? `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 3px ${glowColor})`
          : 'none',
        transition: 'filter 0.2s ease',
        pointerEvents: 'none',
      }} />

      {/* Colour overlay */}
      {overlayColor && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          clipPath: isTop ? clipTop : clipBottom,
          background: overlayColor,
          animation: isValidDest ? 'pulse-dest 1s ease-in-out infinite' : undefined,
          pointerEvents: 'none',
        }} />
      )}

      {/* Ring at the tip for valid destinations */}
      {isValidDest && (
        <div style={{
          position: 'absolute',
          top:    isTop ? 'auto' : 3,
          bottom: isTop ? 3 : 'auto',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 32, height: 32,
          borderRadius: '50%',
          border: '3px solid #00e87a',
          boxShadow: '0 0 12px #00e87a, inset 0 0 6px rgba(0,232,122,0.25)',
          animation: 'pulse-ring 0.9s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 25,
        }} />
      )}
      {/* Dashed ring for combined (both-dice) destinations */}
      {isCombinedDest && !isValidDest && (
        <div style={{
          position: 'absolute',
          top:    isTop ? 'auto' : 4,
          bottom: isTop ? 4 : 'auto',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 26, height: 26,
          borderRadius: '50%',
          border: '2px dashed #40a0ff',
          boxShadow: '0 0 8px rgba(64,160,255,0.6)',
          animation: 'pulse-ring 1.2s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 24,
        }} />
      )}

      {/* Point number label */}
      <div style={{
        position: 'absolute',
        [isTop ? 'top' : 'bottom']: -18,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 9,
        color: '#a89060',
        fontFamily: 'Space Mono, monospace',
        userSelect: 'none',
        opacity: 0.7,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}>{pointNumber}</div>

      {/* Checkers — touch falls through to data-point on this div; desktop drag on top checker */}
      <div style={{
        position: 'absolute',
        top: isTop ? 0 : 'auto',
        bottom: isTop ? 'auto' : 0,
        left: 0, right: 0, height: '100%',
        pointerEvents: 'none',
      }}>
        {checkers.slice(0, 6).map((c, i) => {
          const shown = Math.min(checkers.length, 6);
          const isTopChecker = i === shown - 1;
          const canDrag = isMovable && isTopChecker;
          return (
            <div
              key={i}
              ref={isTopChecker ? topCheckerRef : null}
              draggable={canDrag}
              onMouseDown={canDrag ? (e) => { e.stopPropagation(); onMouseDown && onMouseDown(pointNumber); } : undefined}
              onClick={canDrag ? (e) => e.stopPropagation() : undefined}
              onDragStart={canDrag ? (e) => {
                if (topCheckerRef.current) e.dataTransfer.setDragImage(topCheckerRef.current, 15, 15);
                e.stopPropagation();
                onDragStart && onDragStart(pointNumber);
              } : undefined}
              style={{
                position: 'absolute',
                width: CHECKER, height: CHECKER,
                borderRadius: '50%',
                [isTop ? 'top' : 'bottom']: i * STEP,
                left: '50%',
                transform: 'translateX(-50%)',
                background: c === 'white'
                  ? 'radial-gradient(circle at 35% 35%, #f5f0e8, #d4c8a8, #b8a87c)'
                  : 'radial-gradient(circle at 35% 35%, #c0392b, #8b1a1a, #5c0f0f)',
                boxShadow: c === 'white'
                  ? '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.6)'
                  : '0 2px 6px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,100,100,0.3)',
                border: c === 'white' ? '2px solid #a09060' : '2px solid #6b1010',
                zIndex: 10 + i,
                pointerEvents: canDrag ? 'auto' : 'none',
                cursor: canDrag ? 'grab' : 'default',
              }}
            />
          );
        })}

        {checkers.length > 6 && (
          <div style={{
            position: 'absolute',
            [isTop ? 'top' : 'bottom']: 5 * STEP + 6,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a1a1a', color: '#ffd700',
            fontSize: 10, fontFamily: 'Space Mono', fontWeight: 700,
            borderRadius: 10, padding: '1px 5px',
            zIndex: 30, pointerEvents: 'none',
          }}>{checkers.length}</div>
        )}
      </div>
    </div>
  );
}

// ─── BAR ─────────────────────────────────────────────────────────────────────
// playerColor's pieces always sit at the bottom half (near their home side).
// Opponent's pieces sit at the top half.
function Bar({ whiteCount, blackCount, selectedPoint, onClickBar, onDragStart, onMouseDown, onDrop, currentPlayer, isMyTurn, d }) {
  const { BAR_W, BAR_CHECKER, POINT_H } = d;
  const isSelected = selectedPoint === 'bar';
  const myColor    = currentPlayer;
  const myCount    = myColor === 'white' ? whiteCount : blackCount;
  const isMovable  = isMyTurn && myCount > 0;
  const halfH      = Math.floor(POINT_H / 2);
  // Bottom half = active (current) player's hit pieces; top half = opponent's.
  const bottomColor = currentPlayer;
  const topColor    = currentPlayer === 'white' ? 'black' : 'white';
  const bottomCount = currentPlayer === 'white' ? whiteCount : blackCount;
  const topCount    = currentPlayer === 'white' ? blackCount : whiteCount;

  const cs = (color) => ({
    width: BAR_CHECKER, height: BAR_CHECKER, borderRadius: '50%', flexShrink: 0,
    background: color === 'white'
      ? 'radial-gradient(circle at 35% 35%, #f5f0e8, #d4c8a8, #b8a87c)'
      : 'radial-gradient(circle at 35% 35%, #c0392b, #8b1a1a, #5c0f0f)',
    border: color === 'white' ? '2px solid #a09060' : '2px solid #6b1010',
    boxShadow: '0 2px 5px rgba(0,0,0,0.6)',
  });

  // Renders up to 5 visible checkers + optional count badge for one colour.
  const renderGroup = (color, count) => {
    const shown      = Math.min(count, 5);
    const canDragCol = isMovable && myColor === color;
    const pieces = Array.from({ length: shown }).map((_, i) => {
      // In column layout     : piece 0 is at top, last (shown-1) is at bottom (closest to centre).
      // In column-reverse    : piece 0 is at bottom, last (shown-1) is at top (closest to centre).
      // Either way isTopChecker = last shown = draggable top-of-pile piece.
      const isTopChecker = i === shown - 1;
      const canDrag      = canDragCol && isTopChecker;
      return (
        <div key={i}
          draggable={canDrag}
          onMouseDown={canDrag ? (e) => { e.stopPropagation(); onMouseDown && onMouseDown('bar'); } : undefined}
          onClick={canDrag ? (e) => e.stopPropagation() : undefined}
          onDragStart={canDrag ? (e) => {
            const c = makeDragCanvas(color, BAR_CHECKER);
            e.dataTransfer.setDragImage(c, BAR_CHECKER / 2, BAR_CHECKER / 2);
            e.stopPropagation(); onDragStart && onDragStart('bar');
          } : undefined}
          style={{ ...cs(color), cursor: canDrag ? 'grab' : 'default', pointerEvents: canDrag ? 'auto' : 'none' }}
        />
      );
    });
    // Badge goes AFTER pieces so it appears at the centre-side end (column: bottom; column-reverse: top).
    const badge = count > 5
      ? <div key="badge" style={{ color: '#ffd700', fontSize: 9, fontFamily: 'Space Mono', fontWeight: 700, flexShrink: 0 }}>{count}</div>
      : null;
    return [...pieces, badge];
  };

  return (
    <div
      data-point="bar"
      onClick={() => isMyTurn && onClickBar()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDrop && onDrop('bar'); }}
      style={{
        width: BAR_W, height: POINT_H, position: 'relative',
        background: 'linear-gradient(180deg, #1a0f05 0%, #2a1a08 50%, #1a0f05 100%)',
        borderLeft: '3px solid #6b4a1a', borderRight: '3px solid #6b4a1a',
        cursor: isMovable ? 'grab' : 'default',
        boxShadow: isSelected ? 'inset 0 0 20px rgba(255,215,0,0.4)' : 'inset 0 0 10px rgba(0,0,0,0.5)',
        transition: 'box-shadow 0.2s ease',
        flexShrink: 0, zIndex: 5, touchAction: 'none',
      }}
    >
      {/* Opponent's pieces — top half, stack top-down */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: halfH,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'flex-start', paddingTop: 4, gap: 3, overflow: 'hidden',
      }}>
        {renderGroup(topColor, topCount)}
      </div>

      {/* Player's own pieces — bottom half, stack bottom-up (closest to board centre) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: halfH,
        display: 'flex', flexDirection: 'column-reverse', alignItems: 'center',
        justifyContent: 'flex-start', paddingBottom: 4, gap: 3, overflow: 'hidden',
      }}>
        {renderGroup(bottomColor, bottomCount)}
      </div>
    </div>
  );
}

// ─── BEAR-OFF TRAY ────────────────────────────────────────────────────────────
// Single-colour tray — rendered once for each player's side.
// `fromTop`: pieces stack downward (top tray); otherwise upward (bottom tray).
function BearOffTray({ count, color, fromTop, isValidDest, isCombinedDest, onClick, onDrop, d }) {
  const { BEAROFF_W, POINT_H } = d;
  const isWhite = color === 'white';
  const chipBg  = isWhite
    ? 'radial-gradient(#f5f0e8, #b8a87c)'
    : 'radial-gradient(#c0392b, #5c0f0f)';
  const chipBorder = isWhite ? '1px solid #a09060' : '1px solid #6b1010';

  const borderColor = isValidDest ? '#00e87a' : isCombinedDest ? '#40a0ff' : '#3a5a2a';
  const boxShadow   = isValidDest
    ? '0 0 18px rgba(0,232,122,0.7), inset 0 0 12px rgba(0,232,122,0.2)'
    : isCombinedDest
      ? '0 0 14px rgba(64,160,255,0.6), inset 0 0 8px rgba(64,160,255,0.15)'
      : 'none';

  return (
    <div
      data-point="bearoff"
      onClick={onClick}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDrop && onDrop('bearoff'); }}
      style={{
        width: BEAROFF_W, height: POINT_H,
        background: 'linear-gradient(180deg, #0f1a0a, #1a2a10, #0f1a0a)',
        border: `2px ${isCombinedDest && !isValidDest ? 'dashed' : 'solid'} ${borderColor}`,
        borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: fromTop ? 'flex-start' : 'flex-end',
        cursor: (isValidDest || isCombinedDest) ? 'copy' : 'default',
        boxShadow,
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        overflow: 'hidden', flexShrink: 0, touchAction: 'none',
        paddingTop: fromTop ? 4 : 0, paddingBottom: fromTop ? 0 : 4,
        gap: 2,
      }}
    >
      {count > 12 && (
        <div style={{ color: '#ffd700', fontSize: 10, fontFamily: 'Space Mono', marginBottom: 2 }}>{count}</div>
      )}
      {Array.from({ length: Math.min(count, 12) }).map((_, i) => (
        <div key={i} style={{ width: BEAROFF_W - 8, height: 7, borderRadius: 4, background: chipBg, border: chipBorder, flexShrink: 0 }} />
      ))}
    </div>
  );
}

// ─── MAIN BOARD ──────────────────────────────────────────────────────────────
export default function Board({ gameState, selectedPoint, validDestinations, movableSources, combinedDests = [], playerColor, isMyTurn, onSelectPoint, onDirectMove, landscape }) {
  if (!gameState) return null;

  const { points, bar, borneOff, currentPlayer } = gameState;
  const d = landscape ? L : P;
  const flip = playerColor === 'black'; // black sees their home at bottom

  // ── Desktop drag ──────────────────────────────────────────────────────────
  const dropOccurred = useRef(false);
  const dragSrcRef   = useRef(null); // source point of current desktop drag

  // ── Touch drag — all live values via refs (no stale closures) ────────────
  const boardRef          = useRef(null);
  const movableRef        = useRef(movableSources);
  const onSelectRef       = useRef(onSelectPoint);
  const onDirectMoveRef   = useRef(onDirectMove);
  const isMyTurnRef       = useRef(isMyTurn);
  const currentPlayerRef  = useRef(currentPlayer);
  const barRef            = useRef(bar);
  const dimsRef           = useRef(d);
  const touchActive       = useRef(false);
  const touchSrcRef       = useRef(null); // source point of current touch drag

  // Sync refs every render
  movableRef.current       = movableSources;
  onSelectRef.current      = onSelectPoint;
  onDirectMoveRef.current  = onDirectMove;
  isMyTurnRef.current      = isMyTurn;
  currentPlayerRef.current = currentPlayer;
  barRef.current           = bar;
  dimsRef.current          = d;

  // ── Touch listener setup (once on mount) ─────────────────────────────────
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    // Floating checker is appended to document.body — outside any zoomed
    // container — so its position:fixed coords are always viewport-accurate.
    const fc = document.createElement('div');
    Object.assign(fc.style, {
      display: 'none', position: 'fixed',
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.7)',
      pointerEvents: 'none',
      zIndex: '9999',
      opacity: '0.92',
    });
    document.body.appendChild(fc);

    // Walk DOM up to find nearest data-point ancestor
    const getPt = (el) => {
      let node = el;
      while (node && node !== document.body) {
        const dp = node.dataset?.point;
        if (dp !== undefined) {
          if (dp === 'bar') return 'bar';
          if (dp === 'bearoff') return 'bearoff';
          const n = parseInt(dp);
          return isNaN(n) ? null : n;
        }
        node = node.parentElement;
      }
      return null;
    };

    const showFloat = (x, y, color) => {
      const sz = dimsRef.current.CHECKER;
      fc.style.width      = `${sz}px`;
      fc.style.height     = `${sz}px`;
      fc.style.display    = 'block';
      fc.style.left       = `${x}px`;
      fc.style.top        = `${y}px`;
      fc.style.background = color === 'white'
        ? 'radial-gradient(circle at 35% 35%, #f5f0e8, #d4c8a8, #b8a87c)'
        : 'radial-gradient(circle at 35% 35%, #c0392b, #8b1a1a, #5c0f0f)';
      fc.style.border = color === 'white' ? '2px solid #a09060' : '2px solid #6b1010';
    };
    const hideFloat = () => { fc.style.display = 'none'; };

    const onTouchStart = (e) => {
      if (!isMyTurnRef.current) return;
      const touch  = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const pt     = getPt(target);
      if (pt === null) return;

      const ms    = movableRef.current;
      const color = currentPlayerRef.current;
      const canMove = pt === 'bar'
        ? barRef.current[color] > 0
        : ms.includes(pt);
      if (!canMove) return;

      e.preventDefault();
      touchActive.current = true;
      touchSrcRef.current = pt;           // remember source for direct move
      onSelectRef.current(pt);            // visual highlight (best-effort)
      showFloat(touch.clientX, touch.clientY, color);
    };

    const onTouchMove = (e) => {
      if (!touchActive.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      fc.style.left = `${touch.clientX}px`;
      fc.style.top  = `${touch.clientY}px`;
    };

    const onTouchEnd = (e) => {
      if (!touchActive.current) return;
      touchActive.current = false;
      const touch  = e.changedTouches[0];
      const src    = touchSrcRef.current;
      touchSrcRef.current = null;

      // Hide BEFORE elementFromPoint — otherwise fc blocks hit detection
      hideFloat();

      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const dest   = getPt(target);

      if (dest !== null && dest !== src) {
        // Real drag: use handleDirectMove which relies only on refs (no stale
        // closure) — this is the fix for bear-off and all touch-drag moves.
        // Sound is played inside handleDirectMove (with blot hit detection).
        onDirectMoveRef.current(src, dest);
      } else if (dest === src) {
        // Finger lifted on same point → just keep the piece selected (already
        // selected by onSelectRef in touchStart above).
        // Nothing extra needed.
      } else {
        // Dropped outside the board → deselect
        onSelectRef.current(null);
      }
    };

    board.addEventListener('touchstart', onTouchStart, { passive: false });
    board.addEventListener('touchmove',  onTouchMove,  { passive: false });
    board.addEventListener('touchend',   onTouchEnd);

    return () => {
      board.removeEventListener('touchstart', onTouchStart);
      board.removeEventListener('touchmove',  onTouchMove);
      board.removeEventListener('touchend',   onTouchEnd);
      document.body.removeChild(fc);
    };
  }, []); // intentionally empty — all live values read via refs above

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getCheckers      = (pt) => { const p = points[pt]; return (!p || !p.color || p.count === 0) ? [] : Array(p.count).fill(p.color); };
  const isValidDest      = (pt) => validDestinations.some(d => d.to === pt);
  const isCombinedDest   = (pt) => !isValidDest(pt) && combinedDests.includes(pt);
  const isMovableSrc     = (pt) => movableSources.includes(pt);
  const isBearOffDest    = validDestinations.some(d => d.to === 0 || d.to === 25);
  const isCombinedBearOff = !isBearOffDest && combinedDests.includes('bearoff');
  const ptColor          = (pt) => (pt % 2 === 0) ? 'light' : 'dark';

  // ── Desktop drag handlers ─────────────────────────────────────────────────
  const handleMouseDown = (pt) => { dragSrcRef.current = pt; onSelectPoint(pt); };
  const handleDragStart = () => { dropOccurred.current = false; };
  const handleDrop      = (pt) => {
    dropOccurred.current = true;
    const src = dragSrcRef.current;
    dragSrcRef.current = null;
    // Use onDirectMove (ref-based, bypasses selectedPoint) so that drops work
    // even when the piece was already selected before the drag started — in that
    // case onMouseDown deselects it (selectedPoint===pt triggers the deselect
    // branch), but dragSrcRef still knows where the drag came from.
    if (src !== null) {
      onDirectMove(src, pt);
    } else {
      onSelectPoint(pt);
    }
  };
  const handleDragEnd = () => {
    dragSrcRef.current = null;
    if (!dropOccurred.current) onSelectPoint(null);
    dropOccurred.current = false;
  };

  const ptProps = (pt) => ({
    key: pt, pointNumber: pt, color: ptColor(pt), checkers: getCheckers(pt),
    isSelected: selectedPoint === pt, isValidDest: isValidDest(pt), isCombinedDest: isCombinedDest(pt), isMovable: isMovableSrc(pt),
    onClick: () => onSelectPoint(pt), onDragStart: handleDragStart, onMouseDown: handleMouseDown, onDrop: handleDrop, d,
  });

  const topRow    = flip ? [12, 11, 10,  9,  8,  7,  6,  5,  4,  3,  2,  1] : [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
  const bottomRow = flip ? [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24] : [12, 11, 10,  9,  8,  7,  6,  5,  4,  3,  2,  1];

  // Each side's tray shows only its own colour's collected pieces.
  // Bottom = current player's home side; top = opponent's side.
  const myColor  = playerColor;                                      // e.g. 'white'
  const oppColor = playerColor === 'white' ? 'black' : 'white';     // e.g. 'black'
  const myBorneOff  = borneOff[myColor];
  const oppBorneOff = borneOff[oppColor];

  return (
    <div
      ref={boardRef}
      onDragEnd={handleDragEnd}
      style={{
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg, #2c1a08 0%, #3d2510 50%, #2c1a08 100%)',
        borderRadius: 12,
        padding: '16px 8px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,220,100,0.1)',
        border: '3px solid #6b4a1a',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      <div style={{
        background: 'linear-gradient(180deg, #1a4d2e 0%, #153d24 100%)',
        borderRadius: 8, padding: '8px 6px',
        display: 'flex', flexDirection: 'column',
        border: '2px solid #0d2a18',
        boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.4)',
      }}>

        {/* Top row: 13-24 */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: POINT_GAP, alignItems: 'flex-start', marginBottom: 4 }}>
          <div style={{ display: 'flex', gap: POINT_GAP }}>
            {topRow.slice(0, 6).map(pt => <PointTriangle {...ptProps(pt)} isTop={true} />)}
          </div>
          <Bar
            whiteCount={bar.white} blackCount={bar.black}
            selectedPoint={selectedPoint}
            onClickBar={() => onSelectPoint('bar')}
            onDragStart={handleDragStart} onMouseDown={handleMouseDown} onDrop={handleDrop}
            currentPlayer={currentPlayer} isMyTurn={isMyTurn}
            d={d}
          />
          <div style={{ display: 'flex', gap: POINT_GAP }}>
            {topRow.slice(6).map(pt => <PointTriangle {...ptProps(pt)} isTop={true} />)}
          </div>
          <BearOffTray
            count={oppBorneOff} color={oppColor} fromTop={true}
            isValidDest={false}
            d={d}
          />
        </div>

        {/* Centre strip */}
        <div style={{
          height: 30,
          background: 'linear-gradient(90deg, #0d2a18, #0f3020, #0d2a18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderTop: '1px solid #1a5030', borderBottom: '1px solid #1a5030',
        }}>
          <div style={{ color: '#3a7a50', fontSize: 12, fontFamily: 'Playfair Display', letterSpacing: 8, opacity: 0.7 }}>
            ✦ Üstad Tito ✦
          </div>
        </div>

        {/* Bottom row: 12-1 */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: POINT_GAP, alignItems: 'flex-end', marginTop: 4 }}>
          <div style={{ display: 'flex', gap: POINT_GAP }}>
            {bottomRow.slice(0, 6).map(pt => <PointTriangle {...ptProps(pt)} isTop={false} />)}
          </div>
          {/* Bottom bar column — matches the top Bar width and accepts drops */}
          <div
            data-point="bar"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleDrop('bar'); }}
            style={{
              width: d.BAR_W, height: d.POINT_H,
              background: 'linear-gradient(180deg, #1a0f05 0%, #2a1a08 50%, #1a0f05 100%)',
              borderLeft: '3px solid #6b4a1a', borderRight: '3px solid #6b4a1a',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', gap: POINT_GAP }}>
            {bottomRow.slice(6).map(pt => <PointTriangle {...ptProps(pt)} isTop={false} />)}
          </div>
          <BearOffTray
            count={myBorneOff} color={myColor} fromTop={false}
            isValidDest={isBearOffDest && isMyTurn}
            isCombinedDest={isCombinedBearOff && isMyTurn}
            onClick={() => (isBearOffDest || isCombinedBearOff) && onSelectPoint('bearoff')}
            onDrop={handleDrop}
            d={d}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulse-dest { 0%,100%{opacity:0.55} 50%{opacity:0.88} }
        @keyframes pulse-ring { 0%,100%{opacity:0.75} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
