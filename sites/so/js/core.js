/* Ceresio OS — nucleo: schermo, palette, font bitmap, disegno, input, loop. */
(() => {
'use strict';
const OS = window.OS = window.OS || {};
OS.VERSION = '1.0.0';

/* ------------------------------------------------------------ palette */
// "Ceresio-16": i colori del lago di Lugano, del San Salvatore e della bandiera.
const P = OS.P = {
  night: '#141a33', ink: '#241f2e', lake: '#1f4e7a', lakeHi: '#3b87b9',
  sky: '#8fd0ea', mist: '#d7ecf0', snow: '#fbf6e9', stone: '#a39d8f',
  slate: '#5b5d72', red: '#d52b3a', orange: '#f0892f', gold: '#f6cb4b',
  pine: '#2d6a4c', leaf: '#73b04c', rose: '#e5919f', brown: '#7b4b2f'
};
OS.PAL16 = Object.values(P);
OS.rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

/* ------------------------------------------------------------ storage + impostazioni */
OS.store = {
  get(k, d) { try { const v = localStorage.getItem('ceresio.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ceresio.' + k, JSON.stringify(v)); } catch { /* storage non disponibile */ } }
};
const navLang = (navigator.language || 'it').slice(0, 2);
OS.settings = Object.assign(
  { lang: navLang === 'it' ? 'it' : (['en', 'de', 'fr'].includes(navLang) ? 'en' : 'it'), sound: true, vol: 0.5, crt: true, tod: 'auto', wx: 'auto', fastBoot: false },
  OS.store.get('settings', {})
);
OS.saveSettings = () => { OS.store.set('settings', OS.settings); OS.emit('settings'); };
OS.L = (it, en) => (OS.settings.lang === 'en' ? en : it);
OS.tx = (o) => (o == null ? '' : typeof o === 'string' ? o : (o[OS.settings.lang] ?? o.it ?? ''));

/* ------------------------------------------------------------ eventi */
const handlers = {};
OS.on = (ev, fn) => { (handlers[ev] ||= []).push(fn); };
OS.emit = (ev, ...a) => { (handlers[ev] || []).forEach((fn) => fn(...a)); };

/* ------------------------------------------------------------ trofei (easter egg) */
OS.found = new Set(OS.store.get('eggs', []));
OS.toasts = [];
OS.unlock = (id) => {
  if (OS.found.has(id)) return false;
  OS.found.add(id);
  OS.store.set('eggs', [...OS.found]);
  OS.toasts.push({ id, t: 0 });
  OS.sfx?.chime();
  OS.emit('egg', id);
  const all = (OS.EGGS || []).filter((e) => e.id !== 'all');
  if (all.length && all.every((e) => OS.found.has(e.id))) setTimeout(() => OS.unlock('all'), 1500);
  return true;
};

/* ------------------------------------------------------------ schermo */
const disp = document.getElementById('screen');
const dctx = disp.getContext('2d', { alpha: false });
const buf = document.createElement('canvas');
const screenCtx = buf.getContext('2d');
let g = OS.g = screenCtx;
const scr = OS.scr = { W: 320, H: 200, S: 2, ox: 0, oy: 0, devW: 0, devH: 0, ratio: 1 };
let crt = null;
OS.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const vv = window.visualViewport;
function resize() {
  // Con la tastiera aperta lo schermo si accorcia invece di finirci sotto.
  const iw = window.innerWidth, ih = Math.round(vv ? Math.min(vv.height, window.innerHeight) : window.innerHeight);
  const dpr = window.devicePixelRatio || 1;
  // Pixel "logico" da almeno 1.5 px CSS sui telefoni, 2-4 px sui monitor.
  const k = Math.max(1.5, Math.floor(Math.min(iw / 400, ih / 250)));
  const S = Math.max(1, Math.round(k * dpr));
  const devW = Math.round(iw * dpr), devH = Math.round(ih * dpr);
  Object.assign(scr, {
    S, devW, devH, ratio: devW / iw,
    W: Math.floor(devW / S), H: Math.floor(devH / S)
  });
  scr.ox = Math.floor((devW - scr.W * S) / 2);
  scr.oy = Math.floor((devH - scr.H * S) / 2);
  disp.width = devW; disp.height = devH;
  disp.style.width = iw + 'px'; disp.style.height = ih + 'px';
  disp.style.top = (vv ? vv.offsetTop : 0) + 'px';
  buf.width = scr.W; buf.height = scr.H;
  g.imageSmoothingEnabled = false; dctx.imageSmoothingEnabled = false;
  buildCrt();
  OS.emit('resize', scr.W, scr.H);
}

function buildCrt() {
  const w = scr.W * scr.S, h = scr.H * scr.S;
  crt = document.createElement('canvas');
  crt.width = w; crt.height = h;
  const c = crt.getContext('2d');
  if (scr.S >= 3) {
    c.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = 0; y < scr.H; y++) c.fillRect(0, y * scr.S + scr.S - 1, w, Math.max(1, Math.floor(scr.S / 4)));
  }
  const gr = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.hypot(w, h) * 0.62);
  gr.addColorStop(0, 'rgba(0,0,0,0)');
  gr.addColorStop(1, 'rgba(0,0,0,0.42)');
  c.fillStyle = gr; c.fillRect(0, 0, w, h);
}

