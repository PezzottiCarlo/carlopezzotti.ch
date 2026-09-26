/**
 * SCRIPT PRINCIPALE
 * Dipende da translations.js (caricato prima nell'HTML).
 *
 * Contiene: tema, lingua, scala di sintonia, quadranti del titolo,
 * dati GitHub con cache, liste generate (percorso, lingue, contatti).
 */
(function () {
    'use strict';

    /* ========================================================
       UTILITA'
       ======================================================== */
    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

    const store = {
        get(key) {
            try { return localStorage.getItem(key); } catch (e) { return null; }
        },
        set(key, val) {
            try { localStorage.setItem(key, val); } catch (e) { /* modalita' privata */ }
        }
    };

    let lang = 'it';
    const t = (key) => (translations[lang] && translations[lang][key]) || key;

    /* La sequenza di accensione parte solo se il JS c'e': senza JS
       la pagina resta comunque leggibile e visibile. */
    document.body.classList.add('boot');

    /* ========================================================
       TEMA
       Nessun attributo di default nell'HTML: senza scelta esplicita
       comanda prefers-color-scheme (gestito in CSS).
       ======================================================== */
    const themeBtn = $('#themeToggle');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    function currentTheme() {
        const set = document.documentElement.getAttribute('data-theme');
        if (set) return set;
        return systemDark.matches ? 'dark' : 'light';
    }

    function paintThemeButton() {
        const dark = currentTheme() === 'dark';
        themeBtn.setAttribute('aria-pressed', String(dark));
        themeBtn.setAttribute('aria-label', dark ? t('theme_to_light') : t('theme_to_dark'));
        themeBtn.title = dark ? t('theme_to_light') : t('theme_to_dark');
    }

    const savedTheme = store.get('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    themeBtn.addEventListener('click', () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        store.set('theme', next);
        paintThemeButton();
    });

    systemDark.addEventListener('change', () => {
        if (!document.documentElement.getAttribute('data-theme')) paintThemeButton();
    });

    /* ========================================================
       LINGUA
       ======================================================== */
    const titles = {
        it: 'Carlo Pezzotti — Sviluppatore full-stack a Lugano',
        en: 'Carlo Pezzotti — Full-stack developer in Lugano',
        fr: 'Carlo Pezzotti — Développeur full-stack à Lugano',
        de: 'Carlo Pezzotti — Full-Stack-Entwickler in Lugano'
    };

    function setLanguage(next) {
        if (!translations[next]) return;
        lang = next;

        document.documentElement.setAttribute('lang', lang);
        document.title = titles[lang] || titles.it;

        $$('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) el.textContent = translations[lang][key];
        });

        $$('[data-i18n-label]').forEach(el => {
            const key = el.getAttribute('data-i18n-label');
            if (translations[lang][key]) el.setAttribute('aria-label', translations[lang][key]);
        });

        $$('.ctl--lang').forEach(btn => {
            const on = btn.dataset.setlang === lang;
            btn.classList.toggle('is-on', on);
            btn.setAttribute('aria-pressed', String(on));
        });

        $('#langGroup').setAttribute('aria-label', t('lang_group'));
        $('#dial').setAttribute('aria-label', t('nav_label'));
        $('#mapFrame').setAttribute('title', t('map_title'));
        $('#btn-left').setAttribute('aria-label', t('btn_left'));
        $('#btn-right').setAttribute('aria-label', t('btn_right'));
        $('#filters').setAttribute('aria-label', t('filter_label'));

        paintThemeButton();
        renderLog();
        renderEducation();
        renderCefr();
        renderPorts();
        paintProjects();
        refreshDialLabels();
        store.set('lang', lang);
    }

    $$('.ctl--lang').forEach(btn => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.setlang));
    });

    /* ========================================================
       SCALA DI SINTONIA: sezione corrente + navigazione
       ======================================================== */
    const dialLinks = $$('#dial a');

    /* Ogni voce ha bisogno di uno <span> interno: l'etichetta scorre
       fuori dalla tacca, quindi non puo' essere testo nudo. */
    dialLinks.forEach(a => {
        const key = a.getAttribute('data-i18n');
        const span = document.createElement('span');
        span.setAttribute('data-i18n', key);
        span.textContent = a.textContent;
        a.textContent = '';
        a.removeAttribute('data-i18n');
        a.appendChild(span);
        a.setAttribute('aria-label', span.textContent);
    });

    const sections = dialLinks
        .map(a => document.getElementById(a.getAttribute('href').slice(1)))
        .filter(Boolean);

    function markCurrent(id) {
        dialLinks.forEach(a => {
            const on = a.getAttribute('href') === '#' + id;
            if (on) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
        });
    }

    if ('IntersectionObserver' in window) {
        const spy = new IntersectionObserver((entries) => {
            const visible = entries
                .filter(e => e.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) markCurrent(visible.target.id);
        }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, .2, 1] });

        sections.forEach(s => spy.observe(s));
    }

    /* Mantiene aggiornate le etichette aria dopo un cambio lingua */
    function refreshDialLabels() {
        dialLinks.forEach(a => a.setAttribute('aria-label', a.textContent.trim()));
    }

    /* ========================================================
       QUADRANTI: ora di Lugano, coordinate, temperatura
       ======================================================== */
    const { lat, lon, city, zip } = SITE.location;

    $('#r-place').textContent = city + ' ' + zip;
    $('#r-coords').textContent =
        Math.abs(lat).toFixed(2) + '°' + (lat >= 0 ? 'N' : 'S') + ' ' +
        Math.abs(lon).toFixed(2) + '°' + (lon >= 0 ? 'E' : 'W');

    function tickClock() {
        const now = new Date();
        const time = new Intl.DateTimeFormat('it-CH', {
            timeZone: SITE.timeZone, hour: '2-digit', minute: '2-digit', hour12: false
        }).format(now);

        const zoneName = new Intl.DateTimeFormat('en-GB', {
            timeZone: SITE.timeZone, timeZoneName: 'short'
        }).formatToParts(now).find(p => p.type === 'timeZoneName');

        $('#r-time').textContent = time;
        $('#r-zone').textContent = zoneName ? zoneName.value : 'CET';
    }
    tickClock();
    setInterval(tickClock, 15000);

    /* Temperatura reale: open-meteo, senza chiave, fallisce in silenzio.
       Metti SITE.showWeather = false per togliere la chiamata. */
    if (SITE.showWeather) {
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat +
            '&longitude=' + lon + '&current=temperature_2m,weather_code&timezone=' + SITE.timeZone;

        fetch(url)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(data => {
                const temp = data && data.current && data.current.temperature_2m;
                if (typeof temp !== 'number') return;
                $('#r-temp').textContent = Math.round(temp) + '°C';
                $('#r-sky').textContent = skyWord(data.current.weather_code);
                $('#r-temp-cell').hidden = false;
            })
            .catch(() => { /* il quadrante resta nascosto */ });
    }

    /* Codici WMO ridotti a quattro stati: piu' di cosi' sarebbe rumore. */
    function skyWord(code) {
        if (code === 0 || code === 1) return 'clear';
        if (code === 2 || code === 3 || code === 45 || code === 48) return 'cloud';
        if (code >= 71 && code <= 77 || code === 85 || code === 86) return 'snow';
        if (code >= 51) return 'rain';
        return '';
    }

    /* ========================================================
       PERCORSO: registro esperienze
       ======================================================== */
    function renderLog() {
        const root = $('#log-root');
        root.textContent = '';

        historyData.slice().reverse().forEach(item => {
            const li = document.createElement('li');
            li.className = 'log__item';
            li.dataset.kind = item.kind || 'job';
            if (item.end === null) li.dataset.live = 'true';

            const end = item.end === null ? t('present') : item.end;
            const years = item.start === item.end ? item.start : item.start + '–' + end;

            const y = document.createElement('div');
            y.className = 'log__year';
            y.textContent = years;

            const body = document.createElement('div');
            body.className = 'log__body';

            const title = document.createElement('div');
            title.className = 'log__title';
            title.textContent = item.title[lang] || item.title.it;

            const desc = document.createElement('p');
            desc.className = 'log__desc';
            desc.textContent = item.desc[lang] || item.desc.it;

            const kind = document.createElement('div');
            kind.className = 'log__kind';
            kind.textContent = t('kind_' + (item.kind || 'job'));

            body.append(title, desc, kind);
            li.append(y, body);
            root.appendChild(li);
        });
    }

    /* ========================================================
       PERCORSO: formazione
       ======================================================== */
    function renderEducation() {
        const root = $('#edu-root');
        root.textContent = '';

        educationData.forEach(item => {
            const li = document.createElement('li');

            const name = document.createElement('b');
            name.textContent = item.school;

            const place = document.createElement('span');
            place.className = 'schools__place';
            place.textContent = item.years ? item.years : (item.place || '');

            const degree = document.createElement('span');
            degree.textContent = item.degree[lang] || item.degree.it;

            li.append(name, place, degree);
            root.appendChild(li);
        });
    }

    /* ========================================================
       LINGUE PARLATE: scala CEFR
       ======================================================== */
    const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    function renderCefr() {
        const root = $('#cefr-root');
        root.textContent = '';

        spokenLangs.forEach(item => {
            const idx = CEFR.indexOf(item.level);

            const li = document.createElement('li');
            li.className = 'cefr__row';

            const name = document.createElement('span');
            name.className = 'cefr__name';
            name.textContent = item.name[lang] || item.name.it;

            const scale = document.createElement('span');
            scale.className = 'cefr__scale';
            CEFR.forEach((_, i) => {
                const tick = document.createElement('span');
                tick.className = 'cefr__tick' +
                    (i < idx ? ' is-on' : '') +
                    (i === idx ? ' is-mark' : '');
                scale.appendChild(tick);
            });

            const val = document.createElement('span');
            val.className = 'cefr__val';
            val.textContent = item.native ? t('level_native') : item.level;

            /* La scala e' decorativa per chi usa uno screen reader:
               il livello e' gia' scritto accanto in chiaro. */
            scale.setAttribute('aria-hidden', 'true');

            li.append(name, scale, val);
            root.appendChild(li);
        });

        const legend = document.createElement('li');
        legend.className = 'cefr__legend';
        legend.setAttribute('aria-hidden', 'true');
        const pad = document.createElement('span');
        const scale = document.createElement('span');
        scale.className = 'cefr__legend-scale';
        CEFR.forEach(code => {
            const s = document.createElement('span');
            s.textContent = code;
            scale.appendChild(s);
        });
        legend.append(pad, scale);
        root.appendChild(legend);
    }

    /* ========================================================
       CONTATTI
       ======================================================== */
    function renderPorts() {
        const root = $('#ports');
        root.textContent = '';

        /* Email, con copia negli appunti */
        const mail = document.createElement('li');
        const mailLabel = document.createElement('span');
        mailLabel.className = 'ports__label';
        mailLabel.textContent = t('email_label');

        const mailLink = document.createElement('a');
        mailLink.href = 'mailto:' + SITE.email;
        mailLink.textContent = SITE.email;

        const copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'ports__copy';
        copy.textContent = t('copy');
        copy.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(SITE.email);
                copy.textContent = t('copied');
                copy.dataset.done = 'true';
                setTimeout(() => {
                    copy.textContent = t('copy');
                    delete copy.dataset.done;
                }, 1800);
            } catch (e) {
                /* Niente permesso appunti: il link mailto resta valido */
                mailLink.focus();
            }
        });

        mail.append(mailLabel, mailLink, copy);
        root.appendChild(mail);

        /* GitHub */
        root.appendChild(port(t('github_label'), 'github.com/' + SITE.githubUser,
            'https://github.com/' + SITE.githubUser));

        /* LinkedIn, solo se configurato */
        if (SITE.linkedin) {
            root.appendChild(port(t('linkedin_label'), SITE.linkedin.replace(/^https?:\/\//, ''), SITE.linkedin));
        }

        /* Posizione */
        const place = document.createElement('li');
        const placeLabel = document.createElement('span');
        placeLabel.className = 'ports__label';
        placeLabel.textContent = t('location_label');
        const placeVal = document.createElement('span');
        placeVal.className = 'ports__val';
        placeVal.textContent = SITE.location.city + ', ' + SITE.location.country;
        place.append(placeLabel, placeVal);
        root.appendChild(place);
    }

    function port(label, text, href) {
        const li = document.createElement('li');
        const l = document.createElement('span');
        l.className = 'ports__label';
        l.textContent = label;
        const a = document.createElement('a');
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = text;
        li.append(l, a);
        return li;
    }

    /* ========================================================
       GITHUB
       Una sola chiamata, messa in cache per 30 minuti: il limite
       anonimo e' 60 richieste all'ora per indirizzo IP.
       ======================================================== */
    const CACHE_KEY = 'repos:' + SITE.githubUser;
    const CACHE_TTL = 30 * 60 * 1000;

    /* Colori ufficiali GitHub per i linguaggi piu' probabili qui */
    const LANG_DOT = {
        JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Java: '#b07219',
        'C#': '#178600', C: '#555555', 'C++': '#f34b7d', HTML: '#e34c26', CSS: '#563d7c',
        SCSS: '#c6538c', PHP: '#4F5D95', Go: '#00ADD8', Rust: '#dea584', Kotlin: '#A97BFF',
        Swift: '#F05138', Dart: '#00B4AB', Ruby: '#701516', Shell: '#89e051',
        'Jupyter Notebook': '#DA5B0B', Vue: '#41b883', Svelte: '#ff3e00', Dockerfile: '#384d54',
        Makefile: '#427819', Lua: '#000080', Assembly: '#6E4C13', Blade: '#f7523f'
    };

    let repoData = null;   /* dati grezzi da GitHub */
    let repoError = false;
    let activeLang = null; /* filtro attivo */

    function readCache() {
        try {
            const raw = store.get(CACHE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed.at || Date.now() - parsed.at > CACHE_TTL) return null;
            return parsed.repos;
        } catch (e) { return null; }
    }

    async function loadGitHub() {
        const cached = readCache();
        if (cached) {
            repoData = cached;
            paintProjects();
            return;
        }

        try {
            const res = await fetch('https://api.github.com/users/' + SITE.githubUser +
                '/repos?sort=pushed&direction=desc&per_page=100&type=owner');
            if (!res.ok) throw new Error('HTTP ' + res.status);

            const all = await res.json();

            repoData = all
                .filter(r => !r.fork && !r.archived)
                .map(r => ({
                    name: r.name,
                    desc: r.description || '',
                    lang: r.language || '',
                    stars: r.stargazers_count || 0,
                    pushed: r.pushed_at,
                    url: r.html_url
                }))
                /* Prima le piu' apprezzate, poi le piu' recenti */
                .sort((a, b) => b.stars - a.stars || new Date(b.pushed) - new Date(a.pushed));

            store.set(CACHE_KEY, JSON.stringify({ at: Date.now(), repos: repoData }));
        } catch (e) {
            repoError = true;
        }
        paintProjects();
    }

    /* Ridisegna tutto quello che dipende dai dati GitHub */
    function paintProjects() {
        renderRepos();
        renderTally();
        renderFilters();
        renderStack();
    }

    function renderRepos() {
        const root = $('#repos-root');
        if (!root) return;

        if (!repoData && !repoError) return; /* il messaggio di attesa resta */

        root.textContent = '';
        root.setAttribute('aria-busy', 'false');

        if (repoError) {
            const li = document.createElement('li');
            li.className = 'repo repo--error';
            const b = document.createElement('b');
            b.textContent = t('error_title');
            const p = document.createElement('p');
            p.textContent = t('error_body');
            li.append(b, p);
            root.appendChild(li);
            return;
        }

        const list = activeLang
            ? repoData.filter(r => r.lang === activeLang)
            : repoData;

        list.slice(0, 12).forEach(repo => {
            const li = document.createElement('li');
            li.className = 'repo';

            const a = document.createElement('a');
            a.className = 'repo__link';
            a.href = repo.url;
            a.target = '_blank';
            a.rel = 'noopener';

            const name = document.createElement('span');
            name.className = 'repo__name';
            name.textContent = repo.name;

            const desc = document.createElement('p');
            desc.className = 'repo__desc';
            desc.textContent = repo.desc || t('no_desc');

            a.append(name, desc);

            if (repo.lang) {
                const l = document.createElement('span');
                l.className = 'repo__lang';
                l.style.setProperty('--dot', LANG_DOT[repo.lang] || 'var(--ink-3)');
                l.textContent = repo.lang;
                a.appendChild(l);
            }

            const nums = document.createElement('span');
            nums.className = 'repo__nums';
            nums.textContent = repo.stars > 0 ? '★ ' + repo.stars : '';
            a.appendChild(nums);

            const when = document.createElement('time');
            when.className = 'repo__when';
            when.dateTime = repo.pushed;
            when.textContent = t('updated') + ' ' + shortDate(repo.pushed);
            a.appendChild(when);

            li.appendChild(a);
            root.appendChild(li);
        });
    }

    function shortDate(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return '';
        return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : lang, {
            year: 'numeric', month: 'short'
        }).format(d);
    }

    function renderTally() {
        if (!repoData || repoError) return;
        const stars = repoData.reduce((sum, r) => sum + r.stars, 0);
        const langs = new Set(repoData.map(r => r.lang).filter(Boolean));

        $('#t-repos').textContent = repoData.length;
        $('#t-stars').textContent = stars;
        $('#t-langs').textContent = langs.size;
        $('#tally').hidden = false;
    }

    function langCounts() {
        const counts = new Map();
        (repoData || []).forEach(r => {
            if (!r.lang) return;
            counts.set(r.lang, (counts.get(r.lang) || 0) + 1);
        });
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    }

    function renderFilters() {
        const root = $('#filters');
        if (!repoData || repoError) return;

        const langs = langCounts();
        if (langs.length < 2) return;

        root.textContent = '';
        root.hidden = false;

        const make = (label, value) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = label;
            b.setAttribute('aria-pressed', String(activeLang === value));
            b.addEventListener('click', () => {
                activeLang = activeLang === value ? null : value;
                renderRepos();
                renderFilters();
            });
            return b;
        };

        root.appendChild(make(t('filter_all'), null));
        langs.slice(0, 7).forEach(([name, n]) => root.appendChild(make(name + ' ' + n, name)));
    }

    function renderStack() {
        const root = $('#stack-root');
        if (!root || !repoData || repoError) return;

        root.textContent = '';
        langCounts().forEach(([name]) => {
            const li = document.createElement('li');
            li.style.setProperty('--dot', LANG_DOT[name] || 'var(--ink-3)');
            li.textContent = name;
            root.appendChild(li);
        });
    }

    /* ========================================================
       AVVIO
       ======================================================== */
    $('#heroCode').href = 'https://github.com/' + SITE.githubUser;
    $('#viewAll').href = 'https://github.com/' + SITE.githubUser + '?tab=repositories';
    $('#year').textContent = new Date().getFullYear();

    const savedLang = store.get('lang');
    const browserLang = (navigator.language || 'it').slice(0, 2).toLowerCase();
    setLanguage(
        translations[savedLang] ? savedLang :
            (translations[browserLang] ? browserLang : 'it')
    );

    loadGitHub();
})();
