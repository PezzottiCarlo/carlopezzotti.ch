// File statici di un sito, con le regole che aveva Firebase Hosting:
//   - i file e le cartelle che iniziano con "." e gli "_*.html" non vengono mai serviti;
//   - una cartella con index.html si apre con la barra finale (/fogli → /fogli/),
//     così i percorsi relativi della pagina funzionano.

import { statSync, createReadStream } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { CACHE } from "./http.mjs";

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

export function stat(file) {
  try {
    return statSync(file);
  } catch {
    return null;
  }
}

export function sendFile(req, res, file, st, status = 200) {
  const etag = `"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
  res.setHeader("Content-Type", TYPES[extname(file).toLowerCase()] ?? "application/octet-stream");
  res.setHeader("Cache-Control", CACHE);
  res.setHeader("ETag", etag);
  res.setHeader("Last-Modified", st.mtime.toUTCString());
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (status === 200 && req.headers["if-none-match"] === etag) return res.writeHead(304).end();
  res.writeHead(status, { "Content-Length": st.size });
  if (req.method === "HEAD") res.end();
  else createReadStream(file).pipe(res);
}

// Risponde con il file richiesto e restituisce true; false se il file non c'è (o non si può servire).
export function serveStatic(req, res, root, url) {
  let path;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    return false;
  }
  const file = resolve(root, "." + path);
  const rel = file.slice(root.length + 1).replaceAll(sep, "/");
  if ((file !== root && !file.startsWith(root + sep)) || hidden(rel)) return false;

  const st = stat(file);
  if (st?.isFile()) {
    sendFile(req, res, file, st);
    return true;
  }
  if (st?.isDirectory()) {
    const index = join(file, "index.html");
    const ist = stat(index);
    if (!ist) return false;
    if (!path.endsWith("/")) {
      res.writeHead(301, { Location: url.pathname + "/" + url.search }).end();
      return true;
    }
    sendFile(req, res, index, ist);
    return true;
  }
  return false;
}

// La pagina principale del sito, per gli indirizzi che non esistono (siti a pagina singola).
export function sendIndex(req, res, root) {
  const index = join(root, "index.html");
  const st = stat(index);
  if (!st) return false;
  sendFile(req, res, index, st);
  return true;
}
