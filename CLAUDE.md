# carlopezzotti.ch — note per gli agenti

@README.md
@docs/lab.md

## Regole di lavoro

- Testi dei siti e commenti nel codice in italiano; messaggi di commit in inglese, come nella storia del repository.
- **Push su `main` = online.** Il server di produzione è la copia in `~/sites/carlopezzotti.ch`
  e si aggiorna da solo con il webhook. Non modificare file in quella cartella: lavora in un
  `git worktree` (o in un'altra copia), prova con `npm run dev` e poi fai push.
- Il server non ha dipendenze npm: il deploy è solo `git pull`. Non aggiungerne senza motivo; se
  servissero, il deploy dovrebbe anche fare `npm ci`.
- Un esperimento nuovo parte sempre da `npm run new` e usa il laboratorio (`/_lab/`): niente copie
  di CSS o di logica già presenti lì. Se manca qualcosa che servirà anche ad altri, aggiungilo al
  laboratorio e documentalo in `docs/lab.md`.
- Prova le pagine davvero, anche a 390 px di larghezza. Su questa macchina c'è Chromium headless:
  `~/.cache/ms-playwright/chromium-1140/chrome-linux/chrome` (con `playwright-core` in una cartella
  temporanea; per scegliere il sito usa il server come proxy HTTP verso `http://dd.carlopezzotti.ch/`).
- Cambiando il formato di una chiave in localStorage, scrivi una migrazione: gli allievi non devono
  perdere i progressi.
- Nessun segreto nel repository (tabella in fondo al README).
