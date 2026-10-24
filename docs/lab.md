# Il laboratorio di dd

Tutti gli esperimenti di **dd.carlopezzotti.ch** hanno la stessa grafica e la stessa meccanica:
una barra con i livelli, una scena a sinistra, un pannello a destra con il feedback del
milieu e gli strumenti, un diario delle mosse, un dialogo con coriandoli a fine livello.
Questa parte comune vive in `sites/dd/_lab/`. Un esperimento scrive solo la sua scena e le
sue regole.

| File | Cosa contiene |
|---|---|
| `sites/dd/_lab/lab.css` | colori, cornice, pulsanti, pannello, feedback, diario, dialogo |
| `sites/dd/_lab/lab.js` | `lab()`: livelli, progressi, feedback, diario, dialogo, azioni; più i piccoli attrezzi |
| `sites/dd/_lab/audio.js` | suono calcolato dalle funzioni, uscita audio, grafici del suono (per beat e suona) |
| `sites/dd/_template/` | un esperimento completo e funzionante da copiare (dd.carlopezzotti.ch/_template/) |

## Un esperimento nuovo

```bash
npm run new -- frazioni "La pizza delle frazioni" --tags "prima media, frazioni"
npm run dev            # poi apri http://dd.localhost:8091/frazioni/
```

Il comando copia `_template` in `sites/dd/frazioni/` con titolo, data e prefisso dei
progressi già impostati. Dentro c'è il gioco del numero nascosto come esempio: si
sostituisce con il proprio. Con `git push` su `main` l'esperimento è online e compare
nell'indice. Non serve registrarlo da nessuna parte: il server legge le cartelle.

L'indice prende i dati dall'`index.html` dell'esperimento:

```html
<title>La pizza delle frazioni</title>
<meta name="description" content="Una frase che invoglia a provare.">
<meta name="dd:tags" content="prima media, frazioni">
<meta name="dd:date" content="2026-10-24">   <!-- ordina l'indice, i più recenti prima -->
<meta name="dd:hidden">                       <!-- facoltativo: online ma fuori dall'indice -->
```

Le cartelle che iniziano con `_` o `.` non sono esperimenti.

## Lo scheletro della pagina

Il laboratorio riempie gli elementi che trova con questi `id`. Quelli che mancano li salta.

```html
<link rel="stylesheet" href="/_lab/lab.css">
<body class="fit">                      <!-- su schermi grandi tutto sta nella finestra -->
<div class="app">
  <header class="topbar">
    <div class="brand">
      <a class="dd-back" href="/">←dd</a>  <div class="logo"><svg>…</svg></div>
      <div><h1>Titolo</h1><p>Sottotitolo</p></div>
    </div>
    <nav class="levels" id="levels"></nav>            <!-- i pulsanti dei livelli -->
    <div class="top-tools">
      <div id="sym"></div>                            <!-- interruttore "Simboli" (se sym) -->
      <button class="btn ghost-btn icon-btn" id="reset"></button>   <!-- ↺ ricomincia il livello -->
    </div>
  </header>
  <main class="layout">
    <section class="card stage-card"><div class="mission" id="mission"></div> … la scena …</section>
    <aside class="card panel">
      <div class="feedback info" id="feedback"></div>
      <div class="tools" id="tools"></div>               <!-- gli strumenti del livello -->
      <details class="diario" id="diario" data-title="Diario" data-empty="Ancora niente."></details>
    </aside>
  </main>
</div>
<script type="module"> import { lab } from '/_lab/lab.js'; … </script>
```

Dialogo di fine livello, coriandoli e annunci per i lettori di schermo li crea `lab.js`.
Se `#mission` o `#diario` contengono già il loro markup (per esempio un pulsante in più nella
missione), il laboratorio usa quello che c'è invece di ricrearlo.

## lab()

