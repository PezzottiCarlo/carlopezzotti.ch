/* Ceresio OS — giochi: Pizza Rider, Mattoni, Campo minato. */
(() => {
'use strict';
const OS = window.OS, P = OS.P, L = OS.L;

const DIRS = { ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0] };
const swipe = (io, st) => {
  if (io.pressed) st.sw = { x: io.x, y: io.y };
  if (st.sw && (io.down || io.released)) {
    const dx = io.x - st.sw.x, dy = io.y - st.sw.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 8) { st.sw = null; return Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]; }
  }
  if (!io.down) st.sw = null;
  return null;
};
function banner(r, lines) {
  const w = Math.min(r.w - 16, Math.max(...lines.map(([s]) => OS.textW(s))) + 16);
  const h = lines.length * 11 + 10;
  const x = r.x + ((r.w - w) >> 1), y = r.y + ((r.h - h) >> 1);
  OS.rect(x + 2, y + 2, w, h, P.ink);
  OS.rect(x, y, w, h, P.snow); OS.frame(x, y, w, h, P.ink);
  lines.forEach(([s, c], i) => OS.textC(s, x + w / 2, y + 6 + i * 11, c || P.ink));
}

/* ------------------------------------------------------------ Pizza Rider */
const SN = { cols: 22, rows: 15, cell: 7 };
OS.app('snake', {
  title: 'Pizza Rider', icon: 'pizza', pixel: true,
  w: SN.cols * SN.cell + 2, h: SN.rows * SN.cell + 12 + 14,
  make() {
    const st = { state: 'ready', best: OS.store.get('best.snake', 0) };
    const blocks = [];
    const reset = () => {
      blocks.length = 0;
      for (let i = 0; i < 4; i++) {
        const bx = 3 + Math.floor(Math.random() * (SN.cols - 7)), by = 2 + Math.floor(Math.random() * (SN.rows - 5));
        if (Math.abs(by - 7) < 2) continue;
        blocks.push([bx, by], [bx + 1, by]);
      }
      Object.assign(st, { body: [[6, 7], [5, 7], [4, 7]], dir: [1, 0], next: [1, 0], acc: 0, speed: 6, score: 0, grow: 0 });
      place();
    };
    const free = (x, y) => !st.body.some(([a, b]) => a === x && b === y) && !blocks.some(([a, b]) => a === x && b === y);
    const place = () => {
      let x, y, n = 0;
      do { x = Math.floor(Math.random() * SN.cols); y = Math.floor(Math.random() * SN.rows); n++; } while (!free(x, y) && n < 500);
      st.food = [x, y];
    };
    reset();
    return {
      draw(g, r, io) {
        const dt = 1 / 60;
        let d = null;
        for (const k of io.keys) {
          if (DIRS[k.key]) d = DIRS[k.key];
          if ((k.key === ' ' || k.key === 'Enter') && st.state !== 'play') { reset(); st.state = 'play'; OS.sfx.select(); }
          if (k.key === 'p' && st.state === 'play') st.state = 'pause';
          else if (k.key === 'p' && st.state === 'pause') st.state = 'play';
        }
        d = swipe(io, st) || d;
        if (io.click(0, 0, r.w, r.h) && st.state !== 'play' && !d) { reset(); st.state = 'play'; OS.sfx.select(); }
        if (d && st.state === 'play' && !(d[0] === -st.dir[0] && d[1] === -st.dir[1])) st.next = d;
        if (st.state === 'play') {
          st.acc += dt * st.speed;
          while (st.acc >= 1) {
            st.acc -= 1;
            st.dir = st.next;
            const [hx, hy] = st.body[0];
            const nx = (hx + st.dir[0] + SN.cols) % SN.cols, ny = (hy + st.dir[1] + SN.rows) % SN.rows;
            if (!free(nx, ny) && !(nx === st.body[st.body.length - 1][0] && ny === st.body[st.body.length - 1][1])) {
              st.state = 'over'; OS.sfx.die();
              if (st.score > st.best) { st.best = st.score; OS.store.set('best.snake', st.best); }
              break;
            }
            st.body.unshift([nx, ny]);
            if (nx === st.food[0] && ny === st.food[1]) {
              st.score++; st.grow += 1; st.speed = Math.min(14, st.speed + 0.35); OS.sfx.coin(); place();
              if (st.score >= 10) OS.unlock('pizza');
            }
            if (st.grow > 0) st.grow--; else st.body.pop();
          }
        }
        // Campo: strade di Lugano.
        const fx = r.x, fy = r.y + 12;
        OS.rect(r.x, r.y, r.w, 12, P.ink);
        OS.text(L('Consegne ', 'Deliveries ') + st.score, r.x + 3, r.y + 1, P.gold);
        const b = L('Record ', 'Best ') + st.best;
        OS.text(b, r.x + r.w - OS.textW(b) - 3, r.y + 1, P.stone);
        OS.rect(fx, fy, SN.cols * SN.cell, SN.rows * SN.cell, P.slate);
        for (let y = 0; y < SN.rows; y++) for (let x = 0; x < SN.cols; x++) if ((x + y) % 2 === 0) OS.px(fx + x * SN.cell + 3, fy + y * SN.cell + 3, '#66687c');
        for (const [x, y] of blocks) {
          OS.rect(fx + x * SN.cell, fy + y * SN.cell, SN.cell, SN.cell, P.rose);
          OS.rect(fx + x * SN.cell, fy + y * SN.cell, SN.cell, 2, P.red);
          OS.px(fx + x * SN.cell + 3, fy + y * SN.cell + 4, P.gold);
        }
        const [ox, oy] = st.food;
        const blink = Math.floor(OS.time * 4) % 2;
        OS.rect(fx + ox * SN.cell, fy + oy * SN.cell + 2, SN.cell, SN.cell - 2, P.snow);
        OS.rect(fx + ox * SN.cell - 1, fy + oy * SN.cell, SN.cell + 2, 3, P.red);
        OS.rect(fx + ox * SN.cell + 2, fy + oy * SN.cell + 4, 3, 3, blink ? P.gold : P.brown);
        st.body.forEach(([x, y], i) => {
          const X = fx + x * SN.cell, Y = fy + y * SN.cell;
          if (i === 0) {
            OS.rect(X, Y, SN.cell, SN.cell, P.red);
            OS.rect(X + 2, Y + 2, 3, 3, P.snow);
            OS.px(X + 3 + st.dir[0] * 2, Y + 3 + st.dir[1] * 2, P.ink);
          } else {
            OS.rect(X + 1, Y + 1, SN.cell - 2, SN.cell - 2, P.brown);
            OS.rect(X + 2, Y + 2, SN.cell - 4, SN.cell - 4, P.gold);
          }
        });
        if (st.state === 'ready') banner(r, [['Pizza Rider', P.red], [L('Consegna le pizze.', 'Deliver the pizzas.')], [OS.inp.touch ? L('Tocca e scorri', 'Tap, then swipe') : L('Spazio, poi frecce', 'Space, then arrows'), P.slate]]);
        if (st.state === 'over') banner(r, [[L('Pizza fredda!', 'Cold pizza!'), P.red], [L('Consegne: ', 'Deliveries: ') + st.score], [L('Spazio per riprovare', 'Space to retry'), P.slate]]);
        if (st.state === 'pause') banner(r, [[L('Pausa', 'Paused')]]);
      }
    };
  }
});

