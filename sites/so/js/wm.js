/* Ceresio OS — window manager: scrivania, icone, finestre, barra dei menu, notifiche. */
(() => {
'use strict';
const OS = window.OS, P = OS.P, L = OS.L;
const MB = OS.MB = 12;      // altezza barra dei menu
const TB = 12;              // altezza barra del titolo
const CELL_W = 62, CELL_H = 32;
const GRID = 8;             // passo del ridimensionamento "a pixel"
const EDGE = 3;             // spessore dei bordi afferrabili

OS.apps = {};
OS.app = (id, def) => { OS.apps[id] = { single: true, escClose: true, bg: P.snow, ...def, resizable: true, id }; };

const wins = OS.wins = [];
let focus = null, hover = { kind: 'desk' }, press = null, drag = null, menu = null, seq = 1;
OS.dnd = null; // trascinamento di un file tra finestre: { id, moved }

/* ------------------------------------------------------------ icone della scrivania */
const SYS_DESK = [
  { app: 'readme', icon: 'doc', label: { it: 'Leggimi', en: 'Read me' } },
  { app: 'about', icon: 'person', label: { it: 'Chi sono', en: 'About me' } },
  { app: 'path', icon: 'path', label: { it: 'Percorso', en: 'Experience' } },
  { app: 'edu', icon: 'school', label: { it: 'Formazione', en: 'Education' } },
  { app: 'langs', icon: 'langs', label: { it: 'Lingue', en: 'Languages' } },
  { app: 'projects', icon: 'floppy', label: { it: 'Progetti', en: 'Projects' } },
  { app: 'contact', icon: 'mail', label: { it: 'Contatti', en: 'Contact' } },
  { app: 'terminal', icon: 'term', label: { it: 'Terminale', en: 'Terminal' } },
  { app: 'folder', arg: 'games', icon: 'joy', label: { it: 'Giochi', en: 'Games' } },
  { app: 'folder', arg: 'tools', icon: 'folder', label: { it: 'Accessori', en: 'Accessories' } },
  { app: 'trophies', icon: 'trophy', label: { it: 'Trofei', en: 'Trophies' } },
  { app: 'secret', icon: 'key', label: { it: 'Segreto', en: 'Secret' }, hidden: () => !OS.found.has('konami') },
  { app: 'trash', icon: 'trash', label: { it: 'Cestino', en: 'Trash' }, corner: true }
];
const DESK = OS.desk = [...SYS_DESK];
let selIcon = null;
let rename = null; // { id, text } rinomina in corso sulla scrivania

// Le icone dei file creati dall'utente arrivano dal file system (files.js).
function syncUserIcons() {
  const fs = OS.fs;
  const keep = new Map(DESK.filter((d) => d.ufs).map((d) => [d.ufs, d]));
  DESK.length = 0;
  DESK.push(...SYS_DESK);
  if (fs) {
    for (const n of fs.children('desk')) {
      const d = keep.get(n.id) || { ufs: n.id };
      d.icon = n.type === 'dir' ? 'folder' : 'note';
      d.label = n.name;
      if (n.x != null) { d.pos = { x: n.x, y: n.y }; d.moved = true; } else d.moved = false;
      DESK.push(d);
    }
  }
  if (selIcon && !DESK.includes(selIcon)) selIcon = null;
  layoutIcons();
}
OS.on('fs', syncUserIcons);

function layoutIcons() {
  const { W, H } = OS.scr;
  const rows = Math.max(1, Math.floor((H - MB - 8) / CELL_H));
  const taken = new Set();
  let i = 0;
  const slot = () => {
    for (;;) {
      const x = 4 + Math.floor(i / rows) * CELL_W, y = MB + 5 + (i % rows) * CELL_H;
      i++;
      if (!taken.has(x + ',' + y) || i > 400) return { x, y };
    }
  };
  for (const d of DESK) {
    if (d.hidden?.()) { d.pos = null; continue; }
    if (d.moved && d.pos) { d.pos.x = OS.clamp(d.pos.x, 0, W - CELL_W); d.pos.y = OS.clamp(d.pos.y, MB + 2, H - CELL_H); taken.add(d.pos.x + ',' + d.pos.y); continue; }
    if (d.corner) { d.pos = { x: W - CELL_W - 4, y: H - CELL_H - 4 }; continue; }
    d.pos = slot();
  }
}
OS.on('resize', () => { layoutIcons(); wins.forEach(clampWin); });
OS.on('egg', (id) => { if (id === 'konami') layoutIcons(); });
const iconRect = (d) => ({ x: d.pos.x + (CELL_W >> 1) - 8, y: d.pos.y, w: 16, h: 16 });
function labelOf(d) {
  let s = OS.tx(d.label);
  if (OS.textW(s) > CELL_W - 2) s = s.slice(0, Math.floor((CELL_W - 2) / OS.CW) - 1) + '…';
  return s;
}
function outlined(s, x, y, fg, bg) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) OS.text(s, x + dx, y + dy, bg);
  OS.text(s, x, y, fg);
}
// Casella di testo per rinominare, centrata su cx.
OS.drawEditLabel = (text, cx, y, minW = 30) => {
  const w = Math.max(minW, OS.textW(text) + 8);
  const x = Math.round(cx - w / 2);
  OS.rect(x, y, w, 11, P.snow); OS.frame(x, y, w, 11, P.ink);
  const tx = OS.text(text, x + 3, y + 1, P.ink);
  if (Math.floor(OS.time * 2.5) % 2) OS.rect(x + 3 + tx, y + 1, 1, 9, P.lake);
};
// Applica i tasti a un nome in modifica. Restituisce 'ok', 'cancel' o null.
OS.editLabel = (st, keys) => {
  for (const k of keys) {
    if (k.key === 'Enter') return 'ok';
    if (k.key === 'Escape') return 'cancel';
    if (k.key === 'Backspace') st.text = st.text.slice(0, -1);
    else if (k.key.length === 1 && !k.ctrl && k.key !== '/' && [...st.text].length < 24) st.text += k.key;
  }
  return null;
};

