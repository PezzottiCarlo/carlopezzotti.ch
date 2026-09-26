/* Ceresio OS — suono: generatore a 4 voci (2 quadre, triangolo, rumore) con WebAudio. */
(() => {
'use strict';
const OS = window.OS;
let ac = null, master, sfxBus, musBus, analyser, noiseBuf;

function init() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  master = ac.createGain();
  analyser = ac.createAnalyser(); analyser.fftSize = 64;
  master.connect(analyser); analyser.connect(ac.destination);
  sfxBus = ac.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
  musBus = ac.createGain(); musBus.gain.value = 0.55; musBus.connect(master);
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  applyVol();
  OS.emit('audio');
}
function applyVol() { if (master) master.gain.value = OS.settings.sound ? OS.settings.vol : 0; }
['pointerdown', 'keydown', 'touchend'].forEach((ev) => window.addEventListener(ev, init, true));
OS.on('settings', applyVol);

function tone(freq, dur, o = {}) {
  if (!ac || !OS.settings.sound) return;
  const t = ac.currentTime + (o.delay || 0) + (o.at ? o.at - ac.currentTime : 0);
  const osc = ac.createOscillator(), gn = ac.createGain();
  osc.type = o.type || 'square';
  osc.frequency.setValueAtTime(freq, t);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + o.slide), t + dur);
  const v = o.vol ?? 0.12;
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.linearRampToValueAtTime(v, t + 0.004);
  gn.gain.setValueAtTime(v, t + Math.max(0.005, dur * (o.sustain ?? 0.6)));
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gn); gn.connect(o.bus || sfxBus);
  osc.start(t); osc.stop(t + dur + 0.03);
}
function noise(dur, o = {}) {
  if (!ac || !OS.settings.sound) return;
  const t = o.at ?? ac.currentTime + (o.delay || 0);
  const s = ac.createBufferSource(); s.buffer = noiseBuf;
  const f = ac.createBiquadFilter(); f.type = o.ftype || 'highpass'; f.frequency.value = o.freq || 1000;
  if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t + dur);
  const gn = ac.createGain();
  gn.gain.setValueAtTime(o.vol ?? 0.15, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(gn); gn.connect(o.bus || sfxBus);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
const seq = (notes, step, o) => notes.forEach((n, i) => n && tone(n, step * 1.1, { ...o, delay: i * step }));

OS.sfx = {
  init, tone, noise,
  click: () => tone(1400, 0.025, { vol: 0.06 }),
  key: () => tone(900 + Math.random() * 300, 0.018, { vol: 0.03 }),
  select: () => tone(660, 0.05, { vol: 0.07 }),
  open: () => seq([523, 659, 784], 0.045, { vol: 0.07 }),
  close: () => seq([784, 587, 440], 0.04, { vol: 0.06 }),
  error: () => { tone(160, 0.22, { vol: 0.12, type: 'sawtooth' }); tone(120, 0.22, { vol: 0.1, delay: 0.1, type: 'sawtooth' }); },
  menu: () => tone(1000, 0.03, { vol: 0.05 }),
  post: () => tone(988, 0.12, { vol: 0.09 }),
  chime: () => seq([784, 988, 1175, 1568], 0.07, { vol: 0.08, type: 'triangle' }),
  coin: () => { tone(988, 0.06, { vol: 0.08 }); tone(1319, 0.2, { vol: 0.08, delay: 0.06 }); },
  hit: () => tone(440, 0.04, { vol: 0.07 }),
  brick: () => tone(660 + Math.random() * 200, 0.05, { vol: 0.06 }),
  die: () => tone(440, 0.5, { vol: 0.1, slide: -380, type: 'sawtooth' }),
  win: () => seq([523, 659, 784, 1047, 784, 1047], 0.09, { vol: 0.08 }),
  horn: () => { tone(110, 0.9, { vol: 0.13, type: 'sawtooth', sustain: 0.85 }); tone(138, 0.9, { vol: 0.08, type: 'square', sustain: 0.85 }); },
  scratch: () => noise(0.18, { freq: 600, sweep: 3000, vol: 0.2, ftype: 'bandpass' }),
  boom: () => { noise(0.8, { freq: 1200, sweep: 60, vol: 0.35, ftype: 'lowpass' }); tone(80, 0.6, { vol: 0.2, slide: -50, type: 'triangle' }); },
  boot: () => seq([392, 523, 659, 784, 1047], 0.09, { vol: 0.08, type: 'triangle' }),
  shutdown: () => seq([1047, 784, 659, 523, 392], 0.11, { vol: 0.08, type: 'triangle' }),
  thunder: () => noise(1.6, { freq: 400, sweep: 40, vol: 0.25, ftype: 'lowpass' }),
  levels() {
    if (!analyser) return null;
    const a = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(a);
    return a;
  },
  get ready() { return !!ac; }
};

/* ------------------------------------------------------------ brani */
// Un passo = una semicroma. "-" prolunga la nota precedente, "." è pausa.
// Batteria: k = cassa, s = rullante, h = charleston.
const TRACKS = [
  {
    id: 'lungolago', title: 'Lungolago', bpm: 96,
    lead: `E5 - - . C5 - A4 - B4 - C5 - E5 - - . | F5 - - . E5 - C5 - A4 - C5 - F5 - E5 . |
           G5 - - . E5 - C5 - D5 - E5 - G5 - - . | D5 - - . B4 - G4 - A4 - B4 - D5 - C5 .`,
    harm: `A4 - - - - - - - E4 - - - - - - - | A4 - - - - - - - F4 - - - - - - - |
           G4 - - - - - - - E4 - - - - - - - | G4 - - - - - - - D4 - - - - - - -`,
    bass: `A2 - - - A2 - - - E3 - - - A2 - - - | F2 - - - F2 - - - C3 - - - F2 - - - |
           C3 - - - C3 - - - G2 - - - C3 - - - | G2 - - - G2 - - - D3 - - - G2 - B2 -`,
    drum: `k . h . s . h . k . h . s . h h`
  },
  {
    id: 'pizza', title: 'Pizza Express', bpm: 148,
    lead: `C5 . E5 . G5 . E5 . C6 . G5 . E5 . G5 . | F5 . A5 . C6 . A5 . F5 . A5 . G5 . F5 . |
           E5 . G5 . C6 . G5 . D5 . F5 . B5 . G5 . | C6 - - . G5 - - . E5 . D5 . C5 - - .`,
    harm: `. . C5 . . . C5 . . . C5 . . . C5 . | . . C5 . . . C5 . . . C5 . . . C5 . |
           . . C5 . . . C5 . . . B4 . . . B4 . | . . E5 . . . E5 . . . G4 . . . . .`,
    bass: `C3 . C4 . C3 . C4 . C3 . C4 . C3 . C4 . | F2 . F3 . F2 . F3 . F2 . F3 . F2 . F3 . |
           C3 . C4 . C3 . C4 . G2 . G3 . G2 . G3 . | C3 . C4 . G2 . G3 . C3 - - . . . . .`,
    drum: `k . h . s . h . k k h . s . h .`
  },
  {
    id: 'sergente', title: 'Sergente', bpm: 116,
    lead: `D5 - - D5 D5 - F5 - A5 - - - F5 - D5 - | E5 - - E5 E5 - G5 - A5 - - - G5 - E5 - |
           F5 - - F5 F5 - A5 - D6 - - - A5 - F5 - | E5 - C#5 - D5 - - - - - - - . . . .`,
    harm: `A4 - - - - - - - D5 - - - - - - - | C#5 - - - - - - - E5 - - - - - - - |
           D5 - - - - - - - F5 - - - - - - - | C#5 - A4 - A4 - - - - - - - . . . .`,
    bass: `D3 - A2 - D3 - A2 - D3 - A2 - D3 - A2 - | A2 - E2 - A2 - E2 - A2 - E2 - A2 - E2 - |
           D3 - A2 - D3 - A2 - D3 - A2 - D3 - A2 - | A2 - A2 - D3 - - - . . . . . . . .`,
    drum: `s . s s s . s . k . . . k . s s`
  }
];
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function freq(tok) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(tok);
  if (!m) return 0;
  const n = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12;
  return 440 * Math.pow(2, (n - 69) / 12);
}
const parse = (s) => s.replace(/\|/g, ' ').trim().split(/\s+/);
for (const t of TRACKS) for (const ch of ['lead', 'harm', 'bass', 'drum']) t[ch] = parse(t[ch]);

