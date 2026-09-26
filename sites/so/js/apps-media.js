/* Ceresio OS — Giradischi, Pittura, Orologio da stazione. */
(() => {
'use strict';
const OS = window.OS, P = OS.P, L = OS.L;

const thick = (x0, y0, x1, y1, w, c) => {
  const a = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
  for (let i = -w / 2; i <= w / 2; i += 0.5) OS.line(x0 + Math.cos(a) * i, y0 + Math.sin(a) * i, x1 + Math.cos(a) * i, y1 + Math.sin(a) * i, c);
};

/* ------------------------------------------------------------ Giradischi */
OS.app('music', {
  title: { it: 'Giradischi', en: 'Turntable' }, icon: 'vinyl', w: 250, h: 150, pixel: true,
  make() {
    const st = { ang: 0, spd: 0, scratch: null, lastSfx: 0 };
    return {
      draw(g, r, io) {
        const dt = 1 / 60;
        const playing = !!OS.music.playing;
        // Plancia.
        const px = r.x + 4, py = r.y + 4, pw = 124, ph = r.h - 8;
        OS.rect(px, py, pw, ph, P.brown);
        OS.frame(px, py, pw, ph, P.ink);
        for (let y = py + 3; y < py + ph - 2; y += 5) OS.rect(px + 2, y, pw - 4, 1, '#6a4028');
        const cx = px + 56, cy = py + (ph >> 1), R = Math.min(50, (ph >> 1) - 5);
        OS.disc(cx, cy, R + 2, P.slate);
        OS.disc(cx, cy, R, P.ink);
        for (let rr = 16; rr < R - 2; rr += 4) OS.ring(cx, cy, rr, '#2e2939');
        // Riflesso che gira.
        const target = playing && !st.scratch ? 3.5 : 0;
        st.spd += (target - st.spd) * Math.min(1, dt * 3);
        if (!st.scratch) st.ang += st.spd * dt;
        for (let k = 0; k < 2; k++) {
          const a = st.ang + k * Math.PI;
          OS.line(cx + Math.cos(a) * 17, cy + Math.sin(a) * 17, cx + Math.cos(a) * (R - 3), cy + Math.sin(a) * (R - 3), P.slate);
        }
        OS.disc(cx, cy, 14, P.red);
        const la = st.ang;
        OS.rect(cx + Math.cos(la) * 8 - 1, cy + Math.sin(la) * 8 - 1, 3, 3, P.gold);
        OS.text('CP', cx - 5, cy - 4, P.snow);
        OS.disc(cx, cy, 1, P.stone);
        // Braccio.
        const ax = px + pw - 12, ay = py + 12;
        OS.disc(ax, ay, 5, P.stone); OS.disc(ax, ay, 2, P.ink);
        const armA = playing ? 2.05 : 1.72;
        const ex = ax + Math.cos(armA) * (R + 4), ey = ay + Math.sin(armA) * (R + 4);
        thick(ax, ay, ex, ey, 2, P.mist);
        OS.rect(ex - 3, ey - 2, 6, 5, P.snow); OS.frame(ex - 3, ey - 2, 6, 5, P.ink);
        // Scratch: trascina il disco.
        const lx = io.x - (cx - r.x), ly = io.y - (cy - r.y);
        const onRec = Math.hypot(lx, ly) < R;
        if (onRec && io.inside) OS.cursor = 'hand';
        if (io.pressed && onRec) st.scratch = { a: Math.atan2(ly, lx) };
        if (st.scratch && io.down) {
          const a = Math.atan2(ly, lx);
          let d = a - st.scratch.a;
          if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
          st.ang += d; st.scratch.a = a;
          if (Math.abs(d) > 0.12 && OS.time - st.lastSfx > 0.09) {
            st.lastSfx = OS.time; OS.sfx.scratch();
            st.scr = (st.scr || 0) + Math.abs(d);
            if (st.scr > 6) OS.unlock('dj');
          }
        }
        if (!io.down) st.scratch = null;

        // Lato destro: brani e visualizzatore.
        const rx = px + pw + 6, rw = r.x + r.w - rx - 4;
        OS.text(L('Brani', 'Tracks'), rx, r.y + 4, P.slate);
        OS.music.tracks.forEach((t, i) => {
          const on = OS.music.playing?.id === t.id;
          const y = r.y + 16 + i * 15;
          const lbl = (on ? '♪ ' : '') + t.title;
          if (OS.ui.button(io, rx - r.x, y - r.y, lbl.slice(0, Math.floor((rw - 8) / OS.CW)), { w: rw, on })) {
            if (on) OS.music.stop(); else OS.music.play(t.id);
          }
        });
        const vy = r.y + 16 + OS.music.tracks.length * 15 + 4, vh = r.y + r.h - vy - 4;
        OS.rect(rx, vy, rw, vh, P.night);
        const lv = OS.sfx.levels();
        const bars = Math.max(4, Math.floor(rw / 7));
        for (let i = 0; i < bars; i++) {
          const v = playing && lv ? lv[Math.min(lv.length - 1, 1 + i * 2)] / 255 : 0.05 + 0.03 * Math.sin(OS.time * 2 + i);
          const h = Math.max(1, Math.round(v * (vh - 4)));
          for (let y = 0; y < h; y += 2) OS.rect(rx + 2 + i * 7, vy + vh - 2 - y, 5, 1, y > vh * 0.7 ? P.red : y > vh * 0.45 ? P.gold : P.leaf);
        }
        if (!OS.sfx.ready) OS.textC(L('Tocca per l\'audio', 'Tap for audio'), rx + rw / 2, vy + 4, P.slate);
      },
      close() { OS.music.stop(); }
    };
  }
});

/* ------------------------------------------------------------ Pittura */
const PW = 96, PH = 64;
OS.app('paint', {
  title: { it: 'Pittura', en: 'Paint' }, icon: 'paint', w: 238, h: 176, minW: 150, minH: 120,
  make() {
    const img = new Uint8Array(PW * PH).fill(6);
    const cv = document.createElement('canvas'); cv.width = PW; cv.height = PH;
    const cvx = cv.getContext('2d'), id = cvx.createImageData(PW, PH);
    const RGB16 = OS.PAL16.map(OS.rgb);
    const used = new Set();
    const st = { col: 0, tool: 'pen', last: null };
    const TOOLS = ['pen', 'fill', 'erase', 'clear', 'save'];
    const fillAt = (x, y, c) => {
      const t = img[y * PW + x];
      if (t === c) return;
      const q = [[x, y]];
      while (q.length) {
        const [a, b] = q.pop();
        if (a < 0 || b < 0 || a >= PW || b >= PH || img[b * PW + a] !== t) continue;
        img[b * PW + a] = c;
        q.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]);
      }
    };
    const plot = (x, y, c) => { if (x >= 0 && y >= 0 && x < PW && y < PH) img[y * PW + x] = c; };
    const save = () => {
      const c = document.createElement('canvas'); c.width = PW * 4; c.height = PH * 4;
      const x = c.getContext('2d');
      for (let i = 0; i < PW * PH; i++) { x.fillStyle = OS.PAL16[img[i]]; x.fillRect((i % PW) * 4, Math.floor(i / PW) * 4, 4, 4); }
      const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'ceresio-pittura.png'; a.click();
    };
    return {
      draw(g, r, io) {
        const tw = 22;
        const sc = Math.max(1, Math.floor(Math.min((r.w - tw - 8) / PW, (r.h - 24) / PH)));
        const cx = r.x + tw + 4 + Math.floor((r.w - tw - 8 - PW * sc) / 2), cy = r.y + 3;
        OS.rect(r.x, r.y, r.w, r.h, P.stone);
        // Strumenti.
        TOOLS.forEach((t, i) => {
          const x = 3, y = 3 + i * 18;
          const on = st.tool === t;
          const hov = io.hit(x, y, 16, 16);
          OS.rect(r.x + x, r.y + y, 16, 16, on ? P.lake : hov ? P.mist : P.snow);
          OS.frame(r.x + x, r.y + y, 16, 16, P.ink);
          const X = r.x + x, Y = r.y + y, ic = on ? P.snow : P.ink;
          if (t === 'pen') { OS.line(X + 4, Y + 11, X + 11, Y + 4, ic); OS.line(X + 5, Y + 12, X + 12, Y + 5, ic); OS.px(X + 3, Y + 12, P.red); }
          if (t === 'fill') { OS.frame(X + 4, Y + 6, 7, 7, ic); OS.rect(X + 5, Y + 9, 5, 3, P.lakeHi); OS.rect(X + 11, Y + 9, 1, 3, P.lakeHi); }
          if (t === 'erase') { OS.rect(X + 4, Y + 6, 8, 5, P.rose); OS.frame(X + 4, Y + 6, 8, 5, ic); }
          if (t === 'clear') { OS.line(X + 4, Y + 4, X + 11, Y + 11, P.red); OS.line(X + 11, Y + 4, X + 4, Y + 11, P.red); }
          if (t === 'save') { OS.rect(X + 4, Y + 4, 8, 8, ic); OS.rect(X + 6, Y + 4, 4, 3, on ? P.lake : P.snow); OS.rect(X + 5, Y + 9, 6, 3, on ? P.lake : P.snow); }
          if (hov) OS.cursor = 'hand';
          if (io.click(x, y, 16, 16)) {
            OS.sfx.click();
            if (t === 'clear') img.fill(6);
            else if (t === 'save') save();
            else st.tool = t;
          }
        });
        // Tela.
        OS.rect(cx - 1, cy - 1, PW * sc + 2, PH * sc + 2, P.ink);
        for (let i = 0; i < PW * PH; i++) {
          const c = RGB16[img[i]];
          id.data[i * 4] = c[0]; id.data[i * 4 + 1] = c[1]; id.data[i * 4 + 2] = c[2]; id.data[i * 4 + 3] = 255;
        }
        cvx.putImageData(id, 0, 0);
        g.drawImage(cv, cx, cy, PW * sc, PH * sc);
        const lx = Math.floor((io.x - (cx - r.x)) / sc), ly = Math.floor((io.y - (cy - r.y)) / sc);
        const inCanvas = lx >= 0 && ly >= 0 && lx < PW && ly < PH;
        if (inCanvas && io.inside) OS.frame(cx + lx * sc - 1, cy + ly * sc - 1, sc + 2, sc + 2, P.ink);
        if (io.down && io.pressIn(cx - r.x, cy - r.y, PW * sc, PH * sc) && inCanvas) {
          const c = st.tool === 'erase' ? 6 : st.col;
          if (st.tool === 'fill') { if (io.pressed) { fillAt(lx, ly, c); used.add(c); } }
          else {
            const [x0, y0] = st.last || [lx, ly];
            const n = Math.max(Math.abs(lx - x0), Math.abs(ly - y0), 1);
            for (let k = 0; k <= n; k++) plot(Math.round(x0 + (lx - x0) * k / n), Math.round(y0 + (ly - y0) * k / n), c);
            st.last = [lx, ly];
            if (st.tool === 'pen') used.add(c);
          }
          if (used.size >= 8) OS.unlock('paint');
        }
        if (!io.down) st.last = null;
        // Palette.
        const sw = Math.max(6, Math.min(12, Math.floor((r.w - tw - 8) / 16)));
        const py = r.y + r.h - sw - 3, px0 = r.x + tw + 4;
        OS.PAL16.forEach((c, i) => {
          const x = px0 + i * sw;
          OS.rect(x, py, sw, sw, c);
          OS.frame(x, py, sw, sw, i === st.col ? P.snow : P.ink);
          if (i === st.col) OS.frame(x + 1, py + 1, sw - 2, sw - 2, P.ink);
          if (io.click(x - r.x, py - r.y, sw, sw)) { st.col = i; if (st.tool === 'erase') st.tool = 'pen'; OS.sfx.click(); }
        });
      }
    };
  }
});

