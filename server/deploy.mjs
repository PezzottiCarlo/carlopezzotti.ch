// Aggiornamento automatico da GitHub.
//
// Un webhook (evento push) chiama POST /_deploy su uno qualsiasi degli hostname. Se la firma
// torna con il segreto, il server porta la copia locale su origin/<branch>. Lo stesso controllo
// gira all'avvio, per i push arrivati mentre il server era spento.
//
// I file statici vengono letti a ogni richiesta, quindi sono online subito. Se cambia il codice
// del server (server/, sites.config.json, package.json, ecosystem.config.cjs) il processo esce
// e pm2 lo riavvia.
//
// Il segreto sta in WEBHOOK_SECRET o in ~/.config/carlopezzotti/webhook.secret.
// Funziona solo con --deploy: in locale il server non tocca mai git.

import { execFile } from "node:child_process";
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { log, logError, readBody, text } from "./http.mjs";

const run = promisify(execFile);
const RESTART = (f) => f.startsWith("server/") || ["sites.config.json", "package.json", "ecosystem.config.cjs"].includes(f);

function readSecret() {
  if (process.env.WEBHOOK_SECRET) return process.env.WEBHOOK_SECRET.trim();
  try {
    return readFileSync(join(homedir(), ".config", "carlopezzotti", "webhook.secret"), "utf8").trim();
  } catch {
    return "";
  }
}

export function createDeploy({ root, branch = "main", enabled }) {
  const git = (...a) => run("git", a, { cwd: root });
  const secret = enabled ? readSecret() : "";
  let commit = "";
  git("log", "-1", "--format=%h %s")
    .then(({ stdout }) => (commit = stdout.trim()))
    .catch(() => {});

  let updating = false;
  let again = false;
  async function update() {
    if (updating) {
      again = true; // un push arrivato durante l'aggiornamento: si ricontrolla dopo
      return;
    }
    updating = true;
    try {
      await git("fetch", "--quiet", "origin", branch);
      const [{ stdout: head }, { stdout: remote }] = await Promise.all([
        git("rev-parse", "HEAD"),
        git("rev-parse", `origin/${branch}`),
      ]);
      if (head.trim() === remote.trim()) return;
      await git("merge", "--ff-only", "--quiet", `origin/${branch}`);
      commit = (await git("log", "-1", "--format=%h %s")).stdout.trim();
      log(`aggiornato a ${commit}`);
      const { stdout: changed } = await git("diff", "--name-only", head.trim(), remote.trim());
      if (changed.split("\n").some(RESTART)) {
        log("codice del server cambiato: riavvio");
        setTimeout(() => process.exit(0), 200);
      }
    } catch (e) {
      logError(`aggiornamento fallito: ${e.stderr || e.message}`);
    } finally {
      updating = false;
      if (again) {
        again = false;
        update();
      }
    }
  }

  async function webhook(req, res) {
    if (req.method !== "POST") return text(res, 405, "solo POST", { Allow: "POST" });
    if (!secret) return text(res, 503, "webhook non configurato");
    let body;
    try {
      body = await readBody(req);
    } catch {
      return;
    }
    const sig = Buffer.from(String(req.headers["x-hub-signature-256"] ?? ""));
    const want = Buffer.from("sha256=" + createHmac("sha256", secret).update(body).digest("hex"));
    if (sig.length !== want.length || !timingSafeEqual(sig, want)) return text(res, 401, "firma non valida");
    const event = req.headers["x-github-event"];
    if (event === "ping") return text(res, 200, "pong");
    let ref = "";
    try {
      ref = JSON.parse(body).ref;
    } catch {}
    if (event !== "push" || ref !== `refs/heads/${branch}`) return text(res, 202, "ignorato");
    update();
    text(res, 202, "aggiornamento avviato");
  }

  if (enabled) update();
  return { webhook, update, enabled, get commit() { return commit; } };
}
