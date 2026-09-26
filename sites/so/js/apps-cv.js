/* Ceresio OS — le app del curriculum. */
(() => {
'use strict';
const OS = window.OS, P = OS.P, L = OS.L, tx = OS.tx, CV = OS.CV;

const docApp = (id, title, icon, w, h, build, extra = {}) => OS.app(id, {
  title, icon, w, h, minW: 150, minH: 90, ...extra,
  make() { const dv = new OS.ui.DocView(build); OS.on('settings', () => dv.invalidate()); return { draw: (g, r, io) => dv.draw(g, r, io), dv }; }
});
const go = (label, app) => ({ label, act: () => OS.open(app) });

/* ------------------------------------------------------------ Leggimi */
docApp('readme', { it: 'Leggimi.txt', en: 'ReadMe.txt' }, 'doc', 270, 230, () => [
  { h1: L('Benvenuto in Ceresio', 'Welcome to Ceresio') },
  { p: L(
    'Questo è il curriculum di Carlo Pezzotti, dentro un piccolo sistema operativo a 8 bit. Ogni icona sulla scrivania è un pezzo del CV.',
    "This is Carlo Pezzotti's CV, inside a tiny 8-bit operating system. Every icon on the desktop is a piece of the CV.") },
  { h2: L('Come si usa', 'How it works') },
  { li: L("Doppio clic su un'icona per aprirla. Sul telefono basta un tocco.", 'Double-click an icon to open it. On a phone, a tap is enough.') },
  { li: L('Trascina le finestre dalla barra del titolo. Il quadratino a sinistra le chiude, i bordi le ridimensionano a gradini.', 'Drag windows by their title bar. The small box on the left closes them, the edges resize them in steps.') },
  { li: L('Crea cartelle e documenti con il tasto destro sulla scrivania. Restano salvati in questo browser.', 'Create folders and documents by right-clicking the desktop. They stay saved in this browser.') },
  { li: L('Clic destro (o tocco lungo) sulla scrivania per cambiare la luce sul lago.', 'Right-click (or long-press) the desktop to change the light over the lake.') },
  { li: L('Lo sfondo segue ora e meteo veri di Lugano.', 'The wallpaper follows the real time and weather in Lugano.') },
  { h2: L('Da dove iniziare', 'Where to start') },
  { btns: [go(L('Chi sono', 'About me'), 'about'), go(L('Percorso', 'Experience'), 'path'), go(L('Progetti', 'Projects'), 'projects'), go(L('Contatti', 'Contact'), 'contact')] },
  { h2: L('Segreti', 'Secrets') },
  { p: L(
    `Ceresio nasconde ${OS.EGGS.length} segreti e ne hai trovati ${OS.found.size}. Il terminale capisce più comandi di quelli che dichiara, e il lago non è solo decorazione.`,
    `Ceresio hides ${OS.EGGS.length} secrets and you have found ${OS.found.size}. The terminal knows more commands than it admits, and the lake is not just decoration.`) },
  { btns: [go(L('Vedi i trofei', 'See trophies'), 'trophies'), go(L('Apri il terminale', 'Open the terminal'), 'terminal')] },
  { sp: 4 },
  { small: L('Preferisci un sito normale?', 'Prefer a regular website?') },
  { link: 'www.carlopezzotti.ch', href: CV.site }
]);

/* ------------------------------------------------------------ Chi sono */
docApp('about', { it: 'Chi sono', en: 'About me' }, 'person', 290, 250, (cw) => [
  { custom: {
    h: (w) => (w >= 200 ? 52 : 90),
    draw(X, Y, w) {
      OS.rect(X, Y, 52, 52, P.sky);
      OS.frame(X, Y, 52, 52, P.ink);
      OS.spr('person', X + 2, Y + 2, 3);
      const wide = w >= 200;
      const tx0 = wide ? X + 60 : X, ty0 = wide ? Y + 2 : Y + 56;
      OS.text('Carlo', tx0, ty0, P.lake, 2);
      OS.text('Pezzotti', tx0, ty0 + 18, P.lake, 2);
      const on = Math.floor(OS.time * 1.5) % 2;
      if (wide) {
        OS.rect(tx0, ty0 + 40, 5, 5, on ? P.leaf : P.pine);
        OS.text(tx(CV.available), tx0 + 8, ty0 + 38, P.pine);
      }
    }
  } },
  cw < 200 && { p: tx(CV.available), c: P.pine },
  { sp: 4 },
  { p: tx(CV.role), c: P.slate },
  { sp: 2 },
  { p: tx(CV.lead) },
  ...CV.bio.map((b) => ({ p: tx(b) })),
  { h2: L('Scheda', 'Profile') },
  ...CV.specs.map(([k, v]) => ({ kv: [k, v] })),
  { sp: 6 },
  { btns: [go(L('Percorso', 'Experience'), 'path'), go(L('Lingue', 'Languages'), 'langs'), go(L('Contatti', 'Contact'), 'contact')] }
]);

/* ------------------------------------------------------------ Percorso */
const year = new Date().getFullYear();
function gantt() {
  const y0 = 2016, y1 = year + 1;
  const items = CV.exp;
  const rowH = 11;
  return {
    h: () => items.length * rowH + 26,
    draw(X, Y, w, io) {
      const span = y1 - y0;
      const px = (yr) => Math.round(X + (yr - y0) / span * (w - 1));
      const step = w < 200 ? 3 : w < 300 ? 2 : 1;
      for (let yr = y0; yr <= y1; yr++) {
        const x = px(yr);
        for (let yy = Y; yy < Y + items.length * rowH + 4; yy += 2) OS.px(x, yy, P.mist);
        if ((yr - y0) % step === 0 && yr < y1) OS.text("'" + String(yr).slice(2), x + 1, Y + items.length * rowH + 6, P.slate);
      }
      items.forEach((e, i) => {
        const col = P[CV.kinds[e.kind].c];
        const x0 = px(e.start), x1 = e.end ? px(e.end + 1) : px(year + (new Date().getMonth() + 1) / 12);
        const y = Y + i * rowH + 2;
        const hov = io.hit(x0 - X, y - Y, Math.max(4, x1 - x0), 8);
        OS.rect(x0, y, Math.max(3, x1 - x0), 8, hov ? P.ink : col);
        if (!e.end) OS.text('►', x1 - 2, y - 1, col);
        const t = tx(e.title);
        const tw = OS.textW(t);
        if (hov || i === gantt.sel) {
          const tx0 = x1 + tw + 4 < X + w ? x1 + 3 : Math.max(X, x0 - tw - 3);
          OS.rect(tx0 - 1, y - 1, tw + 2, 10, P.snow);
          OS.text(t, tx0, y - 1, P.ink);
          OS.cursor = 'hand';
        }
        if (io.click(x0 - X, y - Y, Math.max(4, x1 - x0), 8)) gantt.sel = i === gantt.sel ? -1 : i;
      });
    }
  };
}
docApp('path', { it: 'Percorso', en: 'Experience' }, 'path', 300, 250, () => [
  { h1: L('Percorso', 'Experience') },
  { small: L('Dal primo stage a oggi. Passa sopra una barra per leggerla.', 'From the first internship to today. Hover a bar to read it.') },
  { custom: gantt() },
  { chips: Object.values(CV.kinds).map((k) => ({ label: tx(k), bg: P[k.c], fg: k.c === 'lakeHi' || k.c === 'red' ? P.snow : P.ink })) },
  { h2: L('Nel dettaglio', 'In detail') },
  ...CV.exp.slice().reverse().map((e) => ({ custom: {
    h: (w) => 14 + OS.wrap(tx(e.desc), w).length * 10 + 6,
    draw(X, Y, w) {
      const yrs = e.start + (e.end === e.start ? '' : '-' + (e.end || L('oggi', 'now')));
      const kc = CV.kinds[e.kind];
      const yw = OS.textW(yrs) + 6;
      OS.rect(X, Y, yw, 11, P[kc.c]);
      OS.text(yrs, X + 3, Y + 1, kc.c === 'gold' || kc.c === 'leaf' || kc.c === 'orange' ? P.ink : P.snow);
      OS.text(tx(e.title), X + yw + 5, Y + 1, P.ink);
      OS.wrap(tx(e.desc), w).forEach((l, i) => OS.text(l, X, Y + 14 + i * 10, P.slate));
    }
  } }))
]);
gantt.sel = -1;

/* ------------------------------------------------------------ Formazione */
docApp('edu', { it: 'Formazione', en: 'Education' }, 'school', 270, 230, () => [
  { h1: L('Formazione', 'Education') },
  { small: L('Scuole, università e un Erasmus in Belgio.', 'Schools, university and an Erasmus in Belgium.') },
  { sp: 4 },
  ...CV.edu.map((e) => ({ custom: {
    h: (w) => 24 + OS.wrap(tx(e.degree), w - 22).length * 10,
    draw(X, Y, w) {
      OS.spr('school', X, Y);
      OS.text(e.school, X + 22, Y + 1, P.lake);
      OS.text(e.place, X + 22 + OS.textW(e.school) + 6, Y + 1, P.slate);
      OS.wrap(tx(e.degree), w - 22).forEach((l, i) => OS.text(l, X + 22, Y + 12 + i * 10, P.ink));
    }
  } }))
]);

/* ------------------------------------------------------------ Lingue */
docApp('langs', { it: 'Lingue', en: 'Languages' }, 'langs', 240, 210, () => [
  { h1: L('Lingue', 'Languages') },
  { small: L('Livelli secondo il quadro europeo QCER.', 'Levels follow the European CEFR scale.') },
  { sp: 4 },
  ...CV.langs.map((l) => ({ level: l })),
  { sp: 4 },
  { p: L('Rispondo alle mail in italiano, inglese, tedesco o francese.', 'I answer emails in Italian, English, German or French.') }
]);

/* ------------------------------------------------------------ Progetti */
const LANG_C = { JavaScript: 'gold', TypeScript: 'lakeHi', Python: 'lake', 'C#': 'pine', Java: 'orange', HTML: 'red', CSS: 'rose', Dart: 'sky', PHP: 'slate', C: 'stone', 'C++': 'rose', Kotlin: 'orange', Shell: 'leaf', Vue: 'leaf', Go: 'sky', Rust: 'brown' };
OS.app('projects', {
  title: { it: 'Progetti', en: 'Projects' }, icon: 'floppy', w: 300, h: 250, minW: 160, minH: 100,
  make() {
    const st = { filter: null, open: -1, retrying: false };
    const dv = new OS.ui.DocView(() => {
      const out = [{ h1: L('Progetti', 'Projects') }, { small: L("Repository pubbliche, lette da GitHub all'avvio.", 'Public repositories, read from GitHub at boot.') }];
      if (!OS.repos) {
        out.push(
          { sp: 4 },
          { p: st.retrying ? L('Riprovo...', 'Retrying...') : L('GitHub non ha risposto: il limite di richieste anonime è finito, oppure manca la rete.', 'GitHub did not answer: the anonymous rate limit ran out, or the network is down.'), c: P.red },
          { btns: [{ label: L('Riprova', 'Retry'), act: () => { st.retrying = true; dv.invalidate(); OS.loadRepos().catch(() => {}).finally(() => { st.retrying = false; dv.invalidate(); }); } }] },
          { link: 'github.com/' + CV.github, href: 'https://github.com/' + CV.github }
        );
        return out;
      }
      const list = OS.repos;
      const langs = [...new Set(list.map((r) => r.lang).filter(Boolean))];
      const stars = list.reduce((a, r) => a + r.stars, 0);
      out.push({ custom: {
        h: () => 28,
        draw(X, Y, w) {
          const cells = [[list.length, L('repository', 'repositories')], [stars, L('stelle', 'stars')], [langs.length, L('linguaggi', 'languages')]];
          const cw = Math.floor(w / 3);
          cells.forEach(([n, l], i) => {
            OS.text(String(n), X + i * cw, Y + 1, P.lake, 2);
            OS.text(l, X + i * cw, Y + 19, P.slate);
          });
        }
      } });
      out.push({ sp: 4 }, { chips: [{ label: L('Tutti', 'All'), on: !st.filter, act: () => { st.filter = null; st.open = -1; dv.invalidate(); } },
        ...langs.map((lg) => ({ label: lg, on: st.filter === lg, act: () => { st.filter = st.filter === lg ? null : lg; st.open = -1; dv.invalidate(); } }))] });
      out.push({ sp: 4 });
      list.filter((r) => !st.filter || r.lang === st.filter).forEach((r, i) => {
        const open = st.open === i;
        const desc = r.desc || L('Nessuna descrizione.', 'No description.');
        out.push({ custom: {
          h: (w) => 13 + OS.wrap(desc, w).length * 10 + (open ? 20 : 0) + 5,
          draw(X, Y, w, io) {
            const h = 13 + OS.wrap(desc, w).length * 10;
            const hov = io.hit(0, 0, w, h);
            if (hov || open) OS.rect(X - 3, Y - 2, w + 6, h + (open ? 20 : 0) + 2, open ? P.mist : '#efe9d8');
            OS.text(r.name + (r.fork ? ' (fork)' : ''), X, Y, P.lake);
            let rx = X + w;
            if (r.stars) { const s = '★' + r.stars; rx -= OS.textW(s); OS.text(s, rx, Y, P.orange); rx -= 6; }
            if (r.lang) {
              rx -= OS.textW(r.lang); OS.text(r.lang, rx, Y, P.slate);
              OS.rect(rx - 7, Y + 2, 5, 5, P[LANG_C[r.lang] || 'stone']); OS.frame(rx - 7, Y + 2, 5, 5, P.ink);
            }
            OS.wrap(desc, w).forEach((l, k) => OS.text(l, X, Y + 12 + k * 10, r.desc ? P.ink : P.stone));
            if (open) {
              const by = h + 2;
              if (OS.ui.button(io, 0, by, L('Apri su GitHub', 'Open on GitHub'))) OS.openUrl(r.url);
              const d = new Date(r.updated);
              const upd = L('aggiornato ', 'updated ') + d.toLocaleDateString(L('it-CH', 'en-GB'), { month: 'short', year: 'numeric' });
              OS.text(upd, X + w - OS.textW(upd), Y + by + 2, P.slate);
              if (r.home && w > 200 && OS.ui.button(io, OS.ui.buttonW(L('Apri su GitHub', 'Open on GitHub')) + 4, by, L('Sito', 'Website'))) OS.openUrl(r.home);
            }
            if (hov) OS.cursor = 'hand';
            if (io.click(0, 0, w, h)) { st.open = open ? -1 : i; OS.sfx.click(); dv.invalidate(); }
          }
        } });
      });
      out.push({ sp: 4 }, { link: L('Tutte le repository su GitHub', 'All repositories on GitHub'), href: 'https://github.com/' + CV.github + '?tab=repositories' });
      return out;
    });
    OS.on('settings', () => dv.invalidate());
    return { draw: (g, r, io) => dv.draw(g, r, io) };
  }
});

/* ------------------------------------------------------------ Contatti */
OS.app('contact', {
  title: { it: 'Contatti', en: 'Contact' }, icon: 'mail', w: 270, h: 240, minW: 150, minH: 100,
  make() {
    let copied = 0;
    const dv = new OS.ui.DocView(() => [
      { h1: L('Contatti', 'Contact') },
      { p: L('Il modo più rapido è la mail. Rispondo in italiano, inglese, tedesco o francese.', 'Email is the fastest way. I answer in Italian, English, German or French.') },
      { custom: {
        h: () => 38,
        draw(X, Y, w) {
          OS.rect(X, Y, w, 34, P.mist); OS.frame(X, Y, w, 34, P.ink);
          OS.spr('mail', X + 6, Y + 9);
          const e = CV.email;
          const fits = OS.textW(e) + 30 < w;
          if (fits) OS.text(e, X + 28, Y + 13, P.lake);
          else { const [a, b] = e.split('@'); OS.text(a, X + 28, Y + 7, P.lake); OS.text('@' + b, X + 28, Y + 17, P.lake); }
        }
      } },
      { btns: [
        { label: OS.time < copied ? L('Copiato', 'Copied') : L('Copia indirizzo', 'Copy address'), primary: true, act: () => {
          navigator.clipboard?.writeText(CV.email).then(() => { copied = OS.time + 2; dv.invalidate(); setTimeout(() => dv.invalidate(), 2100); }).catch(() => OS.sfx.error());
        } },
        { label: L('Scrivi una mail', 'Write an email'), act: () => OS.openUrl('mailto:' + CV.email) }
      ] },
      { h2: L('Altrove', 'Elsewhere') },
      { kv: ['GitHub', ''] },
      { link: 'github.com/' + CV.github, href: 'https://github.com/' + CV.github },
      CV.linkedin && { link: 'LinkedIn', href: CV.linkedin },
      { kv: [L('Sito', 'Website'), ''] },
      { link: 'www.carlopezzotti.ch', href: CV.site },
      { h2: L('Dove sono', 'Where I am') },
      { kv: [L('Città', 'City'), 'Lugano ' + CV.zip] },
      { kv: [L('Coordinate', 'Coordinates'), '46.00°N 8.95°E'] },
      { custom: {
        h: () => 13,
        draw(X, Y, w) {
          const lt = OS.luganoTime();
          OS.text(L('Ora locale', 'Local time'), X, Y, P.slate);
          OS.text(OS.pad(lt.h) + ':' + OS.pad(lt.m) + ':' + OS.pad(lt.s), X + Math.min(90, Math.floor(w * 0.42)), Y, P.ink);
        }
      } }
    ]);
    OS.on('settings', () => dv.invalidate());
    return { draw: (g, r, io) => dv.draw(g, r, io) };
  }
});
})();
