#!/usr/bin/env node
// Configura tutti i siti definiti in sites.config.json:
//   1. crea (se mancano) i progetti Firebase e i siti Hosting
//   2. genera firebase.json e .firebaserc (deploy target)
//   3. collega i domini custom su Firebase Hosting
//   4. crea/aggiorna i record DNS richiesti su Cloudflare
//
// Voci con lo stesso siteId (e progetto) sono alias dello stesso sito: i loro domini
// vengono uniti e devono avere la stessa cartella.
//
// Uso:
//   node scripts/setup-sites.mjs [--dry-run] [--only so,web] [--skip-dns] [--status] [--deploy] [--config-only]
//   --only accetta target, siteId o dominio (es. --only carlopezzotti.ch)
//
// Requisiti:
//   - firebase CLI loggato (firebase login)
//   - gcloud loggato con lo stesso account (gcloud auth login)
//   - CLOUDFLARE_API_TOKEN con permessi Zone:Read + DNS:Edit sulla zona

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const DRY = flag("--dry-run");
const STATUS_ONLY = flag("--status");
const SKIP_DNS = flag("--skip-dns");
const CONFIG_ONLY = flag("--config-only");
const DEPLOY = flag("--deploy");
const ONLY = opt("--only")?.split(",").map((s) => s.trim());

const config = JSON.parse(readFileSync(join(ROOT, "sites.config.json"), "utf8"));

// Più voci possono puntare allo stesso sito Firebase (alias): vengono unite in un
// unico sito con tutti i loro domini, perché firebase.json ammette un solo blocco per sito.
function groupSites(entries) {
  const groups = new Map();
  for (const e of entries) {
    const project = e.project ?? config.defaultProject;
    const key = `${project}/${e.siteId}`;
    const g = groups.get(key);
    if (!g) {
      groups.set(key, { ...e, project, targets: [e.target].filter(Boolean), domains: [...(e.domains ?? [])] });
      continue;
    }
    if (g.folder !== e.folder) die(`Il sito ${e.siteId} ha cartelle diverse: "${g.folder}" e "${e.folder}"`);
    if (e.target) g.targets.push(e.target);
    g.domains.push(...(e.domains ?? []));
    g.hosting = { ...(g.hosting ?? {}), ...(e.hosting ?? {}) };
    g.projectName ??= e.projectName;
  }
  // Il deploy target usa il primo nome non vuoto, altrimenti il siteId.
  return [...groups.values()].map((g) => ({ ...g, target: g.targets[0] ?? g.siteId }));
}

const allSites = groupSites(config.sites);
const matches = (s, key) =>
  s.target === key || s.targets.includes(key) || s.siteId === key || domainEntries(s).some((d) => d.name === key);
const sites = ONLY ? allSites.filter((s) => ONLY.some((k) => matches(s, k))) : allSites;
if (!sites.length) die(`Nessun sito corrisponde a --only ${ONLY}`);

const log = (...m) => console.log(...m);
const step = (m) => console.log(`\n\x1b[1m▸ ${m}\x1b[0m`);
const act = (m) => console.log(`  ${DRY ? "[dry-run] " : ""}${m}`);
function die(m) {
  console.error(`\x1b[31m✖ ${m}\x1b[0m`);
  process.exit(1);
}

// ---------------------------------------------------------------- shell / CLI

function sh(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    throw new Error(`Comando fallito: ${cmd}\n${e.stderr || e.stdout || e.message}`);
  }
}

function firebaseJson(cmd) {
  const out = sh(`firebase ${cmd} --json`);
  const res = JSON.parse(out.slice(out.indexOf("{")));
  if (res.status !== "success") throw new Error(`firebase ${cmd}: ${res.error ?? out}`);
  return res.result;
}

// ---------------------------------------------------------------- Firebase

let gToken;
function googleToken() {
  gToken ??= sh("gcloud auth print-access-token").trim();
  return gToken;
}

