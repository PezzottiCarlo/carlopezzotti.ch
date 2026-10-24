/* ============================================================
   dd.carlopezzotti.ch — il laboratorio: suono e grafici del suono.

   Negli esperimenti di musica il suono non viene da campioni registrati: è calcolato
   un campione alla volta dalle stesse funzioni che la pagina mostra (44100 valori di y
   per ogni secondo). Qui ci sono i pezzi comuni:

     import { createAudio, render, TWO_PI } from '/_lab/audio.js';
     const audio = createAudio({ gain:.55 });
     audio.play(render(t => Math.sin(TWO_PI * 440 * t), 1));
   ============================================================ */

export const SR = 44100;
export const TWO_PI = 2 * Math.PI;

// Rumore: un numero "a caso" tra −1 e 1 per ogni campione j, sempre lo stesso per lo stesso j.
export const noise = j => { const x = Math.sin(j * 12.9898 + 78.233) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };

// Campiona fn(t, j) per dur secondi. Sfuma gli ultimi 20 ms (e i primi fadeIn secondi) per non far scattare l'altoparlante.
export function render(fn, dur, fadeIn = 0){
  const N = Math.round(dur * SR), out = new Float32Array(N), fo = Math.round(.02 * SR), fi = Math.round(fadeIn * SR);
  for (let j = 0; j < N; j++){
    let y = fn(j / SR, j);
    if (j >= N - fo) y *= (N - j) / fo;
    if (fi && j < fi) y *= j / fi;
    out[j] = y;
  }
  return out;
}

/*
  L'uscita audio, creata al primo suono (i browser la accendono solo dopo un gesto).
    gain        volume generale
    compressor  un compressore leggero prima del limitatore (per i mix pieni)
    headroom    fin dove arriva il limitatore: 1 = da −1 a 1, 2 = da −2 a 2
  Il limitatore è morbido: lineare fino a 0,7, poi una tanh che curva verso 1.
*/
export function createAudio({ gain = .75, compressor = false, headroom = 1 } = {}){
  let ctx = null, master = null, sources = [];
  const audio = {
    get ctx(){ return ctx; },
    get master(){ return master; },
    ensure(){
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = gain;
      let node = master;
      if (compressor){
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -12; comp.knee.value = 8; comp.ratio.value = 5; comp.attack.value = .003; comp.release.value = .15;
        node.connect(comp); node = comp;
      }
      // Il WaveShaper legge l'ingresso tra −1 e 1: prima si divide per headroom.
      const pre = ctx.createGain(), shaper = ctx.createWaveShaper(), curve = new Float32Array(2049);
      pre.gain.value = 1 / headroom;
      for (let q = 0; q < curve.length; q++){
        const x = (q / (curve.length - 1) * 2 - 1) * headroom, a = Math.abs(x);
        curve[q] = Math.sign(x) * (a < .7 ? a : .7 + .3 * Math.tanh((a - .7) / .3));
      }
      shaper.curve = curve; shaper.oversample = '2x';
      node.connect(pre); pre.connect(shaper); shaper.connect(ctx.destination);
      return ctx;
    },
    buffer(data){
      const ab = audio.ensure().createBuffer(1, data.length, SR);
      ab.copyToChannel(data, 0);
      return ab;
    },
    // Suona un campionamento; con loop ripete fino a stopAll() o per «times» volte.
    play(data, { delay = 0, loop = false, times = 1, gain = 1, node = null } = {}){
      const c = audio.ensure();
      c.resume();
      const src = c.createBufferSource();
      src.buffer = audio.buffer(data);
      const g = node || c.createGain();
      if (!node){ g.gain.value = gain; g.connect(master); }
      src.connect(g);
      const t0 = c.currentTime + .04 + delay;
      src.loop = loop;
      src.start(t0);
      if (loop && times !== Infinity) src.stop(t0 + times * data.length / SR);
      sources.push(src);
      src.onended = () => { sources = sources.filter(x => x !== src); };
      return { src, t0, g, dur: data.length / SR * (loop ? times : 1) };
    },
    stopAll(){
      sources.forEach(s => { try { s.stop(); } catch(e){} });
      sources = [];
    },
    // Anche il «bravo» è una funzione: tre note che si spengono.
    chime(){
      const notes = [523.25, 659.25, 783.99];
      audio.play(render(t => notes.reduce((s, f, i) => {
        const u = t - i * .09;
        return u < 0 ? s : s + .22 * Math.exp(-7 * u) * Math.sin(TWO_PI * f * u);
      }, 0), 1));
    }
  };
  return audio;
}

/* ---------------- Grafici del suono (canvas) ---------------- */
export const dpr = () => Math.min(2, window.devicePixelRatio || 1);

// Porta il canvas alla sua dimensione sullo schermo in pixel veri. Restituisce [w, h, rapporto].
export function fitCanvas(cv){
  const r = dpr(), w = Math.max(1, Math.round(cv.clientWidth * r)), h = Math.max(1, Math.round(cv.clientHeight * r));
  if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
  return [w, h, r];
}

// Il volume (inviluppo) di un segnale di N campioni disegnato su W pixel: per ogni pixel il valore
// più grande di |y| lì intorno, poi ammorbidito. Niente righe verticali: una forma che si legge come
// il grafico di una funzione. Restituisce un Float32Array con in più .peak, il valore più alto.
export function smoothEnv(get, N, W, radiusSec){
  const col = new Float32Array(W), out = new Float32Array(W);
  for (let x = 0; x < W; x++){
    const a = Math.floor(x * N / W), b = Math.max(a + 1, Math.floor((x + 1) * N / W));
    let m = 0;
    for (let j = a; j < b && j < N; j++){ const v = Math.abs(get(j)); if (v > m) m = v; }
    col[x] = m;
  }
  const rad = Math.max(0, Math.ceil(radiusSec * SR / (N / W)));
  for (let x = 0; x < W; x++){
    let m = 0;
    for (let q = Math.max(0, x - rad); q <= Math.min(W - 1, x + rad); q++) if (col[q] > m) m = col[q];
    out[x] = m;
  }
  for (let x = 1; x < W - 1; x++) col[x] = (out[x - 1] + 2 * out[x] + out[x + 1]) / 4;
  col[0] = out[0]; col[W - 1] = out[W - 1];
  let peak = 0;
  for (let x = 0; x < W; x++) peak = Math.max(peak, col[x]);
  col.peak = peak;
  return col;
}
