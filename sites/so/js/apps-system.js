/* Ceresio OS — cartelle, trofei, cestino, impostazioni, informazioni, dialoghi, note. */
(() => {
'use strict';
const OS = window.OS, P = OS.P, L = OS.L, tx = OS.tx;

/* ------------------------------------------------------------ cartelle */
const FOLDERS = {
  games: { title: { it: 'Giochi', en: 'Games' }, items: [
    { app: 'snake', icon: 'pizza', label: { it: 'Pizza Rider', en: 'Pizza Rider' } },
    { app: 'bricks', icon: 'bricks', label: { it: 'Mattoni', en: 'Bricks' } },
    { app: 'mines', icon: 'bomb', label: { it: 'Campo minato', en: 'Minesweeper' } }
  ] },
  tools: { title: { it: 'Accessori', en: 'Accessories' }, items: [
    { app: 'music', icon: 'vinyl', label: { it: 'Giradischi', en: 'Turntable' } },
    { app: 'paint', icon: 'paint', label: { it: 'Pittura', en: 'Paint' } },
    { icon: 'note', label: { it: 'Blocco note', en: 'Notepad' }, act: () => { const n = OS.fs.create('desk', 'file'); if (typeof n === 'string') OS.dialog({ title: L('Blocco note', 'Notepad'), icon: 'warn', text: n }); else OS.fs.open(n.id); } },
    { app: 'clock', icon: 'clock', label: { it: 'Orologio', en: 'Clock' } },
    { app: 'terminal', icon: 'term', label: { it: 'Terminale', en: 'Terminal' } },
    { app: 'settings', icon: 'gear', label: { it: 'Impostazioni', en: 'Settings' } },
    { app: 'sysinfo', icon: 'computer', label: { it: 'Informazioni', en: 'About' } }
  ] }
};
OS.app('folder', {
  title: (arg) => FOLDERS[arg]?.title || 'Cartella', icon: 'folder', w: 244, h: (arg) => { const n = FOLDERS[arg]?.items.length || 0; return n > 6 ? 158 : n > 3 ? 122 : 84; }, minW: 90, minH: 60,
  make(win, arg) {
    const f = FOLDERS[arg];
    let sel = -1;
    return {
      draw(g, r, io) {
        OS.rect(r.x, r.y, r.w, 11, P.mist);
        OS.text(f.items.length + L(' elementi', ' items'), r.x + 4, r.y + 1, P.slate);
        OS.rect(r.x, r.y + 11, r.w, 1, P.stone);
        const cw = 78, chh = 36, per = Math.max(1, Math.floor((r.w - 4) / cw));
        f.items.forEach((it, i) => {
          const x = 4 + (i % per) * cw, y = 16 + Math.floor(i / per) * chh;
          const hov = io.hit(x, y, cw, chh - 2);
          OS.spr(sel === i ? it.icon + ':sel' : it.icon, r.x + x + (cw >> 1) - 8, r.y + y);
          const lbl = tx(it.label);
          const lw = OS.textW(lbl);
          if (sel === i) OS.rect(r.x + x + ((cw - lw) >> 1) - 2, r.y + y + 18, lw + 3, 11, P.lake);
          OS.text(lbl, r.x + x + ((cw - lw) >> 1), r.y + y + 19, sel === i ? P.snow : P.ink);
          if (hov) OS.cursor = 'hand';
          if (io.pressed && hov) { if (sel !== i) OS.sfx.click(); sel = i; if (io.dbl && !io.touch) (it.act ? it.act() : OS.open(it.app, undefined, { from: { x: r.x + x + 27, y: r.y + y, w: 16, h: 16 } })); }
          if (io.touch && io.click(x, y, cw, chh - 2)) (it.act ? it.act() : OS.open(it.app));
        });
        for (const k of io.keys) {
          if (k.key === 'ArrowRight' || k.key === 'ArrowDown' || k.key === 'Tab') sel = (sel + 1) % f.items.length;
          if (k.key === 'ArrowLeft' || k.key === 'ArrowUp') sel = (sel - 1 + f.items.length) % f.items.length;
          if (k.key === 'Enter' && sel >= 0) (f.items[sel].act ? f.items[sel].act() : OS.open(f.items[sel].app));
        }
      }
    };
  }
});

/* ------------------------------------------------------------ note e dialoghi */
OS.app('note', {
  title: (a) => a?.title || 'Nota', icon: 'doc', w: 230, h: 150, single: false, minW: 120, minH: 70,
  make(win, a) {
    win.title = a.title;
    const dv = new OS.ui.DocView(() => [{ p: tx(a.text) }, ...(a.extra ? a.extra() : [])], { bg: P.snow });
    return { draw: (g, r, io) => dv.draw(g, r, io) };
  }
});
OS.note = (title, text, extra) => OS.open('note', { title, text, extra });

OS.app('dialog', {
  title: (a) => a?.title || 'Ceresio', icon: 'info', single: false,
  w: 210, h: (a) => 14 + 24 + Math.max(20, OS.wrap(tx(a?.text || ''), 210 - 40).length * 10) + 8,
  make(win, a) {
    win.title = a.title;
    if (a.icon === 'warn') OS.sfx.error();
    const btns = a.buttons || [{ label: 'OK' }];
    return {
      draw(g, r, io) {
        OS.spr(a.icon || 'info', r.x + 8, r.y + 8);
        OS.wrap(tx(a.text), r.w - 40).forEach((l, i) => OS.text(l, r.x + 32, r.y + 8 + i * 10, P.ink));
        let x = r.w - 6;
        for (const b of btns.slice().reverse()) {
          x -= OS.ui.buttonW(b.label) + 4;
          if (OS.ui.button(io, x, r.h - 18, b.label, { primary: b === btns[0] })) { OS.closeWin(win); b.act?.(); }
        }
        for (const k of io.keys) if (k.key === 'Enter') { OS.closeWin(win); btns[0].act?.(); }
      }
    };
  }
});
OS.dialog = (o) => OS.open('dialog', o);

/* ------------------------------------------------------------ trofei */
OS.app('trophies', {
  title: { it: 'Trofei', en: 'Trophies' }, icon: 'trophy', w: 260, h: 240, minW: 150, minH: 100,
  make() {
    let confirm = 0;
    const dv = new OS.ui.DocView(() => {
      const n = OS.EGGS.length, f = OS.EGGS.filter((e) => OS.found.has(e.id)).length;
      return [
        { h1: L('Trofei', 'Trophies') },
        { p: L(`Segreti trovati: ${f} su ${n}. Gli indizi sono qui sotto.`, `Secrets found: ${f} of ${n}. The hints are below.`) },
        { custom: { h: () => 12, draw(X, Y, w) {
          OS.rect(X, Y, w, 8, P.mist); OS.frame(X, Y, w, 8, P.ink);
          OS.rect(X + 1, Y + 1, Math.round((w - 2) * f / n), 6, P.gold);
        } } },
        ...OS.EGGS.map((e) => {
          const got = OS.found.has(e.id);
          return { custom: {
            h: (w) => 12 + OS.wrap(tx(e.hint), w - 22).length * 10 + 4,
            draw(X, Y, w) {
              if (got) OS.spr('trophy', X, Y);
              else { OS.rect(X + 1, Y + 1, 14, 14, P.mist); OS.frame(X + 1, Y + 1, 14, 14, P.stone); OS.textC('?', X + 8, Y + 4, P.stone); }
              OS.text(got ? tx(e.name) : '???', X + 22, Y, got ? P.ink : P.slate);
              OS.wrap(tx(e.hint), w - 22).forEach((l, i) => OS.text(l, X + 22, Y + 11 + i * 10, got ? P.slate : P.stone));
            }
          } };
        }),
        { sp: 6 },
        { btns: [{ label: confirm > OS.time ? L('Sicuro? Clicca ancora', 'Sure? Click again') : L('Azzera i trofei', 'Reset trophies'), act: () => {
          if (confirm > OS.time) { OS.found.clear(); OS.store.set('eggs', []); confirm = 0; } else confirm = OS.time + 3;
          dv.invalidate();
        } }] }
      ];
    });
    const inv = () => dv.invalidate();
    OS.on('egg', inv); OS.on('settings', inv);
    return { draw: (g, r, io) => { if (confirm && confirm < OS.time) { confirm = 0; dv.invalidate(); } dv.draw(g, r, io); } };
  }
});

/* ------------------------------------------------------------ cestino */
OS.trashFull = () => true;
const TRASH = [
  { name: 'cv_2016_comic_sans.doc', text: { it: 'Questo file è stato buttato per un motivo. Il motivo è il font.', en: 'This file was thrown away for a reason. The reason is the font.' } },
  { name: 'password.txt', text: { it: '********\n\nTanto non la vedi.', en: '********\n\nYou cannot see it anyway.' } },
  { name: 'bug_risolti.txt', text: { it: '(file vuoto)\n\nSi aggiornerà appena ne risolvo uno senza crearne altri due.', en: '(empty file)\n\nWill be updated as soon as I fix one without creating two more.' } },
  { name: 'idee_startup.txt', text: { it: '1. Uber per le pizze.\n2. Blockchain per le pizze.\n3. Aprire una pizzeria.', en: '1. Uber for pizza.\n2. Blockchain for pizza.\n3. Open a pizzeria.' } },
  { name: 'segreti.txt', egg: 'trash', text: { it: 'Il lago di Lugano ha un altro nome: Ceresio. Da lì viene il nome di questo sistema.\n\nSecondo segreto: il sole sullo sfondo non ama essere cliccato di continuo.', en: 'Lake Lugano has another name: Ceresio. That is where this system got its name.\n\nSecond secret: the sun on the wallpaper does not like being clicked over and over.' } }
];
OS.app('trash', {
  title: { it: 'Cestino', en: 'Trash' }, icon: 'trashFull', w: 230, h: 160, minW: 150, minH: 100,
  make() {
    let sel = null;
    const st = { scroll: 0 };
    return {
      draw(g, r, io) {
        // Prima i file buttati dall'utente, poi quelli di Carlo (che non se ne vanno).
        const user = OS.fs.children('trash').map((n) => ({ user: n, name: n.name }));
        const rows = [...user, ...TRASH];
        const listH = r.h - 20, sbw = 8;
        OS.ui.scrollInput(io, st, listH, rows.length * 14 + 6, r.w - sbw);
        const s = Math.round(st.scroll);
        OS.clip(r.x, r.y, r.w - sbw, listH);
        let hitRow = null;
        rows.forEach((f, i) => {
          const y = 4 + i * 14 - s;
          const hov = io.hit(0, Math.max(0, y), r.w - sbw, 13) && io.y < listH;
          const on = sel === f.name;
          if (on) OS.rect(r.x, r.y + y, r.w - sbw, 13, P.lake);
          else if (hov) OS.rect(r.x, r.y + y, r.w - sbw, 13, P.mist);
          if (f.user?.type === 'dir') { OS.rect(r.x + 4, r.y + y + 3, 9, 7, P.gold); OS.frame(r.x + 4, r.y + y + 3, 9, 7, P.ink); }
          else { OS.rect(r.x + 5, r.y + y + 2, 7, 9, P.snow); OS.frame(r.x + 5, r.y + y + 2, 7, 9, on ? P.snow : P.ink); }
          OS.text(f.name, r.x + 16, r.y + y + 2, on ? P.snow : f.user ? P.lake : P.ink);
          if (hov) { OS.cursor = 'hand'; hitRow = f; }
        });
        OS.unclip();
        st.scroll = OS.ui.scrollbar(io, r.w - sbw, 0, listH, st.scroll, rows.length * 14 + 6, listH, st);
        if (io.pressed && hitRow) {
          sel = hitRow.name;
          if (io.dbl || io.touch) {
            if (hitRow.user) OS.fs.restore(hitRow.user.id);
            else { OS.note(hitRow.name, hitRow.text); if (hitRow.egg) OS.unlock(hitRow.egg); }
          }
        }
        if (io.rpressed && hitRow?.user) {
          const p = io.screen(io.x, io.y), n = hitRow.user;
          OS.menu(p.x, p.y, [
            { label: L('Ripristina', 'Restore'), act: () => OS.fs.restore(n.id) },
            { label: L('Elimina per sempre', 'Delete forever'), act: () => { OS.fs.purge(n.id); OS.fs.save(); } }
          ]);
        }
        const cur = user.find((u) => u.name === sel);
        let bx = 4;
        if (cur) {
          if (OS.ui.button(io, bx, r.h - 17, L('Ripristina', 'Restore'))) OS.fs.restore(cur.user.id);
          bx += OS.ui.buttonW(L('Ripristina', 'Restore')) + 4;
        }
        if (OS.ui.button(io, bx, r.h - 17, L('Svuota', 'Empty'))) {
          const k = user.length;
          if (k) OS.dialog({
            title: L('Cestino', 'Trash'), icon: 'warn',
            text: L(`Eliminare per sempre ${k} elementi? I file di Carlo invece resteranno: si rifiutano di andarsene.`, `Delete ${k} items forever? Carlo's files will stay though: they refuse to leave.`),
            buttons: [{ label: L('Elimina', 'Delete'), act: () => OS.fs.emptyTrash() }, { label: L('Annulla', 'Cancel') }]
          });
          else OS.dialog({ title: L('Cestino', 'Trash'), icon: 'warn', text: L('Impossibile svuotare il cestino: i file si rifiutano di andarsene.', 'Cannot empty the trash: the files refuse to leave.') });
        }
        const hint = cur ? L('doppio clic: ripristina', 'double-click: restore') : L('doppio clic per aprire', 'double-click to open');
        if (r.w > OS.textW(hint) + bx + 60) OS.text(hint, r.x + r.w - OS.textW(hint) - 4, r.y + r.h - 14, P.stone);
      }
    };
  }
});

/* ------------------------------------------------------------ impostazioni */
OS.app('settings', {
  title: { it: 'Impostazioni', en: 'Settings' }, icon: 'gear', w: 260, h: 250, minW: 160, minH: 100,
  make() {
    const s = OS.settings;
    const set = (k, v) => { s[k] = v; OS.saveSettings(); dv.invalidate(); OS.sfx.select(); };
    const chip = (k, v, label) => ({ label, on: s[k] === v, act: () => set(k, v) });
    const check = (k, label) => ({ custom: { h: () => 14, draw(X, Y, w, io) { if (OS.ui.check(io, 0, 1, s[k], label)) set(k, !s[k]); } } });
    const dv = new OS.ui.DocView(() => [
      { h2: L('Lingua', 'Language') },
      { chips: [chip('lang', 'it', 'Italiano'), chip('lang', 'en', 'English')] },
      { h2: L('Suono', 'Sound') },
      check('sound', L('Effetti e musica', 'Effects and music')),
      { chips: [0.25, 0.5, 0.75, 1].map((v) => ({ label: Math.round(v * 100) + '%', on: s.vol === v, act: () => { set('vol', v); OS.sfx.coin(); } })) },
      { h2: L('Schermo', 'Display') },
      check('crt', L('Effetto monitor CRT', 'CRT monitor effect')),
      check('fastBoot', L('Avvio rapido', 'Fast boot')),
      { h2: L('Luce sul lago', 'Light over the lake') },
      { chips: [chip('tod', 'auto', L('ora reale', 'real time')), chip('tod', 'dawn', L('alba', 'dawn')), chip('tod', 'day', L('giorno', 'day')), chip('tod', 'dusk', L('tramonto', 'dusk')), chip('tod', 'night', L('notte', 'night'))] },
      { h2: L('Meteo sullo sfondo', 'Weather on the wallpaper') },
      { chips: ['auto', 'clear', 'cloudy', 'rain', 'snow', 'storm', 'fog'].map((k) => chip('wx', k, k === 'auto' ? L('reale', 'real') : OS.wxName(k))) },
      { sp: 6 },
      { small: L('Le impostazioni restano salvate in questo browser.', 'Settings are saved in this browser.') }
    ]);
    OS.on('settings', () => dv.invalidate());
    return { draw: (g, r, io) => dv.draw(g, r, io) };
  }
});

/* ------------------------------------------------------------ informazioni su Ceresio */
OS.app('sysinfo', {
  title: { it: 'Informazioni su Ceresio', en: 'About Ceresio' }, icon: 'computer', w: 250, h: 236, minW: 150, minH: 100,
  make() {
    let clicks = 0;
    const dv = new OS.ui.DocView(() => [
      { custom: {
        h: () => 56,
        draw(X, Y, w, io) {
          const lx = X + (w >> 1) - 20;
          const rb = clicks >= 10;
          OS.rect(lx, Y, 40, 26, rb ? OS.PAL16[Math.floor(OS.time * 8) % 16] : P.night);
          OS.disc(lx + 29, Y + 7, 4, P.gold);
          for (let i = 0; i < 14; i++) OS.rect(lx + 6 + i, Y + 18 - i, Math.max(1, 28 - i * 2), 1, i > 10 ? P.snow : P.pine);
          OS.rect(lx, Y + 18, 40, 8, P.lake);
          OS.textC('Ceresio ' + OS.VERSION, X + w / 2, Y + 32, P.lake);
          OS.textC(L('sistema operativo a 8 bit', '8-bit operating system'), X + w / 2, Y + 43, P.slate);
          if (io.hit(lx - X, 0, 40, 26)) OS.cursor = 'hand';
          if (io.click(lx - X, 0, 40, 26)) {
            clicks++; OS.sfx.tone(300 + clicks * 60, 0.06, { vol: 0.07 });
            if (clicks === 10) { OS.unlock('about10'); OS.rainbow = true; dv.invalidate(); }
          }
        }
      } },
      { p: L('Scritto a mano da Carlo Pezzotti per raccontare il suo curriculum. Niente framework, niente immagini: solo JavaScript e un canvas.', 'Hand-written by Carlo Pezzotti to tell his CV. No framework, no images: just JavaScript and a canvas.') },
      { kv: [L('Processore', 'Processor'), 'LLP-8 @ 1.79 MHz'] },
      { kv: [L('Memoria', 'Memory'), L('64 KB (bastano a tutti)', '64 KB (enough for anyone)')] },
      { kv: [L('Schermo', 'Screen'), OS.scr.W + '×' + OS.scr.H + ' px'] },
      { kv: ['Palette', 'Ceresio-16'] },
      { kv: ['Font', L('5×7, disegnato a mano', '5×7, hand-drawn')] },
      { kv: [L('Trofei', 'Trophies'), OS.found.size + '/' + OS.EGGS.length] },
      { custom: { h: () => 14, draw(X, Y, w) { const sw = Math.floor(w / 16); OS.PAL16.forEach((c, i) => OS.rect(X + i * sw, Y + 2, sw, 8, c)); } } },
      clicks >= 10 && { p: L('Modalità arcobaleno attivata. Grazie per la pazienza.', 'Rainbow mode on. Thanks for your patience.'), c: P.red }
    ]);
    OS.on('egg', () => dv.invalidate());
    return { draw: (g, r, io) => dv.draw(g, r, io) };
  }
});

/* ------------------------------------------------------------ segreto (dopo il codice Konami) */
OS.app('secret', {
  title: { it: 'segreto.txt', en: 'secret.txt' }, icon: 'key', w: 240, h: 200, minW: 140, minH: 90,
  make() {
    const dv = new OS.ui.DocView(() => [
      { h1: L('Trovato.', 'Found it.') },
      { p: L(
        "Hai inserito il codice Konami. Ecco un segreto vero: Ceresio è nato da una domanda semplice. E se un curriculum fosse un posto da esplorare invece di un foglio da leggere?",
        'You entered the Konami code. Here is a real secret: Ceresio started from a simple question. What if a CV were a place to explore instead of a page to read?') },
      { p: L('Se sei arrivato fin qui, probabilmente abbiamo qualcosa da dirci.', 'If you made it this far, we probably have something to talk about.') },
      { btns: [
        { label: L('Scrivi a Carlo', 'Write to Carlo'), primary: true, act: () => OS.open('contact') },
        { label: OS.rainbow ? L('Basta arcobaleno', 'Stop the rainbow') : L('Arcobaleno', 'Rainbow'), act: () => { OS.rainbow = !OS.rainbow; dv.invalidate(); } }
      ] }
    ]);
    return { draw: (g, r, io) => dv.draw(g, r, io) };
  }
});
})();