/* ------------------------------------------------------------ Mattoni */
const BR = { w: 160, h: 132 };
OS.app('bricks', {
  title: { it: 'Mattoni', en: 'Bricks' }, icon: 'bricks', pixel: true, w: BR.w + 2, h: BR.h + 12 + 14,
  make() {
    const st = { state: 'ready', level: 1, lives: 3, score: 0 };
    const COLS = [P.red, P.orange, P.gold, P.leaf, P.lakeHi];
    const build = () => {
      st.bricks = [];
      for (let y = 0; y < 5; y++) for (let x = 0; x < 8; x++) {
        if (st.level > 1 && (x + y + st.level) % 5 === 0) continue;
        st.bricks.push({ x: x * 20 + 1, y: 14 + y * 8, c: COLS[y], hp: st.level > 2 && y === 0 ? 2 : 1 });
      }
    };
    const serve = () => { st.px = BR.w / 2 - 12; st.ball = { x: BR.w / 2, y: BR.h - 14, vx: 0, vy: 0, stuck: true }; };
    build(); serve();
    return {
      draw(g, r, io) {
        const dt = 1 / 60;
        const fx = r.x, fy = r.y + 12;
        let launch = false;
        for (const k of io.keys) if (k.key === ' ' || k.key === 'Enter') launch = true;
        if (io.held.ArrowLeft) st.px -= 150 * dt;
        if (io.held.ArrowRight) st.px += 150 * dt;
        if (io.inside && (io.touch ? io.down : true) && io.y > 12) st.px = io.x - 12;
        if (io.click(0, 0, r.w, r.h)) launch = true;
        st.px = OS.clamp(st.px, 0, BR.w - 24);
        const b = st.ball;
        if (launch) {
          if (st.state === 'over' || st.state === 'win') { Object.assign(st, { level: st.state === 'win' ? st.level + 1 : 1, lives: st.state === 'win' ? st.lives : 3, score: st.state === 'win' ? st.score : 0 }); build(); serve(); st.state = 'ready'; }
          else if (b.stuck) { const sp = 90 + st.level * 12; b.vx = sp * 0.55 * (Math.random() < 0.5 ? -1 : 1); b.vy = -sp; b.stuck = false; st.state = 'play'; OS.sfx.hit(); }
        }
        if (b.stuck) { b.x = st.px + 12; b.y = BR.h - 14; }
        else if (st.state === 'play') {
          const steps = 3;
          for (let s = 0; s < steps; s++) {
            b.x += b.vx * dt / steps; b.y += b.vy * dt / steps;
            if (b.x < 1) { b.x = 1; b.vx = Math.abs(b.vx); OS.sfx.hit(); }
            if (b.x > BR.w - 2) { b.x = BR.w - 2; b.vx = -Math.abs(b.vx); OS.sfx.hit(); }
            if (b.y < 1) { b.y = 1; b.vy = Math.abs(b.vy); OS.sfx.hit(); }
            if (b.vy > 0 && b.y >= BR.h - 10 && b.y <= BR.h - 6 && b.x >= st.px - 2 && b.x <= st.px + 26) {
              const k = (b.x - (st.px + 12)) / 13;
              const sp = Math.hypot(b.vx, b.vy) * 1.01;
              b.vx = sp * k * 0.85; b.vy = -Math.sqrt(Math.max(sp * sp - b.vx * b.vx, sp * sp * 0.25));
              OS.sfx.hit();
            }
            for (const br of st.bricks) {
              if (br.hp <= 0) continue;
              if (b.x + 1 >= br.x && b.x - 1 <= br.x + 18 && b.y + 1 >= br.y && b.y - 1 <= br.y + 6) {
                br.hp--; st.score += 10; OS.sfx.brick();
                const ox = Math.min(b.x - br.x, br.x + 18 - b.x), oy = Math.min(b.y - br.y, br.y + 6 - b.y);
                if (ox < oy) b.vx = -b.vx; else b.vy = -b.vy;
                break;
              }
            }
            if (b.y > BR.h + 4) {
              st.lives--; OS.sfx.die();
              if (st.lives <= 0) st.state = 'over'; else { serve(); st.state = 'ready'; }
              break;
            }
          }
          if (st.bricks.every((x) => x.hp <= 0)) { st.state = 'win'; OS.sfx.win(); OS.unlock('bricks'); }
        }
        OS.rect(r.x, r.y, r.w, 12, P.ink);
        OS.text(String(st.score).padStart(5, '0'), r.x + 3, r.y + 1, P.gold);
        OS.text(L('Liv ', 'Lv ') + st.level, r.x + 50, r.y + 1, P.stone);
        for (let i = 0; i < st.lives; i++) OS.rect(r.x + r.w - 10 - i * 8, r.y + 4, 6, 3, P.lakeHi);
        OS.rect(fx, fy, BR.w, BR.h, P.night);
        for (let i = 0; i < 30; i++) OS.px(fx + OS.hash(i) * BR.w, fy + OS.hash(i * 3) * BR.h, P.lake);
        for (const br of st.bricks) {
          if (br.hp <= 0) continue;
          OS.rect(fx + br.x, fy + br.y, 18, 6, br.hp > 1 ? P.stone : br.c);
          OS.rect(fx + br.x, fy + br.y + 5, 18, 1, P.ink);
          OS.rect(fx + br.x, fy + br.y, 18, 1, P.snow);
        }
        OS.rect(fx + st.px, fy + BR.h - 8, 24, 4, P.snow);
        OS.rect(fx + st.px, fy + BR.h - 5, 24, 1, P.stone);
        OS.rect(fx + st.px + 2, fy + BR.h - 8, 3, 3, P.red);
        OS.rect(fx + st.px + 19, fy + BR.h - 8, 3, 3, P.red);
        OS.rect(fx + b.x - 1, fy + b.y - 1, 3, 3, P.gold);
        if (st.state === 'ready' && b.stuck && st.score === 0 && st.level === 1) banner(r, [[L('Mattoni', 'Bricks'), P.red], [OS.inp.touch ? L('Tocca per lanciare', 'Tap to launch') : L('Spazio o clic per lanciare', 'Space or click to launch'), P.slate]]);
        if (st.state === 'over') banner(r, [['Game over', P.red], [L('Punti: ', 'Score: ') + st.score], [L('Clic per ricominciare', 'Click to restart'), P.slate]]);
        if (st.state === 'win') banner(r, [[L('Livello completato!', 'Level cleared!'), P.pine], [L('Clic per il prossimo', 'Click for the next one'), P.slate]]);
      }
    };
  }
});