/* ------------------------------------------------------------ Orologio da stazione */
OS.app('clock', {
  title: { it: 'Orologio', en: 'Clock' }, icon: 'clock', w: 150, h: 176, minW: 100, minH: 110,
  make() {
    OS.unlock('clock');
    return {
      draw(g, r) {
        OS.rect(r.x, r.y, r.w, r.h, P.mist);
        const R = Math.floor(Math.min(r.w - 8, r.h - 26) / 2);
        const cx = r.x + (r.w >> 1), cy = r.y + 4 + R;
        OS.disc(cx, cy, R + 2, P.ink);
        OS.disc(cx, cy, R, P.snow);
        for (let i = 0; i < 60; i++) {
          const a = i / 60 * Math.PI * 2 - Math.PI / 2;
          const hour = i % 5 === 0;
          const r0 = R - (hour ? Math.max(4, R * 0.2) : 2), r1 = R - 2;
          if (hour) thick(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, R > 40 ? 2 : 1, P.ink);
          else OS.line(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, P.ink);
        }
        const now = new Date();
        const lt = OS.luganoTime(now);
        const secF = lt.s + now.getMilliseconds() / 1000;
        // Come gli orologi delle stazioni svizzere: la lancetta rossa fa il giro in 58,5 s e aspetta sul 12.
        const secA = Math.min(1, secF / 58.5) * Math.PI * 2 - Math.PI / 2;
        const minA = lt.m / 60 * Math.PI * 2 - Math.PI / 2;
        const hrA = ((lt.h % 12) + lt.m / 60) / 12 * Math.PI * 2 - Math.PI / 2;
        thick(cx - Math.cos(hrA) * R * 0.2, cy - Math.sin(hrA) * R * 0.2, cx + Math.cos(hrA) * R * 0.62, cy + Math.sin(hrA) * R * 0.62, Math.max(2, R / 12), P.ink);
        thick(cx - Math.cos(minA) * R * 0.2, cy - Math.sin(minA) * R * 0.2, cx + Math.cos(minA) * R * 0.9, cy + Math.sin(minA) * R * 0.9, Math.max(2, R / 16), P.ink);
        OS.line(cx - Math.cos(secA) * R * 0.3, cy - Math.sin(secA) * R * 0.3, cx + Math.cos(secA) * R * 0.66, cy + Math.sin(secA) * R * 0.66, P.red);
        OS.disc(cx + Math.cos(secA) * R * 0.66, cy + Math.sin(secA) * R * 0.66, Math.max(2, Math.round(R / 12)), P.red);
        OS.disc(cx, cy, 1, P.red);
        OS.textC('Lugano ' + OS.pad(lt.h) + ':' + OS.pad(lt.m) + ':' + OS.pad(lt.s), r.x + r.w / 2, r.y + r.h - 13, P.ink);
      }
    };
  }
});
})();
