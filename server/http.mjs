// Risposte comuni a tutto il server.
//
// "private, no-cache": il browser ricontrolla ogni risposta con l'ETag e riceve un 304
// se non è cambiata, così un push è online subito. "private" serve perché Cloudflare
// non metta le risposte nella sua cache e non sostituisca l'header con le sue 4 ore
// (non c'è un token con il permesso di svuotarla).

import { createHash } from "node:crypto";

export const CACHE = "private, no-cache";

export const log = (...a) => console.log(`[${new Date().toISOString()}]`, ...a);
export const logError = (...a) => console.error(`[${new Date().toISOString()}]`, ...a);

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Corpo già in memoria (HTML generato, JSON): ETag dal contenuto, 304 se non è cambiato.
export function sendBody(req, res, status, body, type, headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const etag = `"${createHash("sha1").update(buf).digest("base64url").slice(0, 22)}"`;
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", headers["Cache-Control"] ?? CACHE);
  res.setHeader("ETag", etag);
  res.setHeader("X-Content-Type-Options", "nosniff");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  if (status === 200 && req.headers["if-none-match"] === etag) return res.writeHead(304).end();
  res.writeHead(status, { "Content-Length": buf.length });
  res.end(req.method === "HEAD" ? undefined : buf);
}

export const json = (req, res, status, data, headers) =>
  sendBody(req, res, status, JSON.stringify(data, null, 2) + "\n", "application/json; charset=utf-8", headers);

export const html = (req, res, status, body, headers) => sendBody(req, res, status, body, "text/html; charset=utf-8", headers);

export const text = (res, status, msg, headers = {}) =>
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", ...headers }).end(msg + "\n");

// Corpo di una richiesta, con un tetto: oltre `max` byte la connessione viene chiusa.
export function readBody(req, max = 1 << 20) {
  return new Promise((ok, fail) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > max) {
        req.destroy();
        fail(new Error("corpo troppo grande"));
      } else chunks.push(c);
    });
    req.on("end", () => ok(Buffer.concat(chunks)));
    req.on("error", fail);
  });
}