function drawIcons() {
  for (const d of DESK) {
    if (!d.pos) continue;
    const dragging = drag?.type === 'icon' && drag.icon === d && drag.moved;
    const x = dragging ? OS.inp.x - drag.ox : d.pos.x, y = dragging ? OS.inp.y - drag.oy : d.pos.y;
    const sel = selIcon === d;
    const dropHere = dropTargetIcon === d;
    const name = d.app === 'trash' && OS.trashFull?.() ? 'trashFull' : d.icon;
    OS.spr(sel || dropHere ? name + ':sel' : name, x + (CELL_W >> 1) - 8, y);
    if (rename && d.ufs === rename.id) { OS.drawEditLabel(rename.text, x + CELL_W / 2, y + 18); continue; }
    const s = labelOf(d);
    const lw = OS.textW(s);
    const lx = x + ((CELL_W - lw) >> 1);
    if (sel) { OS.rect(lx - 2, y + 18, lw + 3, 11, P.lake); OS.text(s, lx, y + 19, P.snow); }
    else outlined(s, lx, y + 19, P.snow, P.ink);
  }
}
function iconAt(x, y, skip) {
  for (let i = DESK.length - 1; i >= 0; i--) {
    const d = DESK[i];
    if (!d.pos || d === skip) continue;
    const lw = OS.textW(labelOf(d));
    const r = iconRect(d);
    if (x >= r.x - 2 && x < r.x + 18 && y >= r.y && y < r.y + 17) return d;
    const lx = d.pos.x + ((CELL_W - lw) >> 1);
    if (x >= lx - 2 && x < lx + lw + 2 && y >= d.pos.y + 17 && y < d.pos.y + 30) return d;
  }
  return null;
}
function openIcon(d) {
  if (d.ufs) { OS.fs.open(d.ufs, { from: iconRect(d) }); return; }
  OS.open(d.app, d.arg, { from: iconRect(d) });
}
function startRename(d) {
  const n = OS.fs?.get(d.ufs);
  if (!n) return;
  selIcon = d; focus = null;
  rename = { id: n.id, text: n.name };
  OS.keyboard(OS.inp.touch);
}
function finishRename(ok) {
  if (!rename) return;
  if (ok) {
    const err = OS.fs.rename(rename.id, rename.text);
    if (err) OS.dialog({ title: L('Rinomina', 'Rename'), icon: 'warn', text: err });
  }
  rename = null;
  OS.keyboard(false);
}
function newOnDesk(type, x, y) {
  const n = OS.fs.create('desk', type);
  if (typeof n === 'string') { OS.dialog({ title: L('Nuovo', 'New'), icon: 'warn', text: n }); return; }
  const { W, H } = OS.scr;
  if (x != null) { n.x = OS.clamp(Math.round((x - CELL_W / 2) / 4) * 4, 0, W - CELL_W); n.y = OS.clamp(Math.round((y - 8) / 4) * 4, MB + 2, H - CELL_H); OS.fs.save(); }
  syncUserIcons();
  const d = DESK.find((e) => e.ufs === n.id);
  if (d) startRename(d);
}
OS.newOnDesk = newOnDesk;

/* ------------------------------------------------------------ finestre */
function geom(w) {
  const { W, H } = OS.scr;
  return w.max ? { x: 0, y: MB, w: W, h: H - MB } : { x: w.x, y: w.y, w: w.w, h: w.h };
}
const content = (w) => { const g = geom(w); return { x: g.x + 1, y: g.y + TB + 1, w: g.w - 2, h: g.h - TB - 2 }; };
function clampWin(w) {
  const { W, H } = OS.scr;
  w.w = Math.min(w.w, W); w.h = Math.min(w.h, H - MB);
  w.x = OS.clamp(w.x, -w.w + 40, W - 40);
  w.y = OS.clamp(w.y, MB, H - TB - 2);
}
OS.findWin = (app, arg) => wins.find((w) => w.app === app && (arg === undefined || w.arg === arg));
OS.focusWin = (w) => {
  if (!w) { focus = null; return; }
  if (rename) finishRename(true);
  const i = wins.indexOf(w);
  if (i >= 0) { wins.splice(i, 1); wins.push(w); }
  focus = w;
  selIcon = null;
  OS.keyboard(!!(w.def.wantsKeyboard && OS.inp.touch));
};
OS.open = (id, arg, o = {}) => {
  const def = OS.apps[id];
  if (!def) { OS.sfx.error(); return null; }
  if (def.single) {
    const ex = wins.find((w) => w.app === id && w.arg === arg);
    if (ex) { OS.focusWin(ex); ex.inst.reopen?.(arg); return ex; }
  }
  const { W, H } = OS.scr;
  const dw = typeof def.w === 'function' ? def.w(arg) : def.w, dh = typeof def.h === 'function' ? def.h(arg) : def.h;
  const w = { id: seq++, app: id, arg, def, icon: def.icon, x: 0, y: 0, w: Math.min(dw, W), h: Math.min(dh, H - MB), born: OS.time, from: o.from };
  if (def.pixel) {
    // Le app "a pixel" nascono al multiplo intero più grande che entra (massimo x2).
    w.base = { w: dw - 2, h: dh - TB - 2 };
    const k = Math.max(1, Math.min(2, Math.floor(Math.min((W - 8) / w.base.w, (H - MB - 8) / w.base.h))));
    w.w = Math.min(W, w.base.w * k + 2); w.h = Math.min(H - MB, w.base.h * k + TB + 2);
  }
  const n = wins.length;
  w.x = Math.max(0, Math.min(W - w.w, Math.round((W - w.w) / 2 + (n % 5) * 12 - 24 + (W > 400 ? 30 : 0))));
  w.y = Math.max(MB, Math.min(H - w.h, Math.round(MB + (H - MB - w.h) / 3 + (n % 5) * 10)));
  if (!def.pixel && (W < 360 || dw > W - 8 || dh > H - MB - 4)) w.max = true;
  w.inst = def.make(w, arg) || {};
  wins.push(w);
  OS.focusWin(w);
  OS.sfx.open();
  return w;
};
OS.closeWin = (w) => {
  const i = wins.indexOf(w);
  if (i < 0) return;
  w.inst.close?.();
  wins.splice(i, 1);
  if (focus === w) { focus = wins[wins.length - 1] || null; OS.keyboard(false); }
  OS.sfx.close();
};
OS.titleOf = (w) => OS.tx(w.title ?? (typeof w.def.title === 'function' ? w.def.title(w.arg) : w.def.title));

