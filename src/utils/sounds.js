let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Noise burst at a given time, tuned to sound like hard material impact
function impact(c, startTime, amplitude, freqCenter) {
  const dur = 0.055 + Math.random() * 0.03;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    // Sharper attack with exponential decay
    const env = Math.pow(1 - i / len, 3.5);
    data[i] = (Math.random() * 2 - 1) * env;
  }

  const src = c.createBufferSource();
  src.buffer = buf;

  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 600;

  const peak = c.createBiquadFilter();
  peak.type = 'peaking';
  peak.frequency.value = freqCenter;
  peak.gain.value = 10;
  peak.Q.value = 1.2;

  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 8000;

  const gain = c.createGain();
  gain.gain.value = amplitude;

  src.connect(hp);
  hp.connect(peak);
  peak.connect(lp);
  lp.connect(gain);
  gain.connect(c.destination);
  src.start(startTime);
}

// ─── DICE ROLL ────────────────────────────────────────────────────────────────
// Simulates multiple dice impacts: fast rattling then settling
export function playDiceRoll() {
  try {
    const c = getCtx();
    const now = c.currentTime;

    // Irregular hit schedule (ms) — fast at start, slower at end like dice settling
    const hits = [0, 55, 105, 150, 190, 225, 255, 280, 302];
    hits.forEach((ms, i) => {
      const t = now + ms / 1000;
      // Amplitude decays as dice slow down
      const amp = 0.65 * Math.pow(0.82, i);
      // Pitch varies per hit — dice tumbling produces different facets
      const freq = 1200 + Math.random() * 900;
      setTimeout(() => impact(c, c.currentTime, amp, freq), ms);
    });
  } catch (e) { /* silent fail */ }
}

// ─── CHECKER MOVE ─────────────────────────────────────────────────────────────
// Wooden checker placed on board: sharp click + low thud + brief resonance
export function playCheckerMove() {
  try {
    const c = getCtx();
    const now = c.currentTime;

    // 1. Sharp click transient (wood surface contact)
    const clickLen = Math.floor(c.sampleRate * 0.01);
    const clickBuf = c.createBuffer(1, clickLen, c.sampleRate);
    const cd = clickBuf.getChannelData(0);
    for (let i = 0; i < clickLen; i++) {
      cd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / clickLen, 2.5);
    }
    const clickSrc = c.createBufferSource();
    clickSrc.buffer = clickBuf;
    const clickBp = c.createBiquadFilter();
    clickBp.type = 'bandpass';
    clickBp.frequency.value = 3200;
    clickBp.Q.value = 0.6;
    const clickGain = c.createGain();
    clickGain.gain.value = 0.8;
    clickSrc.connect(clickBp);
    clickBp.connect(clickGain);
    clickGain.connect(c.destination);
    clickSrc.start(now);

    // 2. Low thud — body of the wooden checker
    const thudOsc = c.createOscillator();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(210, now);
    thudOsc.frequency.exponentialRampToValueAtTime(75, now + 0.18);
    const thudGain = c.createGain();
    thudGain.gain.setValueAtTime(0, now);
    thudGain.gain.linearRampToValueAtTime(0.5, now + 0.003);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    thudOsc.connect(thudGain);
    thudGain.connect(c.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.2);

    // 3. Brief board resonance
    const resonOsc = c.createOscillator();
    resonOsc.type = 'triangle';
    resonOsc.frequency.value = 340;
    const resonGain = c.createGain();
    resonGain.gain.setValueAtTime(0, now);
    resonGain.gain.linearRampToValueAtTime(0.1, now + 0.005);
    resonGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    resonOsc.connect(resonGain);
    resonGain.connect(c.destination);
    resonOsc.start(now);
    resonOsc.stop(now + 0.28);
  } catch (e) { /* silent fail */ }
}

// ─── CHECKER HIT (sent to bar) ────────────────────────────────────────────────
export function playCheckerHit() {
  try {
    const c = getCtx();
    const now = c.currentTime;

    // Harder impact
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.55, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.25);

    // Clack
    const len = Math.floor(c.sampleRate * 0.015);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = 0.5;
    src.connect(g);
    g.connect(c.destination);
    src.start(now);
  } catch (e) { /* silent fail */ }
}

// ─── WIN ─────────────────────────────────────────────────────────────────────
export function playWin() {
  try {
    const c = getCtx();
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.28, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.35);
      }, i * 130);
    });
  } catch (e) { /* silent fail */ }
}
