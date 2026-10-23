#!/usr/bin/env node
// Collega gli hostname di sites.config.json al tunnel Cloudflare del server.
//
// Per ogni hostname:
//   - aggiunge (o corregge) la regola di ingress del tunnel verso http://localhost:<porta>,
//     lasciando com'erano le regole degli altri servizi;
//   - sostituisce i record A/AAAA/CNAME con un CNAME proxato su <tunnel>.cfargotunnel.com;
//   - toglie i resti di Firebase Hosting (TXT _acme-challenge.<host> e "hosting-site=...").
//
// Il token Cloudflare (Tunnel Edit, Zone Read, DNS Edit) viene da CLOUDFLARE_API_TOKEN
// oppure da ~/.config/cf-panel/token, dove lo tiene il pannello del server.
//
// Uso:  node scripts/setup-tunnel.mjs [--dry-run]

import dns from "node:dns";
import net from "node:net";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Il token può avere un filtro sull'IPv4 di casa: niente IPv6.
dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamily(false);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry-run");
const config = JSON.parse(readFileSync(join(ROOT, "sites.config.json"), "utf8"));
const TOKEN = (
  process.env.CLOUDFLARE_API_TOKEN ?? readFileSync(join(homedir(), ".config", "cf-panel", "token"), "utf8")
).trim();

async function cf(method, path, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(`${method} ${path}: ${JSON.stringify(json.errors)}`);
  return json.result;
}
const write = (method, path, body) => (DRY ? Promise.resolve() : cf(method, path, body));
const log = (s) => console.log((DRY ? "[dry-run] " : "") + s);

const hosts = config.sites.flatMap((s) => s.hosts);
const service = `http://localhost:${config.server.port}`;

const [zone] = await cf("GET", `/zones?name=${config.domain}`);
if (!zone) throw new Error(`zona ${config.domain} non trovata con questo token`);
const acc = zone.account.id;
const tunnel = (await cf("GET", `/accounts/${acc}/cfd_tunnel?is_deleted=false&name=${config.tunnel}`))[0];
if (!tunnel) throw new Error(`tunnel "${config.tunnel}" non trovato`);
if (tunnel.config_src !== "cloudflare") throw new Error("il tunnel è gestito da config.yml locale, non via API");
const target = `${tunnel.id}.cfargotunnel.com`;

// --- ingress -----------------------------------------------------------------
const conf = (await cf("GET", `/accounts/${acc}/cfd_tunnel/${tunnel.id}/configurations`))?.config ?? {};
const others = (conf.ingress ?? []).filter((r) => r.hostname && !hosts.includes(r.hostname));
const ingress = [...others, ...hosts.map((hostname) => ({ hostname, service })), { service: "http_status:404" }];
// Cloudflare restituisce le regole con campi in più: si confrontano solo hostname e servizio.
const key = (rules) => JSON.stringify((rules ?? []).map((r) => [r.hostname ?? "", r.service]));
const same = key(ingress) === key(conf.ingress);
if (same) log(`ingress del tunnel ${tunnel.name}: già a posto`);
else {
  await write("PUT", `/accounts/${acc}/cfd_tunnel/${tunnel.id}/configurations`, { config: { ...conf, ingress } });
  log(`ingress del tunnel ${tunnel.name}: ${hosts.join(", ")} → ${service}`);
}

// --- DNS ---------------------------------------------------------------------
const records = await cf("GET", `/zones/${zone.id}/dns_records?per_page=500`);
for (const host of hosts) {
  const mine = records.filter((r) => r.name === host && ["A", "AAAA", "CNAME"].includes(r.type));
  const ok = mine.find((r) => r.type === "CNAME" && r.content === target && r.proxied);
  for (const r of mine.filter((r) => r !== ok)) {
    await write("DELETE", `/zones/${zone.id}/dns_records/${r.id}`);
    log(`${host}: tolto ${r.type} ${r.content}`);
  }
  if (ok) log(`${host}: CNAME già sul tunnel`);
  else {
    await write("POST", `/zones/${zone.id}/dns_records`, {
      type: "CNAME",
      name: host,
      content: target,
      proxied: true,
      comment: "carlopezzotti.ch: scripts/setup-tunnel.mjs",
    });
    log(`${host}: CNAME → ${target}`);
  }
  const leftovers = records.filter(
    (r) =>
      r.type === "TXT" &&
      (r.name === `_acme-challenge.${host}` || (r.name === host && /^"?hosting-site=/.test(r.content))),
  );
  for (const r of leftovers) {
    await write("DELETE", `/zones/${zone.id}/dns_records/${r.id}`);
    log(`${r.name}: tolto TXT ${r.content}`);
  }
}
