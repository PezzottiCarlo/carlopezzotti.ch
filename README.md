# carlopezzotti.ch

I siti di Carlo Pezzotti e il server che li fa girare, sul server di casa dietro un tunnel Cloudflare.

| Sito | Cartella | Cos'è |
|---|---|---|
| carlopezzotti.ch, www., web. | `sites/www` | il sito personale |
| so.carlopezzotti.ch | `sites/so` | Ceresio OS, un sistema operativo finto in pixel art |
| dd.carlopezzotti.ch | `sites/dd` | gli esperimenti didattici, costruiti sul laboratorio (`docs/lab.md`) |

## Com'è fatto

```
sites.config.json        hostname → cartella, porta, tunnel, meteo, GitHub
server/main.mjs          un solo processo Node, una porta (8090), tutti i siti; zero dipendenze
server/static.mjs        file statici: ETag, niente file nascosti, /cartella → /cartella/
server/api.mjs           /api comuni: health, github/repos, weather (con cache)
server/deploy.mjs        webhook GitHub → git pull → riavvio se cambia il server
server/sites/dd.mjs      il catalogo degli esperimenti, l'indice generato, i 404 con suggerimento
sites/dd/_lab/           il laboratorio comune a tutti gli esperimenti
sites/dd/_template/      l'esperimento modello
scripts/new-experiment.mjs   npm run new: un esperimento nuovo dal modello
scripts/setup-tunnel.mjs     collega gli hostname al tunnel e al DNS di Cloudflare
ecosystem.config.cjs     il processo pm2
```

Ogni richiesta passa dal webhook (`POST /_deploy`), poi dalle API (`/api/…`: prima quelle del
sito, poi quelle comuni), poi dalle pagine generate del sito, poi dai file statici. Un indirizzo
che non esiste va a `notFound` del sito (dd: indice con stato 404 e "forse cercavi…") oppure, per
www e so, alla loro `index.html`.

Un sito con logica sul server dichiara `"app": "server/sites/<nome>.mjs"` in `sites.config.json`.
Il modulo esporta una funzione che riceve `{ root, config }` e restituisce `{ api, page, notFound }`
(tutte facoltative; `api` e `page` restituiscono `true` se hanno risposto). Vedi `server/sites/dd.mjs`.

### API

| | |
|---|---|
| `GET /api/health` | versione (commit), avvio, aggiornamenti attivi |
| `GET /api/github/repos` | repository pubblici di PezzottiCarlo, puliti; cache 15 min, se GitHub non risponde l'ultima risposta buona |
| `GET /api/weather` | meteo attuale a Lugano da open-meteo; cache 10 min |
| `GET /api/experiments` (solo dd) | il catalogo degli esperimenti |
| `GET /api/experiments/<slug>` (solo dd) | un esperimento |

Le risposte hanno `Cache-Control: private, no-cache` (ETag + 304): così Cloudflare non le tiene in
cache e un push è online subito.

## Lavorare in locale

```bash
npm run dev       # http://localhost:8091, si riavvia quando cambia server/
```

Il sito si sceglie dal nome: http://dd.localhost:8091/, http://so.localhost:8091/,
http://www.localhost:8091/. In locale il server non tocca mai git (manca `--deploy`).

Esperimento nuovo: `npm run new -- <cartella> "Titolo"`, poi `docs/lab.md`.

## Pubblicare

**Un push su `main` è già il deploy.** GitHub chiama `https://carlopezzotti.ch/_deploy`; il
server verifica la firma, fa `git merge --ff-only origin/main` nella sua copia
(`~/sites/carlopezzotti.ch`) e, se sono cambiati `server/`, `sites.config.json`, `package.json` o
`ecosystem.config.cjs`, esce e pm2 lo riavvia. Lo stesso controllo gira all'avvio.

Quindi la copia sul server non va modificata a mano: un file cambiato lì blocca il merge. Si
lavora in un'altra cartella (o in un `git worktree`) e si fa push.

```bash
pm2 logs carlopezzotti                 # aggiornamenti, errori
curl -s localhost:8090/api/health      # che versione gira
pm2 restart carlopezzotti              # a mano, se serve
pm2 start ecosystem.config.cjs && pm2 save   # prima installazione
```

## Hostname nuovi

Si aggiungono in `sites.config.json` e poi `npm run tunnel` (oppure `node scripts/setup-tunnel.mjs
--dry-run` per vedere cosa farebbe): imposta l'ingress del tunnel `carlo.pezzotti` verso la porta
8090 e il CNAME proxato su Cloudflare, lasciando stare le regole degli altri servizi.

## Segreti (mai nel repository)

| | Dove |
|---|---|
| segreto del webhook GitHub | `~/.config/carlopezzotti/webhook.secret` (o `WEBHOOK_SECRET`) |
| token Cloudflare (Tunnel Edit, Zone Read, DNS Edit) | `~/.config/cf-panel/token` (o `CLOUDFLARE_API_TOKEN`) |
| accesso a GitHub per il push | `gh` (`~/.config/gh/hosts.yml`) |
