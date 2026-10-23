#!/usr/bin/env node
// Serve tutti i siti di carlopezzotti.ch da un'unica porta, scegliendo la cartella
// in base all'hostname (sites.config.json). Davanti c'è il tunnel Cloudflare.
//
// Regole, come le aveva Firebase Hosting:
//   - i file che iniziano con "." e gli "_*.html" non vengono mai serviti;
//   - un percorso che non esiste risponde con l'index.html del sito (SPA);
//   - html e json non vanno in cache, js/css/svg/immagini per un'ora.
//
// Aggiornamento: un webhook GitHub (evento push) chiama POST /_deploy su uno
// qualsiasi degli hostname. Se la firma torna con il segreto, il server porta
// la copia locale su origin/main e rigenera l'indice di dd. Lo stesso controllo
// gira all'avvio, per i push arrivati mentre il server era spento.
// Il segreto sta in WEBHOOK_SECRET o in ~/.config/carlopezzotti/webhook.secret.
// --pull <secondi> aggiunge un controllo periodico, se mai servisse.
//
// Uso:  node scripts/serve.mjs [--port 8090] [--pull 600]
// Sul server gira in pm2:
//   pm2 start scripts/serve.mjs --name carlopezzotti --cwd ~/sites/carlopezzotti.ch
//   pm2 save

import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { createHmac, timingSafeEqual } from "node:crypto";
import { homedir } from "node:os";
import { readFileSync, statSync, createReadStream } from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, def) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : def;
};

const config = JSON.parse(readFileSync(join(ROOT, "sites.config.json"), "utf8"));
const PORT = Number(arg("--port", config.server?.port ?? 8090));
const HOST = config.server?.bind ?? "127.0.0.1";
const PULL = Number(arg("--pull", 0));

// hostname → cartella; il primo sito fa anche da predefinito.
const sites = new Map();
for (const s of config.sites) for (const h of s.hosts) sites.set(h.toLowerCase(), resolve(ROOT, s.folder));
const fallback = resolve(ROOT, config.sites[0].folder);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".pdf": "application/pdf",
};

const hidden = (rel) => rel.split("/").some((p) => p.startsWith(".")) || /(^|\/)_[^/]*\.html$/.test(rel);

function stat(file) {
  try {
    return statSync(file);
  } catch {
    return null;
  }
}

function send(req, res, file, st, status = 200) {
  const ext = extname(file).toLowerCase();
  const etag = `"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
  res.setHeader("Content-Type", TYPES[ext] ?? "application/octet-stream");
  res.setHeader(
    "Cache-Control",
    ext === ".html" || ext === ".json" ? "public, max-age=0, must-revalidate" : "public, max-age=3600",
  );
  res.setHeader("ETag", etag);
  res.setHeader("Last-Modified", st.mtime.toUTCString());
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (status === 200 && req.headers["if-none-match"] === etag) {
    res.writeHead(304).end();
    return;
  }
  res.writeHead(status, { "Content-Length": st.size });
  if (req.method === "HEAD") res.end();
  else createReadStream(file).pipe(res);
}

function handle(req, res) {
  if (req.method === "POST" && req.url === "/_deploy") return webhook(req, res);
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  const host = (req.headers.host ?? "").replace(/:\d+$/, "").toLowerCase();
  const base = sites.get(host) ?? fallback;

  let path;
  try {
    path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  const file = resolve(base, "." + path);
  const rel = file.slice(base.length + 1).replaceAll(sep, "/");
  if ((file !== base && !file.startsWith(base + sep)) || hidden(rel)) return spa(req, res, base);

  const st = stat(file);
  if (st?.isFile()) return send(req, res, file, st);
  if (st?.isDirectory()) {
    const index = join(file, "index.html");
    const ist = stat(index);
    if (ist) {
      // /fogli → /fogli/, così i percorsi relativi della pagina funzionano
      if (!path.endsWith("/")) {
        const q = req.url.indexOf("?");
        res.writeHead(301, { Location: path + "/" + (q >= 0 ? req.url.slice(q) : "") }).end();
        return;
      }
      return send(req, res, index, ist);
    }
  }
  spa(req, res, base);
}

function spa(req, res, base) {
  const index = join(base, "index.html");
  const st = stat(index);
  if (st) return send(req, res, index, st);
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Non trovato\n");
}

// --- aggiornamento automatico da GitHub -------------------------------------
const run = promisify(execFile);
const git = (...a) => run("git", a, { cwd: ROOT });
const buildManifest = () => run(process.execPath, [join(ROOT, "scripts", "build-dd-manifest.mjs")], { cwd: ROOT });

let updating = false;
async function update() {
  if (updating) return;
  updating = true;
  try {
    await git("fetch", "--quiet", "origin", "main");
    const [{ stdout: head }, { stdout: remote }] = await Promise.all([
      git("rev-parse", "HEAD"),
      git("rev-parse", "origin/main"),
    ]);
    if (head.trim() === remote.trim()) return;
    await git("merge", "--ff-only", "--quiet", "origin/main");
    await buildManifest();
    const { stdout } = await git("log", "-1", "--format=%h %s");
    console.log(`[${new Date().toISOString()}] aggiornato a ${stdout.trim()}`);
  } catch (e) {
    console.error(`[${new Date().toISOString()}] aggiornamento fallito: ${e.stderr || e.message}`);
  } finally {
    updating = false;
  }
}

// --- webhook GitHub -------------------------------------------------------------
const SECRET = (() => {
  if (process.env.WEBHOOK_SECRET) return process.env.WEBHOOK_SECRET.trim();
  try {
    return readFileSync(join(homedir(), ".config", "carlopezzotti", "webhook.secret"), "utf8").trim();
  } catch {
    return "";
  }
})();

function webhook(req, res) {
  const done = (status, msg) => res.writeHead(status, { "Content-Type": "text/plain" }).end(msg + "\n");
  if (!SECRET) return done(503, "webhook non configurato");
  const chunks = [];
  let size = 0;
  req.on("data", (c) => {
    size += c.length;
    if (size > 1 << 20) req.destroy();
    else chunks.push(c);
  });
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const sig = Buffer.from(String(req.headers["x-hub-signature-256"] ?? ""));
    const want = Buffer.from("sha256=" + createHmac("sha256", SECRET).update(body).digest("hex"));
    if (sig.length !== want.length || !timingSafeEqual(sig, want)) return done(401, "firma non valida");
    const event = req.headers["x-github-event"];
    if (event === "ping") return done(200, "pong");
    let ref = "";
    try {
      ref = JSON.parse(body).ref;
    } catch {}
    if (event !== "push" || ref !== "refs/heads/main") return done(202, "ignorato");
    update();
    done(202, "aggiornamento avviato");
  });
}

await buildManifest().catch((e) => console.error("indice di dd non generato:", e.stderr || e.message));
update();
createServer(handle).listen(PORT, HOST, () => {
  console.log(`carlopezzotti.ch in ascolto su http://${HOST}:${PORT} (${[...sites.keys()].join(", ")})`);
});
if (PULL > 0) setInterval(update, PULL * 1000);
