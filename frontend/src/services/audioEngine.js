// Web Audio API Tibetan Singing Bowl & Ambient Soundscape Synthesizer
let audioCtx = null;
let activeAmbientSource = null;
let ambientGainNode = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a rich, resonant Tibetan Singing Bowl Bell Chime.
 * Uses additive synthesis with natural harmonics (fundamental + partials)
 * with exponential release decay to replicate authentic bronze/crystal bells.
 */
export function playSingingBowlBell(type = 'medium') {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Base frequency: 216Hz for deep grounding bowl, 432Hz for heart bowl, 528Hz for clear chime
  const baseFreq = type === 'deep' ? 180 : type === 'high' ? 432 : 272;
  const decayTime = type === 'deep' ? 6.5 : type === 'high' ? 4.0 : 5.2;

  // Harmonic partial ratios typical of handmade Tibetan bronze singing bowls
  const harmonics = [
    { mult: 1.0, gain: 0.55 },
    { mult: 2.76, gain: 0.28 },
    { mult: 4.82, gain: 0.12 },
    { mult: 6.95, gain: 0.05 }
  ];

  harmonics.forEach(({ mult, gain: harmonicGain }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * mult, now);
    // Subtle frequency modulation for authentic shimmer
    osc.frequency.exponentialRampToValueAtTime(baseFreq * mult * 0.998, now + decayTime);

    // Envelope: sharp gentle attack, long soothing exponential decay
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(harmonicGain * 0.6, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + decayTime);
  });
}

/**
 * Start ambient background soundscape (Singing Bowl Drone, Rain, Forest Breeze, Stream, Binaural)
 */
export function startAmbientSound(soundType = 'singing_bowl_drone', volume = 0.4) {
  stopAmbientSound();
  const ctx = getAudioContext();
  if (!ctx) return;

  ambientGainNode = ctx.createGain();
  ambientGainNode.gain.setValueAtTime(0.01, ctx.currentTime);
  ambientGainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5);
  ambientGainNode.connect(ctx.destination);

  if (soundType === 'singing_bowl_drone' || soundType === 'drone') {
    // Warm meditative drone at 108Hz + 216Hz with soft LFO pulsator
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(108, ctx.currentTime);
    osc2.frequency.setValueAtTime(216, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(ambientGainNode);

    osc1.start();
    osc2.start();
    activeAmbientSource = { stop: () => { osc1.stop(); osc2.stop(); } };

  } else if (soundType === 'rain' || soundType === 'stream') {
    // Generative pink noise filter for gentle falling rain / moving water
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      output[i] = (b0 + b1 + b2 + b3) * 0.11;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = soundType === 'stream' ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(soundType === 'stream' ? 800 : 650, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(ambientGainNode);

    whiteNoise.start();
    activeAmbientSource = whiteNoise;
  }
}

/**
 * Stop active ambient soundscape
 */
export function stopAmbientSound() {
  if (ambientGainNode && audioCtx) {
    try {
      ambientGainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    } catch (e) {}
  }
  setTimeout(() => {
    if (activeAmbientSource) {
      try {
        activeAmbientSource.stop();
      } catch (e) {}
      activeAmbientSource = null;
    }
  }, 800);
}
