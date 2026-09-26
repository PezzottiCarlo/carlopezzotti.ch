/* Ceresio OS — widget in modalità immediata e vista documento scorrevole. */
(() => {
'use strict';
const OS = window.OS, P = OS.P;
const CH = OS.CH;

const ui = OS.ui = {};

// Sotto-io: sposta l'origine di un io (coordinate locali) di dx, dy e limita l'area attiva.
ui.sub = (io, dx, dy, lim) => ({
  __proto__: io,
  x: io.x - dx, y: io.y - dy, px: io.px - dx, py: io.py - dy, ox: io.ox + dx, oy: io.oy + dy,
  hit(x, y, w, h) { return (!lim || lim()) && io.hit(dx + x, dy + y, w, h); },
  click(x, y, w, h) { return (!lim || lim()) && io.click(dx + x, dy + y, w, h); },
  pressIn(x, y, w, h) { return io.pressIn(dx + x, dy + y, w, h); }
});

ui.button = (io, x, y, label, o = {}) => {
  const w = o.w || OS.textW(label) + 10, h = 13;
  const hov = !o.disabled && io.hit(x, y, w, h);
  const down = hov && io.down && io.pressIn(x, y, w, h);
  const X = io.ox + x + (down ? 1 : 0), Y = io.oy + y + (down ? 1 : 0);
  if (!down) OS.rect(io.ox + x + 1, io.oy + y + 1, w, h, P.ink);
  const bg = o.disabled ? P.mist : down ? P.lake : o.on ? P.lakeHi : o.primary ? P.gold : hov ? P.mist : P.snow;
  OS.rect(X, Y, w, h, bg);
  OS.frame(X, Y, w, h, P.ink);
  OS.textC(label, X + w / 2, Y + 2, o.disabled ? P.stone : (down || o.on) ? P.snow : P.ink);
  if (hov) OS.cursor = 'hand';
  const c = !o.disabled && io.click(x, y, w, h);
  if (c) OS.sfx.click();
  return c;
};
ui.buttonW = (label, o = {}) => (o.w || OS.textW(label) + 10) + 1;

ui.check = (io, x, y, on, label) => {
  const w = 10 + OS.textW(label) + 4;
  const hov = io.hit(x, y - 1, w, 11);
  const X = io.ox + x, Y = io.oy + y;
  OS.rect(X, Y, 9, 9, P.snow); OS.frame(X, Y, 9, 9, P.ink);
  if (on) { OS.line(X + 2, Y + 4, X + 3, Y + 6, P.lake); OS.line(X + 3, Y + 6, X + 6, Y + 2, P.lake); OS.rect(X + 2, Y + 4, 1, 1, P.lake); }
  OS.text(label, X + 13, Y, hov ? P.lake : P.ink);
  if (hov) OS.cursor = 'hand';
  const c = io.click(x, y - 1, w, 11);
  if (c) OS.sfx.click();
  return c;
};

ui.bevel = (X, Y, w, h, bg = P.snow) => {
  OS.rect(X, Y, w, h, bg);
  OS.rect(X, Y, w, 1, P.stone); OS.rect(X, Y, 1, h, P.stone);
  OS.rect(X, Y + h - 1, w, 1, P.snow); OS.rect(X + w - 1, Y, 1, h, P.snow);
};

// Barra di scorrimento verticale. Restituisce il nuovo valore di scroll.
ui.scrollbar = (io, x, y, h, scroll, content, view, st) => {
  const max = Math.max(0, content - view);
  const X = io.ox + x, Y = io.oy + y;
  OS.rect(X, Y, 8, h, P.mist);
  OS.rect(X, Y, 1, h, P.ink);
  if (max <= 0) return 0;
  const th = Math.max(12, Math.floor(h * view / content));
  const ty = Math.round((h - th) * scroll / max);
  const hov = io.hit(x, y, 8, h);
  if (io.pressed && hov) {
    if (io.y - y >= ty && io.y - y < ty + th) st.thumb = { y0: io.y, s0: scroll };
    else scroll += (io.y - y < ty ? -view : view) * 0.9;
  }
  if (st.thumb && io.down) scroll = st.thumb.s0 + (io.y - st.thumb.y0) * max / Math.max(1, h - th);
  if (!io.down) st.thumb = null;
  OS.rect(X + 1, Y + ty, 7, th, st.thumb ? P.lake : hov ? P.lakeHi : P.stone);
  OS.frame(X + 1, Y + ty, 7, th, P.ink);
  OS.rect(X + 3, Y + ty + (th >> 1) - 2, 3, 1, P.snow);
  OS.rect(X + 3, Y + ty + (th >> 1), 3, 1, P.snow);
  OS.rect(X + 3, Y + ty + (th >> 1) + 2, 3, 1, P.snow);
  return OS.clamp(scroll, 0, max);
};

// Gestione comune di rotella, tastiera e trascinamento touch.
ui.scrollInput = (io, st, view, content, w) => {
  const max = Math.max(0, content - view);
  let s = st.scroll;
  if (io.wheel) s += io.wheel * 22;
  for (const k of io.keys) {
    if (k.key === 'ArrowDown') s += 12;
    else if (k.key === 'ArrowUp') s -= 12;
    else if (k.key === 'PageDown' || (k.key === ' ' && !st.noSpace)) s += view - 20;
    else if (k.key === 'PageUp') s -= view - 20;
    else if (k.key === 'Home') s = 0;
    else if (k.key === 'End') s = max;
  }
  if (io.pressed && io.hit(0, 0, w, view)) { st.drag = { y0: io.y, s0: s }; st.dragged = false; }
  if (st.drag && io.down) {
    const d = io.y - st.drag.y0;
    if (Math.abs(d) > 4) st.dragged = true;
    if (st.dragged && io.touch) s = st.drag.s0 - d;
  }
  if (!io.down && !io.released) { st.drag = null; }
  st.scroll = OS.clamp(s, 0, max);
};

/* ------------------------------------------------------------ vista documento */
// Blocchi: h1, h2, p, small, li, kv, link, btns, hr, sp, spr, level, chips, custom.
class DocView {
  constructor(build, o = {}) {
    this.build = build; this.scroll = 0; this.w = -1; this.lang = null;
    this.bg = o.bg || P.snow; this.pad = o.pad ?? 8; this.items = []; this.contentH = 0; this.st = { scroll: 0 };
  }
  invalidate() { this.w = -1; }
  layout(w) {
    const pad = this.pad, cw = w - pad * 2;
    let y = pad;
    const items = [];
    const add = (h, draw) => { items.push({ y, h, draw }); y += h; };
    for (const b of this.build(cw).filter(Boolean)) {
      if (b.h1 != null) {
        const sc = cw >= 150 ? 2 : 1;
        const lines = OS.wrap(b.h1, cw, sc);
        add(lines.length * CH * sc + 4, (X, Y) => lines.forEach((l, i) => OS.text(l, X, Y + i * CH * sc, b.c || P.lake, sc)));
      } else if (b.h2 != null) {
        y += 6;
        const lines = OS.wrap(b.h2, cw);
        add(lines.length * CH + 6, (X, Y) => {
          lines.forEach((l, i) => OS.text(l, X, Y + i * CH, b.c || P.ink));
          OS.rect(X, Y + lines.length * CH + 1, cw, 1, P.stone);
        });
      } else if (b.p != null || b.small != null) {
        const lines = OS.wrap(b.p ?? b.small, cw);
        const col = b.c || (b.small != null ? P.slate : P.ink);
        add(lines.length * CH + 4, (X, Y) => lines.forEach((l, i) => OS.text(l, X, Y + i * CH, col)));
      } else if (b.li != null) {
        const lines = OS.wrap(b.li, cw - 9);
        add(lines.length * CH + 2, (X, Y) => {
          OS.rect(X + 1, Y + 3, 3, 3, b.c || P.lakeHi);
          lines.forEach((l, i) => OS.text(l, X + 9, Y + i * CH, P.ink));
        });
      } else if (b.kv) {
        const [k, v] = b.kv.map(OS.tx);
        const kw = Math.min(90, Math.floor(cw * 0.42));
        if (cw >= 170) {
          const lines = OS.wrap(v, cw - kw);
          add(lines.length * CH + 3, (X, Y) => {
            OS.text(k, X, Y, P.slate);
            lines.forEach((l, i) => OS.text(l, X + kw, Y + i * CH, b.c || P.ink));
          });
        } else {
          const lines = OS.wrap(v, cw);
          add((lines.length + 1) * CH + 3, (X, Y) => {
            OS.text(k, X, Y, P.slate);
            lines.forEach((l, i) => OS.text(l, X, Y + (i + 1) * CH, b.c || P.ink));
          });
        }
      } else if (b.link != null) {
        const lines = OS.wrap(b.link, cw);
        add(lines.length * CH + 3, (X, Y, io) => {
          const w = Math.min(cw, Math.max(...lines.map((l) => OS.textW(l))));
          const hov = io.hit(0, -1, w, lines.length * CH + 1);
          lines.forEach((l, i) => {
            OS.text(l, X, Y + i * CH, hov ? P.red : P.lake);
            OS.rect(X, Y + i * CH + 8, OS.textW(l) - 1, 1, hov ? P.red : P.lakeHi);
          });
          if (hov) OS.cursor = 'hand';
          if (io.click(0, -1, w, lines.length * CH + 1)) { OS.sfx.click(); b.href ? OS.openUrl(b.href) : b.act?.(); }
        });
      } else if (b.btns) {
        let rows = [[]], rw = 0;
        for (const bt of b.btns) {
          const w = ui.buttonW(bt.label, bt) + 4;
          if (rw + w > cw && rows[rows.length - 1].length) { rows.push([]); rw = 0; }
          rows[rows.length - 1].push({ ...bt, x: rw }); rw += w;
        }
        add(rows.length * 17 + 2, (X, Y, io) => rows.forEach((row, ri) => row.forEach((bt) => {
          if (ui.button(io, bt.x, ri * 17 + 1, bt.label, bt)) bt.act();
        })));
      } else if (b.hr) {
        add(9, (X, Y) => { for (let x = 0; x < cw; x += 2) OS.px(X + x, Y + 4, P.stone); });
      } else if (b.sp != null) {
        y += b.sp;
      } else if (b.spr) {
        const s = OS.SPR[b.spr], sc = b.sc || 1;
        const h = (s ? s.height : 16) * sc;
        add(h + 4, (X, Y, io) => {
          const x = b.align === 'left' ? X : X + ((cw - (s ? s.width : 16) * sc) >> 1);
          OS.spr(b.spr, x, Y, sc);
          if (b.act && io.click(x - X, 0, (s ? s.width : 16) * sc, h)) b.act();
        });
      } else if (b.level) {
        const lv = b.level, order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const n = order.indexOf(lv.level) + 1;
        add(26, (X, Y) => {
          OS.text(OS.tx(lv.name), X, Y, P.ink);
          const tag = lv.native ? OS.L('madrelingua', 'native') : lv.level;
          OS.text(tag, X + cw - OS.textW(tag), Y, lv.native ? P.red : P.lake);
          const sw = Math.floor((cw - 5 * 2) / 6);
          for (let i = 0; i < 6; i++) {
            const x = X + i * (sw + 2);
            OS.rect(x, Y + 11, sw, 6, i < n ? (i >= 4 ? P.lake : i >= 2 ? P.lakeHi : P.sky) : P.mist);
            OS.frame(x, Y + 11, sw, 6, P.ink);
            if (sw >= 16) OS.textC(order[i], x + sw / 2, Y + 18, i < n ? P.slate : P.stone);
          }
        });
        if (cw / 6 >= 16) y += 8;
      } else if (b.chips) {
        let x = 0, row = 0;
        const pos = b.chips.map((c) => {
          const w = OS.textW(c.label) + 8;
          if (x + w > cw && x > 0) { x = 0; row++; }
          const p = { ...c, x, row, w }; x += w + 3; return p;
        });
        add((row + 1) * 14 + 2, (X, Y, io) => pos.forEach((c) => {
          const hov = c.act && io.hit(c.x, c.row * 14, c.w, 12);
          const bg = c.on ? P.lake : c.bg || (hov ? P.mist : P.snow);
          OS.rect(X + c.x, Y + c.row * 14, c.w, 12, bg);
          OS.frame(X + c.x, Y + c.row * 14, c.w, 12, c.border || P.ink);
          OS.text(c.label, X + c.x + 4, Y + c.row * 14 + 1, c.on ? P.snow : c.fg || P.ink);
          if (hov) OS.cursor = 'hand';
          if (c.act && io.click(c.x, c.row * 14, c.w, 12)) { OS.sfx.click(); c.act(); }
        }));
      } else if (b.custom) {
        const h = b.custom.h(cw);
        add(h, (X, Y, io) => b.custom.draw(X, Y, cw, io));
      }
    }
    this.items = items;
    this.contentH = y + pad;
  }
  draw(g, r, io) {
    const sbw = 8, w = r.w - sbw;
    if (w !== this.w || this.lang !== OS.settings.lang) { this.w = w; this.lang = OS.settings.lang; this.layout(w); }
    const st = this.st;
    ui.scrollInput(io, st, r.h, this.contentH, w);
    OS.rect(r.x, r.y, r.w, r.h, this.bg);
    OS.clip(r.x, r.y, w, r.h);
    const s = Math.round(st.scroll);
    const inView = () => io.y >= 0 && io.y < r.h && io.x < w && !st.dragged;
    for (const it of this.items) {
      const yy = it.y - s;
      if (yy + it.h < 0 || yy > r.h) continue;
      it.draw(r.x + this.pad, r.y + yy, ui.sub(io, this.pad, yy, inView));
    }
    OS.unclip();
    st.scroll = ui.scrollbar(io, w, 0, r.h, st.scroll, this.contentH, r.h, st);
  }
  top() { this.st.scroll = 0; }
}
ui.DocView = DocView;
})();