function drawWin(w) {
  const gm = geom(w), active = w === focus;
  const age = OS.time - w.born;
  if (age < 0.16 && !OS.reduced) {
    const f = w.from || { x: gm.x + gm.w / 2, y: gm.y + gm.h / 2, w: 1, h: 1 };
    for (let i = 1; i <= 3; i++) {
      const k = Math.min(1, age / 0.16) * i / 3;
      OS.frame(f.x + (gm.x - f.x) * k, f.y + (gm.y - f.y) * k, f.w + (gm.w - f.w) * k, f.h + (gm.h - f.h) * k, P.ink);
    }
    return;
  }
  if (!w.max) OS.shade(gm.x + 3, gm.y + 3, gm.w, gm.h, P.ink, 8);
  OS.rect(gm.x, gm.y, gm.w, gm.h, P.ink);
  // Barra del titolo a righe, come i sistemi di fine anni 80.
  OS.rect(gm.x + 1, gm.y + 1, gm.w - 2, TB - 1, active ? P.lake : P.stone);
  if (active) for (let yy = 2; yy < TB - 1; yy += 2) OS.rect(gm.x + 14, gm.y + yy, gm.w - 28, 1, OS.rainbow ? OS.PAL16[(yy + Math.floor(OS.time * 12)) % 16] : P.lakeHi);
  let t = OS.titleOf(w);
  if (w.def.pixel) {
    const r0 = content(w);
    const k = Math.max(1, Math.floor(Math.min(r0.w / w.base.w, r0.h / w.base.h)));
    if (k > 1) t += ' ×' + k;
  }
  const maxChars = Math.max(1, Math.floor((gm.w - 40) / OS.CW));
  const tt = [...t].length > maxChars ? [...t].slice(0, maxChars - 1).join('') + '…' : t;
  const tw = OS.textW(tt);
  const tx = gm.x + ((gm.w - tw) >> 1);
  OS.rect(tx - 4, gm.y + 1, tw + 7, TB - 1, active ? P.lake : P.stone);
  OS.text(tt, tx, gm.y + 2, active ? P.snow : P.ink);
  const hovC = hover.kind === 'win' && hover.win === w && hover.part === 'close';
  OS.rect(gm.x + 3, gm.y + 2, 8, 8, hovC ? P.red : P.snow); OS.frame(gm.x + 3, gm.y + 2, 8, 8, P.ink);
  if (hovC) { OS.line(gm.x + 5, gm.y + 4, gm.x + 8, gm.y + 7, P.snow); OS.line(gm.x + 8, gm.y + 4, gm.x + 5, gm.y + 7, P.snow); }
  const hovM = hover.kind === 'win' && hover.win === w && hover.part === 'max';
  const mx = gm.x + gm.w - 11;
  OS.rect(mx, gm.y + 2, 8, 8, hovM ? P.gold : P.snow); OS.frame(mx, gm.y + 2, 8, 8, P.ink);
  OS.frame(mx + 2, gm.y + 4, w.max ? 3 : 4, w.max ? 3 : 4, P.ink);

  const r = content(w);
  const dropping = OS.dnd?.moved && dropWin === w;
  OS.rect(r.x, r.y, r.w, r.h, w.def.bg);
  OS.clip(r.x, r.y, r.w, r.h);
  try {
    if (w.def.pixel) drawPixelApp(w, r);
    else w.inst.draw?.(OS.g, r, mkIO(w, r));
  } catch (e) {
    console.error(e);
    OS.setTarget(null);
    OS.unclip(); OS.clip(r.x, r.y, r.w, r.h);
    OS.text(L('Errore: ', 'Error: ') + e.message, r.x + 4, r.y + 4, P.red);
  }
  OS.unclip();
  if (dropping) { OS.frame(r.x, r.y, r.w, r.h, P.gold); OS.frame(r.x + 1, r.y + 1, r.w - 2, r.h - 2, P.gold); }
  if (!w.max) {
    const gx = gm.x + gm.w - 8, gy = gm.y + gm.h - 8;
    for (let i = 0; i < 3; i++) OS.line(gx + 2 + i * 2, gy + 6, gx + 6, gy + 2 + i * 2, P.slate);
  }
}

// App a risoluzione fissa: disegnate su una superficie piccola e ingrandite a multipli interi.
function drawPixelApp(w, r) {
  const b = w.base;
  const k = Math.max(1, Math.floor(Math.min(r.w / b.w, r.h / b.h)));
  if (!w.cv) {
    w.cv = document.createElement('canvas'); w.cv.width = b.w; w.cv.height = b.h;
    w.cx = w.cv.getContext('2d');
  }
  const sx = r.x + ((r.w - b.w * k) >> 1), sy = r.y + ((r.h - b.h * k) >> 1);
  if (b.w * k < r.w || b.h * k < r.h) OS.dither(r.x, r.y, r.w, r.h, P.ink, P.night, 8);
  const inner = { x: 0, y: 0, w: b.w, h: b.h };
  const prev = OS.setTarget(w.cx);
  try {
    OS.rect(0, 0, b.w, b.h, w.def.bg);
    w.inst.draw?.(w.cx, inner, mkIO(w, inner, sx, sy, k));
  } finally { OS.setTarget(prev); }
  OS.g.drawImage(w.cv, sx, sy, b.w * k, b.h * k);
}