async function hostingApi(project, method, path, body) {
  const res = await fetch(`https://firebasehosting.googleapis.com/v1beta1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${googleToken()}`,
      "x-goog-user-project": project,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function ensureProjects() {
  step("Progetti Firebase");
  const existing = new Set(firebaseJson("projects:list").map((p) => p.projectId));
  for (const project of new Set(sites.map((s) => s.project))) {
    if (existing.has(project)) {
      log(`  ✓ ${project}`);
      continue;
    }
    const site = sites.find((s) => s.project === project);
    const name = site.projectName ?? project;
    act(`creo il progetto ${project} ("${name}")`);
    if (!DRY) sh(`firebase projects:create ${project} --display-name "${name}" --non-interactive`);
  }
}

function ensureHostingSites() {
  step("Siti Firebase Hosting");
  const cache = new Map();
  for (const s of sites) {
    if (!cache.has(s.project)) {
      let ids = [];
      try {
        ids = firebaseJson(`hosting:sites:list --project ${s.project}`).sites.map((x) => x.name.split("/").pop());
      } catch (e) {
        if (!DRY) throw e; // in dry-run il progetto potrebbe non esistere ancora
      }
      cache.set(s.project, new Set(ids));
    }
    if (cache.get(s.project).has(s.siteId)) {
      log(`  ✓ ${s.siteId} (${s.project})`);
      continue;
    }
    act(`creo il sito ${s.siteId} nel progetto ${s.project}`);
    if (!DRY) sh(`firebase hosting:sites:create ${s.siteId} --project ${s.project} --non-interactive`);
  }
}

function ensureFolders() {
  step("Cartelle dei siti");
  for (const s of sites) {
    const dir = join(ROOT, s.folder);
    if (existsSync(dir)) {
      log(`  ✓ ${s.folder}`);
      continue;
    }
    act(`creo ${s.folder} con una pagina segnaposto`);
    if (DRY) continue;
    mkdirSync(dir, { recursive: true });
    const title = s.domains?.[0] ?? s.target;
    writeFileSync(
      join(dir, "index.html"),
      `<!doctype html>\n<html lang="it">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${title}</title>\n</head>\n<body>\n  <h1>${title}</h1>\n  <p>Coming soon.</p>\n</body>\n</html>\n`
    );
  }
}

// firebase.json e .firebaserc vengono sempre rigenerati da TUTTI i siti in config,
// anche con --only, così non si perdono i target degli altri siti.
function writeFirebaseConfig() {
  step("firebase.json / .firebaserc");
  const hosting = allSites.map((s) => ({
    target: s.target,
    public: s.folder,
    ...structuredClone(config.hosting ?? {}),
    ...(s.hosting ?? {}),
  }));
  const rc = { projects: { default: config.defaultProject }, targets: {} };
  for (const s of allSites) {
    rc.targets[s.project] ??= { hosting: {} };
    rc.targets[s.project].hosting[s.target] = [s.siteId];
  }
  act("scrivo firebase.json e .firebaserc");
  if (DRY) return;
  writeFileSync(join(ROOT, "firebase.json"), JSON.stringify({ hosting }, null, 2) + "\n");
  writeFileSync(join(ROOT, ".firebaserc"), JSON.stringify(rc, null, 2) + "\n");
}

function domainEntries(s) {
  return (s.domains ?? []).map((d) => (typeof d === "string" ? { name: d } : d));
}

async function getCustomDomain(s, domain) {
  const r = await hostingApi(s.project, "GET", `projects/${s.project}/sites/${s.siteId}/customDomains/${domain}`);
  return r.ok ? r.data : null;
}

async function ensureCustomDomain(s, d) {
  let cd = await getCustomDomain(s, d.name);
  if (cd) {
    log(`  ✓ ${d.name} già collegato a ${s.siteId}`);
    return cd;
  }
  act(`collego ${d.name} → ${s.siteId}${d.redirect ? ` (redirect a ${d.redirect})` : ""}`);
  if (DRY) return null;
  const body = d.redirect ? { redirectTarget: d.redirect } : {};
  const r = await hostingApi(
    s.project,
    "POST",
    `projects/${s.project}/sites/${s.siteId}/customDomains?customDomainId=${encodeURIComponent(d.name)}`,
    body
  );
  if (!r.ok) throw new Error(`Creazione dominio ${d.name} fallita (${r.status}): ${JSON.stringify(r.data.error ?? r.data)}`);

  // Firebase calcola i record DNS richiesti in modo asincrono: aspetta che compaiano.
  for (let i = 0; i < 24; i++) {
    cd = await getCustomDomain(s, d.name);
    if (desiredRecords(cd).length) break;
    await new Promise((r) => setTimeout(r, 5000));
  }
  return cd;
}

// Record da aggiungere (in "desired") e da togliere (in "discovered", per esempio
// un vecchio hosting-site= di un altro progetto che crea un conflitto di proprietà).
function desiredRecords(cd) {
  const upd = [cd?.requiredDnsUpdates, cd?.cert?.verification?.dns];
  const sets = upd.flatMap((u) => [...(u?.desired ?? []), ...(u?.discovered ?? [])]);
  const seen = new Set();
  return sets.flatMap((set) => set.records ?? [])
    .filter((r) => r.requiredAction && r.requiredAction !== "NONE")
    .filter((r) => { const k = r.requiredAction + r.type + r.domainName + r.rdata; if (seen.has(k)) return false; seen.add(k); return true; });
}

// ---------------------------------------------------------------- Cloudflare

async function cf(method, path, body) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) die("Imposta CLOUDFLARE_API_TOKEN (Zone:Read + DNS:Edit) oppure usa --skip-dns");
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Cloudflare ${method} ${path}: ${JSON.stringify(data.errors)}`);
  return data.result;
}

let zoneId;
async function cfZone() {
  if (zoneId) return zoneId;
  const zones = await cf("GET", `/zones?name=${config.domain}`);
  if (!zones.length) die(`Zona ${config.domain} non trovata su Cloudflare`);
  return (zoneId = zones[0].id);
}

const strip = (v) => String(v).trim().replace(/\.$/, "").replace(/^"|"$/g, "");
const clean = (v) => strip(v).toLowerCase();
// I valori TXT (token di verifica) distinguono maiuscole e minuscole: vanno confrontati esatti.
const cleanVal = (type, v) => (type === "TXT" ? strip(v) : clean(v));

async function syncDns(records) {
  const zone = await cfZone();
  const proxied = !!config.cloudflare?.proxied;

  for (const rec of records) {
    const name = clean(rec.domainName);
    const content = cleanVal(rec.type, rec.rdata);
    const existing = await cf("GET", `/zones/${zone}/dns_records?name=${name}&per_page=100`);
    const same = existing.filter((e) => e.type === rec.type && cleanVal(e.type, e.content) === content);

    if (rec.requiredAction === "REMOVE") {
      for (const e of same) {
        act(`DNS: rimuovo ${e.type} ${name} → ${e.content}`);
        if (!DRY) await cf("DELETE", `/zones/${zone}/dns_records/${e.id}`);
      }
      continue;
    }

    if (same.length) {
      log(`  ✓ DNS ${rec.type} ${name} → ${content}`);
      continue;
    }

    // Copie dello stesso token con le maiuscole sbagliate (versioni precedenti dello script).
    if (rec.type === "TXT") {
      for (const e of existing.filter((e) => e.type === "TXT" && clean(e.content) === content.toLowerCase())) {
        act(`DNS: rimuovo TXT ${name} → ${e.content} (maiuscole sbagliate)`);
        if (!DRY) await cf("DELETE", `/zones/${zone}/dns_records/${e.id}`);
      }
    }

    // Un CNAME non può convivere con altri record sullo stesso nome, e viceversa.
    const conflicts = existing.filter((e) =>
      rec.type === "CNAME" ? ["A", "AAAA", "CNAME"].includes(e.type) : ["A", "AAAA"].includes(rec.type) && e.type === "CNAME"
    );
    for (const e of conflicts) {
      act(`DNS: rimuovo record in conflitto ${e.type} ${name} → ${e.content}`);
      if (!DRY) await cf("DELETE", `/zones/${zone}/dns_records/${e.id}`);
    }

    const canProxy = ["A", "AAAA", "CNAME"].includes(rec.type) && !name.startsWith("_");
    act(`DNS: aggiungo ${rec.type} ${name} → ${content}${canProxy && proxied ? " (proxied)" : ""}`);
    if (!DRY) {
      await cf("POST", `/zones/${zone}/dns_records`, {
        type: rec.type,
        name,
        content: rec.type === "TXT" ? `"${content}"` : content,
        ttl: 1,
        proxied: canProxy && proxied,
      });
    }
  }
}

// ---------------------------------------------------------------- main

async function printStatus() {
  step("Stato domini");
  for (const s of sites) {
    for (const d of domainEntries(s)) {
      const cd = await getCustomDomain(s, d.name);
      if (!cd) {
        log(`  ✗ ${d.name}: non collegato`);
        continue;
      }
      log(`  ${d.name} → ${s.siteId}: host=${cd.hostState} ownership=${cd.ownershipState} cert=${cd.cert?.state ?? "-"}`);
      for (const r of desiredRecords(cd)) log(`      da fare: ${r.requiredAction} ${r.type} ${clean(r.domainName)} → ${r.rdata}`);
    }
  }
}

async function main() {
  if (STATUS_ONLY) return printStatus();
  if (CONFIG_ONLY) return writeFirebaseConfig();

  if (DRY) log("Modalità dry-run: nessuna modifica verrà applicata.");
  ensureProjects();
  ensureHostingSites();
  ensureFolders();
  writeFirebaseConfig();

  step("Domini custom");
  for (const s of sites) {
    for (const d of domainEntries(s)) {
      const cd = await ensureCustomDomain(s, d);
      const recs = desiredRecords(cd);
      if (!recs.length) continue;
      if (SKIP_DNS) {
        for (const r of recs) log(`  da fare a mano: ${r.requiredAction} ${r.type} ${clean(r.domainName)} → ${r.rdata}`);
      } else {
        await syncDns(recs);
      }
    }
  }

  if (DEPLOY) {
    step("Deploy");
    for (const project of new Set(sites.map((s) => s.project))) {
      const list = sites.filter((s) => s.project === project);
      const only = list.map((s) => `hosting:${s.target}`).join(",");
      act(`firebase deploy --only ${only} --project ${project}`);
      if (!DRY) execSync(`firebase deploy --only ${only} --project ${project}`, { cwd: ROOT, stdio: "inherit" });
    }
  }

  if (!DRY) await printStatus();
  log("\nIl certificato SSL può richiedere da qualche minuto fino a 24h. Ricontrolla con --status.");
}

main().catch((e) => die(e.message));
