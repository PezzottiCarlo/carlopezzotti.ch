/* Ceresio OS — file system dell'utente: cartelle e documenti salvati nel browser,
   la finestra delle cartelle e il Blocco note. */
(() => {
'use strict';
const OS = window.OS, P = OS.P, L = OS.L;
const MAX_NODES = 200, MAX_TEXT = 20000;
const DESK_PATH = '/home/carlo/Scrivania';

/* ------------------------------------------------------------ modello */
// Nodo: { id, type: 'dir' | 'file', name, parent, text, t, x, y, from }
// Radici: 'desk' (la scrivania) e 'trash' (il cestino).
const FS = OS.fs = {
  nodes: {}, seq: 1, DESK_PATH,
  load() {
    const d = OS.store.get('fs', null);
    this.nodes = (d && d.nodes) || {};
    this.seq = (d && d.seq) || 1;
  },
  save() { OS.store.set('fs', { nodes: this.nodes, seq: this.seq }); OS.emit('fs'); },
  get(id) { return this.nodes[id] || null; },
  children(pid) {
    return Object.values(this.nodes).filter((n) => n.parent === pid)
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
  },
  // true se id sta dentro ancestor (a qualunque profondità).
  isIn(id, ancestor) {
    let n = this.get(id);
    for (let i = 0; n && i < 64; i++) { if (n.parent === ancestor) return true; n = this.get(n.parent); }
    return false;
  },
  inTrash(id) { return this.isIn(id, 'trash'); },
  checkName(pid, name, except) {
    name = String(name || '').trim();
    if (!name) return { err: L('Il nome non può essere vuoto.', 'The name cannot be empty.') };
    if (name.includes('/')) return { err: L('Il nome non può contenere "/".', 'The name cannot contain "/".') };
    if (name === '.' || name === '..') return { err: L('Nome non valido.', 'Invalid name.') };
    if ([...name].length > 24) return { err: L('Nome troppo lungo (massimo 24 caratteri).', 'Name too long (24 characters max).') };
    if (this.children(pid).some((n) => n.id !== except && n.name.toLowerCase() === name.toLowerCase())) {
      return { err: L(`Esiste già "${name}" in questa cartella.`, `"${name}" already exists in this folder.`) };
    }
    return { name };
  },
  unique(pid, base, except) {
    const dot = base.lastIndexOf('.');
    const stem = dot > 0 ? base.slice(0, dot) : base, ext = dot > 0 ? base.slice(dot) : '';
    for (let i = 1; i < 999; i++) {
      const name = i === 1 ? base : `${stem} ${i}${ext}`;
      if (!this.checkName(pid, name, except).err) return name;
    }
    return base + ' ' + Date.now();
  },
  // Restituisce il nodo creato oppure una stringa di errore.
  create(pid, type, name) {
    if (Object.keys(this.nodes).length >= MAX_NODES) return L('Troppi file: il disco da 64 KB è pieno.', 'Too many files: the 64 KB disk is full.');
    if (pid !== 'desk' && this.get(pid)?.type !== 'dir') return L('Cartella inesistente.', 'No such folder.');
    let nm;
    if (name) { const c = this.checkName(pid, name); if (c.err) return c.err; nm = c.name; }
    else nm = this.unique(pid, type === 'dir' ? L('Nuova cartella', 'New folder') : L('Documento.txt', 'Document.txt'));
    const n = { id: 'n' + (this.seq++).toString(36), type, name: nm, parent: pid, text: '', t: Date.now(), x: null, y: null };
    this.nodes[n.id] = n;
    this.save();
    return n;
  },
  rename(id, name) {
    const n = this.get(id);
    if (!n) return L('File inesistente.', 'No such file.');
    const c = this.checkName(n.parent, name, id);
    if (c.err) return c.err;
    n.name = c.name; n.t = Date.now();
    this.save();
    return null;
  },
  move(id, pid) {
    const n = this.get(id);
    if (!n) return L('File inesistente.', 'No such file.');
    if (n.parent === pid) return null;
    if (pid === id || this.isIn(pid, id)) return L('Non puoi mettere una cartella dentro se stessa.', 'You cannot put a folder inside itself.');
    n.parent = pid;
    n.name = this.unique(pid, n.name, id);
    n.x = n.y = null;
    this.save();
    return null;
  },
  remove(id) {
    const n = this.get(id);
    if (!n || n.parent === 'trash') return;
    n.from = n.parent; n.parent = 'trash'; n.x = n.y = null;
    n.name = this.unique('trash', n.name, id);
    this.closeWindows(id);
    this.save();
  },
  restore(id) {
    const n = this.get(id);
    if (!n) return;
    const back = n.from && (n.from === 'desk' || (this.get(n.from) && !this.inTrash(n.from) && n.from !== 'trash')) ? n.from : 'desk';
    n.parent = back; delete n.from;
    n.name = this.unique(back, n.name, id);
    this.save();
  },
  purge(id) {
    for (const c of this.children(id)) this.purge(c.id);
    this.closeWindows(id);
    delete this.nodes[id];
  },
  emptyTrash() {
    const list = this.children('trash');
    list.forEach((n) => this.purge(n.id));
    this.save();
    return list.length;
  },
  write(id, text) {
    const n = this.get(id);
    if (!n || n.type !== 'file') return;
    n.text = String(text).slice(0, MAX_TEXT); n.t = Date.now();
    this.save();
  },
  closeWindows(id) {
    for (const w of OS.wins.slice()) {
      if ((w.app === 'ufolder' || w.app === 'editor') && (w.arg === id || this.isIn(w.arg, id))) OS.closeWin(w);
    }
  },
  path(id) {
    const parts = [];
    let n = this.get(id);
    for (let i = 0; n && i < 64; i++) { parts.unshift(n.name); n = this.get(n.parent); }
    return DESK_PATH + (parts.length ? '/' + parts.join('/') : '');
  },
  // Percorso assoluto -> id ('desk' per la scrivania), oppure null.
  resolve(abs) {
    if (abs === DESK_PATH) return 'desk';
    if (!abs.startsWith(DESK_PATH + '/')) return null;
    let cur = 'desk';
    for (const seg of abs.slice(DESK_PATH.length + 1).split('/').filter(Boolean)) {
      const next = this.children(cur).find((c) => c.name === seg);
      if (!next) return null;
      cur = next.id;
    }
    return cur;
  },
  open(id, o) {
    const n = this.get(id);
    if (!n) return;
    OS.open(n.type === 'dir' ? 'ufolder' : 'editor', id, o);
  }
};
FS.load();

/* ------------------------------------------------------------ finestra cartella */
const CELL = 70, ROW = 36, BAR = 17;
OS.app('ufolder', {
  title: (id) => FS.get(id)?.name || L('Cartella', 'Folder'), icon: 'folder', w: 250, h: 170, minW: 120, minH: 80,
  make(win, id) {
    const st = { sel: null, ren: null, scroll: 0 };
    const startRename = (n) => { st.sel = n.id; st.ren = { id: n.id, text: n.name }; OS.keyboard(OS.inp.touch); };
    const add = (type) => {
      const n = FS.create(id, type);
      if (typeof n === 'string') return OS.dialog({ title: L('Nuovo', 'New'), icon: 'warn', text: n });
      startRename(n);
    };
    const itemMenu = (n) => [
      { label: L('Apri', 'Open'), kbd: n.type === 'file', act: () => FS.open(n.id) },
      { label: L('Rinomina', 'Rename'), kbd: true, act: () => startRename(n) },
      { sep: true },
      { label: L('Sposta nel cestino', 'Move to trash'), act: () => FS.remove(n.id) }
    ];
    const bgMenu = () => [
      { label: L('Nuova cartella', 'New folder'), kbd: true, act: () => add('dir') },
      { label: L('Nuovo documento', 'New document'), kbd: true, act: () => add('file') }
    ];
    return {
      // Tastiera sul telefono: durante una rinomina, sui pulsanti "+" e sui documenti.
      kbdAt(x, y) {
        const r = st.r;
        if (!r) return false;
        if (st.ren) return true;
        if (y - r.y < BAR) return x - r.x > 20;
        return st.items.some((it) => it.file && x >= it.x && y >= it.y && x < it.x + CELL && y < it.y + ROW - 4);
      },
      draw(g, r, io) {
        st.r = r; st.items = [];
        const me = FS.get(id);
        if (!me || FS.inTrash(id)) { OS.closeWin(win); return; }
        win.title = me.name;
        // Barra degli strumenti.
        OS.rect(r.x, r.y, r.w, BAR, P.mist);
        OS.rect(r.x, r.y + BAR - 1, r.w, 1, P.stone);
        let bx = 2;
        if (me.parent !== 'desk' && OS.ui.button(io, bx, 2, '▲')) { OS.open('ufolder', me.parent); }
        if (me.parent !== 'desk') bx += OS.ui.buttonW('▲') + 3;
        if (OS.ui.button(io, bx, 2, L('+ Cartella', '+ Folder'))) add('dir');
        bx += OS.ui.buttonW(L('+ Cartella', '+ Folder')) + 3;
        if (OS.ui.button(io, bx, 2, L('+ Documento', '+ Document'))) add('file');

        const list = FS.children(id);
        const area = { y: BAR, h: r.h - BAR };
        const per = Math.max(1, Math.floor((r.w - 12) / CELL));
        const contentH = Math.ceil(list.length / per) * ROW + 8;
        const sub = OS.ui.sub(io, 0, area.y);
        OS.ui.scrollInput(st.ren ? { ...sub, keys: [], wheel: sub.wheel } : sub, st, area.h, contentH, r.w - 8);
        const s = Math.round(st.scroll);
        OS.clip(r.x, r.y + area.y, r.w - 8, area.h);
        if (!list.length) {
          OS.textC(L('Cartella vuota.', 'Empty folder.'), r.x + (r.w - 8) / 2, r.y + area.y + 14, P.slate);
          OS.textC(L('Crea un file o trascinalo qui.', 'Create a file or drag one here.'), r.x + (r.w - 8) / 2, r.y + area.y + 26, P.stone);
        }
        let hitItem = null;
        list.forEach((n, i) => {
          const x = 4 + (i % per) * CELL, y = area.y + 4 + Math.floor(i / per) * ROW - s;
          if (y + ROW < area.y || y > r.h) return;
          const sel = st.sel === n.id;
          const icon = n.type === 'dir' ? 'folder' : 'note';
          OS.spr(sel ? icon + ':sel' : icon, r.x + x + (CELL >> 1) - 8, r.y + y);
          if (st.ren?.id === n.id) OS.drawEditLabel(st.ren.text, r.x + x + CELL / 2, r.y + y + 18, 40);
          else {
            let lbl = n.name;
            if (OS.textW(lbl) > CELL - 2) lbl = lbl.slice(0, Math.floor((CELL - 2) / OS.CW) - 1) + '…';
            const lw = OS.textW(lbl);
            if (sel) OS.rect(r.x + x + ((CELL - lw) >> 1) - 2, r.y + y + 18, lw + 3, 11, P.lake);
            OS.text(lbl, r.x + x + ((CELL - lw) >> 1), r.y + y + 19, sel ? P.snow : P.ink);
          }
          if (y >= area.y - 10 && io.hit(x, Math.max(area.y, y), CELL, ROW - 4)) hitItem = n;
          st.items.push({ x: r.x + x, y: r.y + y, file: n.type === 'file' });
        });
        OS.unclip();
        st.scroll = OS.ui.scrollbar(io, r.w - 8, area.y, area.h, st.scroll, contentH, area.h, st);

        // Mouse.
        if (hitItem) OS.cursor = 'hand';
        if (io.pressed && io.y >= area.y && io.x < r.w - 8) {
          if (st.ren) { const e = FS.rename(st.ren.id, st.ren.text); st.ren = null; if (e) OS.dialog({ title: L('Rinomina', 'Rename'), icon: 'warn', text: e }); }
          if (hitItem) {
            if (st.sel !== hitItem.id) OS.sfx.click();
            st.sel = hitItem.id;
            if (io.dbl && !io.touch) FS.open(hitItem.id);
            else OS.dnd = { id: hitItem.id, moved: false, x0: OS.inp.px, y0: OS.inp.py };
          } else st.sel = null;
        }
        if (io.released && hitItem && io.touch && !OS.dnd?.moved && io.pressIn(0, area.y, r.w - 8, area.h) && st.sel === hitItem.id && !st.dragged) FS.open(hitItem.id);
        if (io.rpressed) {
          const p = io.screen(io.x, io.y);
          if (hitItem) { st.sel = hitItem.id; OS.menu(p.x, p.y, itemMenu(hitItem)); } else OS.menu(p.x, p.y, bgMenu());
        }
        // Tastiera.
        if (st.ren) {
          const res = OS.editLabel(st.ren, io.keys);
          if (res === 'ok') { const e = FS.rename(st.ren.id, st.ren.text); if (e) OS.dialog({ title: L('Rinomina', 'Rename'), icon: 'warn', text: e }); st.ren = null; OS.keyboard(false); }
          else if (res === 'cancel') { st.ren = null; OS.keyboard(false); }
          return;
        }
        const idx = list.findIndex((n) => n.id === st.sel);
        for (const k of io.keys) {
          if (k.key === 'ArrowRight' || k.key === 'ArrowDown') st.sel = list[Math.min(list.length - 1, idx + (k.key === 'ArrowDown' ? per : 1))]?.id ?? st.sel;
          else if (k.key === 'ArrowLeft' || k.key === 'ArrowUp') st.sel = list[Math.max(0, idx - (k.key === 'ArrowUp' ? per : 1))]?.id ?? st.sel;
          else if (k.key === 'Enter' && st.sel) FS.open(st.sel);
          else if (k.key === 'F2' && st.sel) startRename(FS.get(st.sel));
          else if ((k.key === 'Delete') && st.sel) FS.remove(st.sel);
        }
      }
    };
  }
});

/* ------------------------------------------------------------ Blocco note */
OS.app('editor', {
  title: (id) => (FS.get(id)?.name || '') + L(' - Blocco note', ' - Notepad'), icon: 'note',
  w: 260, h: 190, minW: 120, minH: 70, wantsKeyboard: true,
  make(win, id) {
    const n0 = FS.get(id);
    const st = { text: n0 ? n0.text : '', caret: n0 ? n0.text.length : 0, scroll: 0, dirty: false, edited: 0, saved: 0, want: -1 };
    const flush = () => { if (st.dirty) { FS.write(id, st.text); st.dirty = false; st.saved = OS.time; } };
    const edit = (text, caret) => { st.text = text.slice(0, MAX_TEXT); st.caret = Math.min(caret, st.text.length); st.dirty = true; st.edited = OS.time; st.want = -1; };
    return {
      draw(g, r, io) {
        const n = FS.get(id);
        if (!n || FS.inTrash(id)) { OS.closeWin(win); return; }
        win.title = n.name + L(' - Blocco note', ' - Notepad');
        const sbw = 8, stH = 11;
        const ax = r.x + 3, ay = r.y + 2, aw = r.w - sbw - 5, ah = r.h - stH - 3;
        const cols = Math.max(4, Math.floor(aw / OS.CW)), vis = Math.max(1, Math.floor(ah / OS.CH));
        // Righe visive: le righe lunghe vanno a capo a cols caratteri.
        const rows = [];
        let start = 0;
        for (const line of st.text.split('\n')) {
          if (!line.length) rows.push([start, start]);
          for (let i = 0; i < line.length; i += cols) rows.push([start + i, start + Math.min(line.length, i + cols)]);
          start += line.length + 1;
        }
        const rowOf = (c) => {
          for (let i = rows.length - 1; i >= 0; i--) if (c >= rows[i][0]) return i;
          return 0;
        };
        // Tastiera.
        for (const k of io.keys) {
          const t = st.text, c = st.caret;
          const row = rowOf(c), col = c - rows[row][0];
          if (k.ctrl && k.key.toLowerCase() === 's') { st.dirty = true; flush(); OS.sfx.select(); continue; }
          if (k.ctrl) continue;
          if (k.key === 'Backspace') { if (c > 0) edit(t.slice(0, c - 1) + t.slice(c), c - 1); }
          else if (k.key === 'Delete') { if (c < t.length) edit(t.slice(0, c) + t.slice(c + 1), c); }
          else if (k.key === 'Enter') edit(t.slice(0, c) + '\n' + t.slice(c), c + 1);
          else if (k.key === 'Tab') edit(t.slice(0, c) + '  ' + t.slice(c), c + 2);
          else if (k.key === 'ArrowLeft') { st.caret = Math.max(0, c - 1); st.want = -1; }
          else if (k.key === 'ArrowRight') { st.caret = Math.min(t.length, c + 1); st.want = -1; }
          else if (k.key === 'ArrowUp' || k.key === 'ArrowDown' || k.key === 'PageUp' || k.key === 'PageDown') {
            const d = k.key === 'ArrowUp' ? -1 : k.key === 'ArrowDown' ? 1 : k.key === 'PageUp' ? -vis : vis;
            const nr = OS.clamp(row + d, 0, rows.length - 1);
            if (st.want < 0) st.want = col;
            st.caret = Math.min(rows[nr][1], rows[nr][0] + st.want);
          }
          else if (k.key === 'Home') st.caret = rows[row][0];
          else if (k.key === 'End') st.caret = rows[row][1];
          else if (k.key.length === 1) { edit(t.slice(0, c) + k.key + t.slice(c), c + 1); OS.sfx.key(); }
          else continue;
          st.follow = true;
        }
        if (st.dirty && OS.time - st.edited > 0.4) flush();
        // Ricalcola dopo le modifiche.
        rows.length = 0; start = 0;
        for (const line of st.text.split('\n')) {
          if (!line.length) rows.push([start, start]);
          for (let i = 0; i < line.length; i += cols) rows.push([start + i, start + Math.min(line.length, i + cols)]);
          start += line.length + 1;
        }
        const crow = rowOf(st.caret);
        // Mouse: posiziona il cursore.
        if (io.pressed && io.hit(0, 0, r.w - sbw, r.h - stH)) {
          const rr = OS.clamp(Math.floor((io.y - 2) / OS.CH) + st.scroll, 0, rows.length - 1);
          const cc = Math.max(0, Math.round((io.x - 3) / OS.CW));
          st.caret = Math.min(rows[rr][1], rows[rr][0] + cc); st.want = -1;
          OS.keyboard(io.touch);
        }
        if (io.inside && io.y < r.h - stH && io.x < r.w - sbw) OS.cursor = 'arrow';
        if (io.wheel) { st.scroll += io.wheel * 3; st.follow = false; }
        if (st.follow) {
          if (crow < st.scroll) st.scroll = crow;
          if (crow >= st.scroll + vis) st.scroll = crow - vis + 1;
          st.follow = false;
        }
        st.scroll = OS.clamp(st.scroll, 0, Math.max(0, rows.length - vis));
        // Testo.
        OS.rect(r.x, r.y, r.w - sbw, r.h - stH, P.snow);
        for (let i = 0; i < vis && st.scroll + i < rows.length; i++) {
          const [a, b] = rows[st.scroll + i];
          OS.text(st.text.slice(a, b), ax, ay + i * OS.CH, P.ink);
        }
        if (!st.text.length) OS.text(L('Scrivi qui...', 'Type here...'), ax, ay, P.stone);
        const vr = crow - st.scroll;
        if (vr >= 0 && vr < vis && io.focused && Math.floor(OS.time * 2.5) % 2 === 0) {
          OS.rect(ax + (st.caret - rows[crow][0]) * OS.CW - 1, ay + vr * OS.CH - 1, 1, OS.CH, P.lake);
        }
        // Barra di scorrimento a righe.
        const ss = { scroll: st.scroll * OS.CH };
        const ns = OS.ui.scrollbar(io, r.w - sbw, 0, r.h - stH, ss.scroll, rows.length * OS.CH + 4, vis * OS.CH, st);
        st.scroll = Math.round(ns / OS.CH);
        // Barra di stato.
        OS.rect(r.x, r.y + r.h - stH, r.w, stH, P.mist);
        OS.rect(r.x, r.y + r.h - stH, r.w, 1, P.stone);
        const lineNo = st.text.slice(0, st.caret).split('\n').length;
        const colNo = st.caret - st.text.lastIndexOf('\n', st.caret - 1);
        const info = L('Riga ', 'Ln ') + lineNo + ', ' + L('col ', 'col ') + colNo + '   ' + st.text.length + L(' caratteri', ' chars');
        OS.text(info, r.x + 3, r.y + r.h - stH + 1, P.slate);
        const saved = st.dirty ? L('modificato', 'edited') : L('salvato', 'saved');
        if (r.w > OS.textW(info) + OS.textW(saved) + 12) OS.text(saved, r.x + r.w - OS.textW(saved) - 3, r.y + r.h - stH + 1, st.dirty ? P.orange : P.pine);
      },
      close() { flush(); OS.keyboard(false); }
    };
  }
});

OS.tasks.push({ it: 'Monto il disco utente', en: 'Mounting the user disk', run: async () => { OS.emit('fs'); return Object.keys(FS.nodes).length + ' file'; } });
})();
