#!/usr/bin/env node
// Genera sites/dd/experiments.json, l'indice letto dalla pagina router di dd.carlopezzotti.ch.
//
// Ogni sottocartella di sites/dd con un index.html è un esperimento. I dati vengono
// letti dall'index.html stesso, così aggiungere un esperimento = aggiungere una cartella:
//   <title>                           → titolo
//   <meta name="description">         → descrizione
//   <meta name="dd:tags" content="…"> → tag separati da virgola (facoltativo)
//   <meta name="dd:date" content="AAAA-MM-GG"> → data, usata per l'ordinamento (facoltativo)
//   <meta name="dd:hidden">           → esclude l'esperimento dall'indice (facoltativo)
// Le cartelle che iniziano con "_" o "." vengono ignorate.
//
// Viene eseguito in automatico prima di ogni deploy (predeploy in firebase.json e
// workflow GitHub), quindi il file generato non va committato.
//
// Uso: node scripts/build-dd-manifest.mjs [--check]

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DD = join(ROOT, "sites", "dd");
const OUT = join(DD, "experiments.json");

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();

function meta(html, name) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const n = tag.match(/\bname\s*=\s*["']([^"']+)["']/i)?.[1];
    if (n?.toLowerCase() !== name) continue;
    const c = tag.match(/\bcontent\s*=\s*"([^"]*)"|\bcontent\s*=\s*'([^']*)'/i);
    return c ? decode(c[1] ?? c[2]) : "";
  }
  return undefined;
}

function read(slug) {
  const html = readFileSync(join(DD, slug, "index.html"), "utf8");
  if (meta(html, "dd:hidden") !== undefined) return null;
  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") || slug;
  const date = meta(html, "dd:date") || null;
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${slug}: dd:date "${date}" non è nel formato AAAA-MM-GG`);
  const tags = (meta(html, "dd:tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return { slug, path: `/${slug}/`, title, description: meta(html, "description") ?? "", tags, date };
}

const experiments = readdirSync(DD, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !/^[._]/.test(d.name) && existsSync(join(DD, d.name, "index.html")))
  .map((d) => read(d.name))
  .filter(Boolean)
  // Più recenti prima; quelli senza data in fondo, in ordine alfabetico.
  .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || a.title.localeCompare(b.title, "it"));

const json = JSON.stringify({ generated: new Date().toISOString(), experiments }, null, 2) + "\n";

if (process.argv.includes("--check")) {
  console.log(json);
} else {
  writeFileSync(OUT, json);
  console.log(`dd: ${experiments.length} esperimenti → ${OUT.slice(ROOT.length + 1)}`);
  for (const e of experiments) console.log(`  ${e.path}  ${e.title}`);
}