const music = OS.music = {
  tracks: TRACKS, playing: null, step: 0, next: 0, timer: 0,
  play(id) {
    init();
    if (!ac) return;
    this.stop();
    this.playing = TRACKS.find((t) => t.id === id) || TRACKS[0];
    this.step = 0; this.next = ac.currentTime + 0.06;
    this.timer = setInterval(schedule, 25);
    OS.emit('music');
  },
  stop() { clearInterval(this.timer); this.timer = 0; this.playing = null; OS.emit('music'); },
  get beat() { return this.playing ? this.step : 0; }
};
const VOICES = {
  lead: { type: 'square', vol: 0.07 },
  harm: { type: 'square', vol: 0.035 },
  bass: { type: 'triangle', vol: 0.16 }
};
function schedule() {
  const tr = music.playing;
  if (!tr || !ac) return;
  const spb = 60 / tr.bpm / 4;
  while (music.next < ac.currentTime + 0.12) {
    const at = music.next;
    for (const ch of ['lead', 'harm', 'bass']) {
      const arr = tr[ch];
      const i = music.step % arr.length;
      const f = freq(arr[i]);
      if (!f) continue;
      let len = 1;
      while (arr[(i + len) % arr.length] === '-' && len < 16) len++;
      tone(f, len * spb * 0.95, { ...VOICES[ch], at, bus: musBus, sustain: 0.7 });
    }
    const d = tr.drum[music.step % tr.drum.length];
    if (d === 'k') tone(150, 0.12, { at, slide: -110, vol: 0.25, type: 'sine', bus: musBus, sustain: 0.1 });
    else if (d === 's') noise(0.1, { at, freq: 1800, vol: 0.12, bus: musBus });
    else if (d === 'h') noise(0.03, { at, freq: 7000, vol: 0.06, bus: musBus });
    music.next += spb;
    music.step++;
  }
}
})();
