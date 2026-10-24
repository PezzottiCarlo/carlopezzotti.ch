/* ============================================================
   dd.carlopezzotti.ch — il laboratorio: la logica comune agli esperimenti.

   Un esperimento importa da qui quello che gli serve:

     import { lab, $, esc, wait } from '/_lab/lab.js';
     const app = lab({ id:'fogli', sym:true });
     const L1 = { nav:'1. Il calibro', title:'…', mission:'…', enter(){ … }, on:{ misura(btn){ … } } };
     app.start([L1, L2]);

   lab() gestisce livelli (sblocco, ✓, ?livello=, ?tutti), missione, feedback, diario,
   interruttore "Simboli", pulsante ↺, dialogo di fine livello con coriandoli e le azioni
   data-act / data-input. Tutto è spiegato in docs/lab.md.
   ============================================================ */

/* ---------------- Piccoli attrezzi ---------------- */
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const params = new URLSearchParams(location.search);
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Pausa per le animazioni: con "riduci movimento" diventa brevissima.
export const wait = ms => new Promise(r => setTimeout(r, reduceMotion ? Math.min(ms, 120) : ms));
// Numero all'italiana: virgola decimale, segno meno tipografico, al massimo d decimali.
export const fmt = (x, d = 2) => {
  if (!Number.isFinite(x)) return '—';
  const r = Math.round(x * 10 ** d) / 10 ** d;
  return String(r).replace('.', ',').replace('-', '−');
};
// Fa ripartire un'animazione CSS legata a una classe.
export function replay(node, cls){ if (!node) return; node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }

// localStorage che non si rompe mai (navigazione privata, spazio pieno): valori JSON.
// store('fogli').get('sym') legge la chiave "fogli.sym"; store() usa le chiavi così come sono.
export function store(ns = ''){
  const key = k => ns ? `${ns}.${k}` : k;
  return {
    get(k, d){ try { const v = localStorage.getItem(key(k)); return v === null ? d : JSON.parse(v); } catch(e){ return d; } },
    set(k, v){ try { localStorage.setItem(key(k), JSON.stringify(v)); } catch(e){} },
    del(k){ try { localStorage.removeItem(key(k)); } catch(e){} }
  };
}

// Annuncio per i lettori di schermo.
let srEl = null;
export function announce(text){
  if (!srEl){
    srEl = document.createElement('div');
    srEl.className = 'sr-only'; srEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(srEl);
  }
  srEl.textContent = '';
  setTimeout(() => { srEl.textContent = text; }, 30);
}

/* ---------------- Effetti: coriandoli e scintille ---------------- */
export const fx = (() => {
  const COLS = ['#4338ca', '#6b3fd1', '#7c5cf0', '#ffd166', '#f0a24a', '#2bb39f', '#0f9d8a', '#e5675b', '#ef476f', '#06aed5'];
  let c = null, ctx = null, W = 0, H = 0, parts = [], raf = 0;
  function size(){
    const d = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; c.width = W * d; c.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function canvas(){
    if (c) return;
    c = document.createElement('canvas');
    c.className = 'lab-fx'; c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c);
    ctx = c.getContext('2d');
    size(); addEventListener('resize', size);
  }
  function star(s){ ctx.beginPath(); for (let i = 0; i < 10; i++){ const r = i % 2 ? s * .22 : s * .55, a = i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
  function tick(){
    ctx.clearRect(0, 0, W, H);
    parts = parts.filter(p => p.life > 0 && p.y < H + 40);
    for (const p of parts){
      p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      ctx.save(); ctx.globalAlpha = Math.min(1, p.life / 30); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col;
      if (p.shape === 'rect') ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      else if (p.shape === 'star') star(p.s);
      else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(tick); else { raf = 0; ctx.clearRect(0, 0, W, H); }
  }
  const go = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const col = () => COLS[Math.random() * COLS.length | 0];
  return {
    // Una fontana di coriandoli dal centro dello schermo (fine livello).
    confetti(){
      if (reduceMotion) return;
      canvas(); size();
      for (let i = 0; i < 140; i++) parts.push({ x: W / 2 + (Math.random() - .5) * W * .4, y: H * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 12 - 4, g: .18, drag: 1,
        rot: Math.random() * 6, vr: (Math.random() - .5) * .3, s: 7 + Math.random() * 7, life: 90 + Math.random() * 60, col: col(), shape: 'rect' });
      go();
    },
    // Coriandoli che piovono dall'alto su tutto lo schermo.
    rain(){
      if (reduceMotion) return;
      canvas();
      for (let i = 0; i < 190; i++) parts.push({ x: Math.random() * W, y: -20 - Math.random() * H * .5, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 3, g: .05, drag: .995,
        rot: Math.random() * 6, vr: (Math.random() - .5) * .25, s: 8 + Math.random() * 8, life: 170 + Math.random() * 90, col: col(), shape: Math.random() < .75 ? 'rect' : 'circle' });
      go();
    },
    // Scintille da un punto (x, y in pixel della finestra): o = { speed, size, life, col, shape, g, lift }.
    burst(x, y, n = 10, o = {}){
      if (reduceMotion) return;
      canvas();
      for (let i = 0; i < n; i++){
        const a = Math.random() * Math.PI * 2, v = (o.speed || 3) * (.5 + Math.random());
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.lift || 1), g: o.g ?? .08, drag: .96, rot: Math.random() * 6, vr: (Math.random() - .5) * .3,
          s: o.size || (6 + Math.random() * 6), life: o.life || (40 + Math.random() * 25), col: o.col || col(), shape: o.shape || 'star' });
      }
      go();
    }
  };
})();

