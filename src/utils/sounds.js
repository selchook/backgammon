let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function playDiceRoll() {
  try {
    const c = getCtx();
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const len = Math.floor(c.sampleRate * 0.06);
        const buf = c.createBuffer(1, len, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let j = 0; j < len; j++) {
          data[j] = (Math.random() * 2 - 1) * 0.45 * Math.exp(-j / len * 3);
        }
        const src = c.createBufferSource();
        src.buffer = buf;
        const filter = c.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 900 + Math.random() * 700;
        filter.Q.value = 0.6;
        const gain = c.createGain();
        gain.gain.setValueAtTime(0.55, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);
        src.start();
      }, i * 100 + Math.random() * 40);
    }
  } catch (e) { /* silent fail */ }
}

export function playCheckerMove() {
  try {
    const c = getCtx();
    // Thud
    const len = Math.floor(c.sampleRate * 0.025);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let j = 0; j < len; j++) {
      data[j] = (Math.random() * 2 - 1) * Math.exp(-j / len * 10);
    }
    const noise = c.createBufferSource();
    noise.buffer = buf;
    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(0.4, c.currentTime);
    noise.connect(noiseGain);
    noiseGain.connect(c.destination);
    noise.start(c.currentTime);

    // Tone
    const osc = c.createOscillator();
    const oscGain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(260, c.currentTime + 0.12);
    oscGain.gain.setValueAtTime(0.25, c.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.14);
    osc.connect(oscGain);
    oscGain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.14);
  } catch (e) { /* silent fail */ }
}

export function playCheckerHit() {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.22);
    gain.gain.setValueAtTime(0.45, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.22);
  } catch (e) { /* silent fail */ }
}

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
