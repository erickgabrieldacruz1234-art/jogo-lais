// ============================================================================
// EFEITOS SONOROS SINTETIZADOS (Web Audio) + caixinha de música do final
// ============================================================================

let ctx = null;
let master = null;

function ac() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, start, dur, { type = "sine", vol = 0.2, slide = null, attack = 0.005 } = {}) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noise(start, dur, { vol = 0.2, freq = 800, q = 1, type = "lowpass" } = {}) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + start;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t0);
}

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

export const SYNTH = {
  step: () => noise(0, 0.05, { vol: 0.05, freq: 1200 }),
  push: () => { noise(0, 0.22, { vol: 0.22, freq: 260 }); tone(70, 0, 0.2, { type: "triangle", vol: 0.12 }); },
  bump: () => tone(110, 0, 0.08, { type: "square", vol: 0.05 }),
  door: () => { noise(0, 0.5, { vol: 0.12, freq: 500, q: 6, type: "bandpass" }); tone(196, 0.05, 0.4, { type: "triangle", vol: 0.1, slide: 147 }); },
  key: () => [0, 0.08, 0.16].forEach((s, i) => tone(NOTE(84 + i * 4), s, 0.35, { type: "triangle", vol: 0.16 })),
  treasure: () => [76, 79, 83, 88].forEach((n, i) => tone(NOTE(n), i * 0.06, 0.3, { type: "sine", vol: 0.14 })),
  rose: () => {
    [72, 76, 79, 84, 88].forEach((n, i) => tone(NOTE(n), i * 0.11, 0.9, { type: "sine", vol: 0.13, attack: 0.02 }));
    [60, 67].forEach((n) => tone(NOTE(n), 0, 1.4, { type: "triangle", vol: 0.07, attack: 0.1 }));
  },
  swing: () => noise(0, 0.12, { vol: 0.12, freq: 2400, q: 2, type: "bandpass" }),
  arrow: () => { noise(0, 0.15, { vol: 0.1, freq: 3200, q: 3, type: "bandpass" }); tone(900, 0, 0.1, { type: "sine", vol: 0.05, slide: 500 }); },
  thunk: () => tone(160, 0, 0.08, { type: "triangle", vol: 0.12, slide: 90 }),
  hit: () => { tone(300, 0, 0.1, { type: "square", vol: 0.08, slide: 120 }); noise(0, 0.08, { vol: 0.12, freq: 900 }); },
  hurt: () => tone(330, 0, 0.3, { type: "sawtooth", vol: 0.1, slide: 110 }),
  heal: () => [72, 79].forEach((n, i) => tone(NOTE(n), i * 0.08, 0.3, { vol: 0.12 })),
  poof: () => noise(0, 0.3, { vol: 0.16, freq: 700 }),
  switch: () => { tone(1200, 0, 0.04, { type: "square", vol: 0.05 }); tone(600, 0.04, 0.08, { type: "triangle", vol: 0.08 }); },
  splash: () => { noise(0, 0.45, { vol: 0.25, freq: 900 }); tone(220, 0, 0.3, { vol: 0.08, slide: 80 }); },
  fire: () => noise(0, 0.25, { vol: 0.1, freq: 500 }),
  break: () => { noise(0, 0.5, { vol: 0.3, freq: 400 }); tone(90, 0, 0.4, { type: "triangle", vol: 0.15, slide: 40 }); },
  whoosh: () => noise(0, 0.3, { vol: 0.06, freq: 1500, q: 1, type: "bandpass" }),
  chime1: () => tone(NOTE(72), 0, 0.6, { vol: 0.15 }),
  chime2: () => tone(NOTE(76), 0, 0.6, { vol: 0.15 }),
  chime3: () => tone(NOTE(79), 0, 0.6, { vol: 0.15 }),
  chime4: () => tone(NOTE(84), 0, 0.6, { vol: 0.15 }),
  chime5: () => tone(NOTE(88), 0, 0.6, { vol: 0.15 }),
  heartbeat: () => { tone(60, 0, 0.12, { type: "sine", vol: 0.3 }); tone(55, 0.18, 0.14, { type: "sine", vol: 0.25 }); }
};

/** Caixinha de música romântica (loop) para a cena final. */
let musicTimer = null;
export function startMusicBox(intensity = 1) {
  stopMusicBox();
  const c = ac();
  if (!c) return;
  // C - G - Am - F (I–V–vi–IV)
  const chords = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
  const melody = [76, 79, 81, 79, 76, 74, 72, 74, 76, 74, 72, 71, 72, 74, 76, 77];
  let bar = 0;
  const beat = 0.42;
  const play = () => {
    const ch = chords[bar % 4];
    [0, 1, 2, 1, 0, 1, 2, 1].forEach((k, i) => tone(NOTE(ch[k] + 12), i * beat * 0.5, 0.9, { type: "triangle", vol: 0.045 * intensity, attack: 0.01 }));
    tone(NOTE(ch[0] - 12), 0, beat * 4, { type: "sine", vol: 0.06 * intensity, attack: 0.05 });
    for (let i = 0; i < 4; i++) tone(NOTE(melody[(bar * 4 + i) % melody.length]), i * beat, beat * 1.6, { type: "sine", vol: 0.07 * intensity, attack: 0.02 });
    bar++;
  };
  play();
  musicTimer = setInterval(play, beat * 4 * 1000);
}

export function stopMusicBox() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}
