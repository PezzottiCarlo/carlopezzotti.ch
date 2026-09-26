/* Ceresio OS — avvio: POST del BIOS, setup nascosto, caricamento reale delle risorse. */
(() => {
'use strict';
const OS = window.OS, P = OS.P, L = OS.L;

// Moduli caricati dal loader, in ordine. Ogni modulo può registrare task in OS.tasks.
const FILES = [
  'js/data.js', 'js/sprites.js', 'js/wallpaper.js', 'js/ui.js', 'js/wm.js',
  'js/apps-cv.js', 'js/apps-terminal.js', 'js/apps-games.js', 'js/apps-media.js',
  'js/apps-system.js', 'js/files.js', 'js/eggs.js'
];
OS.tasks = [];

/* ------------------------------------------------------------ BIOS */
const bios = {
  t: 0, mem: 0, lines: [], idx: 0, setupAsked: false,
  script() {
    const net = navigator.onLine;
    const lt = OS.luganoTime();
    const touch = matchMedia('(pointer: coarse)').matches;
    return [
      [0.0, 'Ceresio-8 BIOS v1.26, (C) 1998-2026 Carlo Pezzotti', P.snow],
      [0.15, L('Processore: LLP-8 Lago Lugano @ 1.79 MHz', 'CPU: LLP-8 Lake Lugano @ 1.79 MHz'), P.stone],
      [0.3, 'MEM', P.stone],
      [1.3, L('Tastiera ............ OK', 'Keyboard ............ OK'), P.stone],
      [1.45, (touch ? L('Schermo tattile ..... OK', 'Touch screen ........ OK') : 'Mouse ............... OK'), P.stone],
      [1.6, L('Audio ............... PSG a 4 voci', 'Audio ............... 4-voice PSG'), P.stone],
      [1.75, L('Rete ................ ', 'Network ............. ') + (net ? 'OK' : L('assente', 'offline')), net ? P.stone : P.orange],
      [1.9, L('Orologio ............ ', 'Clock ............... ') + OS.pad(lt.h) + ':' + OS.pad(lt.m) + ' Europe/Zurich', P.stone],
      [2.1, '', P.stone],
      [2.2, L('Avvio da C:\\CERESIO ...', 'Booting from C:\\CERESIO ...'), P.gold]
    ];
  },
  enter() {
    this.t = 0; this.mem = 0; this.idx = 0; this.lines = this.script();
    this.end = OS.settings.fastBoot ? 1.2 : 3.0;
    if (OS.settings.fastBoot) this.lines.forEach((l) => { l[0] *= 0.35; });
  },
  update(dt) {
    this.t += dt;
    while (this.idx < this.lines.length && this.lines[this.idx][0] <= this.t) {
      this.idx++;
      OS.sfx.click();
    }
    const memT = OS.settings.fastBoot ? 0.35 : 1.0;
    this.mem = Math.min(65536, Math.floor(65536 * OS.clamp((this.t - 0.1) / memT, 0, 1)));
    const inp = OS.inp;
    for (const k of inp.keys) {
      if (k.key === 'Delete' || k.key === 'F2') this.setupAsked = true;
      if (k.key === 'Escape' || k.key === ' ') this.t = Math.max(this.t, this.end);
    }
    if (inp.released && inp.y > OS.scr.H - 14) this.setupAsked = true;
    if (this.t >= this.end && !this.left) {
      this.left = true;
      if (this.setupAsked) { OS.unlock('bios'); OS.fade(() => OS.setScene(setup), 0.3); }
      else OS.fade(() => OS.setScene(loader), 0.4);
    }
  },
  draw(g) {
    const { W, H } = OS.scr;
    OS.rect(0, 0, W, H, '#000');
    // Emblema: sole sopra il lago, in alto a destra.
    const ex = W - 44, ey = 6;
    OS.rect(ex, ey, 38, 24, P.night);
    OS.disc(ex + 26, ey + 9, 5, P.gold);
    for (let i = 0; i < 5; i++) OS.rect(ex + 3 + i * 3, ey + 18 - i * 2, 38 - 6 - i * 6, 1, P.pine);
    OS.rect(ex, ey + 18, 38, 6, P.lake);
    OS.rect(ex + 6, ey + 20, 10, 1, P.lakeHi); OS.rect(ex + 20, ey + 22, 12, 1, P.lakeHi);
    OS.text('Ceresio', ex - 1, ey + 26, P.lakeHi);
    let y = 6;
    for (let i = 0; i < this.idx; i++) {
      const [, txt, col] = this.lines[i];
      const s = txt === 'MEM' ? L('Memoria: ', 'Memory:  ') + String(this.mem).padStart(5, ' ') + 'K' + (this.mem >= 65536 ? ' OK' : '') : txt;
      OS.text(s, 6, y, col);
      y += 11;
    }
    if (Math.floor(OS.time * 3) % 2) OS.rect(6, y, 5, 9, P.stone);
    const hint = OS.inp.touch || matchMedia('(pointer: coarse)').matches
      ? L('Tocca qui per il setup', 'Tap here for setup')
      : L('CANC o F2: setup    ESC: salta', 'DEL or F2: setup    ESC: skip');
    OS.rect(0, H - 13, W, 13, this.setupAsked ? P.lake : '#000');
    OS.text(this.setupAsked ? L('Setup in arrivo...', 'Entering setup...') : hint, 6, H - 11, this.setupAsked ? P.snow : P.slate);
  }
};

/* ------------------------------------------------------------ BIOS setup */
const setup = {
  sel: 0,
  opts() {
    const s = OS.settings;
    const tod = { auto: L('automatica', 'automatic'), dawn: L('alba', 'dawn'), day: L('giorno', 'day'), dusk: L('tramonto', 'dusk'), night: L('notte', 'night') };
    return [
      { k: L('Lingua', 'Language'), v: s.lang === 'it' ? 'Italiano' : 'English', act: () => { s.lang = s.lang === 'it' ? 'en' : 'it'; } },
      { k: L('Audio', 'Sound'), v: s.sound ? L('attivo', 'on') : L('muto', 'muted'), act: () => { s.sound = !s.sound; } },
      { k: L('Effetto CRT', 'CRT effect'), v: s.crt ? L('attivo', 'on') : L('spento', 'off'), act: () => { s.crt = !s.crt; } },
      { k: L('Ora del giorno', 'Time of day'), v: tod[s.tod], act: () => { const o = Object.keys(tod); s.tod = o[(o.indexOf(s.tod) + 1) % o.length]; } },
      { k: L('Avvio rapido', 'Fast boot'), v: s.fastBoot ? L('attivo', 'on') : L('spento', 'off'), act: () => { s.fastBoot = !s.fastBoot; } },
      { k: L('Salva ed esci', 'Save and exit'), v: '', act: () => this.exit() }
    ];
  },
  enter() { this.sel = 0; this.leaving = false; },
  exit() {
    if (this.leaving) return;
    this.leaving = true;
    OS.saveSettings();
    OS.fade(() => OS.setScene(loader), 0.4);
  },
  update() {
    const o = this.opts();
    for (const k of OS.inp.keys) {
      if (k.key === 'ArrowUp') this.sel = (this.sel + o.length - 1) % o.length;
      else if (k.key === 'ArrowDown' || k.key === 'Tab') this.sel = (this.sel + 1) % o.length;
      else if (['Enter', ' ', 'ArrowLeft', 'ArrowRight'].includes(k.key)) { o[this.sel].act(); OS.sfx.select(); }
      else if (k.key === 'F10' || k.key === 'Escape') this.exit();
      else continue;
      OS.sfx.click();
    }
    const i = OS.inp;
    if (i.released) {
      const row = Math.floor((i.y - 40) / 14);
      if (row >= 0 && row < o.length && i.x > 10 && i.x < OS.scr.W - 10) { this.sel = row; o[row].act(); OS.sfx.select(); }
    }
  },
  draw() {
    const { W, H } = OS.scr;
    OS.rect(0, 0, W, H, P.lake);
    OS.rect(0, 0, W, 13, P.stone);
    OS.textC(L('CERESIO BIOS - UTILITÀ DI CONFIGURAZIONE', 'CERESIO BIOS - SETUP UTILITY'), W / 2, 2, P.ink);
    OS.frame(6, 20, W - 12, H - 40, P.mist);
    OS.frame(8, 22, W - 16, H - 44, P.mist);
    OS.text(L('Impostazioni di sistema', 'System settings'), 16, 27, P.gold);
    this.opts().forEach((o, i) => {
      const y = 42 + i * 14;
      const on = i === this.sel;
      if (on) OS.rect(12, y - 2, W - 24, 13, P.mist);
      OS.text(o.k, 18, y, on ? P.lake : P.snow);
      if (o.v) OS.text('[' + o.v + ']', Math.max(130, W / 2), y, on ? P.red : P.gold);
    });
    OS.rect(0, H - 14, W, 14, P.stone);
    OS.text(L('↑↓ scegli  INVIO cambia  F10 salva', '↑↓ select  ENTER change  F10 save'), 6, H - 12, P.ink);
  }
};

/* ------------------------------------------------------------ loader */
const TIPS = [
  ['Scaldo il forno della pizzeria...', 'Heating up the pizza oven...'],
  ['Lucido gli stivali da sergente...', 'Polishing the sergeant boots...'],
  ['Conto i battelli sul Ceresio...', 'Counting the boats on the lake...'],
  ['Allineo i pixel uno per uno...', 'Aligning pixels one by one...'],
  ['Spiego a C# che ora faccio JavaScript...', 'Telling C# I do JavaScript now...'],
  ['Riavvolgo il vinile...', 'Rewinding the vinyl...'],
  ['Controllo che il San Salvatore sia ancora lì...', 'Checking San Salvatore is still there...']
];
const loader = {
  enter() {
    this.p = 0; this.shown = 0; this.label = ''; this.log = []; this.err = null; this.done = false; this.tip = 0; this.t = 0;
    this.run();
  },
  async run() {
    const fileShare = 0.55;
    try {
      for (let i = 0; i < FILES.length; i++) {
        const f = FILES[i];
        this.label = L('Carico ', 'Loading ') + f.replace('js/', '');
        const size = await loadScript(f, (frac) => { this.p = fileShare * (i + frac) / FILES.length; });
        this.log.push(f.replace('js/', '').padEnd(18, ' ') + (size / 1024).toFixed(1).padStart(5, ' ') + ' KB');
      }
      const tasks = OS.tasks;
      for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];
        this.label = OS.tx(t);
        const t0 = performance.now();
        let res = 'OK';
        try { res = (await t.run()) || 'OK'; } catch (e) { res = L('saltato', 'skipped'); console.warn(e); }
        const wait = (OS.settings.fastBoot ? 60 : 220) - (performance.now() - t0);
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        this.p = fileShare + (1 - fileShare) * (i + 1) / tasks.length;
        this.log.push(OS.tx(t).slice(0, 30).padEnd(31, ' ') + res);
      }
      this.p = 1;
      this.label = L('Pronto.', 'Ready.');
      await new Promise((r) => setTimeout(r, 350));
      this.done = true;
      OS.fade(() => OS.startDesktop(), 0.6);
    } catch (e) {
      console.error(e);
      this.err = e.message;
      OS.sfx.error();
    }
  },
  update(dt) {
    this.t += dt;
    this.shown += (this.p - this.shown) * Math.min(1, dt * 10);
    this.tip = Math.floor(this.t / 1.6) % TIPS.length;
    if (this.err && (OS.inp.released || OS.inp.keys.length)) location.reload();
  },
  draw() {
    const { W, H } = OS.scr;
    OS.rect(0, 0, W, H, P.night);
    const cy = Math.floor(H * 0.3);
    // Logo: montagna, sole e lago in 40x26.
    const lx = (W >> 1) - 20, ly = cy - 34;
    OS.disc(lx + 29, ly + 7, 4, P.gold);
    for (let i = 0; i < 14; i++) OS.rect(lx + 6 + i, ly + 18 - i, 28 - i * 2 > 0 ? 28 - i * 2 : 1, 1, i > 10 ? P.snow : P.pine);
    OS.rect(lx, ly + 18, 40, 8, P.lake);
    OS.rect(lx + 4, ly + 20, 12, 1, P.lakeHi); OS.rect(lx + 22, ly + 23, 14, 1, P.lakeHi);
    const sc = W >= 300 ? 3 : 2;
    OS.textC('Ceresio', W / 2, cy, P.snow, sc);
    OS.textC(L('il sistema operativo di Carlo Pezzotti', "Carlo Pezzotti's operating system"), W / 2, cy + CHs(sc) + 4, P.sky);

    const bw = Math.min(W - 40, 240), bx = (W - bw) >> 1, by = cy + CHs(sc) + 22;
    OS.frame(bx - 2, by - 2, bw + 4, 12, P.mist);
    const segs = Math.floor(bw / 6);
    const filled = Math.floor(this.shown * segs);
    for (let i = 0; i < filled; i++) OS.rect(bx + i * 6, by, 5, 8, i === filled - 1 && !this.done ? P.gold : P.lakeHi);
    OS.text(this.label, bx, by + 14, this.err ? P.red : P.snow);
    OS.text(Math.round(this.shown * 100) + '%', bx + bw - OS.textW('100%'), by + 14, P.stone);

    if (this.err) {
      OS.text(L('Errore: ', 'Error: ') + this.err, bx, by + 30, P.orange);
      OS.text(L('Tocca o premi un tasto per riprovare.', 'Tap or press a key to retry.'), bx, by + 42, P.snow);
      return;
    }
    const maxLines = Math.max(0, Math.floor((H - (by + 34) - 20) / 10));
    const lines = this.log.slice(-maxLines);
    lines.forEach((l, i) => OS.text(l, bx, by + 32 + i * 10, i === lines.length - 1 ? P.mist : P.slate));
    OS.textC(OS.tx({ it: TIPS[this.tip][0], en: TIPS[this.tip][1] }), W / 2, H - 14, P.slate);
    OS.cursor = 'wait';
  }
};
const CHs = (sc) => OS.CH * sc;