OS.shake = 0;
function present() {
  let sx = 0, sy = 0;
  if (OS.shake > 0 && !OS.reduced) {
    sx = ((Math.random() * 5) | 0) - 2; sy = ((Math.random() * 5) | 0) - 2;
  }
  dctx.fillStyle = '#000';
  dctx.fillRect(0, 0, scr.devW, scr.devH);
  dctx.drawImage(buf, 0, 0, scr.W, scr.H, scr.ox + sx * scr.S, scr.oy + sy * scr.S, scr.W * scr.S, scr.H * scr.S);
  if (OS.settings.crt && crt) dctx.drawImage(crt, scr.ox, scr.oy);
}

/* ------------------------------------------------------------ primitive */
let lastFill = null;
const fill = (c) => { if (c !== lastFill) { g.fillStyle = c; lastFill = c; } };
OS.resetFill = () => { lastFill = null; };
// Cambia la superficie di disegno (usato per le finestre ingrandite a multipli interi).
OS.setTarget = (ctx) => {
  const prev = g;
  g = OS.g = ctx || screenCtx;
  g.imageSmoothingEnabled = false;
  lastFill = null;
  return prev;
};
OS.rect = (x, y, w, h, c) => { if (w <= 0 || h <= 0) return; fill(c); g.fillRect(x | 0, y | 0, w | 0, h | 0); };
OS.px = (x, y, c) => { fill(c); g.fillRect(x | 0, y | 0, 1, 1); };
OS.frame = (x, y, w, h, c) => {
  OS.rect(x, y, w, 1, c); OS.rect(x, y + h - 1, w, 1, c);
  OS.rect(x, y, 1, h, c); OS.rect(x + w - 1, y, 1, h, c);
};
OS.line = (x0, y0, x1, y1, c) => {
  x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  fill(c);
  for (let i = 0; i < 2000; i++) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
};
OS.disc = (cx, cy, r, c) => {
  fill(c);
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8));
    g.fillRect((cx - dx) | 0, (cy + dy) | 0, dx * 2 + 1, 1);
  }
};
OS.ring = (cx, cy, r, c) => {
  fill(c);
  let x = r, y = 0, err = 1 - r;
  while (x >= y) {
    for (const [a, b] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) g.fillRect((cx + a) | 0, (cy + b) | 0, 1, 1);
    y++;
    if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
  }
};
OS.clip = (x, y, w, h) => { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); };
OS.unclip = () => { g.restore(); lastFill = null; };

