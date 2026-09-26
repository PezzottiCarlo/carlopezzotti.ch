/* Ceresio OS — sfondo: il golfo di Lugano con San Salvatore e Monte Brè.
   Cambia con l'ora e il meteo veri di Lugano. Ha diversi punti cliccabili. */
(() => {
'use strict';
const OS = window.OS, P = OS.P;
const RGB = {};
for (const [k, v] of Object.entries(P)) RGB[k] = OS.rgb(v);
const BAY = OS.BAYER;
const bay = (x, y) => BAY[(x & 3) + ((y & 3) << 2)];

const SCHEMES = {
  day: {
    sky: ['lakeHi', 'sky', 'sky', 'mist'], far: 'stone', farShade: 'slate', farSnow: 'snow',
    mtn: 'pine', mtnHi: 'leaf', mtnShade: 'ink', lake: ['lakeHi', 'lake', 'lake'], refl: 'pine', glint: 'mist',
    city: ['snow', 'mist', 'rose', 'gold', 'stone'], roof: ['red', 'brown', 'orange'], win: 'slate', lit: 0, body: 'sun'
  },
  dawn: {
    sky: ['lake', 'lakeHi', 'rose', 'mist'], far: 'stone', farShade: 'slate', farSnow: 'rose',
    mtn: 'slate', mtnHi: 'pine', mtnShade: 'ink', lake: ['rose', 'lakeHi', 'lake'], refl: 'slate', glint: 'rose',
    city: ['mist', 'rose', 'stone'], roof: ['brown', 'red'], win: 'slate', lit: 0.2, body: 'sun'
  },
  dusk: {
    sky: ['night', 'lake', 'rose', 'orange', 'gold'], far: 'slate', farShade: 'ink', farSnow: 'rose',
    mtn: 'ink', mtnHi: 'brown', mtnShade: 'night', lake: ['orange', 'lake', 'night'], refl: 'ink', glint: 'gold',
    city: ['rose', 'stone', 'brown'], roof: ['brown', 'ink'], win: 'ink', lit: 0.45, body: 'sun'
  },
  night: {
    sky: ['night', 'night', 'lake'], far: 'ink', farShade: 'night', farSnow: 'slate',
    mtn: 'ink', mtnHi: 'night', mtnShade: 'night', lake: ['lake', 'night', 'night'], refl: 'ink', glint: 'slate',
    city: ['slate', 'ink'], roof: ['ink'], win: 'ink', lit: 0.6, body: 'moon'
  }
};

OS.todNow = () => {
  const s = OS.settings.tod;
  if (s && s !== 'auto') return s;
  const { h } = OS.luganoTime();
  if (h >= 6 && h < 8) return 'dawn';
  if (h >= 8 && h < 18) return 'day';
  if (h >= 18 && h < 20) return 'dusk';
  return 'night';
};

const WP = OS.wallpaper = {
  sky: null, front: null, W: 0, H: 0, key: '', hy: 0, geo: null,
  sunClicks: [], eclipse: 0, boat: { x: -30, boost: 0, horn: 0 }, funi: -1, flash: 0, shoot: null,
  clouds: [], drops: [],

  ensure(W, H) {
    const key = W + 'x' + H + OS.todNow() + OS.wxKind();
    if (key === this.key) return;
    this.key = key;
    this.render(W, H, OS.todNow(), OS.wxKind());
  },

  render(W, H, tod, wx) {
    const MB = OS.MB || 12;
    const sc = { ...SCHEMES[tod] };
    const overcast = ['cloudy', 'rain', 'storm', 'snow', 'fog'].includes(wx);
    if (overcast && tod === 'day') sc.sky = wx === 'snow' ? ['stone', 'mist', 'mist', 'snow'] : wx === 'cloudy' ? ['lakeHi', 'sky', 'mist', 'mist'] : ['stone', 'stone', 'mist', 'mist'];
    if (overcast && tod === 'dusk') sc.sky = ['night', 'slate', 'rose', 'stone'];
    this.scheme = sc; this.tod = tod; this.wx = wx;
    this.W = W; this.H = H;
    const hy = this.hy = MB + Math.floor((H - MB) * 0.64);
    const span = H - MB;

    // Geometria (altezze sopra l'orizzonte).
    const salX = Math.round(W * 0.3), salHalf = Math.max(34, Math.round(W * 0.15)), salPeak = Math.round(span * 0.44);
    const breX = Math.round(W * 0.88), breHalf = Math.round(W * 0.36), brePeak = Math.round(span * 0.3);
    const far = (x) => span * (0.22 + 0.05 * Math.sin(x * 0.031 + 1) + 0.035 * Math.sin(x * 0.083 + 2) + 0.02 * Math.sin(x * 0.21) + 0.012 * (OS.hash(x) - 0.5));
    const sal = (x) => {
      const d = Math.abs(x - salX + (x > salX ? 0 : 2)) / salHalf;
      return d >= 1 ? 0 : salPeak * (1 - Math.pow(d, 1.25)) * (1 + 0.03 * Math.sin(x * 0.5));
    };
    const bre = (x) => {
      const d = Math.abs(x - breX) / breHalf;
      return d >= 1 ? 0 : brePeak * Math.pow(Math.cos(d * Math.PI / 2), 0.7) * (1 + 0.04 * Math.sin(x * 0.3));
    };
    const hill = (x) => {
      const d = Math.abs(x - W * 0.02) / (W * 0.22);
      return d >= 1 ? 0 : span * 0.17 * Math.cos(d * Math.PI / 2);
    };
    this.geo = { salX, salHalf, salPeak, sal };

    const sky = new ImageData(W, H), front = new ImageData(W, H);
    const mat = new Uint8Array(W * H); // 0 cielo, 1 lontano, 2 monte, 3 città chiara, 4 luce
    const put = (img, x, y, c) => {
      const i = (y * W + x) * 4, rgb = RGB[c];
      img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2]; img.data[i + 3] = 255;
    };
    const grad = (cols, f, x, y) => {
      const n = cols.length - 1;
      const v = OS.clamp(f, 0, 0.9999) * n;
      const i = Math.floor(v);
      return bay(x, y) < (v - i) * 16 ? cols[Math.min(n, i + 1)] : cols[i];
    };

    // Cielo.
    for (let y = 0; y < hy; y++) for (let x = 0; x < W; x++) put(sky, x, y, grad(sc.sky, y / hy, x, y));

    // Montagne.
    for (let x = 0; x < W; x++) {
      const fT = hy - Math.round(far(x)), sT = hy - Math.round(sal(x)), bT = hy - Math.round(bre(x)), hT = hy - Math.round(hill(x));
      for (let y = Math.min(fT, sT, bT, hT); y < hy; y++) {
        if (y < 0) continue;
        let c = null, m = 0;
        if (y >= sT && sal(x) > 0) {
          const d = (x - salX) / salHalf;
          m = 2;
          c = sc.mtn;
          if (d > 0.15 && bay(x, y) < (d * 10)) c = sc.mtnShade;
          else if (OS.hash(x * 7.1 + y * 3.3) < 0.1) c = sc.mtnHi;
          if (wx === 'snow' && y < hy - salPeak * 0.62 + OS.hash(x) * 4 && bay(x, y) < 12) c = 'snow';
        } else if (y >= bT && bre(x) > 0) {
          m = 2; c = sc.mtn;
          if (OS.hash(x * 3.7 + y * 9.1) < 0.12) c = sc.mtnHi;
          if (bay(x, y) < 5) c = sc.mtnShade === 'ink' ? c : sc.mtnShade;
          if (wx === 'snow' && y < hy - brePeak * 0.72 + OS.hash(x * 3) * 3 && bay(x, y) < 10) c = 'snow';
        } else if (y >= hT && hill(x) > 0) {
          m = 2; c = bay(x, y) < 8 ? sc.mtn : sc.mtnShade;
        } else if (y >= fT) {
          m = 1;
          const depth = y - fT;
          c = depth < 3 + Math.round(3 * Math.sin(x * 0.11)) && far(x) > span * 0.2 ? sc.farSnow : (bay(x, y) < 5 ? sc.farShade : sc.far);
        }
        if (c) { put(front, x, y, c); mat[y * W + x] = m; }
      }
    }

    // Chiesetta e antenna sulla vetta del San Salvatore.
    const peakY = hy - Math.round(sal(salX));
    this.geo.peak = { x: salX, y: peakY };
    for (let dx = -2; dx <= 2; dx++) for (let dy = -3; dy <= 0; dy++) put(front, salX + dx, peakY + dy, dy === -3 ? (tod === 'night' ? 'slate' : 'red') : (tod === 'night' ? 'slate' : 'snow'));
    for (let dy = 4; dy <= 9; dy++) put(front, salX + 3, peakY - dy, 'slate');
    // Binario della funicolare.
    const fb = { x: salX - Math.round(salHalf * 0.62), y: hy - 1 }, ft = { x: salX - 3, y: peakY + 2 };
    this.geo.funi = { fb, ft };
    const steps = Math.max(Math.abs(ft.x - fb.x), Math.abs(ft.y - fb.y));
    for (let i = 0; i <= steps; i += 2) {
      const x = Math.round(fb.x + (ft.x - fb.x) * i / steps), y = Math.round(fb.y + (ft.y - fb.y) * i / steps);
      put(front, x, y, tod === 'night' ? 'slate' : 'stone');
    }

    // Villaggi sul Monte Brè.
    for (let i = 0; i < 40; i++) {
      const x = Math.round(breX - breHalf * 0.8 + OS.hash(i * 13.3) * breHalf * 1.6);
      if (x < 0 || x >= W) continue;
      const top = hy - Math.round(bre(x));
      const y = Math.round(top + 3 + OS.hash(i * 5.1) * (hy - top - 6));
      if (y >= hy - 2 || y <= top) continue;
      if (sc.lit && OS.hash(i * 2.2) < sc.lit + 0.2) { put(front, x, y, 'gold'); mat[y * W + x] = 4; }
      else if (tod !== 'night') { put(front, x, y, 'snow'); put(front, x + 1, y, 'snow'); put(front, x, y - 1, 'red'); put(front, x + 1, y - 1, 'red'); }
    }

    // Lugano: case sul lungolago, un campanile, palme.
    const cx0 = Math.round(W * 0.41), cx1 = Math.round(W * 0.8);
    let x = cx0, bi = 0;
    while (x < cx1) {
      const bw = 4 + Math.floor(OS.hash(bi * 3.1) * 5);
      const bh = 5 + Math.floor(OS.hash(bi * 7.7) * 9) + (x > W * 0.5 && x < W * 0.62 ? 4 : 0);
      const col = sc.city[Math.floor(OS.hash(bi * 1.9) * sc.city.length)];
      const roof = sc.roof[Math.floor(OS.hash(bi * 4.4) * sc.roof.length)];
      for (let yy = hy - bh; yy < hy; yy++) {
        for (let xx = x; xx < x + bw && xx < W; xx++) {
          let c = yy === hy - bh ? roof : col;
          const isWin = yy > hy - bh + 1 && yy < hy - 1 && (yy - (hy - bh)) % 2 === 0 && (xx - x) % 2 === 1 && xx < x + bw - 1;
          let m = 3;
          if (isWin) {
            if (sc.lit && OS.hash(xx * 1.3 + yy * 7.9) < sc.lit) { c = 'gold'; m = 4; } else c = sc.win;
          }
          put(front, xx, yy, c); mat[yy * W + xx] = m;
        }
      }
      x += bw + (OS.hash(bi * 9.9) < 0.3 ? 1 : 0);
      bi++;
    }
    const tx = Math.round(W * 0.56);
    for (let yy = hy - 22; yy < hy; yy++) for (let xx = tx; xx < tx + 3; xx++) { put(front, xx, yy, yy < hy - 19 ? sc.roof[0] : sc.city[0]); mat[yy * W + xx] = 3; }
    put(front, tx + 1, hy - 24, sc.roof[0]); put(front, tx + 1, hy - 23, sc.roof[0]);
    for (let xx = Math.round(W * 0.38); xx < Math.round(W * 0.84); xx++) { put(front, xx, hy - 1, tod === 'night' ? 'slate' : 'stone'); mat[(hy - 1) * W + xx] = 3; }
    for (let i = 0; i < 7; i++) {
      const px = Math.round(W * 0.42 + i * W * 0.058);
      for (let yy = 1; yy < 6; yy++) put(front, px, hy - 1 - yy, 'brown');
      const leaf = tod === 'night' ? 'ink' : tod === 'day' ? 'leaf' : 'pine';
      for (const [dx, dy] of [[-2, -6], [-1, -7], [0, -7], [1, -7], [2, -6], [-3, -5], [3, -5], [0, -8]]) put(front, px + dx, hy - 1 + dy, leaf);
    }

    // Lago con riflessi.
    const lakeCols = sc.lake;
    for (let y = hy; y < H; y++) {
      const f = (y - hy) / (H - hy);
      for (let xx = 0; xx < W; xx++) {
        let c = grad(lakeCols, Math.min(0.999, f * 1.4), xx, y);
        const dy = y - hy;
        const sy = hy - 1 - Math.round(dy * 1.5);
        const sx = OS.clamp(xx + Math.round(Math.sin(y * 0.9) * (1 + f * 2)), 0, W - 1);
        if (sy >= MB && dy < (H - hy) * 0.7) {
          const m = mat[sy * W + sx];
          if (m === 2 && bay(xx, y) < 11 - f * 10) c = sc.refl;
          else if (m === 1 && bay(xx, y) < 5) c = sc.refl;
          else if (m === 3 && bay(xx, y) < 6) c = sc.glint;
          else if (m === 4 && bay(xx, y) < 12) c = 'gold';
        }
        put(front, xx, y, c);
      }
    }

    this.moonShade = null;
    this.sky = toCanvas(sky, W, H);
    this.front = toCanvas(front, W, H);
    this.clouds = Array.from({ length: overcast ? 9 : tod === 'night' ? 2 : 5 }, (_, i) => ({
      x: OS.hash(i * 3.3) * W, y: MB + 4 + OS.hash(i * 8.1) * (hy - MB) * 0.45, s: 0.6 + OS.hash(i * 1.1) * 0.9, v: 1 + OS.hash(i * 2.2) * 2
    }));
    this.drops = Array.from({ length: wx === 'snow' ? 70 : 110 }, (_, i) => ({ x: OS.hash(i * 1.7) * W, y: OS.hash(i * 4.3) * H, v: 0.7 + OS.hash(i) * 0.6 }));
    this.stars = Array.from({ length: 70 }, (_, i) => ({ x: Math.floor(OS.hash(i * 9.7) * W), y: Math.floor(MB + OS.hash(i * 5.3) * (hy - MB) * 0.8), p: OS.hash(i * 2.9) * 6 }));
  },

  sunPos() {
    const { W, hy } = this;
    const MB = OS.MB || 12;
    const lt = OS.luganoTime();
    const hrs = lt.h + lt.m / 60;
    if (this.scheme.body === 'moon') return { x: Math.round(W * 0.7), y: MB + Math.round((hy - MB) * 0.2), r: 7 };
    if (this.tod === 'dusk') return { x: Math.round(W * 0.64), y: hy - Math.round((hy - MB) * 0.18), r: 9 };
    if (this.tod === 'dawn') return { x: Math.round(W * 0.2), y: hy - Math.round((hy - MB) * 0.25), r: 8 };
    const k = OS.clamp((hrs - 8) / 10, 0, 1);
    return { x: Math.round(W * (0.15 + 0.7 * k)), y: MB + Math.round((hy - MB) * (0.42 - 0.3 * Math.sin(k * Math.PI))), r: 8 };
  },

  draw(W, H, dt) {
    this.ensure(W, H);
    const t = OS.time, sc = this.scheme, hy = this.hy;
    const g = OS.g;
    g.drawImage(this.sky, 0, 0);

    const dark = this.eclipse > 0 ? Math.sin(Math.min(1, (6 - this.eclipse) / 6) * Math.PI) : 0;
    // Stelle (di notte o durante l'eclissi).
    if (sc.body === 'moon' || dark > 0.4) {
      for (const s of this.stars) {
        const tw = Math.sin(t * 2 + s.p) > -0.6;
        if (tw) OS.px(s.x, s.y, (s.p > 4.5) ? P.gold : P.mist);
      }
      if (!this.shoot && Math.random() < dt * 0.08) this.shoot = { x: OS.rand(W * 0.2, W), y: OS.rand(14, hy * 0.4), t: 0 };
    }
    if (this.shoot) {
      const s = this.shoot;
      s.t += dt;
      for (let i = 0; i < 6; i++) OS.px(s.x - s.t * 120 - i, s.y + s.t * 50 + i * 0.4, i < 2 ? P.snow : P.sky);
      if (s.t > 0.8) this.shoot = null;
    }

    // Sole o luna.
    const sp = this.sunPos();
    this.sunRect = sp;
    if (!['rain', 'storm', 'fog', 'snow'].includes(this.wx) || sc.body === 'moon') {
      if (sc.body === 'moon') {
        OS.disc(sp.x, sp.y, sp.r, P.mist);
        this.moonShade ||= this.skyAt(sp.x + 3, sp.y - 2);
        OS.disc(sp.x + 3, sp.y - 2, sp.r - 1, this.moonShade);
      } else {
        OS.disc(sp.x, sp.y, sp.r, sc.sky.length > 4 ? P.orange : P.gold);
        if (this.tod === 'day') for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4 + t * 0.3;
          const r1 = sp.r + 3, r2 = sp.r + 5;
          OS.line(sp.x + Math.cos(a) * r1, sp.y + Math.sin(a) * r1, sp.x + Math.cos(a) * r2, sp.y + Math.sin(a) * r2, P.gold);
        }
        if (this.eclipse > 0) {
          const k = 1 - this.eclipse / 6;
          OS.disc(sp.x - sp.r * 2.4 + k * sp.r * 4.8, sp.y, sp.r, P.ink);
        }
      }
    }
    if (this.eclipse > 0) this.eclipse -= dt;

    // Nuvole dietro le montagne.
    const wet = ['rain', 'storm'].includes(this.wx);
    const cloudC = this.tod === 'night' ? P.slate : wet ? P.slate : this.tod === 'dusk' ? P.rose : P.snow;
    const cloudS = this.tod === 'night' ? P.ink : wet ? P.ink : this.tod === 'dusk' ? P.orange : P.mist;
    for (const c of this.clouds) {
      c.x += c.v * dt;
      if (c.x > W + 40) c.x = -40;
      const r = Math.round(5 * c.s);
      OS.disc(c.x, c.y + 1, r, cloudS);
      OS.disc(c.x - r, c.y + 2, r - 1, cloudS);
      OS.disc(c.x + r, c.y + 2, r - 2, cloudS);
      OS.disc(c.x, c.y, r, cloudC);
      OS.disc(c.x - r, c.y + 1, r - 1, cloudC);
      OS.disc(c.x + r + 1, c.y + 1, r - 2, cloudC);
      OS.rect(c.x - r * 2, c.y + r - 1, r * 4 + 2, 2, cloudS);
    }
    // Uccelli di giorno.
    if (this.tod === 'day' && this.wx === 'clear') {
      for (let i = 0; i < 3; i++) {
        const bx = ((t * (8 + i * 2) + i * 90) % (W + 40)) - 20, by = hy * 0.35 + i * 7 + Math.sin(t * 2 + i) * 2;
        const f = Math.floor(t * 4 + i) % 2;
        OS.px(bx - 1, by - f, P.ink); OS.px(bx, by, P.ink); OS.px(bx + 1, by - f, P.ink);
      }
    }

    if (dark > 0) OS.dither(0, 0, W, hy, '', P.night, Math.round(dark * 12));
    g.drawImage(this.front, 0, 0);
    if (dark > 0) OS.dither(0, hy, W, H - hy, '', P.night, Math.round(dark * 10));

    // Luce rossa dell'antenna.
    const pk = this.geo.peak;
    if (sc.body === 'moon' && Math.floor(t * 1.5) % 2) OS.px(pk.x + 3, pk.y - 10, P.red);

    // Funicolare.
    if (this.funi >= 0) {
      this.funi += dt / 7;
      const { fb, ft } = this.geo.funi;
      const k = Math.min(1, this.funi);
      const x = fb.x + (ft.x - fb.x) * k, y = fb.y + (ft.y - fb.y) * k;
      OS.rect(x - 2, y - 3, 4, 3, P.red);
      OS.px(x - 1, y - 2, P.gold);
      if (this.funi > 1.3) this.funi = -1;
    }

    // Scintille sul lago.
    const glint = P[sc.glint];
    for (let i = 0; i < 36; i++) {
      if (Math.sin(t * 1.6 + i * 1.7) < 0.1) continue;
      const y = hy + 2 + Math.floor(OS.hash(i * 3.1) * (H - hy - 4));
      const x = Math.floor((OS.hash(i * 7.3) * W + t * (2 + (i % 3))) % W);
      OS.rect(x, y, 2 + (i % 4), 1, glint);
    }
    if (sc.body === 'sun' && !['rain', 'storm', 'fog'].includes(this.wx)) {
      for (let y = hy + 1; y < H; y += 2) {
        if (Math.sin(t * 3 + y) < 0) continue;
        const w = 2 + ((y - hy) >> 2);
        OS.rect(sp.x - (w >> 1) + Math.round(Math.sin(t * 2 + y * 0.7) * 2), y, w, 1, sc.sky.length > 4 ? P.gold : P.mist);
      }
    }

    this.drawBoat(W, H, dt);
    this.drawWeather(W, H, dt);
  },

  skyAt(x, y) {
    const c = this.sky.getContext('2d').getImageData(x, y, 1, 1).data;
    return '#' + [c[0], c[1], c[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
  },

  drawBoat(W, H, dt) {
    const b = this.boat, hy = this.hy;
    const by = hy + Math.round((H - hy) * 0.32);
    b.boost = Math.max(0, b.boost - dt);
    b.x += dt * (b.boost > 0 ? 22 : 5);
    if (b.x > W + 30) b.x = -30;
    const x = Math.round(b.x), night = this.tod === 'night';
    // Scia.
    for (let i = 1; i < 5; i++) OS.rect(x - 4 - i * 5, by + 3 + (i & 1), 3, 1, P.mist);
    OS.rect(x, by, 24, 3, night ? P.slate : P.snow);
    OS.rect(x + 1, by + 3, 22, 1, P.red);
    OS.rect(x + 2, by + 4, 20, 1, P.ink);
    OS.rect(x + 5, by - 3, 14, 3, night ? P.slate : P.snow);
    for (let i = 0; i < 6; i++) OS.px(x + 6 + i * 2, by - 2, night ? P.gold : P.lake);
    for (let i = 0; i < 8; i++) OS.px(x + 3 + i * 2 + 1, by + 1, night ? P.gold : P.lake);
    OS.rect(x + 9, by - 6, 3, 3, P.red);
    OS.spr('flag', x - 1, by - 8);
    if (b.horn > 0) {
      b.horn -= dt;
      const k = 1 - b.horn / 1.5;
      OS.disc(x + 10, by - 9 - k * 8, 2 + k * 2, P.mist);
    }
    this.boatRect = { x, y: by - 8, w: 26, h: 14 };
  },

  drawWeather(W, H, dt) {
    const wx = this.wx;
    if (wx === 'rain' || wx === 'storm') {
      for (const d of this.drops) {
        d.y += dt * 140 * d.v; d.x -= dt * 30 * d.v;
        if (d.y > H) { d.y = OS.rand(-10, 0); d.x = OS.rand(0, W + 40); }
        OS.rect(d.x, d.y, 1, 3, this.tod === 'night' ? P.slate : P.lakeHi);
      }
      if (wx === 'storm') {
        if (this.flash <= 0 && Math.random() < dt * 0.15) { this.flash = 0.25; this.boltX = OS.rand(W * 0.2, W * 0.9); setTimeout(() => OS.sfx.thunder(), 500); }
        if (this.flash > 0) {
          this.flash -= dt;
          OS.dither(0, 0, W, H, '', P.mist, 5);
          let x = this.boltX, y = OS.MB || 12;
          while (y < this.hy - 10) { const nx = x + OS.rand(-4, 4), ny = y + OS.rand(4, 9); OS.line(x, y, nx, ny, P.snow); x = nx; y = ny; }
        }
      }
    } else if (wx === 'snow') {
      for (const d of this.drops) {
        d.y += dt * 14 * d.v; d.x += Math.sin(OS.time + d.v * 9) * dt * 6;
        if (d.y > H) { d.y = -2; d.x = OS.rand(0, W); }
        OS.rect(d.x, d.y, d.v > 1.1 ? 2 : 1, d.v > 1.1 ? 2 : 1, P.snow);
      }
    } else if (wx === 'fog') {
      OS.dither(0, this.hy - 18, W, 22, '', P.mist, 6);
      OS.dither(0, this.hy - 26, W, 8, '', P.mist, 3);
    }
  },

  // Restituisce true se il clic ha colpito qualcosa di speciale.
  click(x, y) {
    const b = this.boatRect;
    if (b && x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) {
      this.boat.boost = 4; this.boat.horn = 1.5;
      OS.sfx.horn();
      OS.unlock('boat');
      return true;
    }
    const s = this.sunRect;
    if (s && Math.hypot(x - s.x, y - s.y) <= s.r + 3) {
      const now = OS.time;
      this.sunClicks = this.sunClicks.filter((t) => now - t < 3).concat(now);
      OS.sfx.select();
      if (this.sunClicks.length >= 5 && this.scheme.body === 'sun') {
        this.sunClicks = [];
        this.eclipse = 6;
        OS.unlock('sun');
      }
      return true;
    }
    const gm = this.geo;
    if (gm && y < this.hy && Math.abs(x - gm.salX) < gm.salHalf * 0.8 && y > this.hy - gm.sal(x) && this.funi < 0) {
      this.funi = 0;
      OS.sfx.coin();
      OS.unlock('funicular');
      return true;
    }
    return false;
  }
};

function toCanvas(img, W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  c.getContext('2d').putImageData(img, 0, 0);
  return c;
}

OS.tasks.push({
  it: 'Dipingo il lago di Lugano', en: 'Painting Lake Lugano',
  run: async () => { WP.ensure(OS.scr.W, OS.scr.H); return OS.tx({ dawn: { it: 'alba', en: 'dawn' }, day: { it: 'giorno', en: 'day' }, dusk: { it: 'tramonto', en: 'dusk' }, night: { it: 'notte', en: 'night' } }[WP.tod]); }
});
})();
