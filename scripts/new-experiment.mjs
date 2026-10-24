#!/usr/bin/env node
// Crea un nuovo esperimento di dd copiando il modello sites/dd/_template.
//
// Uso:  npm run new -- <cartella> "Titolo" [--tags "funzioni, grafici"] [--description "…"]
//   es. npm run new -- frazioni "La pizza delle frazioni" --tags "prima media, frazioni"
//
// La cartella diventa l'indirizzo (dd.carlopezzotti.ch/<cartella>/) e il prefisso dei progressi
// in localStorage. Il catalogo dell'indice si aggiorna da solo: basta fare push.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DD = join(ROOT, "sites", "dd");
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const [, v] = args.splice(i, 2);
  return v;
};
const tags = opt("--tags") ?? "";
const description = opt("--description") ?? "";
const [slug, title] = args;

const die = (msg) => {
  console.error(msg + '\nUso: npm run new -- <cartella> "Titolo" [--tags "a, b"] [--description "…"]');
  process.exit(1);
};
if (!slug || !title) die("Servono la cartella e il titolo.");
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) die(`"${slug}": la cartella può avere solo lettere minuscole, cifre e trattini.`);
const dir = join(DD, slug);
if (existsSync(dir)) die(`sites/dd/${slug} esiste già.`);

const attr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const text = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Zurich" }).format(new Date());

let page = readFileSync(join(DD, "_template", "index.html"), "utf8");
const swap = (re, to) => {
  if (!re.test(page)) throw new Error(`modello cambiato: non trovo ${re}`);
  page = page.replace(re, to);
};
swap(/<title>[^<]*<\/title>/, `<title>${text(title)}</title>`);
swap(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(description)}">`);
swap(/<meta name="dd:tags" content="[^"]*">/, `<meta name="dd:tags" content="${attr(tags)}">`);
swap(/<meta name="dd:date" content="[^"]*">/, `<meta name="dd:date" content="${today}">`);
swap(/<!--\n  Esperimento modello[\s\S]*?-->\n/, `<!--\n  Nato dal modello sites/dd/_template: il gioco del numero nascosto è lì solo come esempio,\n  sostituiscilo con il tuo. La guida al laboratorio è in docs/lab.md.\n-->\n`);
swap(/<h1>[^<]*<\/h1>/, `<h1>${text(title)}</h1>`);
swap(/lab\(\{ id:'numero'/, `lab({ id:'${slug}'`);

mkdirSync(dir);
writeFileSync(join(dir, "index.html"), page);
console.log(`Creato sites/dd/${slug}/index.html (${title}).
  1. npm run dev  →  http://dd.localhost:8091/${slug}/
  2. scrivi la descrizione e i tag nei <meta>, poi sostituisci il gioco d'esempio con il tuo
  3. commit e push su main: il server si aggiorna e l'esperimento compare nell'indice`);
