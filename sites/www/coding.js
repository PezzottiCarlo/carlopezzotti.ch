/**
 * TERMINALE
 * Digita una sessione finta riga per riga. Va in pausa quando la
 * sezione esce dallo schermo e non riparte da capo inutilmente.
 */
(function () {
    'use strict';

    const body = document.querySelector('.terminal-body');
    const out = document.getElementById('typewriter-text');
    if (!body || !out) return;

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    const TYPE_MIN = 28;
    const TYPE_MAX = 80;
    const LINE_PAUSE = 550;
    const RESTART_PAUSE = 4000;

    /* Colori coerenti con il fosforo del terminale */
    const CO = {
        prompt: '#d8d6cf',
        ok: '#7ec97a',
        warn: '#d8a33c',
        err: '#e0705f',
        info: '#79a6d2',
        dim: '#6f7a6d'
    };

    const sequence = [
        { text: 'carlo@lugano:~$ npm install --save-dev sanity', type: 'in' },
        { text: '[ERROR] 404 "sanity" not found.', color: CO.err },
        { text: '> falling back to coffee', color: CO.warn },

        { text: 'carlo@lugano:~$ sudo download_more_ram.sh', type: 'in' },
        { text: '[OK] 128GB RAM downloaded wirelessly.', color: CO.ok },

        { text: 'carlo@lugano:~$ git push --force production', type: 'in' },
        { text: '[CRITICAL] the database is gone.', color: CO.err, bold: true },
        { text: '[PANIC] look busy.', color: CO.warn },

        { text: 'carlo@lugano:~$ google "how to center a div"', type: 'in' },
        { text: '> 41 400 000 results', color: CO.info },
        { text: '> copy, paste, pray', color: CO.dim },

        { text: 'carlo@lugano:~$ ./hack_nasa.exe', type: 'in' },
        { text: '[DENIED] nice try.', color: CO.err },

        { text: 'carlo@lugano:~$ echo "it works on my machine"', type: 'in' },
        { text: 'shipping anyway.', color: CO.ok, bold: true }
    ];

    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const scroll = () => { body.scrollTop = body.scrollHeight; };

    let running = false;
    let visible = false;
    let done = false;

    function newLine(data) {
        const line = document.createElement('div');
        line.className = 'term-line';
        line.style.color = data.type === 'in' ? CO.prompt : (data.color || CO.ok);
        if (data.bold) line.style.fontWeight = '500';
        out.appendChild(line);
        return line;
    }

    function cursor() {
        const c = document.createElement('span');
        c.className = 'cursor';
        return c;
    }

    function dropCursor() {
        const old = out.querySelector('.cursor');
        if (old) old.remove();
    }

    async function typeLine(data) {
        dropCursor();
        const line = newLine(data);

        if (data.type !== 'in') {
            line.textContent = data.text;
            scroll();
            await wait(120);
            return;
        }

        const text = document.createElement('span');
        const car = cursor();
        line.append(text, car);

        for (const ch of data.text) {
            if (!visible) { text.textContent = data.text; break; }
            text.textContent += ch;
            scroll();
            await wait(TYPE_MIN + Math.random() * (TYPE_MAX - TYPE_MIN));
        }
        scroll();
    }

    /* Senza animazioni: la sessione compare tutta insieme, una volta. */
    function renderStatic() {
        out.textContent = '';
        sequence.forEach(data => { newLine(data).textContent = data.text; });
        out.appendChild(cursor());
        scroll();
        done = true;
    }

    async function loop() {
        if (running) return;
        running = true;

        while (visible) {
            out.textContent = '';
            for (const data of sequence) {
                if (!visible) break;
                await typeLine(data);
                await wait(LINE_PAUSE);
            }
            dropCursor();
            out.appendChild(cursor());
            if (!visible) break;
            await wait(RESTART_PAUSE);
        }

        running = false;
    }

    const section = document.querySelector('.terminal-section');

    if (!section || !('IntersectionObserver' in window)) {
        calm.matches ? renderStatic() : (visible = true, loop());
        return;
    }

    new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            visible = entry.isIntersecting;

            if (!visible) return;
            if (calm.matches) {
                if (!done) renderStatic();
            } else {
                loop();
            }
        });
    }, { threshold: 0.25 }).observe(section);
})();