```js
import { lab, $ } from '/_lab/lab.js';

const app = lab({
  id: 'frazioni',            // prefisso in localStorage: frazioni.unlocked, frazioni.done, frazioni.sym
  sym: { onChange(on){ … } }, // oppure true: interruttore "Simboli" (mette body.sym-on)
  reset: true,               // ↺ in #reset (false lo nasconde)
  onLevel(i, level){ … },    // prima di ogni level.enter(): pulire la scena comune
  act(name, node, e){ … },   // azioni data-act che il livello non gestisce in level.on
});

const L1 = {
  nav: '1. La pizza',        // etichetta nella barra (predefinita: "1. <title>")
  title: 'La pizza',         // titolo della missione
  mission: 'Dividi la pizza in parti uguali…',
  badge: 'Livello 1',        // facoltativo; challenge: true → "Sfida"
  id: 'pizza',               // facoltativo: ?livello=pizza invece di ?livello=1
  enter(){ … },              // prepara la scena; app.L è vuoto
  restart(){ … },            // facoltativo: cosa fa ↺ (predefinito: rientra nel livello)
  leave(){ … },              // facoltativo: prima di cambiare livello (fermare l'audio…)
  on: {                      // azioni: data-act="taglia" su un pulsante o un <form>
    taglia(btn, e){ this.render(); },   // this è il livello
  },
};

app.start([L1, L2, L3]);     // sempre alla fine, quando tutto è definito
```

### Stato e flusso

| | |
|---|---|
| `app.L` | lo stato del livello in corso; si svuota a ogni ingresso |
| `app.idx`, `app.level`, `app.levels` | livello in corso |
| `app.go(i)`, `app.next()`, `app.restart()` | cambiare livello (i bloccati non si aprono) |
| `app.complete(i = idx, { stars })` | ✓ al livello e sblocco del successivo; `true` la prima volta |
| `app.isDone(i)`, `app.unlocked`, `app.stars(i)` | progressi |
| `app.sym` | interruttore Simboli acceso? |
| `app.store` | `get(k, d)` / `set(k, v)` / `del(k)` in localStorage con il prefisso dell'esperimento |
| `app.busy` | `true` durante un'animazione: le azioni `data-act` aspettano |
| `app.gen`, `app.alive(gen)` | cresce a ogni cambio livello; dopo un `await` controlla di essere ancora lì |

```js
async misura(){
  const gen = app.gen;
  app.busy = true;
  await wait(800);                 // animazione
  if (!app.alive(gen)) return;     // nel frattempo l'allievo ha cambiato livello
  app.busy = false;
  …
}
```

### Feedback, diario, missione, dialogo

```js
app.say('ok', 'Giusto!', 'La pila misura <strong>3 mm</strong>.');   // info | ok | tilt | error | win
app.log('Prova: entra 3, esce 7');        // una riga nel diario (restituisce il <li>)
app.clearLog();                            // il diario si svuota da solo al cambio livello
app.mission({ title: 'Dimostrazione', text: '…', badge: '…' });

app.complete();
app.win({
  title: 'Tre misure esatte!',
  text: 'Hai trovato una pila misurabile per ogni carta.',
  extra: '<ul class="dlg-list"><li>…</li></ul>',   // facoltativo
  reflect: 'Una domanda per ripensare a cosa è successo.',
  stars: 3,                                        // facoltativo: ★★★
  next: 'Livello successivo →', stay: 'Resta qui',
  then: () => app.next(),                          // il pulsante principale
  confetti: true, focus: 'next',
});
```

### Azioni

Ogni elemento con `data-act="nome"` chiama `level.on.nome(elemento, evento)` (un `<form data-act>`
alla consegna, senza ricaricare la pagina). `data-input="nome"` chiama `level.on.nome(campo)` a
ogni modifica, anche mentre `app.busy` è vero. Gli elementi dentro il dialogo non passano di qui.

### Indirizzi

| | |
|---|---|
| `?livello=3` o `?livello=pizza` | apre quel livello (se è sbloccato); il laboratorio lo tiene aggiornato |
| `?tutti` (o `?livelli=tutti`) | tutti i livelli aperti, senza salvarlo: per l'insegnante |
| `?debug` | `window.__lab` con `app` e quello che passi a `app.debug({ … })` |

## Attrezzi

```js
import { $, $$, esc, plural, rnd, pick, shuffle, clamp, params, reduceMotion,
         wait, fmt, replay, store, announce, fx } from '/_lab/lab.js';
```