// Retinatura ordinata (Bayer 4x4): il modo 8-bit di fare sfumature e trasparenze.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
OS.BAYER = BAYER;
const pats = new Map();
OS.pat = (c1, c2, level) => {
  const key = c1 + c2 + level;
  if (!pats.has(key)) {
    const cv = document.createElement('canvas'); cv.width = 4; cv.height = 4;
    const c = cv.getContext('2d');
    for (let i = 0; i < 16; i++) {
      const col = BAYER[i] < level ? c2 : c1;
      if (col) { c.fillStyle = col; c.fillRect(i % 4, (i / 4) | 0, 1, 1); }
    }
    pats.set(key, screenCtx.createPattern(cv, 'repeat'));
  }
  return pats.get(key);
};
OS.dither = (x, y, w, h, c1, c2, level) => { g.fillStyle = OS.pat(c1, c2, level); lastFill = null; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
OS.shade = (x, y, w, h, c, level = 8) => OS.dither(x, y, w, h, '', c, level);

/* ------------------------------------------------------------ font bitmap 5x9 in celle 6x10 */
const CW = OS.CW = 6, CH = OS.CH = 10;
const FONT = {
  ' ': '',
  'A': '.###. #...# #...# ##### #...# #...# #...#', 'B': '####. #...# #...# ####. #...# #...# ####.',
  'C': '.###. #...# #.... #.... #.... #...# .###.', 'D': '####. #...# #...# #...# #...# #...# ####.',
  'E': '##### #.... #.... ####. #.... #.... #####', 'F': '##### #.... #.... ####. #.... #.... #....',
  'G': '.###. #...# #.... #.### #...# #...# .####', 'H': '#...# #...# #...# ##### #...# #...# #...#',
  'I': '.###. ..#.. ..#.. ..#.. ..#.. ..#.. .###.', 'J': '..### ...#. ...#. ...#. #..#. #..#. .##..',
  'K': '#...# #..#. #.#.. ##... #.#.. #..#. #...#', 'L': '#.... #.... #.... #.... #.... #.... #####',
  'M': '#...# ##.## #.#.# #.#.# #...# #...# #...#', 'N': '#...# ##..# #.#.# #..## #...# #...# #...#',
  'O': '.###. #...# #...# #...# #...# #...# .###.', 'P': '####. #...# #...# ####. #.... #.... #....',
  'Q': '.###. #...# #...# #...# #.#.# #..#. .##.#', 'R': '####. #...# #...# ####. #.#.. #..#. #...#',
  'S': '.#### #.... #.... .###. ....# ....# ####.', 'T': '##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..',
  'U': '#...# #...# #...# #...# #...# #...# .###.', 'V': '#...# #...# #...# #...# #...# .#.#. ..#..',
  'W': '#...# #...# #...# #.#.# #.#.# #.#.# .#.#.', 'X': '#...# #...# .#.#. ..#.. .#.#. #...# #...#',
  'Y': '#...# #...# .#.#. ..#.. ..#.. ..#.. ..#..', 'Z': '##### ....# ...#. ..#.. .#... #.... #####',
  'a': '..... ..... .###. ....# .#### #...# .####', 'b': '#.... #.... ####. #...# #...# #...# ####.',
  'c': '..... ..... .###. #.... #.... #...# .###.', 'd': '....# ....# .#### #...# #...# #...# .####',
  'e': '..... ..... .###. #...# ##### #.... .###.', 'f': '..##. .#..# .#... ###.. .#... .#... .#...',
  'g': '..... ..... .#### #...# #...# #...# .#### ....# .###.', 'h': '#.... #.... #.##. ##..# #...# #...# #...#',
  'i': '..#.. ..... .##.. ..#.. ..#.. ..#.. .###.', 'j': '...#. ..... ..##. ...#. ...#. ...#. ...#. #..#. .##..',
  'k': '#.... #.... #..#. #.#.. ##... #.#.. #..#.', 'l': '.##.. ..#.. ..#.. ..#.. ..#.. ..#.. .###.',
  'm': '..... ..... ##.#. #.#.# #.#.# #.#.# #...#', 'n': '..... ..... #.##. ##..# #...# #...# #...#',
  'o': '..... ..... .###. #...# #...# #...# .###.', 'p': '..... ..... ####. #...# #...# #...# ####. #.... #....',
  'q': '..... ..... .#### #...# #...# #...# .#### ....# ....#', 'r': '..... ..... #.##. ##..# #.... #.... #....',
  's': '..... ..... .###. #.... .###. ....# ####.', 't': '.#... .#... ###.. .#... .#... .#..# ..##.',
  'u': '..... ..... #...# #...# #...# #..## .##.#', 'v': '..... ..... #...# #...# #...# .#.#. ..#..',
  'w': '..... ..... #...# #...# #.#.# #.#.# .#.#.', 'x': '..... ..... #...# .#.#. ..#.. .#.#. #...#',
  'y': '..... ..... #...# #...# #...# #...# .#### ....# .###.', 'z': '..... ..... ##### ...#. ..#.. .#... #####',
  '0': '.###. #...# #..## #.#.# ##..# #...# .###.', '1': '..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.',
  '2': '.###. #...# ....# ...#. ..#.. .#... #####', '3': '####. ....# ....# .###. ....# ....# ####.',
  '4': '...#. ..##. .#.#. #..#. ##### ...#. ...#.', '5': '##### #.... ####. ....# ....# #...# .###.',
  '6': '..##. .#... #.... ####. #...# #...# .###.', '7': '##### ....# ...#. ..#.. .#... .#... .#...',
  '8': '.###. #...# #...# .###. #...# #...# .###.', '9': '.###. #...# #...# .#### ....# ...#. .##..',
  '!': '..#.. ..#.. ..#.. ..#.. ..#.. ..... ..#..', '"': '.#.#. .#.#.',
  '#': '.#.#. .#.#. ##### .#.#. ##### .#.#. .#.#.', '$': '..#.. .#### #.#.. .###. ..#.# ####. ..#..',
  '%': '##..# ##.#. ...#. ..#.. .#... .#.## #..##', '&': '.##.. #..#. #.#.. .#... #.#.# #..#. .##.#',
  "'": '..#.. ..#.. .#...', '(': '...#. ..#.. .#... .#... .#... ..#.. ...#.',
  ')': '.#... ..#.. ...#. ...#. ...#. ..#.. .#...', '*': '..... ..#.. #.#.# .###. #.#.# ..#.. .....',
  '+': '..... ..#.. ..#.. ##### ..#.. ..#.. .....', ',': '..... ..... ..... ..... ..... .##.. ..#.. .#...',
  '-': '..... ..... ..... ##### ..... ..... .....', '.': '..... ..... ..... ..... ..... .##.. .##..',
  '/': '....# ....# ...#. ..#.. .#... #.... #....', ':': '..... .##.. .##.. ..... .##.. .##.. .....',
  ';': '..... .##.. .##.. ..... .##.. ..#.. .#...', '<': '...#. ..#.. .#... #.... .#... ..#.. ...#.',
  '=': '..... ..... ##### ..... ##### ..... .....', '>': '.#... ..#.. ...#. ....# ...#. ..#.. .#...',
  '?': '.###. #...# ....# ...#. ..#.. ..... ..#..', '@': '.###. #...# #.### #.#.# #.### #.... .###.',
  '[': '.###. .#... .#... .#... .#... .#... .###.', '\\': '#.... #.... .#... ..#.. ...#. ....# ....#',
  ']': '.###. ...#. ...#. ...#. ...#. ...#. .###.', '^': '..#.. .#.#. #...#',
  '_': '..... ..... ..... ..... ..... ..... ..... #####', '`': '.#... ..#..',
  '{': '...#. ..#.. ..#.. .#... ..#.. ..#.. ...#.', '|': '..#.. ..#.. ..#.. ..#.. ..#.. ..#.. ..#.. ..#..',
  '}': '.#... ..#.. ..#.. ...#. ..#.. ..#.. .#...', '~': '..... ..... .#... #.#.# ...#.',
  'à': '.#... ..#.. .###. ....# .#### #...# .####', 'è': '.#... ..#.. .###. #...# ##### #.... .###.',
  'é': '...#. ..#.. .###. #...# ##### #.... .###.', 'ì': '.#... ..#.. .##.. ..#.. ..#.. ..#.. .###.',
  'ò': '.#... ..#.. .###. #...# #...# #...# .###.', 'ù': '.#... ..#.. #...# #...# #...# #..## .##.#',
  'ä': '.#.#. ..... .###. ....# .#### #...# .####', 'ö': '.#.#. ..... .###. #...# #...# #...# .###.',
  'ü': '.#.#. ..... #...# #...# #...# #..## .##.#', 'ç': '..... ..... .###. #.... #.... #...# .###. ..#.. .##..',
  'È': '.#... ##### #.... ####. #.... #.... #####', 'É': '...#. ##### #.... ####. #.... #.... #####',
  'À': '.#... .###. #...# ##### #...# #...# #...#', 'Ü': '#...# ..... #...# #...# #...# #...# .###.',
  'Ö': '#...# .###. #...# #...# #...# #...# .###.', 'Ä': '#...# .###. #...# ##### #...# #...# #...#',
  'ß': '.##.. #..#. #..#. #.#.. #..#. #..#. #.##. #....', '°': '.##.. #..#. #..#. .##..',
  '«': '..... ..#.# .#.#. #.#.. .#.#. ..#.# .....', '»': '..... #.#.. .#.#. ..#.# .#.#. #.#.. .....',
  '€': '..### .#... ####. .#... ####. .#... ..###', '·': '..... ..... ..... ..#.. .....',
  '…': '..... ..... ..... ..... ..... ..... #.#.#', '★': '..#.. ..#.. ##### .###. .#.#. #...#',
  '♥': '..... .#.#. ##### ##### .###. ..#..', '♪': '..##. ..#.# ..#.. ..#.. .##.. ###.. .#...',
  '█': '##### ##### ##### ##### ##### ##### ##### ##### #####', '▲': '..... ..#.. .###. #####', '▼': '..... ##### .###. ..#..',
  '◄': '...#. ..##. .###. ..##. ...#.', '►': '.#... .##.. .###. .##.. .#...', '×': '..... #...# .#.#. ..#.. .#.#. #...#',
  '✓': '..... ....# ...#. #.#.. .#...',
  '↑': '..#.. .###. #.#.# ..#.. ..#.. ..#.. ..#..', '↓': '..#.. ..#.. ..#.. ..#.. #.#.# .###. ..#..',
  '←': '..... ..#.. .#... ##### .#... ..#.. .....', '→': '..... ..#.. ...#. ##### ...#. ..#.. .....'
};
const ALIAS = { '’': "'", '‘': "'", '“': '"', '”': '"', '–': '-', '—': '-', '\t': ' ', '•': '·' };
const chars = Object.keys(FONT);
const GI = new Map();
const src = document.createElement('canvas');
src.width = chars.length * CW; src.height = CH;
{
  const c = src.getContext('2d');
  c.fillStyle = '#fff';
  chars.forEach((ch, i) => {
    GI.set(ch, i);
    FONT[ch].split(' ').forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] === '#') c.fillRect(i * CW + x, y, 1, 1);
    });
  });
}
function glyph(ch) {
  let i = GI.get(ch);
  if (i !== undefined) return i;
  const a = ALIAS[ch];
  const base = a ?? ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
  i = GI.get(base) ?? GI.get(base.toLowerCase()) ?? GI.get('?');
  GI.set(ch, i);
  return i;
}
const atlases = new Map();
function atlas(color) {
  let a = atlases.get(color);
  if (!a) {
    a = document.createElement('canvas'); a.width = src.width; a.height = src.height;
    const c = a.getContext('2d');
    c.drawImage(src, 0, 0);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = color; c.fillRect(0, 0, a.width, a.height);
    atlases.set(color, a);
  }
  return a;
}
OS.text = (s, x, y, color = P.ink, sc = 1) => {
  s = String(s);
  const at = atlas(color);
  x |= 0; y |= 0;
  let cx = x;
  for (const ch of s) {
    if (ch !== ' ') g.drawImage(at, glyph(ch) * CW, 0, CW, CH, cx, y, CW * sc, CH * sc);
    cx += CW * sc;
  }
  return cx - x;
};
OS.textW = (s, sc = 1) => [...String(s)].length * CW * sc;
OS.textC = (s, cx, y, color, sc = 1) => OS.text(s, cx - ((OS.textW(s, sc) - sc) >> 1), y, color, sc);
OS.wrap = (s, w, sc = 1) => {
  const cols = Math.max(1, Math.floor((w + sc) / (CW * sc)));
  const out = [];
  for (const para of String(s).split('\n')) {
    // Righe già abbastanza corte (o arte ASCII) restano intatte, spazi compresi.
    if ([...para].length <= cols) { out.push(para); continue; }
    let line = '';
    for (let word of para.split(' ')) {
      while ([...word].length > cols) {
        const room = cols - (line ? [...line].length + 1 : 0);
        if (room < 4) { if (line) out.push(line); line = ''; continue; }
        const head = [...word].slice(0, room).join('');
        out.push(line ? line + ' ' + head : head);
        word = [...word].slice(room).join('');
        line = '';
      }
      if (!line) line = word;
      else if ([...line].length + 1 + [...word].length <= cols) line += ' ' + word;
      else { out.push(line); line = word; }
    }
    out.push(line);
  }
  return out;
};

