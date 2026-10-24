#!/usr/bin/env node
// Il server di carlopezzotti.ch: un solo processo e una sola porta per tutti i siti.
// Davanti c'è il tunnel Cloudflare "carlo.pezzotti", che manda qui ogni hostname di sites.config.json.
//
// Ogni richiesta passa, in ordine, da:
//   1. POST /_deploy        webhook di GitHub (server/deploy.mjs), su qualsiasi hostname;
//   2. /api/…               prima le API del sito (la sua "app"), poi quelle comuni (server/api.mjs);
//   3. app.page()           le pagine generate dal sito (es. l'indice di dd);
//   4. file statici         la cartella del sito (server/static.mjs);
//   5. indirizzo inesistente app.notFound() del sito, oppure la sua index.html se "fallback": "index".
//
// L'hostname sceglie il sito. In locale basta il primo pezzo del nome: http://dd.localhost:8091/.
//
// Uso:  node server/main.mjs [--port 8091] [--deploy]
//   --deploy   segue GitHub: si aggiorna con il webhook e all'avvio. Solo sul server, dove gira
//              in pm2 con ecosystem.config.cjs (pm2 start ecosystem.config.cjs && pm2 save).

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createApi } from "./api.mjs";
import { createDeploy } from "./deploy.mjs";
import { json, log, logError, text } from "./http.mjs";
import { sendIndex, serveStatic } from "./static.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, def) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : def;
};

const config = JSON.parse(readFileSync(join(ROOT, "sites.config.json"), "utf8"));
const PORT = Number(arg("--port", config.server?.port ?? 8090));
const HOST = config.server?.bind ?? "127.0.0.1";

const deploy = createDeploy({ root: ROOT, branch: config.deploy?.branch, enabled: process.argv.includes("--deploy") });
const api = createApi({ config, deploy });

const sites = [];
for (const s of config.sites) {
  const site = { name: s.name, root: resolve(ROOT, s.folder), fallback: s.fallback ?? null, app: null };
  if (s.app) {
    const mod = await import(pathToFileURL(resolve(ROOT, s.app)));
    site.app = mod.default({ root: site.root, config, ROOT });
  }
  sites.push(site);
}
const byHost = new Map(config.sites.flatMap((s, i) => s.hosts.map((h) => [h.toLowerCase(), sites[i]])));
const byName = new Map(sites.map((s) => [s.name, s]));
const siteFor = (host) => byHost.get(host) ?? byName.get(host.split(".")[0]) ?? sites[0];

async function handle(req, res) {
  const host = (req.headers.host ?? "").replace(/:\d+$/, "").toLowerCase();
  let url;
  try {
    url = new URL(req.url, "http://localhost");
  } catch {
    return text(res, 400, "Richiesta non valida");
  }
  if (url.pathname === "/_deploy") return deploy.webhook(req, res);

  const site = siteFor(host);
  if (url.pathname.startsWith("/api/")) {
    if (await site.app?.api?.(req, res, url)) return;
    if (await api(req, res, url)) return;
    return json(req, res, 404, { error: "API inesistente" });
  }
  if (req.method !== "GET" && req.method !== "HEAD") return text(res, 405, "Metodo non ammesso", { Allow: "GET, HEAD" });
  if (await site.app?.page?.(req, res, url)) return;
  if (serveStatic(req, res, site.root, url)) return;
  if (site.app?.notFound) return site.app.notFound(req, res, url);
  if (site.fallback === "index" && sendIndex(req, res, site.root)) return;
  text(res, 404, "Non trovato");
}

createServer((req, res) =>
  handle(req, res).catch((e) => {
    logError(`${req.method} ${req.headers.host}${req.url}: ${e.stack || e.message}`);
    if (!res.headersSent) text(res, 500, "Errore del server");
    else res.destroy();
  }),
).listen(PORT, HOST, () => {
  log(`carlopezzotti.ch su http://${HOST}:${PORT} · ${sites.map((s) => s.name).join(", ")}${deploy.enabled ? " · segue GitHub" : ""}`);
});