// Onda sul pulsante premuto (.btn e .pill), in ogni pagina che importa il laboratorio.
document.addEventListener('pointerdown', e => {
  const host = e.target.closest('.btn, .pill');
  if (!host || host.disabled || reduceMotion) return;
  const r = host.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2;
  const sp = document.createElement('span');
  sp.className = 'rip';
  sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  host.appendChild(sp);
  setTimeout(() => sp.remove(), 600);
});

/* ---------------- Il laboratorio ---------------- */
const ICONS = { info:'i', ok:'✓', tilt:'!', error:'✕', win:'★' };
const TROPHY = '<svg width="42" height="42" viewBox="0 0 46 46"><path d="M23 4l5.6 11.4 12.6 1.8-9.1 8.9 2.2 12.5L23 32.7l-11.3 5.9 2.2-12.5-9.1-8.9 12.6-1.8z" fill="#fff" stroke="#b9790c" stroke-width="2" stroke-linejoin="round"/></svg>';

/*
  cfg = {
    id:      'fogli',        prefisso delle chiavi in localStorage (fogli.unlocked, fogli.done, fogli.sym)
    sym:     true | { label:'Simboli', onChange(on){} }   interruttore in #sym
    reset:   true            pulsante ↺ in #reset (ricomincia il livello; un livello può avere restart())
    onLevel(i, level){}      prima di level.enter(): pulire la scena comune a tutti i livelli
    act(name, node, e){}     azioni data-act che il livello non gestisce in level.on
    url:     true            scrive ?livello= nell'indirizzo, così ricaricando si resta lì
  }
  Un livello: { nav, title, mission, badge, challenge, id, enter(app), leave(), restart(), on:{ azione(node, e){} } }
*/
export function lab(cfg = {}){
  const id = cfg.id || location.pathname.split('/').filter(Boolean)[0] || 'dd';
  const st = store(id);
  const all = params.has('tutti') || params.get('livelli') === 'tutti';
  const el = {
    nav: $('#levels'), mission: $('#mission'), fb: $('#feedback'), diario: $('#diario'),
    sym: $('#sym'), reset: $('#reset')
  };

  const app = {
    id, levels: [], idx: -1, level: null,
    L: {},          // lo stato del livello in corso: si svuota a ogni ingresso
    gen: 0,         // cresce a ogni cambio di livello: le attese async controllano app.alive(gen)
    busy: false,    // true durante un'animazione: le azioni data-act aspettano
    sym: false,
    store: st,
    get unlocked(){ return all ? app.levels.length : clamp(st.get('unlocked', 1) | 0, 1, app.levels.length); },
    get done(){ const d = st.get('done', []); return Array.isArray(d) ? d : []; },
    isUnlocked(i){ return i >= 0 && i < app.unlocked; },
    isDone(i){ return app.done.includes(i); },
    alive(gen){ return gen === app.gen; },

    start(levels, i){
      app.levels = levels;
      if (i === undefined){
        const q = params.get('livello');
        const byId = levels.findIndex(L => L.id && L.id === q);
        i = byId >= 0 ? byId : (Number(q) || 1) - 1;
      }
      app.go(clamp(Math.min(i, app.unlocked - 1), 0, levels.length - 1), { force: true });
      return app;
    },

    go(i, { force = false } = {}){
      if (!force && !app.isUnlocked(i)) return false;
      app.closeDialog();
      app.level?.leave?.();
      app.idx = i; app.level = app.levels[i]; app.L = {}; app.gen++; app.busy = false;
      renderNav();
      const L = app.level;
      app.mission({ badge: L.badge ?? (L.challenge ? 'Sfida' : `Livello ${i + 1}`), title: L.title ?? '', text: L.mission ?? '' });
      app.clearLog();
      if (cfg.url !== false && app.levels.length > 1){
        const u = new URL(location.href);
        u.searchParams.set('livello', L.id ?? String(i + 1));
        history.replaceState(history.state, '', u);
      }
      cfg.onLevel?.(i, L);
      L.enter?.(app);
      return true;
    },
    restart(){ app.level?.restart ? app.level.restart() : app.go(app.idx, { force: true }); },
    next(){ return app.go(Math.min(app.idx + 1, app.levels.length - 1)); },

    // Segna il livello come completato e sblocca il successivo. Restituisce true la prima volta.
    complete(i = app.idx, { stars } = {}){
      const done = app.done, first = !done.includes(i);
      if (first){ done.push(i); st.set('done', done); }
      if (stars) st.set('stars', { ...st.get('stars', {}), [i]: Math.max(stars, st.get('stars', {})[i] || 0) });
      if (!all && i + 2 > st.get('unlocked', 1) && i + 1 < app.levels.length) st.set('unlocked', i + 2);
      renderNav();
      return first;
    },
    stars(i = app.idx){ return st.get('stars', {})[i] || 0; },

    mission({ badge, title, text } = {}){
      if (!el.mission) return;
      const m = missionParts();
      if (badge !== undefined) m.badge.textContent = badge;
      if (title !== undefined) m.title.textContent = title;
      if (text !== undefined) m.text.textContent = text;
    },

    // Il riquadro di feedback: type = info | ok | tilt | error | win.
    say(type, title, html = '', { icon } = {}){
      if (!el.fb) return;
      const f = fbParts();
      el.fb.className = 'feedback ' + type;
      f.ico.textContent = icon ?? ICONS[type] ?? 'i';
      f.title.textContent = title;
      f.text.innerHTML = html;
      announce(title + '. ' + f.text.textContent);
    },

    // Il diario: una riga per mossa. Restituisce il <li>.
    log(html){
      const d = diarioParts();
      if (!d) return null;
      const li = document.createElement('li');
      li.innerHTML = html;
      d.list.appendChild(li);
      d.count.textContent = d.list.children.length; d.empty.hidden = true; d.list.scrollTop = d.list.scrollHeight;
      return li;
    },
    clearLog(){
      const d = diarioParts();
      if (!d) return;
      d.list.innerHTML = ''; d.count.textContent = '0'; d.empty.hidden = false;
    },

    // Dialogo di fine livello. then() parte con il pulsante principale.
    win({ title, text = '', extra = '', reflect = '', stars, next = 'Livello successivo →', stay = 'Resta qui', then, confetti = true, focus } = {}){
      const d = dialogParts();
      d.title.textContent = title;
      d.stars.hidden = stars === undefined;
      if (stars !== undefined) d.stars.textContent = '★'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars));
      d.text.innerHTML = text;
      d.extra.innerHTML = extra;
      d.reflect.innerHTML = reflect; d.reflect.hidden = !reflect;
      d.next.textContent = next; d.next.hidden = !next;
      d.stay.textContent = stay;
      d.then = then;
      if (!d.dlg.open) d.dlg.showModal();
      if (focus === 'next') d.next.focus();
      if (confetti) fx.confetti();
      return d.dlg;
    },
    closeDialog(){ if (dlg?.dlg.open) dlg.dlg.close(); },
    get dialog(){ return dialogParts().dlg; },

    // Per la console: ?debug espone window.__lab con l'app e quello che aggiungi qui.
    debug(extra = {}){ if (params.has('debug')) window.__lab = Object.assign(window.__lab || { app }, extra); }
  };

  /* --- pezzi della pagina, costruiti la prima volta che servono --- */
  let mParts = null, fParts = null, dParts = null, dlg = null;
  function missionParts(){
    if (mParts) return mParts;
    const m = el.mission;
    let badge = $('.dd-badge', m), title = $('h2', m), text = $('p', m);
    if (!badge){ badge = document.createElement('span'); badge.className = 'dd-badge'; m.prepend(badge); }
    if (!title){ const box = document.createElement('div'); box.innerHTML = '<h2></h2><p></p>'; badge.after(box); title = $('h2', box); text = $('p', box); }
    title.id ||= 'missionTitle';
    return (mParts = { badge, title, text });
  }
  function fbParts(){
    if (fParts) return fParts;
    if (!el.fb.children.length) el.fb.innerHTML = '<span class="fb-ico" aria-hidden="true"></span><div><strong></strong><p></p></div>';
    return (fParts = { ico: $('.fb-ico', el.fb), title: $('strong', el.fb), text: $('p', el.fb) });
  }
  function diarioParts(){
    if (dParts || !el.diario) return dParts;
    const d = el.diario;
    if (!d.children.length){
      d.innerHTML = `<summary>${esc(d.dataset.title || 'Diario')} <span class="count">0</span></summary><p class="log-empty">${esc(d.dataset.empty || 'Ancora niente.')}</p><ol class="log"></ol>`;
    }
    return (dParts = { list: $('.log', d), count: $('.count', d), empty: $('.log-empty', d) });
  }
  function dialogParts(){
    if (dlg) return dlg;
    const node = document.createElement('dialog');
    node.className = 'lab-dlg';
    node.setAttribute('aria-labelledby', 'labDlgTitle');
    node.setAttribute('aria-describedby', 'labDlgText');
    node.innerHTML = `<div class="dlg-body">
      <div class="trophy" aria-hidden="true">${TROPHY}</div>
      <h2 id="labDlgTitle"></h2>
      <p class="stars" hidden></p>
      <p class="big" id="labDlgText"></p>
      <div class="dlg-extra"></div>
      <p class="reflect"></p>
      <div class="dlg-actions"><button class="btn ghost-btn" type="button" data-dlg="stay"></button><button class="btn" type="button" data-dlg="next"></button></div>
    </div>`;
    document.body.appendChild(node);
    dlg = { dlg: node, title: $('h2', node), stars: $('.stars', node), text: $('.big', node), extra: $('.dlg-extra', node), reflect: $('.reflect', node),
      stay: $('[data-dlg="stay"]', node), next: $('[data-dlg="next"]', node), then: null };
    dlg.stay.addEventListener('click', () => node.close());
    dlg.next.addEventListener('click', () => { const t = dlg.then; node.close(); t?.(); });
    return dlg;
  }

  function renderNav(){
    if (!el.nav) return;
    if (app.levels.length < 2){ el.nav.innerHTML = ''; return; }
    el.nav.innerHTML = app.levels.map((L, i) => {
      const locked = !app.isUnlocked(i), name = L.nav ?? `${i + 1}. ${L.title}`;
      return `<button class="lvl${i === app.idx ? ' active' : ''}" type="button" data-i="${i}" ${locked ? `disabled aria-label="${esc(name)} (bloccato)"` : ''} ${i === app.idx ? 'aria-current="step"' : ''}>${locked ? '🔒 ' : ''}${name}${app.isDone(i) ? '<span class="done" aria-hidden="true">✓</span>' : ''}</button>`;
    }).join('');
  }
  el.nav?.addEventListener('click', e => { const b = e.target.closest('.lvl'); if (b && !b.disabled) app.go(+b.dataset.i); });

  /* --- interruttore Simboli --- */
  if (cfg.sym && el.sym){
    const label = cfg.sym.label || 'Simboli';
    el.sym.classList.add('switch-row');
    el.sym.innerHTML = `<span id="symLbl">${esc(label)}</span><button class="switch" id="symToggle" type="button" role="switch" aria-checked="false" aria-labelledby="symLbl"><span class="st on" aria-hidden="true">SÌ</span><span class="st off" aria-hidden="true">NO</span></button>`;
    const btn = $('.switch', el.sym);
    const apply = on => { app.sym = on; document.body.classList.toggle('sym-on', on); btn.setAttribute('aria-checked', String(on)); };
    apply(!!st.get('sym', false));
    btn.addEventListener('click', () => { apply(!app.sym); st.set('sym', app.sym); cfg.sym.onChange?.(app.sym); });
  } else if (el.sym) el.sym.hidden = true;

  /* --- pulsante ↺ --- */
  if (el.reset){
    if (cfg.reset === false) el.reset.hidden = true;
    else {
      if (!el.reset.textContent.trim()){
        el.reset.textContent = '↺';
        el.reset.title = el.reset.getAttribute('aria-label') || 'Ricomincia il livello';
        el.reset.setAttribute('aria-label', el.reset.title);
      }
      el.reset.addEventListener('click', () => app.restart());
    }
  }

  /* --- azioni: data-act su pulsanti e form, data-input sui campi --- */
  function dispatch(name, node, e){
    if (app.busy) return;
    const h = app.level?.on?.[name];
    if (h) h.call(app.level, node, e); else cfg.act?.(name, node, e);
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-act]');
    if (!a || a.disabled || a.tagName === 'FORM' || a.closest('dialog')) return;
    dispatch(a.dataset.act, a, e);
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('form[data-act]');
    if (!f || f.closest('dialog')) return;
    e.preventDefault();
    dispatch(f.dataset.act, f, e);
  });
  document.addEventListener('input', e => {
    const t = e.target.closest('[data-input]');
    if (!t) return;
    const h = app.level?.on?.[t.dataset.input];
    if (h) h.call(app.level, t, e); else cfg.act?.(t.dataset.input, t, e);
  });

  app.debug();
  return app;
}