/* ------------------------------------------------------------ Campo minato */
const MS = { n: 9, mines: 10, cell: 12 };
OS.app('mines', {
  title: { it: 'Campo minato', en: 'Minesweeper' }, icon: 'bomb', pixel: true,
  w: MS.n * MS.cell + 12, h: MS.n * MS.cell + 14 + 36,
  make() {
    const st = {};
    const reset = () => Object.assign(st, { grid: Array.from({ length: MS.n * MS.n }, () => ({ m: false, open: false, flag: false, n: 0 })), state: 'ready', t0: 0, time: 0, flagMode: false, first: true, boom: -1 });
    reset();
    const idx = (x, y) => y * MS.n + x;
    const around = (x, y) => { const o = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if ((dx || dy) && nx >= 0 && ny >= 0 && nx < MS.n && ny < MS.n) o.push([nx, ny]); } return o; };
    const seed = (sx, sy) => {
      let k = 0;
      while (k < MS.mines) {
        const x = Math.floor(Math.random() * MS.n), y = Math.floor(Math.random() * MS.n);
        if (st.grid[idx(x, y)].m || (Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1)) continue;
        st.grid[idx(x, y)].m = true; k++;
      }
      for (let y = 0; y < MS.n; y++) for (let x = 0; x < MS.n; x++) st.grid[idx(x, y)].n = around(x, y).filter(([a, b]) => st.grid[idx(a, b)].m).length;
    };
    const open = (x, y) => {
      const c = st.grid[idx(x, y)];
      if (c.open || c.flag) return;
      if (st.first) { seed(x, y); st.first = false; st.state = 'play'; st.t0 = OS.time; }
      c.open = true;
      if (c.m) { st.state = 'lost'; st.boom = idx(x, y); OS.sfx.boom(); OS.shake = 0.4; return; }
      if (c.n === 0) around(x, y).forEach(([a, b]) => open(a, b));
    };
    const NUMC = [null, P.lake, P.pine, P.red, P.night, P.brown, P.lakeHi, P.ink, P.slate];
    return {
      draw(g, r, io) {
        if (st.state === 'play') st.time = Math.min(999, Math.floor(OS.time - st.t0));
        const left = MS.mines - st.grid.filter((c) => c.flag).length;
        // Intestazione.
        OS.rect(r.x, r.y, r.w, 26, P.stone);
        OS.rect(r.x + 4, r.y + 5, 26, 14, P.ink); OS.text(String(Math.max(0, left)).padStart(3, '0'), r.x + 6, r.y + 7, P.red);
        OS.rect(r.x + r.w - 30, r.y + 5, 26, 14, P.ink); OS.text(String(st.time).padStart(3, '0'), r.x + r.w - 28, r.y + 7, P.red);
        const fcx = (r.w >> 1) - 7;
        const face = st.state === 'lost' ? 'x' : st.state === 'won' ? 'w' : 'o';
        OS.rect(r.x + fcx, r.y + 5, 14, 14, P.gold); OS.frame(r.x + fcx, r.y + 5, 14, 14, P.ink);
        OS.px(r.x + fcx + 4, r.y + 9, P.ink); OS.px(r.x + fcx + 9, r.y + 9, P.ink);
        if (face === 'w') { OS.rect(r.x + fcx + 3, r.y + 9, 8, 1, P.ink); }
        if (face === 'x') OS.rect(r.x + fcx + 4, r.y + 14, 6, 1, P.ink); else { OS.rect(r.x + fcx + 4, r.y + 14, 6, 1, P.ink); OS.px(r.x + fcx + 3, r.y + 13, P.ink); OS.px(r.x + fcx + 10, r.y + 13, P.ink); }
        if (io.click(fcx, 5, 14, 14)) { reset(); OS.sfx.select(); }
        const flx = fcx + 20;
        if (OS.inp.touch || st.flagMode) {
          OS.rect(r.x + flx, r.y + 5, 14, 14, st.flagMode ? P.red : P.snow); OS.frame(r.x + flx, r.y + 5, 14, 14, P.ink);
          OS.rect(r.x + flx + 5, r.y + 8, 1, 8, P.ink); OS.rect(r.x + flx + 6, r.y + 8, 4, 3, st.flagMode ? P.snow : P.red);
          if (io.click(flx, 5, 14, 14)) { st.flagMode = !st.flagMode; OS.sfx.click(); }
        }
        // Griglia.
        const gx = 6, gy = 30;
        for (let y = 0; y < MS.n; y++) for (let x = 0; x < MS.n; x++) {
          const c = st.grid[idx(x, y)];
          const X = r.x + gx + x * MS.cell, Y = r.y + gy + y * MS.cell;
          const hov = io.hit(gx + x * MS.cell, gy + y * MS.cell, MS.cell, MS.cell) && st.state !== 'lost' && st.state !== 'won';
          if (c.open) {
            OS.rect(X, Y, MS.cell, MS.cell, idx(x, y) === st.boom ? P.red : P.mist);
            OS.frame(X, Y, MS.cell + 1, MS.cell + 1, P.stone);
            if (c.m) { OS.disc(X + 6, Y + 6, 3, P.ink); OS.px(X + 5, Y + 5, P.snow); }
            else if (c.n) OS.text(String(c.n), X + 4, Y + 2, NUMC[c.n]);
          } else {
            OS.rect(X, Y, MS.cell, MS.cell, hov ? P.sky : P.stone);
            OS.rect(X, Y, MS.cell, 1, P.snow); OS.rect(X, Y, 1, MS.cell, P.snow);
            OS.rect(X, Y + MS.cell - 1, MS.cell, 1, P.slate); OS.rect(X + MS.cell - 1, Y, 1, MS.cell, P.slate);
            if (c.flag) { OS.rect(X + 5, Y + 3, 1, 7, P.ink); OS.rect(X + 6, Y + 3, 3, 3, P.red); }
            if (st.state === 'lost' && c.m && !c.flag) OS.disc(X + 6, Y + 6, 2, P.slate);
          }
          if (st.state === 'lost' || st.state === 'won') continue;
          const tapped = io.click(gx + x * MS.cell, gy + y * MS.cell, MS.cell, MS.cell);
          const longp = io.down && io.touch && io.pressIn(gx + x * MS.cell, gy + y * MS.cell, MS.cell, MS.cell) && performance.now() - OS.inp.downAt > 450 && !st.lp;
          if (longp) st.lp = true;
          if ((io.rpressed && hov) || longp || (tapped && st.flagMode)) { if (!c.open) { c.flag = !c.flag; OS.sfx.click(); } }
          else if (tapped && !st.lp) { open(x, y); OS.sfx.click(); }
        }
        if (!io.down) st.lp = false;
        if (st.state === 'play' && st.grid.every((c) => c.m || c.open)) {
          st.state = 'won'; OS.sfx.win(); OS.unlock('mines');
          st.grid.forEach((c) => { if (c.m) c.flag = true; });
        }
      }
    };
  }
});
})();
