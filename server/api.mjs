// API comuni a tutti gli hostname (www, so, dd…), sotto /api/.
//
//   GET /api/health          stato del server: versione, avvio, aggiornamenti attivi
//   GET /api/github/repos    i repository pubblici di GitHub, già puliti (cache 15 minuti)
//   GET /api/weather         il meteo di adesso a Lugano (cache 10 minuti)
//
// Prima www e so chiamavano GitHub e open-meteo dal browser di ogni visitatore: con il limite
// di 60 richieste all'ora per IP, in una classe GitHub smetteva di rispondere. Ora le chiama
// solo il server, e se il servizio esterno non risponde restituisce l'ultima risposta buona.

import { json, logError } from "./http.mjs";

// Valore calcolato al massimo una volta ogni `ttl` ms; se il calcolo fallisce si tiene il vecchio.
export function cached(ttl, load) {
  let value, at = 0, pending = null;
  return async () => {
    if (value !== undefined && Date.now() - at < ttl) return value;
    pending ??= load()
      .then((v) => {
        value = v;
        at = Date.now();
        return v;
      })
      .finally(() => (pending = null));
    try {
      return await pending;
    } catch (e) {
      if (value !== undefined) return value;
      throw e;
    }
  };
}

async function getJSON(url, headers = {}) {
  const res = await fetch(url, { headers: { "User-Agent": "carlopezzotti.ch", ...headers }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${new URL(url).host} ${res.status}`);
  return res.json();
}

export function createApi({ config, deploy, started = new Date() }) {
  const repos = cached(15 * 60e3, async () => {
    const list = await getJSON(
      `https://api.github.com/users/${config.github}/repos?per_page=100&sort=pushed&type=owner`,
      { Accept: "application/vnd.github+json" },
    );
    return list.map((r) => ({
      name: r.name,
      desc: r.description || "",
      lang: r.language || "",
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      fork: r.fork,
      archived: r.archived,
      url: r.html_url,
      home: r.homepage || "",
      pushed: r.pushed_at,
      updated: r.updated_at,
    }));
  });

  const w = config.weather;
  const weather = cached(10 * 60e3, async () => {
    const q = new URLSearchParams({
      latitude: w.lat,
      longitude: w.lon,
      current: "temperature_2m,weather_code,is_day",
      timezone: w.tz,
    });
    const { current: c } = await getJSON(`https://api.open-meteo.com/v1/forecast?${q}`);
    return { place: w.place, temp: c.temperature_2m, code: c.weather_code, isDay: c.is_day === 1, time: c.time };
  });

  const routes = {
    "/api/health": async () => ({
      ok: true,
      commit: deploy.commit,
      started: started.toISOString(),
      uptime: Math.round(process.uptime()),
      deploy: deploy.enabled,
    }),
    "/api/github/repos": repos,
    "/api/weather": weather,
  };

  // Risponde e restituisce true se la rotta è sua.
  return async function api(req, res, url) {
    const route = routes[url.pathname];
    if (!route) return false;
    if (req.method !== "GET" && req.method !== "HEAD") {
      json(req, res, 405, { error: "solo GET" }, { Allow: "GET, HEAD" });
      return true;
    }
    try {
      json(req, res, 200, await route());
    } catch (e) {
      logError(`${url.pathname}: ${e.message}`);
      json(req, res, 502, { error: "servizio esterno non disponibile" });
    }
    return true;
  };
}