/* ------------------------------------------------------------ sprite */
const SPR_MAP = {
  k: P.ink, n: P.night, b: P.lake, B: P.lakeHi, s: P.sky, m: P.mist, w: P.snow, g: P.stone,
  G: P.slate, r: P.red, o: P.orange, y: P.gold, p: P.pine, l: P.leaf, R: P.rose, u: P.brown
};
OS.SPR = {};
OS.makeSprite = (rows) => {
  const h = rows.length, w = Math.max(...rows.map((r) => r.length));
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = SPR_MAP[row[x]];
      if (col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); }
    }
  });
  return cv;
};
OS.spr = (name, x, y, sc = 1) => {
  const s = OS.SPR[name];
  if (s) g.drawImage(s, x | 0, y | 0, s.width * sc, s.height * sc);
};

/* ------------------------------------------------------------ input */
const inp = OS.inp = {
  x: -99, y: -99, px: 0, py: 0, down: false, pressed: false, released: false, rpressed: false,
  wheel: 0, dbl: false, touch: false, keys: [], held: {}, last: performance.now(), lastDown: 0, downAt: 0
};
function toLocal(e) {
  return [Math.floor((e.clientX * scr.ratio - scr.ox) / scr.S), Math.floor((e.clientY * scr.ratio - scr.oy) / scr.S)];
}
function poke() { inp.last = performance.now(); OS.emit('activity'); }
disp.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  // Il tocco non deve rubare il focus al campo della tastiera virtuale.
  if (e.pointerType === 'mouse') disp.focus({ preventScroll: true });
  [inp.x, inp.y] = toLocal(e);
  inp.touch = e.pointerType !== 'mouse';
  if (e.button === 2) { inp.rpressed = true; poke(); return; }
  const now = performance.now();
  inp.dbl = now - inp.lastDown < 420 && Math.abs(inp.x - inp.px) < 4 && Math.abs(inp.y - inp.py) < 4;
  inp.lastDown = inp.dbl ? 0 : now;
  inp.down = true; inp.pressed = true; inp.downAt = now;
  inp.px = inp.x; inp.py = inp.y;
  try { disp.setPointerCapture(e.pointerId); } catch { /* ignorato */ }
  poke();
});
disp.addEventListener('pointermove', (e) => {
  [inp.x, inp.y] = toLocal(e);
  if (e.pointerType === 'mouse') inp.touch = false;
  poke();
});
const up = (e) => {
  if (!inp.down) return;
  [inp.x, inp.y] = toLocal(e);
  inp.down = false; inp.released = true; poke();
};
disp.addEventListener('pointerup', (e) => {
  up(e);
  // I browser mobili aprono la tastiera solo se il focus arriva dentro il gesto:
  // qui, non nel ciclo di disegno. Il window manager dice se quel punto la vuole.
  if (e.pointerType !== 'mouse' && OS.keyboardWanted) {
    const [x, y] = toLocal(e);
    if (OS.keyboardWanted(x, y)) OS.keyboard(true, true);
  }
});
// Niente click sintetico dopo il tocco: sposterebbe il focus e chiuderebbe la tastiera.
disp.addEventListener('touchend', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });
disp.addEventListener('pointercancel', up);
disp.addEventListener('contextmenu', (e) => e.preventDefault());
disp.addEventListener('wheel', (e) => { e.preventDefault(); inp.wheel += Math.sign(e.deltaY); poke(); }, { passive: false });