async function loadScript(path, onProgress) {
  const res = await fetch(path + '?v=' + OS.VERSION, { cache: 'no-cache' });
  if (!res.ok) throw new Error(path + ' (' + res.status + ')');
  const total = +res.headers.get('content-length') || 0;
  let text;
  let got = 0;
  if (res.body && res.body.getReader) {
    const reader = res.body.getReader();
    const chunks = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value); got += value.length;
      onProgress(total ? Math.min(0.95, got / total) : 0.5);
    }
    text = new TextDecoder().decode(await new Blob(chunks).arrayBuffer());
  } else {
    text = await res.text(); got = text.length;
  }
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = URL.createObjectURL(new Blob([text + '\n//# sourceURL=' + location.origin + '/' + path], { type: 'text/javascript' }));
    s.onload = resolve;
    s.onerror = () => reject(new Error(path));
    document.head.appendChild(s);
  });
  onProgress(1);
  return got;
}

/* ------------------------------------------------------------ errori fatali */
OS.panic = (err) => {
  if (OS.panicked) return;
  OS.panicked = true;
  const msg = String(err && err.message || err).slice(0, 60);
  OS.setScene({
    draw() {
      const { W, H } = OS.scr;
      OS.rect(0, 0, W, H, '#000');
      const on = Math.floor(OS.time * 2) % 2;
      OS.frame(8, 8, W - 16, 40, on ? P.red : '#000');
      OS.frame(9, 9, W - 18, 38, on ? P.red : '#000');
      OS.textC(L('Errore di sistema. Tocca per riavviare.', 'System error. Tap to restart.'), W / 2, 16, P.red);
      OS.textC(msg, W / 2, 30, P.red);
      if (OS.inp.released || OS.inp.keys.length) location.reload();
    }
  });
};

OS.boot = () => OS.setScene(bios);
OS.boot();
})();