// sx, sy, k: dove finisce il contenuto sullo schermo e di quanto è ingrandito.
function mkIO(win, r, sx = r.x, sy = r.y, k = 1) {
  const inp = OS.inp;
  const own = press ? press.kind === 'win' && press.win === win && press.part === 'body' : hover.kind === 'win' && hover.win === win && hover.part === 'body';
  const active = own && !menu && !rename;
  const lx = Math.floor((inp.x - sx) / k), ly = Math.floor((inp.y - sy) / k);
  const px = Math.floor((inp.px - sx) / k), py = Math.floor((inp.py - sy) / k);
  const inside = active && lx >= 0 && ly >= 0 && lx < r.w && ly < r.h;
  const keys = win === focus && !menu && !rename ? inp.keys : [];
  return {
    x: lx, y: ly, px, py, ox: r.x, oy: r.y, w: r.w, h: r.h, win,
    active, inside, down: active && inp.down, pressed: inside && inp.pressed, released: active && inp.released,
    dbl: inside && inp.dbl, rpressed: inside && inp.rpressed, wheel: inside ? inp.wheel : 0,
    keys, focused: win === focus, touch: inp.touch, held: win === focus ? inp.held : {},
    // Coordinate dello schermo di un punto locale (per menu contestuali).
    screen(x, y) { return { x: sx + x * k, y: sy + y * k }; },
    hit(x, y, w, h) { return inside && lx >= x && ly >= y && lx < x + w && ly < y + h; },
    pressIn(x, y, w, h) { return px >= x && py >= y && px < x + w && py < y + h; },
    click(x, y, w, h) { return active && inp.released && !OS.dnd?.moved && this.hit(x, y, w, h) && this.pressIn(x, y, w, h); }
  };
}

/* ------------------------------------------------------------ ridimensionamento a gradini */
function resizeRect() {
  const inp = OS.inp, { W, H } = OS.scr;
  const { win: w, edges: e, g0 } = drag;
  const dx = inp.x - drag.x0, dy = inp.y - drag.y0;
  let nw = g0.w + (e.r ? dx : e.l ? -dx : 0);
  let nh = g0.h + (e.b ? dy : 0);
  if (w.def.pixel) {
    const b = w.base;
    const kx = (nw - 2) / b.w, ky = (nh - TB - 2) / b.h;
    let k = e.b && (e.l || e.r) ? (kx + ky) / 2 : e.b ? ky : kx;
    const kmax = Math.max(1, Math.floor(Math.min((W - (e.l ? 0 : g0.x)) / b.w, (H - g0.y - TB - 2) / b.h)));
    k = OS.clamp(Math.round(k), 1, kmax);
    nw = b.w * k + 2; nh = b.h * k + TB + 2;
  } else {
    nw = Math.round(nw / GRID) * GRID; nh = Math.round(nh / GRID) * GRID;
    nw = OS.clamp(nw, w.def.minW || 96, e.l ? g0.x + g0.w : W - g0.x);
    nh = OS.clamp(nh, w.def.minH || 64, H - g0.y);
  }
  const nx = e.l ? g0.x + g0.w - nw : g0.x;
  return { x: nx, y: g0.y, w: nw, h: nh };
}
function drawResizeOutline() {
  if (drag?.type !== 'resize' || !drag.rect) return;
  const { x, y, w, h } = drag.rect;
  OS.dither(x, y, w, 2, P.ink, P.snow, 8); OS.dither(x, y + h - 2, w, 2, P.ink, P.snow, 8);
  OS.dither(x, y, 2, h, P.ink, P.snow, 8); OS.dither(x + w - 2, y, 2, h, P.ink, P.snow, 8);
  OS.dither(x, y + TB, w, 1, '', P.ink, 8);
  const b = drag.win.base;
  const s = drag.win.def.pixel ? '×' + Math.round((w - 2) / b.w) : (w - 2) + '×' + (h - TB - 2);
  const sw = OS.textW(s) + 8;
  const lx = x + ((w - sw) >> 1), ly = y + (h >> 1) - 6;
  OS.rect(lx, ly, sw, 12, P.ink);
  OS.text(s, lx + 4, ly + 1, P.gold);
}
const CURSOR_OF = { 'rs-l': 'ew', 'rs-r': 'ew', 'rs-b': 'ns', 'rs-br': 'nwse', 'rs-bl': 'nesw' };

/* ------------------------------------------------------------ barra dei menu */
let barItems = [];
function layoutBar() {
  const { W } = OS.scr;
  const left = [
    { id: 'sys', label: 'Ceresio', emblem: true },
    { id: 'win', label: L('Finestre', 'Windows') },
    { id: 'help', label: L('Aiuto', 'Help') }
  ];
  let x = 2;
  for (const it of left) { it.x = x; it.w = OS.textW(it.label) + 8 + (it.emblem ? 11 : 0); x += it.w; }
  const lt = OS.luganoTime();
  const colon = Math.floor(OS.time * 2) % 2 ? ':' : ' ';
  const clock = OS.pad(lt.h) + colon + OS.pad(lt.m);
  const right = [{ id: 'clock', label: clock }];
  if (OS.weather || OS.settings.wx !== 'auto') right.push({ id: 'wx', label: (OS.weather ? OS.weather.temp + '°' : '--'), wx: true });
  right.push({ id: 'snd', label: '', w: 14 });
  const place = () => { let rx = W - 2; for (const it of right) { it.w = it.w || OS.textW(it.label) + 8 + (it.wx ? 10 : 0); rx -= it.w; it.x = rx; } return rx; };
  // Schermi stretti: prima sparisce il meteo, poi la voce Aiuto.
  if (place() < x && right.some((r) => r.id === 'wx')) { right.splice(right.findIndex((r) => r.id === 'wx'), 1); }
  if (place() < x) { const h = left.pop(); x -= h.w; }
  barItems = [...left, ...right];
}
function drawWxIcon(x, y, k) {
  if (k === 'clear') { OS.disc(x + 3, y + 4, 2, OS.wallpaper.tod === 'night' ? P.slate : P.orange); return; }
  if (k === 'snow') { for (const [a, b] of [[1, 2], [4, 1], [6, 4], [2, 6], [5, 7]]) OS.px(x + a, y + b, P.lakeHi); return; }
  OS.rect(x + 1, y + 3, 6, 3, P.slate); OS.rect(x + 2, y + 2, 3, 1, P.slate);
  if (k === 'rain' || k === 'storm') { OS.px(x + 2, y + 7, P.lake); OS.px(x + 5, y + 7, P.lake); }
  if (k === 'storm') OS.px(x + 4, y + 8, P.gold);
}
function drawBar() {
  const { W } = OS.scr;
  layoutBar();
  OS.rect(0, 0, W, MB - 1, P.snow);
  OS.rect(0, MB - 1, W, 1, P.ink);
  for (const it of barItems) {
    const open = menu && menu.owner === it.id;
    if (open) OS.rect(it.x, 0, it.w, MB - 1, P.lake);
    let x = it.x + 4;
    if (it.emblem) { OS.spr('emblem', x - 1, 1); x += 11; }
    if (it.wx) { drawWxIcon(x - 1, 1, OS.wxKind()); x += 10; }
    if (it.id === 'snd') { OS.spr(OS.settings.sound ? 'speaker' : 'mute', it.x + 3, 2); continue; }
    OS.text(it.label, x, 1, open ? P.snow : P.ink);
  }
}