const NAV = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Backspace', ' ', 'Enter', 'Escape', 'PageUp', 'PageDown', 'Home', 'End', 'Delete', 'F2', 'F10', "'", '/']);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Unidentified' || e.key === 'Process' || e.isComposing) return;
  if (e.ctrlKey || e.metaKey) { if (!['c', 'l'].includes(e.key.toLowerCase())) return; }
  if (e.key.length === 1 || NAV.has(e.key)) e.preventDefault();
  inp.keys.push({ key: e.key, code: e.code, ctrl: e.ctrlKey || e.metaKey, shift: e.shiftKey, alt: e.altKey });
  inp.held[e.key] = true;
  poke();
});
window.addEventListener('keyup', (e) => { inp.held[e.key] = false; });
window.addEventListener('blur', () => { inp.held = {}; inp.down = false; });

// Tastiera virtuale su telefono: un input nascosto riceve i caratteri.
const kbd = document.getElementById('kbd');
// Il campo parte con uno spazio sentinella, così "cancella" produce sempre un evento.
// Si confronta il testo prima/dopo invece di svuotarlo a ogni lettera: la scrittura
// predittiva di Android (composizione) altrimenti si rompe.
let kbdLast = ' ', composing = false;
const kbdReset = () => { if (kbd) { kbd.value = ' '; kbdLast = ' '; } };
OS.keyboardOpen = () => !!kbd && document.activeElement === kbd;
// Tastiera visibile: il viewport visibile è molto più basso della finestra.
const kbdVisible = () => !!vv && vv.height < window.innerHeight - 120;
// force: chiamato dentro un gesto dell'utente. Se il campo ha già il focus ma la
// tastiera non si vede (focus dato fuori dal gesto), lo si ridà per farla comparire.
OS.keyboard = (on, force) => {
  if (!kbd) return;
  if (on) {
    const has = document.activeElement === kbd;
    if (has && !(force && !kbdVisible())) return;
    if (has) kbd.blur();
    kbdReset();
    kbd.focus({ preventScroll: true });
  } else if (document.activeElement === kbd) kbd.blur();
};
if (kbd) {
  kbd.addEventListener('compositionstart', () => { composing = true; });
  kbd.addEventListener('compositionend', () => { composing = false; });
  kbd.addEventListener('input', () => {
    const v = kbd.value;
    let i = 0;
    while (i < kbdLast.length && i < v.length && kbdLast[i] === v[i]) i++;
    for (let k = kbdLast.length; k > i; k--) inp.keys.push({ key: 'Backspace' });
    for (const ch of v.slice(i)) inp.keys.push({ key: ch === '\n' ? 'Enter' : ch });
    kbdLast = v;
    if (!v.length || (!composing && v.length > 48)) kbdReset();
    poke();
  });
  kbd.addEventListener('keydown', (e) => { if (e.key === 'Enter') setTimeout(kbdReset, 0); });
}

