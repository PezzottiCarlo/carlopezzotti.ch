/* Ceresio OS — easter egg globali: Konami, mascotte, salvaschermo, crash, spegnimento, Matrix. */
(() => {
'use strict';
const OS = window.OS, P = OS.P, L = OS.L;

/* ------------------------------------------------------------ codice Konami */
const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
let kpos = 0;
OS.on('key', (k) => {
  const key = k.key.toLowerCase();
  kpos = key === KONAMI[kpos] ? kpos + 1 : key === KONAMI[0] ? 1 : 0;
  if (kpos === KONAMI.length) {
    kpos = 0;
    OS.unlock('konami');
    OS.rainbow = true;
    OS.shake = 0.5;
    OS.sfx.win();
    setTimeout(() => OS.open('secret'), 600);
  }
});

/* ------------------------------------------------------------ mascotte: scrivi "carlo" sulla scrivania */
let typed = '', walker = null;
OS.on('desktype', (ch) => {
  typed = (typed + ch.toLowerCase()).slice(-5);
  if (typed === 'carlo' && !walker) {
    walker = { t: 0 };
    OS.unlock('carlo');
    OS.sfx.coin();
  }
});
OS.deskOverlays.push((g, dt) => {
  if (!walker) return;
  const { W, H } = OS.scr;
  walker.t += dt;
  const x = Math.round(-16 + walker.t * 34), y = H - 20;
  OS.spr(Math.floor(walker.t * 5) % 2 ? 'carlo1' : 'carlo2', x, y);
  if (x > W * 0.25 && x < W * 0.25 + 90) {
    const s = L('Ciao! Pizza in consegna.', 'Hi! Pizza on the way.');
    const w = OS.textW(s) + 8;
    OS.rect(x - 4, y - 16, w, 12, P.snow); OS.frame(x - 4, y - 16, w, 12, P.ink);
    OS.px(x + 4, y - 4, P.ink); OS.px(x + 5, y - 5, P.ink);
    OS.text(s, x, y - 15, P.ink);
  }
  if (x > W + 20) walker = null;
});

/* ------------------------------------------------------------ salvaschermo: pizze e bandiere in volo */
const IDLE = 60e3;
let saver = null;
OS.overlays.push((g, dt) => {
  const onDesk = OS.scene && OS.scene.isDesktop;
  if (!onDesk) { saver = null; return; }
  const idle = performance.now() - OS.inp.last;
  if (!saver && idle > IDLE) {
    saver = { stars: Array.from({ length: 36 }, () => spawn(true)) };
    OS.unlock('idle');
  }
  if (saver && idle < 200) saver = null;
  if (!saver) return;
  const { W, H } = OS.scr;
  OS.rect(0, 0, W, H, P.night);
  for (const s of saver.stars) {
    s.z -= dt * 0.35;
    if (s.z <= 0.05) Object.assign(s, spawn(false));
    const x = W / 2 + s.x / s.z * W * 0.3, y = H / 2 + s.y / s.z * H * 0.3;
    const sc = s.z < 0.3 ? 3 : s.z < 0.6 ? 2 : 1;
    if (s.z > 0.85) OS.px(x, y, P.mist);
    else OS.spr(s.kind, x - 8 * sc / 2, y - 8 * sc / 2, sc);
  }
  OS.textC(L('Ceresio riposa. Muovi il mouse.', 'Ceresio is resting. Move the mouse.'), W / 2, H - 14, P.slate);
});
function spawn(first) {
  return { x: OS.rand(-1, 1), y: OS.rand(-1, 1), z: first ? OS.rand(0.2, 1) : 1, kind: Math.random() < 0.7 ? 'pizza' : 'flag' };
}

/* ------------------------------------------------------------ crash: Guru Meditation */
OS.crash = () => {
  OS.sfx.boom();
  OS.music.stop();
  OS.shake = 0.6;
  const code = '#0000000' + (4 + Math.floor(Math.random() * 4)) + '.' + Math.floor(Math.random() * 0xffffffff).toString(16).toUpperCase().padStart(8, '0');
  OS.setScene({
    t: 0,
    update(dt) { this.t += dt; if (this.t > 0.8 && (OS.inp.released || OS.inp.keys.length)) location.reload(); },
    draw() {
      const { W, H } = OS.scr;
      OS.rect(0, 0, W, H, '#000');
      const on = Math.floor(this.t * 1.6) % 2 === 0;
      const bw = Math.min(W - 12, 300), bx = (W - bw) >> 1;
      OS.frame(bx, 8, bw, 36, on ? P.red : '#000');
      OS.frame(bx + 1, 9, bw - 2, 34, on ? P.red : '#000');
      OS.textC(L('Errore software. Tocca per continuare.', 'Software failure. Tap to continue.'), W / 2, 14, P.red);
      OS.textC('Guru Meditation ' + code, W / 2, 28, P.red);
      OS.textC(L('Hai cancellato tutto. Anche il lago.', 'You deleted everything. The lake too.'), W / 2, H / 2, P.slate);
    }
  });
};

/* ------------------------------------------------------------ spegnimento */
OS.shutdown = () => {
  OS.dialog({
    title: L('Spegni', 'Shut down'), icon: 'warn',
    text: L('Vuoi davvero spegnere Ceresio?', 'Do you really want to shut Ceresio down?'),
    buttons: [{ label: L('Spegni', 'Shut down'), act: powerOff }, { label: L('Annulla', 'Cancel') }]
  });
};
function powerOff() {
  OS.unlock('shutdown');
  OS.music.stop();
  OS.sfx.shutdown();
  const snap = document.createElement('canvas');
  snap.width = OS.scr.W; snap.height = OS.scr.H;
  setTimeout(() => {
    snap.getContext('2d').drawImage(OS.g.canvas, 0, 0);
    OS.wins.slice().forEach((w) => { w.inst.close?.(); });
    OS.wins.length = 0;
    OS.setScene({
      t: 0,
      update(dt) { this.t += dt; if (this.t > 2 && (OS.inp.released || OS.inp.keys.length)) location.reload(); },
      draw(g) {
        const { W, H } = OS.scr;
        OS.rect(0, 0, W, H, '#000');
        const t = this.t;
        if (t < 0.35) {
          const k = 1 - t / 0.35;
          const h = Math.max(1, Math.round(H * k * k));
          g.drawImage(snap, 0, (H - h) >> 1, W, h);
          if (h < 6) OS.rect(0, (H >> 1) - 1, W, 2, P.snow);
        } else if (t < 0.6) {
          const k = 1 - (t - 0.35) / 0.25;
          const w = Math.max(1, Math.round(W * k * k));
          OS.rect((W - w) >> 1, (H >> 1) - 1, w, 2, P.snow);
        } else if (t < 0.9) {
          if (Math.floor(t * 20) % 2) OS.rect((W >> 1) - 1, (H >> 1) - 1, 2, 2, P.snow);
        } else if (t > 1.4) {
          OS.textC(L('Ora è possibile spegnere il computer.', 'It is now safe to turn off your computer.'), W / 2, (H >> 1) - 6, P.orange);
          if (t > 2.4) OS.textC(L('Tocca per riaccendere.', 'Tap to power on again.'), W / 2, (H >> 1) + 12, P.slate);
        }
      }
    });
  }, 250);
}

/* ------------------------------------------------------------ pioggia di Matrix */
OS.fx = {
  matrix(secs) {
    const { W, H } = OS.scr;
    const cols = Math.ceil(W / 6);
    const drops = Array.from({ length: cols }, () => ({ y: OS.rand(-H, 0), v: OS.rand(40, 110) }));
    const CH = '0123456789ABCDEFCERESIOLUGANO';
    let t = 0;
    const fx = (g, dt) => {
      t += dt;
      const fade = Math.min(1, t * 2, (secs - t) * 2);
      OS.dither(0, 0, W, H, '', '#000', Math.round(fade * 15));
      drops.forEach((d, i) => {
        d.y += d.v * dt;
        if (d.y > H + 60) d.y = OS.rand(-40, 0);
        for (let k = 0; k < 8; k++) {
          const y = Math.floor((d.y - k * 10) / 10) * 10;
          if (y < 0 || y > H) continue;
          const ch = CH[(i * 7 + k * 3 + Math.floor(t * 8)) % CH.length];
          OS.text(ch, i * 6, y, k === 0 ? P.mist : k < 3 ? P.leaf : P.pine);
        }
      });
      if (t >= secs) OS.overlays.splice(OS.overlays.indexOf(fx), 1);
    };
    OS.overlays.push(fx);
  }
};
})();