/* ------------------------------------------------------------ menu a tendina */
function openMenu(owner, x, y, items) {
  const w = Math.max(...items.map((i) => (i.sep ? 0 : OS.textW(i.label) + 22)), 60);
  const h = items.reduce((a, i) => a + (i.sep ? 5 : 11), 4);
  const { W, H } = OS.scr;
  menu = { owner, x: Math.max(0, Math.min(x, W - w - 3)), y: Math.min(y, H - h - 3), w, h, items, sel: -1 };
  OS.sfx.menu();
}
// Menu contestuale aperto da un'app (coordinate dello schermo).
OS.menu = (x, y, items) => { openMenu('app', x, y, items); press = { kind: 'none' }; };
function menuItemAt(x, y) {
  if (!menu || x < menu.x || x >= menu.x + menu.w || y < menu.y || y >= menu.y + menu.h) return -2;
  let yy = menu.y + 2;
  for (let i = 0; i < menu.items.length; i++) {
    const it = menu.items[i], h = it.sep ? 5 : 11;
    if (y >= yy && y < yy + h) return it.sep || it.disabled ? -1 : i;
    yy += h;
  }
  return -1;
}
function drawMenu() {
  if (!menu) return;
  const m = menu;
  OS.rect(m.x + 2, m.y + 2, m.w, m.h, P.ink);
  OS.rect(m.x, m.y, m.w, m.h, P.snow);
  OS.frame(m.x, m.y, m.w, m.h, P.ink);
  const hi = hover.kind === 'menu' ? hover.item : m.sel;
  let y = m.y + 2;
  m.items.forEach((it, i) => {
    if (it.sep) { OS.rect(m.x + 3, y + 2, m.w - 6, 1, P.stone); y += 5; return; }
    const on = i === hi && !it.disabled;
    if (on) OS.rect(m.x + 1, y, m.w - 2, 11, P.lake);
    if (it.check) OS.text('✓', m.x + 4, y + 1, on ? P.snow : P.lake);
    OS.text(it.label, m.x + 13, y + 1, it.disabled ? P.stone : on ? P.snow : P.ink);
    y += 11;
  });
}
function menuFor(id, at) {
  const tod = OS.settings.tod, wxS = OS.settings.wx;
  if (id === 'sys') return [
    { label: L('Informazioni su Ceresio', 'About Ceresio'), act: () => OS.open('sysinfo') },
    { label: L('Impostazioni', 'Settings'), act: () => OS.open('settings') },
    { label: L('Trofei', 'Trophies') + ' (' + OS.found.size + '/' + OS.EGGS.length + ')', act: () => OS.open('trophies') },
    { sep: true },
    { label: L('Sito classico (www)', 'Classic site (www)'), act: () => OS.openUrl(OS.CV.site) },
    { sep: true },
    { label: L('Riavvia', 'Restart'), act: () => OS.restart() },
    { label: L('Spegni...', 'Shut down...'), act: () => OS.shutdown() }
  ];
  if (id === 'win') {
    const items = wins.slice().reverse().map((w) => ({ label: OS.titleOf(w), check: w === focus, act: () => OS.focusWin(w) }));
    if (!items.length) items.push({ label: L('Nessuna finestra aperta', 'No open windows'), disabled: true });
    else items.push({ sep: true }, { label: L('Chiudi tutte', 'Close all'), act: () => wins.slice().forEach(OS.closeWin) });
    return items;
  }
  if (id === 'help') return [
    { label: L('Leggimi', 'Read me'), act: () => OS.open('readme') },
    { label: L('Segreti e trofei', 'Secrets and trophies'), act: () => OS.open('trophies') },
    { label: L('Apri il terminale', 'Open the terminal'), act: () => OS.open('terminal') },
    { sep: true },
    { label: L('Scrivi a Carlo', 'Write to Carlo'), act: () => OS.open('contact') }
  ];
  if (id === 'clock') {
    const d = new Date();
    const date = d.toLocaleDateString(L('it-CH', 'en-GB'), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Zurich' });
    return [
      { label: date, disabled: true },
      { label: 'Lugano, Europe/Zurich', disabled: true },
      { sep: true },
      { label: L('Orologio da stazione', 'Station clock'), act: () => OS.open('clock') }
    ];
  }
  if (id === 'wx') {
    const opts = ['auto', 'clear', 'cloudy', 'rain', 'snow', 'storm', 'fog'];
    return [
      { label: OS.weather ? 'Lugano: ' + OS.weather.temp + '°C, ' + OS.wxName(OS.wxKind()) : L('Meteo non disponibile', 'Weather unavailable'), disabled: true },
      { sep: true },
      ...opts.map((k) => ({ label: L('Sfondo: ', 'Wallpaper: ') + (k === 'auto' ? L('meteo reale', 'real weather') : OS.wxName(k)), check: wxS === k, act: () => { OS.settings.wx = k; OS.saveSettings(); } }))
    ];
  }
  if (id === 'desk') {
    const todN = { auto: L('ora reale', 'real time'), dawn: L('alba', 'dawn'), day: L('giorno', 'day'), dusk: L('tramonto', 'dusk'), night: L('notte', 'night') };
    return [
      { label: L('Nuova cartella', 'New folder'), act: () => newOnDesk('dir', at?.x, at?.y) },
      { label: L('Nuovo documento', 'New document'), act: () => newOnDesk('file', at?.x, at?.y) },
      { sep: true },
      { label: L('Riordina le icone', 'Tidy up icons'), act: () => { DESK.forEach((d) => { d.moved = false; if (d.ufs) { const n = OS.fs.get(d.ufs); if (n) n.x = n.y = null; } }); OS.fs?.save(); layoutIcons(); } },
      { sep: true },
      ...Object.keys(todN).map((k) => ({ label: L('Luce: ', 'Light: ') + todN[k], check: tod === k, act: () => { OS.settings.tod = k; OS.saveSettings(); } })),
      { sep: true },
      { label: L('Impostazioni', 'Settings'), act: () => OS.open('settings') },
      { label: L('Informazioni su Ceresio', 'About Ceresio'), act: () => OS.open('sysinfo') }
    ];
  }
  return [];
}
function iconMenu(d) {
  if (!d.ufs) return [{ label: L('Apri', 'Open'), act: () => openIcon(d) }];
  return [
    { label: L('Apri', 'Open'), act: () => openIcon(d) },
    { label: L('Rinomina', 'Rename'), act: () => startRename(d) },
    { sep: true },
    { label: L('Sposta nel cestino', 'Move to trash'), act: () => OS.fs.remove(d.ufs) }
  ];
}

/* ------------------------------------------------------------ notifiche trofei */
function drawToasts(dt) {
  const { W, H } = OS.scr;
  let y = H - 4;
  for (const t of OS.toasts) {
    t.t += dt;
    const def = OS.EGGS.find((e) => e.id === t.id);
    const name = def ? OS.tx(def.name) : t.id;
    const w = Math.max(OS.textW(name), OS.textW(L('Trofeo sbloccato', 'Trophy unlocked'))) + 30;
    const slide = Math.min(1, t.t * 5) * Math.min(1, (4 - t.t) * 5);
    const x = W - 4 - w * slide;
    y -= 30;
    OS.rect(x + 2, y + 2, w, 26, P.ink);
    OS.rect(x, y, w, 26, P.snow); OS.frame(x, y, w, 26, P.ink);
    OS.rect(x + 1, y + 1, 21, 24, P.gold);
    OS.spr('trophy', x + 3, y + 5);
    OS.text(L('Trofeo sbloccato', 'Trophy unlocked'), x + 25, y + 3, P.slate);
    OS.text(name, x + 25, y + 13, P.ink);
    t.rect = { x, y, w, h: 26 };
  }
  for (let i = OS.toasts.length - 1; i >= 0; i--) if (OS.toasts[i].t > 4) OS.toasts.splice(i, 1);
}

/* ------------------------------------------------------------ hit test */
function hitTest(x, y, skipIcon) {
  if (menu) { const i = menuItemAt(x, y); if (i !== -2) return { kind: 'menu', item: i }; }
  for (const t of OS.toasts) if (t.rect && x >= t.rect.x && x < t.rect.x + t.rect.w && y >= t.rect.y && y < t.rect.y + t.rect.h) return { kind: 'toast' };
  if (y < MB && y >= 0) {
    const it = barItems.find((b) => x >= b.x && x < b.x + b.w);
    return { kind: 'bar', item: it ? it.id : null };
  }
  for (let i = wins.length - 1; i >= 0; i--) {
    const w = wins[i], gm = geom(w);
    if (x < gm.x || y < gm.y || x >= gm.x + gm.w || y >= gm.y + gm.h) continue;
    let part = 'body';
    if (y < gm.y + TB) {
      part = 'title';
      if (x >= gm.x + 2 && x < gm.x + 12) part = 'close';
      else if (x >= gm.x + gm.w - 12 && x < gm.x + gm.w - 2) part = 'max';
    } else if (!w.max) {
      const l = x < gm.x + EDGE, r = x >= gm.x + gm.w - EDGE, b = y >= gm.y + gm.h - EDGE;
      const grip = x >= gm.x + gm.w - 8 && y >= gm.y + gm.h - 8;
      if (grip) part = 'rs-br';
      else if (l || r || b) part = 'rs-' + (b ? 'b' : '') + (l ? 'l' : r ? 'r' : '');
    }
    return { kind: 'win', win: w, part };
  }
  const d = iconAt(x, y, skipIcon);
  if (d) return { kind: 'icon', icon: d };
  return { kind: 'desk' };
}

/* ------------------------------------------------------------ trascina e rilascia file */
let dropTargetIcon = null, dropWin = null;
// Dove finirebbe un file rilasciato in (x, y): cartella aperta, cartella sulla scrivania, cestino o scrivania.
function dropTarget(id, x, y, skipIcon) {
  const t = hitTest(x, y, skipIcon);
  if (t.kind === 'win') {
    if (t.win.app === 'ufolder') return { dir: t.win.arg, win: t.win };
    if (t.win.app === 'trash') return { trash: true, win: t.win };
    return null;
  }
  if (t.kind === 'icon') {
    const d = t.icon;
    if (d.app === 'trash') return { trash: true, icon: d };
    const n = d.ufs && OS.fs.get(d.ufs);
    if (n && n.type === 'dir' && n.id !== id) return { dir: n.id, icon: d };
    return null;
  }
  if (t.kind === 'desk') return { desk: true };
  return null;
}
function applyDrop(id, tg, x, y) {
  const fs = OS.fs, n = fs.get(id);
  if (!n || !tg) return false;
  if (tg.trash) { fs.remove(id); OS.sfx.close(); return true; }
  if (tg.dir) {
    const err = fs.move(id, tg.dir);
    if (err) { OS.dialog({ title: L('Sposta', 'Move'), icon: 'warn', text: err }); return true; }
    OS.sfx.select(); return true;
  }
  if (tg.desk) {
    const { W, H } = OS.scr;
    if (n.parent !== 'desk') { const err = fs.move(id, 'desk'); if (err) { OS.dialog({ title: L('Sposta', 'Move'), icon: 'warn', text: err }); return true; } }
    n.x = OS.clamp(x - (CELL_W >> 1), 0, W - CELL_W); n.y = OS.clamp(y - 8, MB + 2, H - CELL_H);
    fs.save();
    return true;
  }
  return false;
}
function drawDndGhost() {
  if (!OS.dnd?.moved) return;
  const n = OS.fs.get(OS.dnd.id);
  if (!n) return;
  const { x, y } = OS.inp;
  OS.spr(n.type === 'dir' ? 'folder:sel' : 'note:sel', x - 8, y - 8);
  outlined(n.name.slice(0, 12), x - 8, y + 10, P.snow, P.ink);
}

/* ------------------------------------------------------------ input */
function menuKeys() {
  const m = menu, n = m.items.length;
  const step = (dir) => {
    let i = m.sel;
    for (let k = 0; k < n; k++) { i = (i + dir + n) % n; if (!m.items[i].sep && !m.items[i].disabled) break; }
    m.sel = i;
  };
  for (const k of OS.inp.keys) {
    if (k.key === 'ArrowDown') step(1);
    else if (k.key === 'ArrowUp') step(-1);
    else if (k.key === 'Escape') menu = null;
    else if (k.key === 'Enter' && m.sel >= 0) { const it = m.items[m.sel]; menu = null; it.act?.(); }
    if (!menu) break;
  }
  OS.inp.keys.length = 0;
}
function deskKeys() {
  const vis = DESK.filter((d) => d.pos);
  for (const k of OS.inp.keys) {
    const i = vis.indexOf(selIcon);
    if (['ArrowDown', 'ArrowRight', 'Tab'].includes(k.key)) { selIcon = vis[(i + 1) % vis.length]; OS.sfx.click(); }
    else if (['ArrowUp', 'ArrowLeft'].includes(k.key)) { selIcon = vis[(i - 1 + vis.length) % vis.length]; OS.sfx.click(); }
    else if (k.key === 'Enter' && selIcon) openIcon(selIcon);
    else if (k.key === 'F2' && selIcon?.ufs) startRename(selIcon);
    else if ((k.key === 'Delete' || k.key === 'Backspace') && selIcon?.ufs) OS.fs.remove(selIcon.ufs);
    else if (k.key.length === 1) OS.emit('desktype', k.key);
  }
}

const desktop = {
  isDesktop: true,
  enter() { syncUserIcons(); },
  update() {
    const inp = OS.inp;
    layoutBar();
    hover = hitTest(inp.x, inp.y);
    for (const k of inp.keys) OS.emit('key', k);

    if (menu) menuKeys();
    else if (rename) {
      const r = OS.editLabel(rename, inp.keys);
      inp.keys.length = 0;
      if (r) finishRename(r === 'ok');
    } else if (focus) {
      const esc = inp.keys.findIndex((k) => k.key === 'Escape');
      if (esc >= 0 && focus.def.escClose) { inp.keys.splice(esc, 1); OS.closeWin(focus); }
    } else deskKeys();

    if (inp.pressed) {
      // Il punto del clic, non dove il puntatore è arrivato nel frattempo.
      const at = hitTest(inp.px, inp.py);
      if (rename && !(at.kind === 'icon' && at.icon.ufs === rename.id)) finishRename(true);
      press = at; onPress(at);
    }
    if (inp.rpressed) {
      if (rename) finishRename(true);
      if (hover.kind === 'icon') { selIcon = hover.icon; focus = null; openMenu('icon', inp.x, inp.y, iconMenu(hover.icon)); }
      else if (hover.kind === 'desk') openMenu('desk', inp.x, inp.y, menuFor('desk', { x: inp.x, y: inp.y }));
    }
    if (drag && inp.down) onDrag();
    // Tocco lungo: menu contestuale.
    if (inp.down && inp.touch && !menu && performance.now() - inp.downAt > 600) {
      if (press?.kind === 'desk' && !(drag && drag.moved)) { openMenu('desk', inp.x, inp.y, menuFor('desk', { x: inp.x, y: inp.y })); press = null; drag = null; }
      else if (press?.kind === 'icon' && drag && !drag.moved) { openMenu('icon', inp.x, inp.y, iconMenu(press.icon)); press = null; drag = null; }
    }
    if (OS.dnd && inp.down && !OS.dnd.moved && Math.abs(inp.x - OS.dnd.x0) + Math.abs(inp.y - OS.dnd.y0) > 4) OS.dnd.moved = true;
    // Bersagli evidenziati durante un trascinamento.
    dropTargetIcon = null; dropWin = null;
    const draggingId = OS.dnd?.moved ? OS.dnd.id : drag?.type === 'icon' && drag.moved && drag.icon.ufs;
    if (draggingId) {
      const tg = dropTarget(draggingId, inp.x, inp.y, drag?.icon);
      if (tg?.icon) dropTargetIcon = tg.icon;
      if (tg?.win) dropWin = tg.win;
    }
    if (inp.released && OS.dnd) {
      if (OS.dnd.moved) applyDrop(OS.dnd.id, dropTarget(OS.dnd.id, inp.x, inp.y), inp.x, inp.y);
      OS.dnd = null;
    }
    if (inp.released && press) onRelease(hover);
    if (drag?.type === 'move') OS.cursor = 'move';
    else if (drag?.type === 'resize') OS.cursor = CURSOR_OF[drag.part];
    else if (!inp.down && hover.kind === 'win' && CURSOR_OF[hover.part]) OS.cursor = CURSOR_OF[hover.part];
  },
  draw(g, dt) {
    const { W, H } = OS.scr;
    OS.wallpaper.draw(W, H, dt);
    drawIcons();
    for (const w of wins) drawWin(w);
    drawResizeOutline();
    for (const o of OS.deskOverlays) o(g, dt);
    drawDndGhost();
    drawBar();
    drawMenu();
    drawToasts(dt);
    if (OS.inp.released) { press = null; drag = null; }
  }
};
OS.deskOverlays = [];

function onPress(t) {
  const inp = OS.inp;
  if (menu && t.kind !== 'menu') {
    const same = t.kind === 'bar' && t.item === menu.owner;
    menu = null;
    if (same || t.kind !== 'bar') { press = { kind: 'none' }; return; }
  }
  if (t.kind === 'toast') { OS.open('trophies'); press = { kind: 'none' }; return; }
  if (t.kind === 'bar') {
    const it = barItems.find((b) => b.id === t.item);
    if (!it) return;
    if (it.id === 'snd') { OS.settings.sound = !OS.settings.sound; OS.saveSettings(); OS.sfx.click(); return; }
    if (it.id === 'clock' && inp.dbl) { OS.open('clock'); return; }
    openMenu(it.id, it.x, MB, menuFor(it.id));
    return;
  }
  if (t.kind === 'win') {
    OS.focusWin(t.win);
    const gm = geom(t.win);
    if (t.part === 'title') {
      if (inp.dbl) { toggleMax(t.win); return; }
      drag = { type: 'move', win: t.win, dx: inp.px - gm.x, dy: inp.py - gm.y };
    } else if (t.part.startsWith('rs-')) {
      const s = t.part.slice(3);
      drag = { type: 'resize', part: t.part, win: t.win, edges: { l: s.includes('l'), r: s.includes('r'), b: s.includes('b') }, x0: inp.px, y0: inp.py, g0: { ...gm }, rect: null };
    }
    return;
  }
  if (t.kind === 'icon') {
    focus = null;
    if (selIcon !== t.icon) OS.sfx.click();
    selIcon = t.icon;
    drag = { type: 'icon', icon: t.icon, ox: inp.px - t.icon.pos.x, oy: inp.py - t.icon.pos.y, x0: inp.px, y0: inp.py, moved: false };
    if (inp.dbl && !inp.touch) { drag = null; openIcon(t.icon); }
    return;
  }
  if (t.kind === 'desk') {
    focus = null; selIcon = null;
    OS.keyboard(false);
    drag = { type: 'desk', x0: inp.px, y0: inp.py, moved: false };
  }
}
function onDrag() {
  const inp = OS.inp, { W, H } = OS.scr;
  if (drag.type === 'move') {
    const w = drag.win;
    if (w.max) { w.max = false; drag.dx = Math.min(drag.dx, w.w - 20); }
    w.x = OS.clamp(inp.x - drag.dx, -w.w + 40, W - 40);
    w.y = OS.clamp(inp.y - drag.dy, MB, H - TB - 2);
  } else if (drag.type === 'resize') {
    drag.rect = resizeRect();
  } else if (drag.type === 'icon' || drag.type === 'desk') {
    if (Math.abs(inp.x - drag.x0) + Math.abs(inp.y - drag.y0) > 4) drag.moved = true;
  }
}
function onRelease(t) {
  const inp = OS.inp;
  const p = press;
  if (p.kind === 'menu' && t.kind === 'menu' && t.item >= 0) {
    const it = menu.items[t.item];
    menu = null;
    OS.sfx.select();
    it.act?.();
    return;
  }
  if (p.kind === 'bar' && t.kind === 'menu' && t.item >= 0 && menu) {
    const it = menu.items[t.item];
    menu = null; it.act?.(); return;
  }
  if (drag?.type === 'resize') {
    const r = drag.rect;
    if (r) { Object.assign(drag.win, { x: r.x, y: r.y, w: r.w, h: r.h, max: false }); OS.sfx.select(); }
    return;
  }
  if (p.kind === 'win' && t.kind === 'win' && t.win === p.win && t.part === p.part) {
    if (p.part === 'close') OS.closeWin(p.win);
    else if (p.part === 'max') toggleMax(p.win);
  }
  if (p.kind === 'icon' && drag?.type === 'icon') {
    const d = drag.icon;
    if (drag.moved) {
      const tg = d.ufs ? dropTarget(d.ufs, inp.x, inp.y, d) : null;
      if (tg && !tg.desk) applyDrop(d.ufs, tg, inp.x, inp.y);
      else {
        const { W, H } = OS.scr;
        d.pos = { x: OS.clamp(inp.x - drag.ox, 0, W - CELL_W), y: OS.clamp(inp.y - drag.oy, MB + 2, H - CELL_H) };
        d.moved = true;
        if (d.ufs) { const n = OS.fs.get(d.ufs); if (n) { n.x = d.pos.x; n.y = d.pos.y; OS.fs.save(); } }
      }
    } else if (inp.touch) openIcon(d);
  }
  if (p.kind === 'desk' && drag?.type === 'desk' && !drag.moved) OS.wallpaper.click(inp.x, inp.y);
}
function toggleMax(w) { w.max = !w.max; if (!w.max) clampWin(w); OS.sfx.select(); }

OS.startDesktop = () => {
  OS.setScene(desktop);
  OS.sfx.boot();
  setTimeout(() => OS.open('readme'), 350);
};
OS.restart = () => { OS.sfx.shutdown(); OS.fade(() => location.reload(), 0.8); };
})();