function endFrame() {
  inp.pressed = inp.released = inp.rpressed = inp.dbl = false;
  inp.wheel = 0; inp.keys.length = 0;
}

/* ------------------------------------------------------------ cursori */
OS.cursor = 'arrow';
const CURSORS = {
  arrow: ['k.......', 'kk......', 'kwk.....', 'kwwk....', 'kwwwk...', 'kwwwwk..', 'kwwwwwk.', 'kwwwwwwk', 'kwwwwkkk', 'kwkwwk..', 'kk.kwwk.', '....kk..'],
  hand: ['..kk......', '.kwwk.....', '.kwwk.....', '.kwwkkk...', '.kwwkwwkk.', 'kkwwkwwkwk', 'kwkwwwwwwk', 'kwwwwwwwwk', '.kwwwwwwwk', '.kwwwwwwk.', '..kwwwwwk.', '..kkkkkkk.'],
  wait: ['kkkkkkkk', 'kwwwwwwk', '.kyyyyk.', '.kyyyyk.', '..kyyk..', '...kk...', '...kk...', '..kwwk..', '.kwyywk.', '.kyyyyk.', 'kyyyyyyk', 'kkkkkkkk'],
  move: ['...k...', '..kwk..', '.kkwkk.', 'kwwwwwk', '.kkwkk.', '..kwk..', '...k...'],
  ew: ['..k...k..', '.kk...kk.', 'kwkkkkkwk', 'kwwwwwwwk', 'kwkkkkkwk', '.kk...kk.', '..k...k..'],
  ns: ['...k...', '..kwk..', '.kwwwk.', 'kkkwkkk', '..kwk..', '..kwk..', 'kkkwkkk', '.kwwwk.', '..kwk..', '...k...'],
  nwse: ['kkkkk...', 'kwwk....', 'kwwk....', 'kkkwk...', 'k...kwkk', '....kwwk', '....kwwk', '...kkkkk'],
  nesw: ['...kkkkk', '....kwwk', '....kwwk', '...kwkkk', 'kkwk...k', 'kwwk....', 'kwwk....', 'kkkkk...']
};
const curSpr = {};
for (const k in CURSORS) curSpr[k] = OS.makeSprite(CURSORS[k]);
function drawCursor() {
  if (inp.touch || inp.x < 0) return;
  const c = curSpr[OS.cursor] || curSpr.arrow;
  const centered = OS.cursor !== 'arrow' && OS.cursor !== 'hand' && OS.cursor !== 'wait';
  if (centered) g.drawImage(c, inp.x - (c.width >> 1), inp.y - (c.height >> 1));
  else g.drawImage(c, inp.x - (OS.cursor === 'hand' ? 2 : 0), inp.y);
}

