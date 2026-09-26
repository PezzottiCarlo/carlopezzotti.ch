/**
 * ANTEPRIMA CERESIO OS
 * Il monitorino nella parte iniziale: il golfo di Lugano in pixel art, come
 * lo sfondo di so.carlopezzotti.ch, con una finestrella che "scrive".
 * Si ferma quando esce dallo schermo o se il sistema chiede meno movimento.
 */
(function () {
    const canvas = document.getElementById('osScreen');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    const C = {
        night: '#141a33', ink: '#241f2e', lake: '#1f4e7a', lakeHi: '#3b87b9', sky: '#8fd0ea',
        mist: '#d7ecf0', snow: '#fbf6e9', stone: '#a39d8f', slate: '#5b5d72', red: '#d52b3a',
        orange: '#f0892f', gold: '#f6cb4b', pine: '#2d6a4c', leaf: '#73b04c', rose: '#e5919f'
    };
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const bay = (x, y) => BAYER[(x & 3) + ((y & 3) << 2)];
    const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

    // Ora di Lugano: di notte il lago si accende.
    const hour = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', hour12: false }).format(new Date()) % 24;
    const night = hour >= 20 || hour < 7;
    const dusk = hour >= 18 && hour < 20;

    const HY = 50; // orizzonte
    const sal = (x) => { const d = Math.abs(x - 38) / 24; return d >= 1 ? 0 : 30 * (1 - Math.pow(d, 1.25)); };
    const bre = (x) => { const d = Math.abs(x - 118) / 46; return d >= 1 ? 0 : 19 * Math.pow(Math.cos(d * Math.PI / 2), 0.7); };
    const far = (x) => 11 + 3 * Math.sin(x * 0.12 + 1) + 2 * Math.sin(x * 0.31);

    // Sfondo fisso disegnato una volta sola.
    const bg = document.createElement('canvas');
    bg.width = W; bg.height = H;
    const b = bg.getContext('2d');
    const px = (c, x, y, w = 1, h = 1) => { b.fillStyle = c; b.fillRect(x, y, w, h); };
    const skyCols = night ? [C.night, C.night, C.lake] : dusk ? [C.night, C.lake, C.rose, C.orange] : [C.lakeHi, C.sky, C.sky, C.mist];
    for (let y = 0; y < HY; y++) {
        const v = (y / HY) * (skyCols.length - 1), i = Math.floor(v);
        for (let x = 0; x < W; x++) px(bay(x, y) < (v - i) * 16 ? skyCols[Math.min(skyCols.length - 1, i + 1)] : skyCols[i], x, y);
    }
    if (night) for (let i = 0; i < 28; i++) px(i % 5 ? C.mist : C.gold, Math.floor(hash(i) * W), Math.floor(8 + hash(i * 3) * 26));
    // Sole o luna.
    const sx = 92, sy = 16;
    b.fillStyle = night ? C.mist : dusk ? C.orange : C.gold;
    b.beginPath(); b.arc(sx, sy, 4, 0, Math.PI * 2); b.fill();
    if (night) { b.fillStyle = C.night; b.beginPath(); b.arc(sx + 2, sy - 1, 3.5, 0, Math.PI * 2); b.fill(); }
    const mtn = night || dusk ? C.ink : C.pine, hi = night ? C.night : dusk ? '#7b4b2f' : C.leaf, farC = night ? C.ink : dusk ? C.slate : C.stone;
    for (let x = 0; x < W; x++) {
        const fT = HY - Math.round(far(x)), sT = HY - Math.round(sal(x)), bT = HY - Math.round(bre(x));
        for (let y = Math.min(fT, sT, bT); y < HY; y++) {
            if (y >= sT && sal(x) > 0) px(x > 44 && bay(x, y) < 6 ? C.ink : hash(x * 7 + y * 3) < 0.1 ? hi : mtn, x, y);
            else if (y >= bT && bre(x) > 0) px(hash(x * 3 + y * 9) < 0.12 ? hi : mtn, x, y);
            else if (y >= fT) px(y - fT < 2 && !night ? C.snow : farC, x, y);
        }
    }
    // Città sul lungolago.
    for (let x = 52, i = 0; x < 100; i++) {
        const w = 2 + Math.floor(hash(i) * 3), h = 2 + Math.floor(hash(i * 5) * 4);
        const col = night ? C.slate : [C.snow, C.rose, C.gold, C.mist][i % 4];
        px(col, x, HY - h, w, h);
        if (night && hash(i * 9) < 0.7) px(C.gold, x + 1, HY - h + 1);
        else if (!night) px(C.red, x, HY - h, w, 1);
        x += w;
    }
    // Lago con riflessi.
    for (let y = HY; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const dy = y - HY, sy2 = HY - 1 - Math.round(dy * 1.5);
            let c = (y - HY) / (H - HY) > 0.6 && bay(x, y) < 8 ? (night ? C.night : C.lake) : C.lake;
            if (dy < 14 && sy2 > HY - sal(x) && sal(x) > 0 && bay(x, y) < 9) c = mtn;
            else if (dy < 10 && sy2 > HY - bre(x) && bre(x) > 0 && bay(x, y) < 7) c = mtn;
            px(c, x, y);
        }
    }
    // Barra dei menu, come su Ceresio.
    px(C.snow, 0, 0, W, 5); px(C.ink, 0, 5, W, 1);
    px(C.pine, 2, 1, 3, 3); px(C.ink, 7, 2, 12, 1); px(C.ink, 22, 2, 10, 1); px(C.ink, W - 12, 2, 10, 1);

    // Finestrella con il testo che si scrive da solo.
    const win = { x: 70, y: 10, w: 50, h: 30 };
    const LINES = [18, 26, 12, 22, 30, 16];

    let t = 0, last = 0, raf = 0, visible = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function frame(now) {
        if (now - last < 80) { raf = requestAnimationFrame(frame); return; } // ~12 fps: basta per i pixel
        last = now; t += 1;
        draw();
        if (!reduced && visible) raf = requestAnimationFrame(frame);
    }
    function draw() {
        ctx.drawImage(bg, 0, 0);
        // Scintille sul lago.
        for (let i = 0; i < 12; i++) {
            if (Math.sin(t * 0.25 + i * 1.7) < 0.2) continue;
            const y = HY + 2 + Math.floor(hash(i * 3) * (H - HY - 3));
            const x = Math.floor((hash(i * 7) * W + t * (0.3 + (i % 3) * 0.2)) % W);
            ctx.fillStyle = night ? C.slate : C.mist;
            ctx.fillRect(x, y, 2 + (i % 3), 1);
        }
        // Battello.
        const bx = Math.floor((t * 0.4) % (W + 30)) - 15, by = HY + 8;
        ctx.fillStyle = C.snow; ctx.fillRect(bx, by, 12, 2); ctx.fillRect(bx + 3, by - 2, 6, 2);
        ctx.fillStyle = C.red; ctx.fillRect(bx, by + 2, 12, 1); ctx.fillRect(bx + 1, by - 4, 2, 2);
        // Finestra.
        const { x, y, w, h } = win;
        ctx.fillStyle = 'rgba(20,26,51,.45)'; ctx.fillRect(x + 2, y + 2, w, h);
        ctx.fillStyle = C.ink; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = C.lake; ctx.fillRect(x + 1, y + 1, w - 2, 4);
        ctx.fillStyle = C.lakeHi; ctx.fillRect(x + 6, y + 2, w - 12, 1); ctx.fillRect(x + 6, y + 4, w - 12, 1);
        ctx.fillStyle = C.snow; ctx.fillRect(x + 1, y + 2, 3, 3); ctx.fillRect(x + 1, y + 6, w - 2, h - 7);
        // Righe che compaiono una dopo l'altra, poi si ricomincia.
        const shown = Math.floor(t / 3) % (LINES.length * 12 + 20);
        let left = shown;
        for (let i = 0; i < LINES.length; i++) {
            const len = Math.max(0, Math.min(LINES[i] + 6 > w - 6 ? w - 8 : LINES[i], left));
            left -= LINES[i];
            ctx.fillStyle = i === 0 ? C.lake : C.slate;
            if (len > 0) ctx.fillRect(x + 4, y + 9 + i * 3, len, 1);
            if (left < 0 || i === LINES.length - 1) {
                if (Math.floor(t / 4) % 2) { ctx.fillStyle = C.red; ctx.fillRect(x + 4 + len + 1, y + 8 + i * 3, 1, 3); }
                break;
            }
        }
    }

    draw();
    if (reduced) return;
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            visible = entries[0].isIntersecting;
            cancelAnimationFrame(raf);
            if (visible) raf = requestAnimationFrame(frame);
        }).observe(canvas);
    } else raf = requestAnimationFrame(frame);
})();
