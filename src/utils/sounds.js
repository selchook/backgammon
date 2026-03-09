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

// ─── WOODEN IMPACT HELPER ─────────────────────────────────────────────────────
// Generates a wood-knock: noise burst shaped by envelope, split into body + click bands
function woodKnock(c, startTime, amplitude, bodyFreq = 480, clickFreq = 2800, decayMs = 70) {
  const dur = decayMs / 1000;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    // Very sharp attack, exponential decay — characteristic wood knock envelope
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 5);
  }
  const src = c.createBufferSource();
  src.buffer = buf;

  // Wood body resonance band
  const body = c.createBiquadFilter();
  body.type = 'bandpass';
  body.frequency.value = bodyFreq;
  body.Q.value = 3.5;
  const bodyGain = c.createGain();
  bodyGain.gain.value = amplitude;

  // Surface click band
  const click = c.createBiquadFilter();
  click.type = 'bandpass';
  click.frequency.value = clickFreq;
  click.Q.value = 1.2;
  const clickGain = c.createGain();
  clickGain.gain.value = amplitude * 0.55;

  src.connect(body);  body.connect(bodyGain);   bodyGain.connect(c.destination);
  src.connect(click); click.connect(clickGain); clickGain.connect(c.destination);
  src.start(startTime);
}

// ─── CHECKER MOVE ─────────────────────────────────────────────────────────────
// Single wooden checker placed on board: one crisp wood knock
export function playCheckerMove() {
  try {
    const c = getCtx();
    woodKnock(c, c.currentTime, 1.1, 480 + Math.random() * 60, 2800, 65);
  } catch (e) { /* silent fail */ }
}

// ─── CHECKER HIT (sent to bar) ────────────────────────────────────────────────
// Two pieces clashing — louder double wood knock
export function playCheckerHit() {
  try {
    const c = getCtx();
    const now = c.currentTime;
    // First piece contact — full force
    woodKnock(c, now,        2.0, 380, 2400, 90);
    // Second piece recoil a few ms later — slightly softer
    woodKnock(c, now + 0.018, 1.4, 520, 3200, 60);
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
