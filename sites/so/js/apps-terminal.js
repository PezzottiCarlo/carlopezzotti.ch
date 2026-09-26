/* Ceresio OS — terminale con file system virtuale. Alcuni comandi non compaiono in "help". */
(() => {
'use strict';
const OS = window.OS, P = OS.P, L = OS.L, tx = OS.tx, CV = OS.CV;

/* ------------------------------------------------------------ file system */
const file = (read) => ({ type: 'file', read });
const app = (id, arg) => ({ type: 'app', app: id, arg });
const dir = (children) => ({ type: 'dir', children });
function cvText(kind) {
  if (kind === 'chi_sono') return [CV.name, tx(CV.role), '', tx(CV.lead), '', ...CV.bio.map(tx)].join('\n');
  if (kind === 'percorso') return CV.exp.map((e) => `${e.start}${e.end === e.start ? '     ' : '-' + (e.end || L('oggi', 'now'))}  ${tx(e.title)}\n           ${tx(e.desc)}`).join('\n');
  if (kind === 'formazione') return CV.edu.map((e) => `${e.school} (${e.place})\n  ${tx(e.degree)}`).join('\n');
  if (kind === 'lingue') return CV.langs.map((l) => tx(l.name).padEnd(10, ' ') + (l.native ? L('madrelingua', 'native') : l.level)).join('\n');
  if (kind === 'contatti') return `email   ${CV.email}\ngithub  github.com/${CV.github}\nweb     www.carlopezzotti.ch\n${L('città', 'city')}   Lugano ${CV.zip}`;
  return '';
}
// La Scrivania del terminale è il file system dell'utente (files.js).
function udir(id) {
  const d = dir({});
  d.uid = id;
  for (const c of OS.fs.children(id)) {
    d.children[c.name] = c.type === 'dir' ? udir(c.id) : Object.assign(file(() => OS.fs.get(c.id)?.text ?? ''), { uid: c.id });
  }
  return d;
}
// Percorso -> { abs, id (se esiste), pid (cartella che lo conterrebbe), base }.
function utarget(t, p) {
  const abs = resolve(t.cwd, p);
  const cut = abs.lastIndexOf('/');
  const parentAbs = cut > 0 ? abs.slice(0, cut) : '/';
  return { abs, id: OS.fs.resolve(abs), pid: OS.fs.resolve(parentAbs), base: abs.slice(cut + 1) };
}
const onlyDesk = () => L('qui puoi scrivere solo dentro ~/Scrivania', 'you can only write inside ~/Scrivania');
function fsRoot() {
  const repos = {};
  (OS.repos || []).forEach((r) => { repos[r.name + '.txt'] = file(() => `${r.name}\n${r.desc || L('Nessuna descrizione.', 'No description.')}\n${r.lang || '-'}  ★${r.stars}\n${r.url}`); });
  return dir({
    home: dir({
      carlo: dir({
        Scrivania: udir('desk'),
        'leggimi.txt': file(() => L('Benvenuto nel terminale di Ceresio.\nScrivi "help" per i comandi, "ls" per guardarti intorno.\nNon tutti i comandi sono nella lista.', 'Welcome to the Ceresio terminal.\nType "help" for commands, "ls" to look around.\nNot every command is on the list.')),
        cv: dir({
          'chi_sono.txt': file(() => cvText('chi_sono')), 'percorso.txt': file(() => cvText('percorso')),
          'formazione.txt': file(() => cvText('formazione')), 'lingue.txt': file(() => cvText('lingue')),
          'contatti.txt': file(() => cvText('contatti'))
        }),
        progetti: dir(repos),
        giochi: dir({ 'pizza-rider': app('snake'), mattoni: app('bricks'), 'campo-minato': app('mines') }),
        ricette: dir({ 'margherita.txt': file(() => L('Impasto 48 ore, pomodoro San Marzano, fior di latte, basilico.\nForno a 450 gradi, 90 secondi.\nConsegna: 12 minuti in scooter, salita di Besso inclusa.', 'Dough 48 hours, San Marzano tomatoes, fior di latte, basil.\nOven at 450 degrees, 90 seconds.\nDelivery: 12 minutes by scooter, Besso hill included.')) }),
        '.segreto': file(() => L(`Se stai leggendo questo file, sei il tipo di persona con cui mi piacerebbe lavorare.\nScrivimi a ${CV.email} con oggetto "ho trovato il file segreto".\n\nP.S. prova il codice Konami sulla scrivania.`, `If you are reading this file, you are the kind of person I would like to work with.\nWrite to ${CV.email} with the subject "I found the secret file".\n\nP.S. try the Konami code on the desktop.`)),
        '.bash_history': file(() => 'git push --force\n# ' + L('ops', 'oops') + '\ngit reflog\ngit reset --hard HEAD@{1}\n# ' + L('salvato', 'saved') + '\nnpm install\nnpm install\nrm -rf node_modules && npm install\nvim .\n:q\n:q!\n:wq')
      })
    }),
    bin: dir(Object.fromEntries(Object.keys(CMDS).filter((c) => !CMDS[c].hidden).map((c) => [c, file(() => L('file binario', 'binary file'))]))),
    etc: dir({
      motd: file(() => L('Oggi a Lugano: ', 'Today in Lugano: ') + (OS.weather ? OS.weather.temp + '°C, ' + OS.wxName(OS.wxKind()) : L('meteo sconosciuto', 'weather unknown'))),
      hostname: file(() => 'ceresio')
    })
  });
}
function resolve(cwd, p) {
  if (!p) return cwd;
  let parts = p.startsWith('/') ? [] : p.startsWith('~') ? ['home', 'carlo'] : cwd.split('/').filter(Boolean);
  for (const s of p.replace(/^~\/?/, '').split('/')) {
    if (!s || s === '.') continue;
    if (s === '..') parts.pop(); else parts.push(s);
  }
  return '/' + parts.join('/');
}
function node(root, path) {
  let n = root;
  for (const s of path.split('/').filter(Boolean)) { if (!n || n.type !== 'dir') return null; n = n.children[s]; }
  return n;
}
const pretty = (p) => (p === '/home/carlo' ? '~' : p.startsWith('/home/carlo/') ? '~' + p.slice(11) : p);

/* ------------------------------------------------------------ comandi */
const FORTUNES = [
  ['Funziona sulla mia macchina.', 'Works on my machine.'],
  ['Ci sono 10 tipi di persone: chi capisce il binario e chi no.', 'There are 10 kinds of people: those who get binary and those who do not.'],
  ['Il momento migliore per scrivere i test era ieri. Il secondo migliore è adesso.', 'The best time to write tests was yesterday. The second best is now.'],
  ['Una pizza consegnata fredda è un bug in produzione.', 'A pizza delivered cold is a bug in production.'],
  ['Prima misura, poi ottimizza.', 'Measure first, then optimise.'],
  ['A Lugano piove poco, ma quando piove recupera.', 'It rarely rains in Lugano, but when it does it catches up.'],
  ['Il codice più veloce è quello che non gira.', 'The fastest code is the code that never runs.'],
  ['Nominare le cose e invalidare la cache: i due problemi difficili.', 'Naming things and cache invalidation: the two hard problems.'],
  ['Un sergente non dice "forse". Un programmatore sì.', 'A sergeant never says "maybe". A programmer does.']
];
const TRAIN = [
  '      ====        ________',
  '  _D _|  |_______/        \\__I_I__',
  '   |(_)---  |   H\\________/ |    |',
  '   /     |  |   H  |  |     |    |',
  '  |      |  |   H  |__|-----+----|',
  '  |______|__|___H__|________|____|',
  '   \\_O=====O=====O=====O=====O_/'
];
const LAKE_ART = [
  ['         /\\       ', 'leaf'], ['        /  \\  /\\  ', 'leaf'], ['   /\\  / /\\ \\/  \\ ', 'pine'],
  ['  /  \\/_/  \\_\\___\\', 'pine'], ['~~~~~~~~~~~~~~~~~~', 'lakeHi'], [' ~~~~~~~~~~~~~~~~ ', 'lake']
];

const CMDS = {
  help: { d: ['mostra questo elenco', 'show this list'], run(t) {
    t.out(L('Comandi disponibili:', 'Available commands:'), P.gold);
    Object.entries(CMDS).filter(([, c]) => !c.hidden).forEach(([n, c]) => t.out('  ' + n.padEnd(10, ' ') + L(c.d[0], c.d[1])));
    t.out(L('Alcuni comandi non sono in questa lista.', 'Some commands are not on this list.'), P.slate);
  } },
  ls: { d: ['elenca i file', 'list files'], run(t, a) {
    const all = a.includes('-a') || a.includes('-la') || a.includes('-al');
    const p = resolve(t.cwd, a.find((x) => !x.startsWith('-')));
    const n = node(t.fs(), p);
    if (!n) return t.out('ls: ' + p + L(': file o cartella inesistente', ': no such file or directory'), P.red);
    if (n.type !== 'dir') return t.out(p.split('/').pop());
    const names = Object.keys(n.children).filter((k) => all || !k.startsWith('.'));
    if (all) names.unshift('.', '..');
    if (!names.length) return t.out(L('(vuota)', '(empty)'), P.slate);
    t.out(names.map((k) => { const c = n.children[k]; return c?.type === 'dir' ? k + '/' : c?.type === 'app' ? k + '*' : k; }).join('  '), P.sky);
  } },
  cd: { d: ['cambia cartella', 'change directory'], run(t, a) {
    const p = resolve(t.cwd, a[0] || '~');
    const n = node(t.fs(), p);
    if (!n || n.type !== 'dir') return t.out('cd: ' + (a[0] || '') + L(': cartella inesistente', ': no such directory'), P.red);
    t.cwd = p;
  } },
  pwd: { d: ['mostra la cartella corrente', 'print working directory'], run: (t) => t.out(t.cwd) },
  cat: { d: ['mostra un file', 'print a file'], run(t, a) {
    if (!a.length) return t.out(L('uso: cat <file>', 'usage: cat <file>'), P.slate);
    for (const f of a) {
      const p = resolve(t.cwd, f), n = node(t.fs(), p);
      if (!n) t.out('cat: ' + f + L(': file inesistente', ': no such file'), P.red);
      else if (n.type === 'dir') t.out('cat: ' + f + L(': è una cartella', ': is a directory'), P.red);
      else if (n.type === 'app') t.out(L('È un programma: scrivi ', 'It is a program: type ') + '"' + f + '"', P.slate);
      else t.out(n.read());
    }
  } },
  open: { d: ['apre un programma o una sezione', 'open a program or section'], run(t, a) {
    const MAP = { about: 'about', chi: 'about', percorso: 'path', experience: 'path', path: 'path', formazione: 'edu', education: 'edu', edu: 'edu', lingue: 'langs', languages: 'langs', progetti: 'projects', projects: 'projects', contatti: 'contact', contact: 'contact', trofei: 'trophies', trophies: 'trophies', paint: 'paint', pittura: 'paint', musica: 'music', music: 'music', giradischi: 'music', orologio: 'clock', clock: 'clock', impostazioni: 'settings', settings: 'settings', cestino: 'trash', trash: 'trash', snake: 'snake', 'pizza-rider': 'snake', mattoni: 'bricks', bricks: 'bricks', mines: 'mines', 'campo-minato': 'mines', leggimi: 'readme', readme: 'readme' };
    const k = (a[0] || '').toLowerCase().replace(/\.txt$/, '');
    if (!MAP[k]) return t.out(L('uso: open <sezione>. Prova: ', 'usage: open <section>. Try: ') + 'about, percorso, progetti, contatti', P.slate);
    OS.open(MAP[k]); t.out(L('Apro ', 'Opening ') + k + '...', P.slate);
  } },
  cv: { d: ['il curriculum in breve', 'the CV in short'], run(t) {
    t.out(CV.name, P.gold);
    t.out(tx(CV.role), P.sky);
    t.out('');
    CV.exp.slice().reverse().slice(0, 4).forEach((e) => t.out(String(e.start).padEnd(6, ' ') + tx(e.title)));
    t.out('');
    t.out(L('Più dettagli: cat ~/cv/percorso.txt oppure open percorso', 'More: cat ~/cv/percorso.txt or open experience'), P.slate);
  } },
  neofetch: { d: ['informazioni sul sistema', 'system information'], run(t) {
    const up = Math.floor(OS.time / 60);
    const info = [
      [['carlo', 'gold'], ['@', 'snow'], ['ceresio', 'gold']], [['-------------', 'slate']],
      [['OS: ', 'sky'], ['Ceresio ' + OS.VERSION + ' (8 bit)', 'snow']], [['Host: ', 'sky'], ['Lugano, CH', 'snow']],
      [['CPU: ', 'sky'], ['LLP-8 @ 1.79 MHz', 'snow']], [['Uptime: ', 'sky'], [up + ' min', 'snow']],
      [[L('Risoluzione: ', 'Resolution: '), 'sky'], [OS.scr.W + 'x' + OS.scr.H, 'snow']], [[L('Palette: ', 'Palette: '), 'sky'], ['Ceresio-16', 'snow']],
      [[L('Trofei: ', 'Trophies: '), 'sky'], [OS.found.size + '/' + OS.EGGS.length, 'snow']]
    ];
    const n = Math.max(LAKE_ART.length, info.length);
    for (let i = 0; i < n; i++) {
      const art = LAKE_ART[i] || ['                  ', 'snow'];
      t.outSeg([[art[0] + '  ', art[1]], ...(info[i] || [])]);
    }
    t.outSeg(OS.PAL16.map((c) => ['██', c]));
  } },
  whoami: { d: ['chi sei tu', 'who you are'], run: (t) => t.out(L('ospite. Carlo però ti saluta.', 'guest. Carlo says hi though.')) },
  date: { d: ['data e ora a Lugano', 'date and time in Lugano'], run: (t) => t.out(new Date().toLocaleString(L('it-CH', 'en-GB'), { timeZone: 'Europe/Zurich', dateStyle: 'full', timeStyle: 'medium' })) },
  meteo: { d: ['il tempo a Lugano', 'the weather in Lugano'], run(t) {
    if (!OS.weather) return t.out(L('Meteo non disponibile. Guarda fuori dalla finestra.', 'Weather unavailable. Look out of the window.'), P.slate);
    t.out('Lugano: ' + OS.weather.temp + '°C, ' + OS.wxName(OS.wxKind()));
  } },
  github: { d: ['elenca i progetti', 'list projects'], run(t, a) {
    if (!OS.repos) return t.out(L('GitHub non risponde. Profilo: ', 'GitHub is not answering. Profile: ') + 'github.com/' + CV.github, P.orange);
    if (a[0]) { const r = OS.repos.find((x) => x.name.toLowerCase() === a[0].toLowerCase()); if (r) { OS.openUrl(r.url); return t.out(L('Apro ', 'Opening ') + r.url); } return t.out(L('Repository non trovata.', 'Repository not found.'), P.red); }
    OS.repos.slice(0, 15).forEach((r) => t.out(r.name.padEnd(24, ' ') + (r.lang || ''), P.sky));
    t.out(L('Apri con: github <nome>', 'Open with: github <name>'), P.slate);
  } },
  email: { d: ["l'indirizzo di Carlo", "Carlo's address"], run(t, a) {
    t.out(CV.email, P.gold);
    if (a[0] === 'send' || a[0] === 'scrivi') OS.openUrl('mailto:' + CV.email);
    else t.out(L('Scrivi "email scrivi" per aprire il programma di posta.', 'Type "email send" to open your mail app.'), P.slate);
  } },
  echo: { d: ['ripete il testo (anche > file)', 'print text (also > file)'], run(t, a) {
    const m = /^(.*?)\s*(>>?)\s*(\S+)$/.exec(a.join(' '));
    if (!m) return t.out(a.join(' '));
    const msg = m[1].replace(/^(["'])(.*)\1$/, '$2');
    const x = utarget(t, m[3]);
    let id = x.id;
    if (!id) {
      if (!x.pid) return t.out('echo: ' + onlyDesk(), P.red);
      const n = OS.fs.create(x.pid, 'file', x.base);
      if (typeof n === 'string') return t.out('echo: ' + n, P.red);
      id = n.id;
    }
    const n = OS.fs.get(id);
    if (!n || n.type !== 'file') return t.out('echo: ' + m[3] + L(': è una cartella', ': is a directory'), P.red);
    OS.fs.write(id, (m[2] === '>>' ? n.text : '') + msg + '\n');
  } },
  mkdir: { d: ['crea una cartella', 'make a folder'], run(t, a) {
    const names = a.filter((x) => !x.startsWith('-'));
    if (!names.length) return t.out(L('uso: mkdir <nome>', 'usage: mkdir <name>'), P.slate);
    for (const p of names) {
      const x = utarget(t, p);
      if (x.id) { t.out('mkdir: ' + p + L(': esiste già', ': already exists'), P.red); continue; }
      if (!x.pid) { t.out('mkdir: ' + onlyDesk(), P.red); continue; }
      const n = OS.fs.create(x.pid, 'dir', x.base);
      if (typeof n === 'string') t.out('mkdir: ' + n, P.red);
    }
  } },
  touch: { d: ['crea un documento vuoto', 'create an empty document'], run(t, a) {
    if (!a.length) return t.out(L('uso: touch <file>', 'usage: touch <file>'), P.slate);
    for (const p of a) {
      const x = utarget(t, p);
      if (x.id) continue;
      if (!x.pid) { t.out('touch: ' + onlyDesk(), P.red); continue; }
      const n = OS.fs.create(x.pid, 'file', x.base);
      if (typeof n === 'string') t.out('touch: ' + n, P.red);
    }
  } },
  mv: { d: ['sposta o rinomina', 'move or rename'], run(t, a) {
    if (a.length !== 2) return t.out(L('uso: mv <origine> <destinazione>', 'usage: mv <source> <destination>'), P.slate);
    const s = utarget(t, a[0]), d = utarget(t, a[1]);
    if (!s.id || s.id === 'desk') return t.out('mv: ' + a[0] + L(': non è un tuo file', ': not one of your files'), P.red);
    const dn = d.id && (d.id === 'desk' || OS.fs.get(d.id)?.type === 'dir');
    let err = null;
    if (dn) err = OS.fs.move(s.id, d.id);
    else if (d.pid) { if (OS.fs.get(s.id).parent !== d.pid) err = OS.fs.move(s.id, d.pid); err = err || OS.fs.rename(s.id, d.base); }
    else err = onlyDesk();
    if (err) t.out('mv: ' + err, P.red);
  } },
  rmdir: { hidden: true, run(t, a) {
    for (const p of a) {
      const x = utarget(t, p), n = x.id && OS.fs.get(x.id);
      if (!n || n.type !== 'dir') t.out('rmdir: ' + p + L(': non è una tua cartella', ': not one of your folders'), P.red);
      else if (OS.fs.children(n.id).length) t.out('rmdir: ' + p + L(': la cartella non è vuota', ': folder not empty'), P.red);
      else OS.fs.remove(n.id);
    }
  } },
  nano: { d: ['modifica un documento', 'edit a document'], run(t, a) {
    if (!a[0]) { t.out(L('nano senza file? Apro vim, che è uguale.', 'nano without a file? Opening vim, same thing.'), P.slate, 600); t.then(() => CMDS.vim.run(t)); return; }
    const x = utarget(t, a[0]);
    let id = x.id;
    if (!id) {
      if (!x.pid) return t.out('nano: ' + onlyDesk(), P.red);
      const n = OS.fs.create(x.pid, 'file', x.base);
      if (typeof n === 'string') return t.out('nano: ' + n, P.red);
      id = n.id;
    }
    if (OS.fs.get(id)?.type !== 'file') return t.out('nano: ' + a[0] + L(': è una cartella', ': is a directory'), P.red);
    OS.fs.open(id);
    t.out(L('Apro il Blocco note...', 'Opening Notepad...'), P.slate);
  } },
  matematica: { hidden: true, run(t) {
    t.out('2 + 2 = 4', P.snow);
    t.out(L("Bene. Compiti per domani: pagina 42, esercizi dall'1 al 12.", 'Good. Homework for tomorrow: page 42, exercises 1 to 12.'), P.gold);
    t.out(L('(Supplente di matematica, SM Mendrisio, 2026)', '(Substitute maths teacher, Mendrisio, 2026)'), P.slate);
  } },
  history: { d: ['comandi usati', 'command history'], run: (t) => t.hist.slice().reverse().forEach((h, i) => t.out(String(i + 1).padStart(3, ' ') + '  ' + h)) },
  fortune: { d: ['una frase a caso', 'a random quote'], run(t) { const f = FORTUNES[Math.floor(Math.random() * FORTUNES.length)]; t.out(L(f[0], f[1]), P.sky); } },
  cowsay: { d: ['una mucca svizzera parla', 'a Swiss cow speaks'], run(t, a) {
    const s = a.join(' ') || L('Muuu. Formaggio?', 'Moo. Cheese?');
    t.out(' ' + '_'.repeat(s.length + 2)); t.out('< ' + s + ' >'); t.out(' ' + '-'.repeat(s.length + 2));
    ['        \\   ^__^', '         \\  (oo)\\_______', '            (__)\\       )\\/\\', '                ||--+-w |', '                ||     ||'].forEach((l) => t.out(l));
  } },
  lang: { d: ['cambia lingua (it, en)', 'change language (it, en)'], run(t, a) {
    if (!['it', 'en'].includes(a[0])) return t.out(L('uso: lang it | lang en', 'usage: lang it | lang en'), P.slate);
    OS.settings.lang = a[0]; OS.saveSettings(); t.out(L('Lingua: italiano', 'Language: English'));
  } },
  clear: { d: ['pulisce lo schermo', 'clear the screen'], run: (t) => { t.lines = []; } },
  exit: { d: ['chiude il terminale', 'close the terminal'], run: (t) => OS.closeWin(t.win) },
  reboot: { d: ['riavvia Ceresio', 'restart Ceresio'], run: () => OS.restart() },
  shutdown: { d: ['spegne Ceresio', 'shut Ceresio down'], run: () => OS.shutdown() },

  // Nascosti.
  sudo: { hidden: true, run(t, a) {
    const rest = a.join(' ');
    if (/^rm\s+-(rf|fr)\s+\/\*?$/.test(rest) || /^rm\s+-(rf|fr)\s+\/\s/.test(rest + ' ')) return CMDS.rm.run(t, a.slice(1));
    if (rest === 'make me a sandwich') return t.out(L('Ok.', 'Okay.'));
    t.out(L('carlo non è nel file sudoers. Questo incidente verrà segnalato.', 'carlo is not in the sudoers file. This incident will be reported.'), P.red);
    OS.unlock('sudo');
  } },
  rm: { hidden: true, run(t, a) {
    const s = a.join(' ');
    if (/-(rf|fr)/.test(s) && /(^|\s)\/\*?(\s|$)/.test(s)) {
      OS.unlock('rmrf');
      ['/bin', '/etc', '/home/carlo/cv', '/home/carlo/progetti', '/home/carlo/ricette', L('/lago', '/lake'), L('/montagne', '/mountains'), '/'].forEach((d, i) => t.out(L('rimuovo ', 'removing ') + d, P.red, 90 + i * 20));
      t.then(() => OS.crash());
      return;
    }
    if (!a.length) return t.out(L('rm: manca un operando', 'rm: missing operand'), P.slate);
    const rec = a.some((x) => /^-\w*r/.test(x));
    for (const p of a.filter((x) => !x.startsWith('-'))) {
      const x = utarget(t, p);
      if (x.id === 'desk') { t.out(L('rm: la Scrivania resta dove è.', 'rm: the desktop stays where it is.'), P.red); continue; }
      const n = x.id && OS.fs.get(x.id);
      if (!n) { t.out(L('rm: permesso negato. I file del curriculum sono protetti.', 'rm: permission denied. CV files are protected.'), P.red); continue; }
      if (n.type === 'dir' && !rec) { t.out('rm: ' + p + L(': è una cartella (usa -r)', ': is a directory (use -r)'), P.red); continue; }
      OS.fs.remove(n.id);
      t.out(p + L(': spostato nel cestino', ': moved to the trash'), P.slate);
    }
  } },
  xyzzy: { hidden: true, run(t) { t.out(L('Non succede niente.', 'Nothing happens.')); OS.unlock('xyzzy'); } },
  vim: { hidden: true, run(t) { t.mode = { kind: 'vim', cmd: '', msg: '', ins: false }; OS.unlock('vim'); } },
  vi: { hidden: true, run: (t) => CMDS.vim.run(t) },
  emacs: { hidden: true, run: (t) => CMDS.nano.run(t, []) },
  matrix: { hidden: true, run(t) { t.out(L('Segui il coniglio bianco.', 'Follow the white rabbit.'), P.leaf); OS.unlock('matrix'); OS.fx?.matrix(7); } },
  sl: { hidden: true, run(t) { t.mode = { kind: 'sl', t: 0 }; } },
  hack: { hidden: true, run(t) {
    for (let i = 0; i < 14; i++) t.out(Array.from({ length: 6 }, () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')).join(' '), P.leaf, 40);
    t.out(L('ACCESSO CONSENTITO', 'ACCESS GRANTED'), P.gold, 300);
    t.out(L('...scherzo. Qui si legge solo il curriculum.', '...kidding. The only thing here is a CV.'), P.slate, 700);
  } },
  coffee: { hidden: true, run(t) { t.out(L('Errore 418: sono una teiera.', "Error 418: I'm a teapot."), P.orange); OS.unlock('coffee'); } },
  caffe: { hidden: true, run: (t) => CMDS.coffee.run(t) },
  'caffè': { hidden: true, run: (t) => CMDS.coffee.run(t) },
  pizza: { hidden: true, run(t) {
    ['   _____', '  /  o  \\', ' / o   o \\', '/_________\\'].forEach((l) => t.out(l, P.gold));
    t.out(L('Esperienza certificata: fattorino dal 2021 al 2023.', 'Certified experience: delivery rider from 2021 to 2023.'));
    t.out(L('Prova il gioco: pizza-rider', 'Try the game: pizza-rider'), P.slate);
  } },
  attenti: { hidden: true, run(t) {
    ['   o7', '  /|', '  / \\'].forEach((l) => t.out(l, P.snow));
    t.out(L('SIGNORSÌ, SERGENTE!', 'SIR, YES, SERGEANT!'), P.red);
    t.out(L('(Sergente, Esercito svizzero, 2021)', '(Sergeant, Swiss Army, 2021)'), P.slate);
    OS.unlock('salute');
  } },
  ping: { hidden: true, run(t, a) {
    const h = a[0] || 'lugano';
    for (let i = 0; i < 4; i++) t.out(`64 bytes from ${h}: icmp_seq=${i + 1} time=${h.includes('lugano') ? 1 : Math.floor(10 + Math.random() * 40)} ms`, P.snow, 400);
  } },
  '42': { hidden: true, run: (t) => t.out(L('Questa è la risposta. Ora serve la domanda.', 'That is the answer. Now we need the question.')) },
  make: { hidden: true, run(t, a) {
    if (a.join(' ') === 'me a sandwich') return t.out(L('Fattelo da solo.', 'Make it yourself.'));
    t.out(L("make: *** Nessuna regola per creare l'obiettivo '", "make: *** No rule to make target '") + (a[0] || L('caffè', 'coffee')) + "'.  Stop.", P.red);
  } },
  git: { hidden: true, run(t, a) {
    const s = a.join(' ');
    if (s.startsWith('blame')) return t.out(L('Tutte le righe: Carlo Pezzotti, 2016-oggi. Colpa sua.', 'Every line: Carlo Pezzotti, 2016-today. His fault.'));
    if (s.startsWith('status')) return t.out(L('Sul branch main. Niente da committare, curriculum pulito.', 'On branch main. Nothing to commit, CV is clean.'));
    if (s.includes('push') && s.includes('force')) return t.out(L('Hai appena riscritto la storia. Coraggioso.', 'You just rewrote history. Brave.'), P.orange);
    if (s.startsWith('log')) return CV.exp.slice().reverse().forEach((e) => t.out(`${e.start}  ${tx(e.title)}`, P.gold));
    t.out(L('git ridotto: prova status, log, blame.', 'reduced git: try status, log, blame.'), P.slate);
  } },
  konami: { hidden: true, run: (t) => t.out(L('Non qui. Prova sulla scrivania: ↑ ↑ ↓ ↓ ← → ← → B A', 'Not here. Try it on the desktop: ↑ ↑ ↓ ↓ ← → ← → B A'), P.gold) },
  ciao: { hidden: true, run: (t) => t.out(L('Ciao! Scrivi "cv" per conoscere Carlo.', 'Hi! Type "cv" to meet Carlo.')) },
  top: { hidden: true, run(t) {
    t.out('  PID  CPU  ' + L('PROCESSO', 'PROCESS'), P.gold);
    [['1', '31%', 'forno-pizza'], ['42', '22%', 'lago-renderer'], ['88', '18%', L('curiosità', 'curiosity')], ['101', '12%', 'caffeina'], ['404', '0%', L('tempo-libero', 'free-time')]].forEach(([p, c, n]) => t.out(p.padStart(5, ' ') + c.padStart(5, ' ') + '  ' + n));
  } },
  uname: { hidden: true, run: (t) => t.out('Ceresio ' + OS.VERSION + ' LLP-8 lugano 8bit') },
  man: { hidden: true, run(t, a) {
    const c = CMDS[a[0]];
    if (c && !c.hidden) return t.out(a[0] + ': ' + L(c.d[0], c.d[1]));
    t.out(L('Nessun manuale. Solo esperienza.', 'No manual. Only experience.'));
  } },
  crt: { hidden: true, run(t, a) { OS.settings.crt = a[0] !== 'off'; OS.saveSettings(); t.out('CRT ' + (OS.settings.crt ? 'on' : 'off')); } },
  trofei: { hidden: true, run(t) { t.out(L('Trofei trovati: ', 'Trophies found: ') + OS.found.size + '/' + OS.EGGS.length, P.gold); } }
};
CMDS.edit = CMDS.nano; CMDS.math = CMDS.matematica;
CMDS.hello = CMDS.ciao; CMDS.hi = CMDS.ciao; CMDS.salute = CMDS.attenti; CMDS.sergente = CMDS.attenti; CMDS.attention = CMDS.attenti;
CMDS.weather = CMDS.meteo; CMDS.mail = CMDS.email; CMDS.trophies = CMDS.trofei;
for (const k of ['edit', 'math', 'hello', 'hi', 'salute', 'sergente', 'attention', 'weather', 'mail', 'trophies']) CMDS[k] = { ...CMDS[k], hidden: true };

/* ------------------------------------------------------------ terminale */
OS.app('terminal', {
  title: { it: 'Terminale', en: 'Terminal' }, icon: 'term', w: 300, h: 190, minW: 160, minH: 80,
  bg: P.night, single: false, wantsKeyboard: true, escClose: false,
  make(win) {
    const t = {
      win, lines: [], input: '', hist: [], hi: -1, cwd: '/home/carlo', queue: [], qt: 0, back: 0, mode: null,
      fs: () => fsRoot(),
      out(text, c = P.snow, delay = 0) { String(text).split('\n').forEach((l, i) => this.queue.push({ text: l, c, delay: i ? 0 : delay })); },
      outSeg(segs) { this.queue.push({ segs }); },
      then(fn) { this.queue.push({ fn }); },
      push(it) { this.lines.push(it); if (this.lines.length > 400) this.lines.splice(0, 100); },
      run(line) {
        const raw = line.trim();
        this.push({ segs: [[pretty(this.cwd) + ' $ ', 'gold'], [line, 'snow']] });
        if (!raw) return;
        this.hist.unshift(raw); this.hi = -1;
        if (/^:\(\)\s*\{\s*:\|:&\s*\};:$/.test(raw.replace(/\s+/g, ''))) { this.out(L('Bomba fork rilevata. Addio.', 'Fork bomb detected. Goodbye.'), P.red); this.then(() => OS.crash()); return; }
        const [cmd, ...args] = raw.split(/\s+/);
        const lc = cmd.toLowerCase().replace(/^\.\//, '');
        const root = this.fs();
        const here = node(root, resolve(this.cwd, lc)) || node(root, '/home/carlo/giochi/' + lc);
        if (here?.type === 'app') { OS.open(here.app); return this.out(L('Avvio ', 'Launching ') + lc + '...', P.slate); }
        const c = CMDS[lc];
        if (!c) {
          if (lc === 'carlo') return this.out(L('Mi hai chiamato? Prova a scriverlo sulla scrivania.', 'You called? Try typing it on the desktop.'), P.gold);
          return this.out(lc + L(': comando non trovato. Scrivi "help".', ': command not found. Type "help".'), P.orange);
        }
        c.run(this, args);
      },
      complete() {
        const parts = this.input.split(' ');
        const last = parts[parts.length - 1];
        let opts;
        if (parts.length === 1) opts = Object.keys(CMDS).filter((k) => !CMDS[k].hidden && k.startsWith(last));
        else {
          const base = last.includes('/') ? last.slice(0, last.lastIndexOf('/') + 1) : '';
          const n = node(this.fs(), resolve(this.cwd, base || '.'));
          if (!n || n.type !== 'dir') return;
          opts = Object.keys(n.children).filter((k) => k.startsWith(last.slice(base.length)) && (!k.startsWith('.') || last.slice(base.length).startsWith('.'))).map((k) => base + k + (n.children[k].type === 'dir' ? '/' : ''));
        }
        if (opts.length === 1) { parts[parts.length - 1] = opts[0] + (opts[0].endsWith('/') ? '' : ' '); this.input = parts.join(' '); }
        else if (opts.length > 1) { this.push({ segs: [[pretty(this.cwd) + ' $ ', 'gold'], [this.input, 'snow']] }); this.push({ text: opts.join('  '), c: P.sky }); }
      },
      tick(dt) {
        this.qt -= dt;
        while (this.queue.length && this.qt <= 0) {
          const q = this.queue.shift();
          if (q.fn) { q.fn(); continue; }
          if (q.delay) { this.qt = q.delay / 1000; this.queue.unshift({ ...q, delay: 0 }); break; }
          this.push(q.segs ? { segs: q.segs } : { text: q.text, c: q.c });
          this.back = 0;
        }
      }
    };
    t.out(L('Ceresio terminale 0.8. Scrivi "help" per iniziare.', 'Ceresio terminal 0.8. Type "help" to start.'), P.sky);
    t.out(L('Oggi è ', 'Today is ') + new Date().toLocaleDateString(L('it-CH', 'en-GB'), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Zurich' }) + '.', P.slate);

    return {
      draw(g, r, io) {
        t.tick(1 / 60);
        // Sul telefono: barra con i tasti che la tastiera virtuale non ha.
        const touchUI = OS.inp.touch || matchMedia('(pointer: coarse)').matches;
        const barH = touchUI ? 17 : 0;
        const cols = Math.max(10, Math.floor((r.w - 6) / OS.CW)), rows = Math.max(2, Math.floor((r.h - 4 - barH) / OS.CH));
        const extra = [];
        if (touchUI) {
          OS.rect(r.x, r.y + r.h - barH, r.w, barH, P.ink);
          let bx = 2;
          for (const [label, key] of [['Tab', { key: 'Tab' }], ['↑', { key: 'ArrowUp' }], ['↓', { key: 'ArrowDown' }], ['^C', { key: 'c', ctrl: true }], ['Esc', { key: 'Escape' }], ['clear', { key: 'l', ctrl: true }]]) {
            const w = OS.ui.buttonW(label) + 2;
            if (bx + w > r.w) break;
            if (OS.ui.button(io, bx, r.h - barH + 2, label)) extra.push(key);
            bx += w + 2;
          }
          // Scorrimento col dito sopra la barra.
          if (io.pressed && io.y < r.h - barH) t.drag = { y0: io.y, back0: t.back };
          if (t.drag && io.down) t.back = Math.max(0, t.drag.back0 + Math.round((io.y - t.drag.y0) / OS.CH));
          if (!io.down) t.drag = null;
        }
        const keys = [...io.keys, ...extra];
        const sub = { ...io, keys, h: r.h - barH };
        if (t.mode?.kind === 'vim') return drawVim(t, { ...r, h: r.h - barH }, sub, cols, rows);
        if (t.mode?.kind === 'sl') return drawSl(t, { ...r, h: r.h - barH }, cols, rows);
        const busy = t.queue.length > 0;
        for (const k of keys) {
          if (k.ctrl && k.key.toLowerCase() === 'c') { t.queue = []; t.push({ segs: [[pretty(t.cwd) + ' $ ', 'gold'], [t.input + '^C', 'snow']] }); t.input = ''; continue; }
          if (k.ctrl && k.key.toLowerCase() === 'l') { t.lines = []; continue; }
          if (busy) continue;
          if (k.key === 'Enter') { const l = t.input; t.input = ''; t.run(l); }
          else if (k.key === 'Backspace') t.input = t.input.slice(0, -1);
          else if (k.key === 'ArrowUp') { if (t.hist.length) { t.hi = Math.min(t.hist.length - 1, t.hi + 1); t.input = t.hist[t.hi]; } }
          else if (k.key === 'ArrowDown') { t.hi = Math.max(-1, t.hi - 1); t.input = t.hi >= 0 ? t.hist[t.hi] : ''; }
          else if (k.key === 'Tab') t.complete();
          else if (k.key === 'PageUp') t.back += rows - 1;
          else if (k.key === 'PageDown') t.back = Math.max(0, t.back - rows + 1);
          else if (k.key.length === 1 && t.input.length < 200) { t.input += k.key; OS.sfx.key(); }
        }
        if (io.wheel) t.back = Math.max(0, t.back - io.wheel * 3);
        // Righe visibili.
        const disp = [];
        for (const l of t.lines) {
          if (l.segs) disp.push(l);
          else OS.wrap(l.text, cols * OS.CW).forEach((w) => disp.push({ text: w, c: l.c }));
        }
        if (!busy) {
          const pr = pretty(t.cwd) + ' $ ';
          const full = pr + t.input;
          const wrapped = [];
          for (let i = 0; i < full.length || i === 0; i += cols) wrapped.push(full.slice(i, i + cols));
          wrapped.forEach((w, i) => disp.push({ prompt: i === 0 ? pr : '', text: i === 0 ? w.slice(pr.length) : w, last: i === wrapped.length - 1 }));
        }
        t.back = Math.min(t.back, Math.max(0, disp.length - rows));
        const start = Math.max(0, disp.length - rows - t.back);
        const vis = disp.slice(start, start + rows);
        vis.forEach((l, i) => {
          const x = r.x + 3, y = r.y + 2 + i * OS.CH;
          if (l.segs) { let xx = x; for (const [s, c] of l.segs) xx += OS.text(s, xx, y, P[c] || c); return; }
          let xx = x;
          if (l.prompt) xx += OS.text(l.prompt, xx, y, P.gold);
          xx += OS.text(l.text, xx, y, l.c || P.snow);
          if (l.last && t.back === 0 && (Math.floor(OS.time * 2.5) % 2 || !io.focused)) OS.rect(xx + 1, y, 5, 9, io.focused ? P.leaf : P.slate);
        });
        if (t.back > 0) OS.text('▲ ' + t.back, r.x + r.w - 40, r.y + 2, P.gold);
      },
      close() { OS.keyboard(false); }
    };
  }
});

function drawVim(t, r, io, cols, rows) {
  const m = t.mode;
  for (const k of io.keys) {
    if (k.key === 'Escape') { m.cmd = ''; m.ins = false; m.msg = ''; continue; }
    if (m.cmd) {
      if (k.key === 'Enter') {
        const c = m.cmd.slice(1);
        if (['q!', 'wq', 'x', 'wq!', 'qa!'].includes(c)) {
          t.mode = null;
          t.out(L('Sei uscito da vim. Pochi ci riescono.', 'You escaped vim. Few people do.'), P.leaf);
          return;
        }
        m.msg = c === 'q' ? L('E37: Nessuna modifica salvata (aggiungi ! per forzare)', 'E37: No write since last change (add ! to override)') : c === 'help' ? L('Suggerimento: :q!', 'Hint: :q!') : 'E492: ' + L('Non è un comando: ', 'Not an editor command: ') + c;
        m.cmd = '';
      } else if (k.key === 'Backspace') m.cmd = m.cmd.slice(0, -1);
      else if (k.key.length === 1) m.cmd += k.key;
    } else if (k.key === ':') m.cmd = ':';
    else if (k.key === 'i') { m.ins = true; m.msg = ''; }
  }
  OS.rect(r.x, r.y, r.w, r.h, P.night);
  for (let i = 0; i < rows - 1; i++) OS.text('~', r.x + 3, r.y + 2 + i * OS.CH, P.lake);
  OS.text(L('VIM - Vi IMproved', 'VIM - Vi IMproved'), r.x + ((r.w - OS.textW('VIM - Vi IMproved')) >> 1), r.y + 2 + Math.floor(rows / 3) * OS.CH, P.snow);
  OS.text(L('scrivi :help per un aiuto', 'type :help for help'), r.x + 12, r.y + 2 + (Math.floor(rows / 3) + 2) * OS.CH, P.slate);
  const by = r.y + 2 + (rows - 1) * OS.CH;
  const status = m.cmd || m.msg || (m.ins ? L('-- INSERIMENTO --', '-- INSERT --') : '');
  OS.text(status.slice(0, cols), r.x + 3, by, m.msg && !m.cmd ? P.red : P.snow);
  if (m.cmd && Math.floor(OS.time * 2.5) % 2) OS.rect(r.x + 4 + OS.textW(m.cmd), by, 5, 9, P.snow);
}
function drawSl(t, r, cols, rows) {
  const m = t.mode;
  m.t += 1 / 60;
  OS.rect(r.x, r.y, r.w, r.h, P.night);
  const x = r.x + r.w - Math.floor(m.t * 140);
  const y0 = r.y + Math.max(2, Math.floor((r.h - TRAIN.length * OS.CH) / 2));
  TRAIN.forEach((l, i) => OS.text(l, x, y0 + i * OS.CH, i === TRAIN.length - 1 ? P.stone : P.snow));
  for (let i = 0; i < 4; i++) OS.text('(  )', x + 36 + i * 10 - Math.floor(m.t * 20) % 10, y0 - OS.CH - i * 3, P.stone);
  if (x + 35 * OS.CW < r.x) { t.mode = null; t.out(L('Volevi scrivere "ls", vero?', 'You meant "ls", right?'), P.slate); }
}
})();