/* ------------------------------------------------------------ transizioni a retino */
let fade = null;
OS.fade = (mid, dur = 0.5) => { fade = { t: 0, dur, mid, done: false }; };
function drawFade(dt) {
  if (!fade) return;
  fade.t += dt;
  const half = fade.dur / 2;
  if (!fade.done && fade.t >= half) { fade.done = true; fade.mid?.(); }
  const k = fade.t < half ? fade.t / half : 1 - (fade.t - half) / half;
  const lvl = Math.max(0, Math.min(16, Math.round(k * 16)));
  if (lvl > 0) OS.dither(0, 0, scr.W, scr.H, '', '#000', lvl);
  if (fade.t >= fade.dur) fade = null;
}

/* ------------------------------------------------------------ loop */
OS.scene = null;
OS.time = 0;
OS.overlays = [];
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  OS.time += dt;
  OS.cursor = 'arrow';
  lastFill = null;
  if (OS.shake > 0) OS.shake -= dt;
  try {
    if (OS.scene) { OS.scene.update?.(dt); OS.scene.draw(g, dt); }
    for (const o of OS.overlays) o(g, dt);
  } catch (err) {
    console.error(err);
    OS.panic?.(err);
  }
  drawFade(dt);
  drawCursor();
  present();
  endFrame();
  requestAnimationFrame(loop);
}
OS.setScene = (s) => { OS.scene = s; s.enter?.(); };

