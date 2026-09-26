/* Ceresio OS — dati: curriculum, trofei, GitHub, meteo. */
(() => {
'use strict';
const OS = window.OS;

OS.CV = {
  name: 'Carlo Pezzotti',
  email: 'carlo.pezzotti01@gmail.com',
  github: 'PezzottiCarlo',
  linkedin: '',
  site: 'https://www.carlopezzotti.ch',
  city: 'Lugano', zip: 'CH-6900', lat: 46.0037, lon: 8.9511, tz: 'Europe/Zurich',
  role: {
    it: 'Sviluppatore full-stack e studente di ingegneria informatica',
    en: 'Full-stack developer and computer engineering student'
  },
  lead: {
    it: 'Costruisco software per il web, dal database al pixel. Studio a Lugano e lavoro come freelance.',
    en: 'I build software for the web, from the database to the pixel. I study in Lugano and work freelance.'
  },
  bio: [
    {
      it: 'Vivo a Lugano, tra il lago e le montagne. Abbastanza vicino a Milano e Zurigo per lavorare con entrambe, abbastanza lontano per avere silenzio quando serve.',
      en: 'I live in Lugano, between the lake and the mountains. Close enough to Milan and Zurich to work with both, far enough to get some quiet when I need it.'
    },
    {
      it: "Ho iniziato con l'elettronica e il C# a scuola, poi mi sono spostato sul web. Oggi lavoro su applicazioni full-stack, e la parte che mi piace di più resta capire come funziona una cosa prima di riscriverla meglio.",
      en: 'I started with electronics and C# at school, then moved to the web. Today I work on full-stack applications, and my favourite part is still figuring out how something works before rewriting it better.'
    }
  ],
  specs: [
    [{ it: 'Base', en: 'Based in' }, { it: 'Lugano, Svizzera', en: 'Lugano, Switzerland' }],
    [{ it: 'Fuso orario', en: 'Time zone' }, 'Europe/Zurich'],
    [{ it: 'Studi', en: 'Studies' }, 'SUPSI DTI'],
    [{ it: 'Stato', en: 'Status' }, { it: 'Studente e freelance', en: 'Student and freelancer' }],
    [{ it: 'Lingue di lavoro', en: 'Working languages' }, 'IT / EN / DE / FR']
  ],
  available: { it: 'Disponibile per progetti', en: 'Available for projects' },
  exp: [
    { start: 2016, end: 2017, kind: 'dev', title: { it: 'Adune Grouppe', en: 'Adune Grouppe' },
      desc: { it: 'Stage come sviluppatore junior in C# .NET.', en: 'Junior developer internship in C# .NET.' } },
    { start: 2020, end: 2021, kind: 'service', title: { it: 'Soldato, Esercito svizzero', en: 'Soldier, Swiss Army' },
      desc: { it: 'Servizio militare, ruolo salvataggio e trasmissioni.', en: 'Military service, rescue and signals role.' } },
    { start: 2021, end: 2021, kind: 'service', title: { it: 'Sergente, Esercito svizzero', en: 'Sergeant, Swiss Army' },
      desc: { it: 'Scuola sottufficiali e conduzione di una squadra.', en: 'Non-commissioned officer school and squad leadership.' } },
    { start: 2021, end: 2023, kind: 'job', title: { it: 'Fattorino, pizzeria', en: 'Delivery rider, pizzeria' },
      desc: { it: 'Lavoro part-time durante gli studi.', en: 'Part-time work during my studies.' } },
    { start: 2021, end: 2025, kind: 'job', title: { it: 'Sicurezza, stadio', en: 'Stadium security' },
      desc: { it: 'Gestione della sicurezza durante gli eventi sportivi.', en: 'Safety and crowd management at sporting events.' } },
    { start: 2025, end: 2025, kind: 'research', title: { it: 'Ricercatore junior', en: 'Junior researcher' },
      desc: { it: 'Progetto sui dati delle energie rinnovabili.', en: 'Renewable energy data project.' } },
    { start: 2025, end: null, kind: 'dev', title: { it: 'Sviluppatore freelance', en: 'Freelance developer' },
      desc: { it: 'Applicazioni e siti web su misura, dal progetto al deploy.', en: 'Custom web applications and sites, from design to deploy.' } },
    { start: 2026, end: 2026, kind: 'job', title: { it: 'Supplente di matematica, SM Mendrisio', en: 'Substitute maths teacher, Mendrisio' },
      desc: { it: 'Supplenza di matematica alla scuola media di Mendrisio, da febbraio a maggio.', en: 'Maths substitute teaching at the Mendrisio middle school, from February to May.' } }
  ],
  kinds: {
    dev: { it: 'sviluppo', en: 'development', c: 'lakeHi' },
    job: { it: 'lavoro', en: 'job', c: 'orange' },
    service: { it: 'servizio', en: 'service', c: 'red' },
    research: { it: 'ricerca', en: 'research', c: 'leaf' }
  },
  edu: [
    { school: 'SAM Trevano', place: 'Canobbio, CH', degree: { it: 'Informatica ed elettronica', en: 'Computer science and electronics' } },
    { school: 'SUPSI DTI', place: 'Lugano, CH', degree: { it: 'Bachelor in ingegneria informatica', en: 'BSc in computer engineering' } },
    { school: 'Thomas More', place: 'Geel, BE', degree: { it: 'Erasmus in informatica', en: 'Erasmus in computer science' } },
    { school: 'KU Leuven', place: 'Leuven, BE', degree: { it: 'Corso di integrazione sociale', en: 'Social integration course' } },
    { school: 'SUPSI DFA', place: 'Locarno, CH', degree: { it: 'Formazione e apprendimento', en: 'Education and learning' } }
  ],
  langs: [
    { name: { it: 'Italiano', en: 'Italian' }, level: 'C2', native: true },
    { name: { it: 'Inglese', en: 'English' }, level: 'C1' },
    { name: { it: 'Tedesco', en: 'German' }, level: 'B2' },
    { name: { it: 'Francese', en: 'French' }, level: 'B1' }
  ]
};

/* ------------------------------------------------------------ trofei */
const E = (id, it, en, hit, hen) => ({ id, name: { it, en }, hint: { it: hit, en: hen } });
OS.EGGS = [
  E('konami', 'Codice Konami', 'Konami code', 'Un vecchio codice da sala giochi, sulla tastiera.', 'An old arcade code, on the keyboard.'),
  E('sudo', 'Non sei nei sudoers', 'Not in the sudoers', 'Chiedi i superpoteri al terminale.', 'Ask the terminal for superpowers.'),
  E('rmrf', 'Meditazione del guru', 'Guru meditation', 'Nel terminale, cancella tutto. Proprio tutto.', 'In the terminal, delete everything. Really everything.'),
  E('boat', 'Capitano', 'Captain', 'Saluta il battello sul lago.', 'Wave at the boat on the lake.'),
  E('sun', 'Eclissi', 'Eclipse', 'Il sole non ama essere cliccato troppe volte.', 'The sun does not like being clicked too often.'),
  E('funicular', 'Funicolare', 'Funicular', 'Sali sul San Salvatore.', 'Ride up San Salvatore.'),
  E('bios', 'Smanettone', 'Tinkerer', "Durante l'avvio c'è un tasto per il setup.", 'There is a setup key during boot.'),
  E('trash', 'Rovistatore', 'Dumpster diver', 'Qualcuno ha buttato qualcosa di interessante.', 'Someone threw away something interesting.'),
  E('pizza', 'Consegna lampo', 'Express delivery', 'Consegna 10 pizze in Pizza Rider.', 'Deliver 10 pizzas in Pizza Rider.'),
  E('bricks', 'Muratore', 'Bricklayer', 'Rompi tutti i mattoni di un livello.', 'Break every brick in a level.'),
  E('mines', 'Artificiere', 'Bomb squad', 'Sminare un campo intero.', 'Clear a whole minefield.'),
  E('dj', 'DJ set', 'DJ set', 'Graffia il disco sul giradischi.', 'Scratch the record on the turntable.'),
  E('clock', 'Puntuale', 'Punctual', "Doppio clic sull'orologio in alto a destra.", 'Double-click the clock in the top right.'),
  E('idle', 'Pisolino', 'Nap time', 'Lascia riposare il computer per un minuto.', 'Leave the computer alone for a minute.'),
  E('xyzzy', 'Avventuriero', 'Adventurer', 'Una parola magica da vecchia avventura testuale.', 'A magic word from an old text adventure.'),
  E('salute', 'Attenti!', 'Attention!', 'Un sergente vuole sentirsi dire: attenti.', 'A sergeant wants to hear: attention.'),
  E('paint', 'Artista', 'Artist', 'Dipingi con almeno 8 colori.', 'Paint with at least 8 colours.'),
  E('shutdown', 'Buonanotte', 'Good night', 'Spegni il computer.', 'Shut the computer down.'),
  E('carlo', 'Chi mi chiama?', 'Who called me?', 'Scrivi il mio nome sulla scrivania.', 'Type my name on the desktop.'),
  E('about10', 'Insistente', 'Persistent', 'Insisti sul logo in Informazioni su Ceresio.', 'Keep clicking the logo in About Ceresio.'),
  E('matrix', 'Coniglio bianco', 'White rabbit', 'Nel terminale, segui il coniglio bianco.', 'In the terminal, follow the white rabbit.'),
  E('vim', 'Prigioniero di vim', 'Trapped in vim', 'Apri un editor da cui nessuno è mai uscito.', 'Open an editor nobody ever escaped.'),
  E('coffee', 'Sono una teiera', "I'm a teapot", 'Chiedi un caffè al terminale.', 'Ask the terminal for a coffee.'),
  E('all', 'Completista', 'Completionist', 'Trova tutti gli altri segreti.', 'Find every other secret.')
];

/* ------------------------------------------------------------ rete */
const withTimeout = (url, ms = 5000) => {
  const ctl = new AbortController();
  const id = setTimeout(() => ctl.abort(), ms);
  return fetch(url, { signal: ctl.signal }).finally(() => clearTimeout(id));
};

OS.repos = null;
OS.loadRepos = async () => {
  try {
    const c = JSON.parse(sessionStorage.getItem('ceresio.repos') || 'null');
    if (c && Date.now() - c.t < 15 * 60e3) { OS.repos = c.list; return c.list.length + ' repo'; }
  } catch { /* nessuna cache */ }
  const r = await withTimeout('https://api.github.com/users/' + OS.CV.github + '/repos?per_page=100&sort=updated');
  if (!r.ok) throw new Error('GitHub ' + r.status);
  // Il font conosce solo latino e pochi simboli: via emoji e caratteri esotici.
  const clean = (s) => (s || '').replace(/[^ -ɏ€★♥♪…’‘“”–—]/gu, '').replace(/\s+/g, ' ').trim();
  const list = (await r.json()).map((x) => ({
    name: x.name, desc: clean(x.description), lang: x.language || '', stars: x.stargazers_count,
    forks: x.forks_count, url: x.html_url, updated: x.pushed_at || x.updated_at, fork: x.fork, home: x.homepage || ''
  })).sort((a, b) => (a.fork - b.fork) || (b.updated > a.updated ? 1 : -1));
  OS.repos = list;
  try { sessionStorage.setItem('ceresio.repos', JSON.stringify({ t: Date.now(), list })); } catch { /* ignorato */ }
  return list.length + ' repo';
};

OS.weather = null;
OS.loadWeather = async () => {
  const u = `https://api.open-meteo.com/v1/forecast?latitude=${OS.CV.lat}&longitude=${OS.CV.lon}&current=temperature_2m,weather_code,is_day&timezone=Europe%2FZurich`;
  const r = await withTimeout(u, 4000);
  if (!r.ok) throw new Error('meteo ' + r.status);
  const c = (await r.json()).current;
  OS.weather = { temp: Math.round(c.temperature_2m), code: c.weather_code };
  return OS.weather.temp + '°C';
};
// Codici WMO -> tipo di cielo usato dallo sfondo.
OS.wxKind = () => {
  const s = OS.settings.wx;
  if (s && s !== 'auto') return s;
  const c = OS.weather?.code;
  if (c == null) return 'clear';
  if (c >= 95) return 'storm';
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow';
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return 'rain';
  if (c === 45 || c === 48) return 'fog';
  if (c >= 2) return 'cloudy';
  return 'clear';
};
OS.wxName = (k) => OS.tx({
  clear: { it: 'sereno', en: 'clear' }, cloudy: { it: 'nuvoloso', en: 'cloudy' }, rain: { it: 'pioggia', en: 'rain' },
  snow: { it: 'neve', en: 'snow' }, storm: { it: 'temporale', en: 'storm' }, fog: { it: 'nebbia', en: 'fog' }
}[k]);

OS.tasks.push(
  { it: 'Leggo il curriculum', en: 'Reading the CV', run: async () => OS.CV.exp.length + ' ' + OS.L('voci', 'entries') },
  { it: 'Cerco repository su GitHub', en: 'Fetching GitHub repositories', run: OS.loadRepos },
  { it: 'Guardo il cielo di Lugano', en: 'Checking the sky over Lugano', run: OS.loadWeather },
  { it: 'Preparo i trofei', en: 'Preparing trophies', run: async () => OS.found.size + '/' + OS.EGGS.length }
);
})();
