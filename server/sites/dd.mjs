// dd.carlopezzotti.ch: il catalogo degli esperimenti vive nel server.
//
// Ogni sottocartella di sites/dd con un index.html è un esperimento. I dati vengono letti
// dall'index.html stesso, così aggiungere un esperimento = aggiungere una cartella:
//   <title>                                    → titolo
//   <meta name="description">                  → descrizione
//   <meta name="dd:tags" content="a, b">       → argomenti (facoltativo)
//   <meta name="dd:date" content="AAAA-MM-GG"> → data, usata per l'ordinamento (facoltativo)
//   <meta name="dd:hidden">                    → esclude l'esperimento dall'indice (facoltativo)
// Le cartelle che iniziano con "_" o "." non sono esperimenti (_lab, _template).
//
// Il catalogo si rilegge da solo quando una cartella o un index.html cambia: niente build.
//
//   GET /api/experiments          l'elenco, i più recenti prima
//   GET /api/experiments/<slug>   un esperimento
//   GET /                         l'indice, generato sul server da sites/dd/index.html
//   indirizzo inesistente         l'indice con stato 404 e l'esperimento dal nome più simile

import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { esc, html, json, logError, text } from "../http.mjs";
import { stat } from "../static.mjs";

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();

function meta(page, name) {
  for (const tag of page.match(/<meta\b[^>]*>/gi) ?? []) {
    const n = tag.match(/\bname\s*=\s*["']([^"']+)["']/i)?.[1];
    if (n?.toLowerCase() !== name) continue;
    const c = tag.match(/\bcontent\s*=\s*"([^"]*)"|\bcontent\s*=\s*'([^']*)'/i);
    return c ? decode(c[1] ?? c[2]) : "";
  }
  return undefined;
}

export function readExperiment(dir, slug) {
  const page = readFileSync(join(dir, slug, "index.html"), "utf8");
  if (meta(page, "dd:hidden") !== undefined) return null;
  const title = decode(page.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") || slug;
  const date = meta(page, "dd:date") || null;
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`dd:date "${date}" non è nel formato AAAA-MM-GG`);
  const tags = (meta(page, "dd:tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return { slug, path: `/${slug}/`, title, description: meta(page, "description") ?? "", tags, date };
}

// Il catalogo, ricalcolato solo quando cambia l'elenco delle cartelle o la data di un index.html.
function createCatalog(dir) {
  let sig = null;
  let list = [];
  return function experiments() {
    const slugs = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !/^[._]/.test(d.name))
      .map((d) => [d.name, stat(join(dir, d.name, "index.html"))])
      .filter(([, st]) => st?.isFile());
    const now = slugs.map(([s, st]) => `${s}:${st.mtimeMs}`).join("|");
    if (now === sig) return list;
    sig = now;
    list = slugs
      .map(([slug]) => {
        try {
          return readExperiment(dir, slug);
        } catch (e) {
          logError(`dd: ${slug} escluso dall'indice: ${e.message}`);
          return null;
        }
      })
      .filter(Boolean)
      // Più recenti prima; quelli senza data in fondo, in ordine alfabetico.
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || a.title.localeCompare(b.title, "it"))
      .map((e, i) => ({ n: i + 1, ...e }));
    return list;
  };
}

const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function distance(a, b) {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = t;
    }
  }
  return d[b.length];
}

// L'esperimento con il nome più simile al primo pezzo del percorso, se è abbastanza simile.
export function suggest(list, path) {
  let first = "";
  try {
    first = decodeURIComponent(path.split("/").filter(Boolean)[0] || "");
  } catch {}
  const slug = norm(first);
  const best = list.map((e) => ({ e, d: distance(slug, norm(e.slug)) })).sort((a, b) => a.d - b.d)[0];
  return best && best.d <= Math.max(2, slug.length / 3) ? best.e : null;
}

const fmtDate = (d) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("it-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function card(e) {
  const search = norm([e.title, e.description, e.slug, ...e.tags].join(" "));
  return `<li data-tags="${esc(e.tags.join("|"))}" data-search="${esc(search)}"><a class="card exp" href="${esc(e.path)}">
      <div class="exp-head"><span class="dd-badge">N° ${String(e.n).padStart(2, "0")}</span>${e.date ? `<span class="exp-date">${esc(fmtDate(e.date))}</span>` : ""}</div>
      <h3>${esc(e.title)}</h3>
      <p>${esc(e.description)}</p>
      ${e.tags.length ? `<div class="exp-tags">${e.tags.map((t) => `<span class="dd-chip">${esc(t)}</span>`).join("")}</div>` : ""}
      <div class="exp-go"><span>Apri <span class="arr" aria-hidden="true">→</span></span><code>${esc(e.path)}</code></div>
    </a></li>`;
}

function notFoundBanner(list, path) {
  const best = suggest(list, path);
  return `<div class="feedback tilt" role="status">
    <span class="fb-ico" aria-hidden="true">?</span>
    <div><strong>Indirizzo non trovato</strong><p><code>${esc(path)}</code> non esiste.${
      best ? ` Forse cercavi <a href="${esc(best.path)}">${esc(best.title)}</a>?` : " Ecco tutti gli esperimenti disponibili."
    }</p></div>
  </div>`;
}

export default function dd({ root }) {
  const experiments = createCatalog(root);

  let tpl = { mtime: 0, page: "" };
  function template() {
    const file = join(root, "index.html");
    const st = stat(file);
    if (st && st.mtimeMs !== tpl.mtime) tpl = { mtime: st.mtimeMs, page: readFileSync(file, "utf8") };
    return tpl.page;
  }

  function index(req, res, status, missing) {
    const list = experiments();
    const tags = [...new Set(list.flatMap((e) => e.tags))].sort((a, b) => a.localeCompare(b, "it"));
    const parts = {
      count: String(list.length),
      tags: tags.map((t) => `<button class="tag" type="button" data-tag="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join(""),
      list: list.map(card).join(""),
      empty: list.length ? "" : "Ancora nessun esperimento. Torna presto!",
      notfound: missing ? notFoundBanner(list, missing) : "",
    };
    const page = template().replace(/<!--dd:(\w+)-->/g, (m, k) => parts[k] ?? m);
    html(req, res, status, page);
  }

  return {
    api(req, res, url) {
      if (url.pathname === "/api/experiments") {
        json(req, res, 200, { experiments: experiments() });
        return true;
      }
      const m = url.pathname.match(/^\/api\/experiments\/([^/]+)\/?$/);
      if (!m) return false;
      const e = experiments().find((x) => x.slug === m[1]);
      json(req, res, e ? 200 : 404, e ?? { error: "esperimento non trovato" });
      return true;
    },
    page(req, res, url) {
      if (url.pathname !== "/" && url.pathname !== "/index.html") return false;
      index(req, res, 200, null);
      return true;
    },
    notFound(req, res, url) {
      // Un file mancante (immagine, script…) non riceve una pagina HTML.
      const ext = extname(url.pathname).toLowerCase();
      if (ext && ext !== ".html") return text(res, 404, "Non trovato");
      index(req, res, 404, url.pathname);
    },
  };
}
