/**
 * GIRADISCHI
 * Piatto con inerzia reale: il motore porta il disco a 33 giri,
 * il trascinamento fa scratch, l'attrito lo ferma.
 * Il braccio comanda play e stop, a mano o entrando nella sezione.
 */
(function () {
    'use strict';

    const wrapper = document.getElementById('vinylPlayer');
    if (!wrapper) return;

    const record = wrapper.querySelector('.record');
    const toneArm = wrapper.querySelector('.tone-arm');
    const recordLabel = wrapper.querySelector('.record-label');
    const section = document.getElementById('workbench');

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* --- Fisica --- */
    const RPM = 33.3;
    const SPEED = (RPM * 360) / (60 * 60); /* gradi per frame a 60fps */
    const FRICTION = 0.96;                 /* motore spento */
    const TORQUE = 0.05;                   /* richiamo verso i 33 giri */
    const ARM_DROP_MS = 900;               /* pari alla transition CSS */

    /* --- Copertine: caricate prima di essere applicate, cosi' un
       link rotto lascia l'etichetta nera invece di un buco. --- */
    const covers = [
        'https://i.scdn.co/image/ab67616d0000b2739efeffdf7074481de1cccb39',
        'https://upload.wikimedia.org/wikipedia/it/5/53/Mr._Simpatia.jpg',
        'https://i.scdn.co/image/ab67616d0000b273db216ca805faf5fe35df4ee6',
        'https://upload.wikimedia.org/wikipedia/en/e/eb/Iron_Maiden_-_Fear_Of_The_Dark.jpg',
        'https://i.scdn.co/image/ab67616d0000b2735b96a8c5d61be8878452f8f1'
    ];

    (function pickCover() {
        if (!recordLabel || !covers.length) return;
        const src = covers[Math.floor(Math.random() * covers.length)];
        const probe = new Image();
        probe.onload = () => { recordLabel.style.backgroundImage = 'url("' + src + '")'; };
        probe.src = src;
    })();

    /* --- Stato --- */
    const state = {
        wantsPlay: false,   /* braccio abbassato */
        motorOn: false,     /* motore che spinge davvero */
        dragging: false,
        angle: 0,
        prevAngle: 0,
        velocity: 0,
        lastPointerAngle: 0,
        visible: false
    };

    let motorTimer = null;
    let frame = null;

    record.style.animation = 'none'; /* la rotazione la governa il JS */

    /* --- Geometria del puntatore --- */
    function pointerAngle(x, y) {
        const r = record.getBoundingClientRect();
        return Math.atan2(y - (r.top + r.height / 2), x - (r.left + r.width / 2)) * (180 / Math.PI);
    }

    function shortestDelta(current, prev) {
        let d = current - prev;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        return d;
    }

    /* --- Ciclo di animazione: gira solo quando serve davvero --- */
    function needsFrames() {
        return state.dragging || state.motorOn || Math.abs(state.velocity) > 0.01;
    }

    function update() {
        if (state.dragging) {
            state.velocity = state.angle - state.prevAngle;
        } else if (state.motorOn) {
            state.velocity += (SPEED - state.velocity) * TORQUE;
            state.angle += state.velocity;
        } else {
            state.velocity *= FRICTION;
            if (Math.abs(state.velocity) < 0.01) state.velocity = 0;
            state.angle += state.velocity;
        }

        record.style.transform = 'rotate(' + state.angle + 'deg)';
        state.prevAngle = state.angle;

        frame = needsFrames() ? requestAnimationFrame(update) : null;
    }

    function wake() {
        if (frame === null) frame = requestAnimationFrame(update);
    }

    /* --- Play / stop --- */
    function setPlay(on) {
        if (state.wantsPlay === on) return;
        state.wantsPlay = on;
        toneArm.setAttribute('aria-pressed', String(on));

        clearTimeout(motorTimer);

        if (on) {
            wrapper.classList.add('playing');
            /* Il motore parte quando il braccio ha finito di scendere */
            motorTimer = setTimeout(() => {
                if (state.wantsPlay) {
                    state.motorOn = true;
                    wake();
                }
            }, calm.matches ? 0 : ARM_DROP_MS);
        } else {
            wrapper.classList.remove('playing');
            state.motorOn = false;
            wake(); /* lascia scorrere l'inerzia fino a fermarsi */
        }
    }

    /* --- Avvio automatico entrando nella sezione --- */
    if (section && 'IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                state.visible = entry.isIntersecting;
                /* Con "movimento ridotto" non parte da sola: decide l'utente. */
                if (calm.matches) {
                    if (!entry.isIntersecting) setPlay(false);
                } else {
                    setPlay(entry.isIntersecting);
                }
            });
        }, { threshold: 0.3 }).observe(section);
    }

    /* --- Braccio: click e tastiera --- */
    toneArm.setAttribute('aria-pressed', 'false');

    toneArm.addEventListener('click', (e) => {
        e.stopPropagation();
        setPlay(!state.wantsPlay);
    });

    toneArm.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            setPlay(!state.wantsPlay);
        }
    });

    /* --- Scratch --- */
    function startDrag(e) {
        state.dragging = true;
        record.style.cursor = 'grabbing';
        const p = e.touches ? e.touches[0] : e;
        state.lastPointerAngle = pointerAngle(p.clientX, p.clientY);
        wake();
    }

    function moveDrag(e) {
        if (!state.dragging) return;
        if (e.cancelable) e.preventDefault();
        const p = e.touches ? e.touches[0] : e;
        const now = pointerAngle(p.clientX, p.clientY);
        state.angle += shortestDelta(now, state.lastPointerAngle);
        state.lastPointerAngle = now;
    }

    function endDrag() {
        if (!state.dragging) return;
        state.dragging = false;
        record.style.cursor = 'grab';
        wake();
    }

    record.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', endDrag);

    record.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('touchmove', moveDrag, { passive: false });
    window.addEventListener('touchend', endDrag);
})();
