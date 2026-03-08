// ─── BACKGAMMON GAME LOGIC ───────────────────────────────────────────────────
// Points are 1-indexed (1–24). White moves 24→1 (direction -1). Black moves 1→24 (direction +1).
// Bar re-entry: white enters at (25 - die), black enters at (die).
// Bear-off: white off = 0, black off = 25.

export function createInitialState() {
  const points = [null]; // index 0 unused
  for (let i = 1; i <= 24; i++) points.push({ color: null, count: 0 });

  const setup = [
    [1, 'black', 2], [6, 'white', 5], [8, 'white', 3], [12, 'black', 5],
    [13, 'white', 5], [17, 'black', 3], [19, 'black', 5], [24, 'white', 2],
  ];
  for (const [pt, color, count] of setup) {
    points[pt] = { color, count };
  }

  return {
    points,
    bar: { white: 0, black: 0 },
    borneOff: { white: 0, black: 0 },
    currentPlayer: 'white',
    dice: [],
    phase: 'rolling', // 'rolling' | 'moving' | 'ended'
    winner: null,
  };
}

export function rollDice() {
  const d1 = Math.ceil(Math.random() * 6);
  const d2 = Math.ceil(Math.random() * 6);
  return d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
}

export function opponent(player) {
  return player === 'white' ? 'black' : 'white';
}

export function canBearOff(state, player) {
  if (state.bar[player] > 0) return false;
  const homeMin = player === 'white' ? 1 : 19;
  const homeMax = player === 'white' ? 6 : 24;
  for (let i = 1; i <= 24; i++) {
    if (i < homeMin || i > homeMax) {
      if (state.points[i]?.color === player && state.points[i].count > 0) return false;
    }
  }
  return true;
}

// Returns array of valid destination points (numbers) for a given source point using any die.
// fromPoint: 1-24, or 'bar'
// Returns: array of { to, die } objects
export function getValidMoves(state, fromPoint, player) {
  const dir = player === 'white' ? -1 : 1;
  const opp = opponent(player);
  const bearing = canBearOff(state, player);
  const moves = [];

  const canLandOn = (pt) => {
    if (pt < 1 || pt > 24) return false;
    const p = state.points[pt];
    return !p.color || p.color === player || (p.color === opp && p.count === 1);
  };

  const uniqueDice = [...new Set(state.dice)];

  if (fromPoint === 'bar') {
    for (const die of uniqueDice) {
      const dest = player === 'white' ? 25 - die : die;
      if (canLandOn(dest)) moves.push({ to: dest, die });
    }
    return moves;
  }

  for (const die of uniqueDice) {
    const dest = fromPoint + dir * die;

    if (dest >= 1 && dest <= 24) {
      if (canLandOn(dest)) moves.push({ to: dest, die });
    } else if (bearing) {
      // Bear-off
      const bearPt = player === 'white' ? 0 : 25;
      const distOff = player === 'white' ? fromPoint : 25 - fromPoint;

      if (die === distOff) {
        // Exact
        moves.push({ to: bearPt, die });
      } else if (die > distOff) {
        // Overshoot — only if fromPoint is the highest occupied home point
        let isHighest = true;
        if (player === 'white') {
          for (let p = fromPoint + 1; p <= 6; p++) {
            if (state.points[p]?.color === 'white' && state.points[p].count > 0) { isHighest = false; break; }
          }
        } else {
          for (let p = fromPoint - 1; p >= 19; p--) {
            if (state.points[p]?.color === 'black' && state.points[p].count > 0) { isHighest = false; break; }
          }
        }
        if (isHighest) moves.push({ to: bearPt, die });
      }
    }
  }

  return moves;
}

// Returns all sources the current player CAN move from (used for highlighting)
export function getMovableSources(state, player) {
  const sources = [];
  if (state.bar[player] > 0) {
    if (getValidMoves(state, 'bar', player).length > 0) sources.push('bar');
    return sources; // must clear bar first
  }
  for (let i = 1; i <= 24; i++) {
    if (state.points[i]?.color === player && state.points[i].count > 0) {
      if (getValidMoves(state, i, player).length > 0) sources.push(i);
    }
  }
  return sources;
}

export function hasAnyMove(state, player) {
  return getMovableSources(state, player).length > 0;
}

export function applyMove(state, fromPoint, toPoint, die) {
  const player = state.currentPlayer;
  const opp = opponent(player);

  // Deep clone
  const s = JSON.parse(JSON.stringify(state));

  // Remove from source
  if (fromPoint === 'bar') {
    s.bar[player]--;
  } else {
    s.points[fromPoint].count--;
    if (s.points[fromPoint].count === 0) s.points[fromPoint].color = null;
  }

  // Place at destination
  if (toPoint === 0 || toPoint === 25) {
    s.borneOff[player]++;
  } else {
    // Hit opponent blot
    if (s.points[toPoint].color === opp && s.points[toPoint].count === 1) {
      s.points[toPoint].count = 0;
      s.points[toPoint].color = null;
      s.bar[opp]++;
    }
    s.points[toPoint].color = player;
    s.points[toPoint].count++;
  }

  // Consume die
  const idx = s.dice.indexOf(die);
  if (idx !== -1) s.dice.splice(idx, 1);

  // Check win
  if (s.borneOff[player] === 15) {
    s.phase = 'ended';
    s.winner = player;
    return s;
  }

  // Check if turn should end
  if (s.dice.length === 0 || !hasAnyMove(s, player)) {
    const next = opp;
    s.currentPlayer = next;
    s.phase = 'rolling';
    s.dice = [];
  }

  return s;
}

export function skipTurn(state) {
  const s = JSON.parse(JSON.stringify(state));
  s.currentPlayer = opponent(s.currentPlayer);
  s.phase = 'rolling';
  s.dice = [];
  return s;
}