window.addEventListener('resize', resize);
let lastVH = 0;
if (vv) {
  // Solo i cambi di altezza (tastiera): lo zoom a pizzico non deve ridisegnare tutto.
  vv.addEventListener('resize', () => {
    if (Math.abs(vv.height - lastVH) > 40) { lastVH = vv.height; resize(); }
    disp.style.top = vv.offsetTop + 'px';
  });
  vv.addEventListener('scroll', () => { disp.style.top = vv.offsetTop + 'px'; });
}
resize();
requestAnimationFrame(loop);

/* ------------------------------------------------------------ utilità */
OS.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
OS.rand = (a, b) => a + Math.random() * (b - a);
OS.hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const ZURICH = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
let ltCache = { at: 0, v: null };
OS.luganoTime = (d) => {
  const now = d ? d.getTime() : Date.now();
  if (!d && ltCache.v && now - ltCache.at < 200) return ltCache.v;
  const parts = ZURICH.formatToParts(d || new Date(now));
  const get = (t) => +parts.find((p) => p.type === t).value;
  const v = { h: get('hour') % 24, m: get('minute'), s: get('second') };
  if (!d) ltCache = { at: now, v };
  return v;
};
OS.pad = (n, l = 2) => String(n).padStart(l, '0');
OS.openUrl = (u) => { window.open(u, u.startsWith('mailto:') ? '_self' : '_blank', 'noopener'); };
})();