- `wait(ms)`: pausa per animazioni; con "riduci movimento" dura al massimo 120 ms.
- `fmt(x, d = 2)`: numero all'italiana (virgola, segno −), `—` se non è un numero.
- `plural(n, 'pallina', 'palline')` → "1 pallina", "3 palline".
- `replay(nodo, 'bump')`: fa ripartire un'animazione CSS.
- `store('chiave')`: localStorage sicuro, per chiavi fuori dal prefisso dell'esperimento.
- `fx.confetti()` fontana, `fx.rain()` pioggia, `fx.burst(x, y, n, { col, size, speed })` scintille.
- Ogni `.btn` e `.pill` fa l'onda quando lo premi: è automatico.

## Classi CSS

- Cornice: `.app`, `.topbar`, `.brand`, `.logo`, `.dd-back`, `.levels`, `.layout`, `.stage-card`, `.panel`, `.tools`, `body.fit`.
- Pannello: `.tool` (con `h3` e `.sub`), `.row`, `.seg`, `.coins` con `.coin`/`.coin.used`, `.tool .goal` (★★☆), `.math`.
- Comandi: `.btn`, `.btn.ghost-btn`, `.btn.grow`, `.icon-btn`, `.pill` (`aria-pressed="true"` = scelto), `.num-input`.
- Etichette: `.dd-badge`, `.dd-chip`. Feedback: `.feedback.info|ok|tilt|error|win`.
- Dialogo: `.dlg-list`, `.idcard`.
- Colori in `:root`: `--primary`, `--ok`, `--tilt`, `--err`, `--win` (ognuno con `-soft` e `-line`), `--ink`, `--muted`, `--line`, `--gold`, `--math`. `--panel-w` è la larghezza del pannello.

Per cambiare un dettaglio solo in un esperimento si riscrive la regola nel suo `<style>`, che
viene dopo `lab.css`.

## Suono: audio.js

```js
import { SR, TWO_PI, noise, render, createAudio, fitCanvas, smoothEnv, dpr } from '/_lab/audio.js';

const audio = createAudio({ gain: .55 });            // { compressor: true, headroom: 2 } per mix pieni
audio.play(render(t => Math.exp(-6 * t) * Math.sin(TWO_PI * 440 * t), 1.2));
audio.stopAll();
audio.chime();                                        // il «bravo»: tre note che si spengono
```

- `render(fn, durata, fadeIn)` campiona `fn(t, j)` a 44 100 valori al secondo e sfuma la fine.
- `audio.play(dati, { delay, loop, times, gain, node })` restituisce `{ src, t0, g, dur }`.
- `audio.ctx`, `audio.master`, `audio.ensure()`, `audio.buffer(dati)` per costruire grafi propri (beat).
- `fitCanvas(canvas)` → `[w, h, rapporto]` in pixel veri; `smoothEnv(get, N, W, raggio)` il volume
  di un segnale per il disegno, con `.peak`.

## Come sono fatti gli esperimenti

- In italiano, con pochissimo testo: il milieu risponde alle mosse (Brousseau), non spiega prima.
- Feedback sempre nello stesso riquadro, con il colore giusto: `info` osserva, `ok` bene, `tilt`
  attento, `error` il milieu ti smentisce, `win` vittoria.
- Ogni livello finisce con `app.win` e una domanda in `reflect` per ripensare a quello che è successo.
- Funziona dal telefono: niente che dipenda solo dal passaggio del mouse, controllare a 390 px.
- Accessibile: `aria-label` sugli elementi disegnati, tastiera dove si può, `reduceMotion` rispettato.
- Niente librerie esterne né CDN: tutto quello che serve è in `_lab/`.
- I progressi stanno nel browser dell'allievo (localStorage). Se cambi il formato di una chiave,
  scrivi una migrazione una tantum come in `equazioni` e `suona`.

## Provare

`npm run dev` avvia il server su http://localhost:8091 e lo riavvia quando cambia il codice del
server; i file dei siti si leggono a ogni richiesta. Ogni sito risponde al suo nome:
http://dd.localhost:8091/, http://so.localhost:8091/, http://www.localhost:8091/.
