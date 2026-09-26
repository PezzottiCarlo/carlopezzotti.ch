const canvas = document.getElementById('arcade-canvas');
const ctx = canvas.getContext('2d');

const RES = 128;
canvas.width = RES;
canvas.height = RES;
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.objectFit = 'contain';
canvas.style.imageRendering = 'pixelated';
ctx.imageSmoothingEnabled = false;

const btnLeftArcade = document.getElementById('btn-left');
const btnRightArcade = document.getElementById('btn-right');

const C = {
    BG_SKY: '#60a5fa',
    BG_DARK: '#050505', // Leggermente meno nero assoluto per profondità
    WHITE: '#ffffff',
    YELLOW: '#fbbf24',
    RED: '#d90000',
    BLUE: '#0033cc',
    CYAN: '#22d3ee',
    GREEN: '#00b300',
    GRAY: '#6b7280',
    darkGRAY: '#374151',
    BROWN: '#804000',
    SKIN: '#ffcc99',
    BLACK: '#000000',
    DARK_GREEN: '#006400',
    PURPLE: '#9333ea',
    ORANGE: '#f97316'
};

let gameState = 'MENU';
let gameLoopId;
let score = 0;
let frameCount = 0;

let inputState = {
    holding: false,
    pressed: false,
    side: null
};

// --- SPRITES (Mario & Goomba rimasti uguali) ---
const SPRITES = {
    mario: [
        [0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0],
        [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
        [0, 0, 3, 3, 3, 4, 4, 3, 4, 0, 0, 0],
        [0, 3, 4, 3, 4, 4, 4, 3, 4, 4, 4, 0],
        [0, 3, 4, 3, 3, 4, 4, 4, 3, 4, 4, 4],
        [0, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3, 0],
        [0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 0, 0],
        [0, 0, 2, 2, 5, 2, 2, 5, 0, 0, 0, 0],
        [0, 2, 2, 2, 5, 2, 2, 5, 2, 2, 2, 0],
        [2, 2, 2, 2, 5, 5, 5, 5, 2, 2, 2, 2],
        [4, 4, 2, 5, 5, 2, 2, 5, 5, 2, 4, 4],
        [4, 4, 4, 5, 5, 5, 5, 5, 5, 4, 4, 4],
        [4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4],
        [0, 0, 5, 5, 5, 0, 0, 5, 5, 5, 0, 0],
        [0, 3, 3, 3, 0, 0, 0, 0, 3, 3, 3, 0],
        [3, 3, 3, 3, 0, 0, 0, 0, 3, 3, 3, 3]
    ],
    goomba: [
        [0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0],
        [0, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 0],
        [0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0],
        [0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0],
        [0, 3, 3, 3, 6, 3, 3, 6, 3, 3, 3, 0],
        [3, 3, 3, 4, 6, 4, 4, 6, 4, 3, 3, 3],
        [3, 3, 3, 4, 4, 4, 4, 4, 4, 3, 3, 3],
        [3, 3, 3, 4, 4, 4, 4, 4, 4, 3, 3, 3],
        [3, 3, 3, 4, 4, 4, 4, 4, 4, 3, 3, 3],
        [0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0],
        [0, 0, 6, 6, 6, 0, 0, 6, 6, 6, 0, 0],
        [0, 6, 6, 6, 6, 0, 0, 6, 6, 6, 6, 0]
    ],
    bigPlantHead: [
        [0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 2, 2, 1, 1, 2, 2, 2, 2, 0, 0, 0, 0, 0],
        [0, 0, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 0, 0, 0, 0],
        [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0],
        [0, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0],
        [2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0],
        [2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0],
        [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0],
        [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0]
    ]
};

// --- UTILS ---
function drawPixelSprite(spriteMap, x, y, flip = false) {
    for (let r = 0; r < spriteMap.length; r++) {
        for (let c = 0; c < spriteMap[r].length; c++) {
            const colorCode = spriteMap[r][flip ? spriteMap[r].length - 1 - c : c];
            if (colorCode !== 0) {
                if (colorCode === 1) ctx.fillStyle = C.WHITE;
                if (colorCode === 2) ctx.fillStyle = C.RED;
                if (colorCode === 3) ctx.fillStyle = C.BROWN;
                if (colorCode === 4) ctx.fillStyle = C.SKIN;
                if (colorCode === 5) ctx.fillStyle = C.BLUE;
                if (colorCode === 6) ctx.fillStyle = C.BLACK;
                if (colorCode === 7) ctx.fillStyle = C.GREEN;
                ctx.fillRect(x + c, y + r, 1, 1);
            }
        }
    }
}

function clearScreen(color = C.BG_DARK) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, RES, RES);
}

function drawText(text, x, y, color = C.WHITE, size = 10, align = 'start') {
    ctx.fillStyle = color;
    ctx.font = `${size}px monospace`;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
}

function startGameLoop(loopFunction) {
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    function step() {
        if (gameState === 'GAMEOVER') return;
        loopFunction();
        if (gameState !== 'GAMEOVER') {
            gameLoopId = requestAnimationFrame(step);
        }
    }
    step();
}

// --- MENU & SYSTEM ---

function showMenu() {
    gameState = 'MENU';
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    clearScreen(C.BG_DARK);

    // Sfondo a righe retro
    ctx.fillStyle = '#111';
    for (let i = 0; i < RES; i += 4) ctx.fillRect(0, i, RES, 1);

    drawText('PIXEL ARCADE', RES / 2, 30, C.YELLOW, 14, 'center');

    // Icona L
    ctx.fillStyle = C.CYAN;
    ctx.fillRect(10, 62, 8, 4);
    drawText('L: ARKANOID', 24, 70, C.CYAN, 10);

    // Icona R
    ctx.fillStyle = C.RED;
    ctx.fillRect(10, 82, 8, 4);
    drawText('R: MARIO', 24, 90, C.RED, 10);

    ctx.fillStyle = C.GRAY;
    ctx.fillRect(0, 116, RES, 4);
}

function showGameOver() {
    if (gameState === 'GAMEOVER') return;
    gameState = 'GAMEOVER';
    cancelAnimationFrame(gameLoopId);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, RES, RES);
    drawText('GAME OVER', RES / 2, 50, C.RED, 16, 'center');
    drawText(`SCORE: ${score}`, RES / 2, 70, C.WHITE, 10, 'center');
    drawText('PRESS BUTTON', RES / 2, 100, C.GRAY, 8, 'center');
}

// ==========================================
// GAME 1: ARKANOID / BREAKOUT (Nuovo)
// ==========================================

let pad = { x: 50, y: 115, w: 24, h: 4, spd: 3 };
let ball = { x: 64, y: 100, r: 2, vx: 0, vy: 0, active: false };
let bricks = [];
let particles = []; // Effetti esplosione

const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_W = 14;
const BRICK_H = 6;
const BRICK_GAP = 2;
const OFFSET_X = (RES - (BRICK_COLS * (BRICK_W + BRICK_GAP))) / 2 + 1;
const OFFSET_Y = 20;

const ROW_COLORS = [C.RED, C.ORANGE, C.YELLOW, C.GREEN, C.CYAN];

function initGame1() {
    gameState = 'GAME1';
    score = 0;
    particles = [];

    // Reset Paddle
    pad.x = (RES - pad.w) / 2;

    // Reset Ball
    resetBall();

    // Genera Mattoni
    bricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
            bricks.push({
                x: OFFSET_X + c * (BRICK_W + BRICK_GAP),
                y: OFFSET_Y + r * (BRICK_H + BRICK_GAP),
                w: BRICK_W,
                h: BRICK_H,
                color: ROW_COLORS[r],
                active: true
            });
        }
    }

    startGameLoop(loopGame1);
}

function resetBall() {
    ball.active = false;
    ball.x = pad.x + pad.w / 2;
    ball.y = pad.y - 4;
    ball.vx = 0;
    ball.vy = 0;
}

function spawnParticles(x, y, color) {
    for (let i = 0; i < 6; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 1.0,
            color: color
        });
    }
}

function loopGame1() {
    clearScreen(C.BG_DARK);

    // 1. Logica Paddle
    if (inputState.holding) {
        if (inputState.side === 'LEFT') pad.x = Math.max(0, pad.x - pad.spd);
        if (inputState.side === 'RIGHT') pad.x = Math.min(RES - pad.w, pad.x + pad.spd);
    }

    // 2. Lancio palla
    if (!ball.active) {
        ball.x = pad.x + pad.w / 2 - ball.r / 2;
        ball.y = pad.y - ball.r * 2;

        // Auto-lancio se si preme un tasto
        if (inputState.pressed) {
            ball.active = true;
            ball.vy = -1.8; // Velocità verticale base
            ball.vx = (Math.random() > 0.5 ? 1 : -1) * 1.5;
            inputState.pressed = false;
        }
    } else {
        // 3. Fisica Palla
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Rimbalzo Muri
        if (ball.x <= 0 || ball.x + ball.r >= RES) ball.vx *= -1;
        if (ball.y <= 0) ball.vy *= -1;

        // Game Over (fondo)
        if (ball.y > RES) {
            showGameOver();
            return;
        }

        // Collisione Paddle
        if (ball.y + ball.r >= pad.y && ball.y <= pad.y + pad.h &&
            ball.x + ball.r >= pad.x && ball.x <= pad.x + pad.w) {

            ball.vy = -Math.abs(ball.vy); // Rimbalza su sempre

            // "English" effect: cambia angolo in base a dove colpisci la paletta
            let hitPoint = (ball.x - (pad.x + pad.w / 2)) / (pad.w / 2);
            ball.vx = hitPoint * 2.5;

            // Aumenta leggermente velocità gioco
            ball.vx *= 1.02;
            ball.vy *= 1.02;
        }

        // Collisione Mattoni
        let hitBrick = false;
        bricks.forEach(b => {
            if (!b.active || hitBrick) return;

            if (ball.x + ball.r > b.x && ball.x < b.x + b.w &&
                ball.y + ball.r > b.y && ball.y < b.y + b.h) {

                b.active = false;
                hitBrick = true;
                score += 10;
                ball.vy *= -1; // Rimbalzo semplice
                spawnParticles(b.x + b.w / 2, b.y + b.h / 2, b.color);
            }
        });

        // Vittoria (resetta mattoni se finiti)
        if (bricks.every(b => !b.active)) {
            // Respawn bricks
            bricks.forEach(b => b.active = true);
            ball.vx *= 1.1; // Più veloce livello successivo
            ball.vy *= 1.1;
            resetBall();
        }
    }

    // 4. Disegno Mattoni (con effetto 3D)
    bricks.forEach(b => {
        if (b.active) {
            // Colore principale
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);

            // Ombreggiatura (Bottom/Right)
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(b.x, b.y + b.h - 1, b.w, 1);
            ctx.fillRect(b.x + b.w - 1, b.y, 1, b.h);

            // Luce (Top/Left)
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(b.x, b.y, b.w, 1);
            ctx.fillRect(b.x, b.y, 1, b.h);
        }
    });

    // 5. Disegno Paddle
    ctx.fillStyle = C.BLUE;
    ctx.fillRect(pad.x, pad.y, pad.w, pad.h);
    // Dettagli metallici paddle
    ctx.fillStyle = C.CYAN;
    ctx.fillRect(pad.x, pad.y, pad.w, 1); // Bordo luce
    ctx.fillRect(pad.x + 2, pad.y + 1, 4, 2); // Luce sx
    ctx.fillRect(pad.x + pad.w - 6, pad.y + 1, 4, 2); // Luce dx

    // 6. Disegno Palla
    ctx.fillStyle = C.WHITE;
    ctx.fillRect(ball.x, ball.y, ball.r + 1, ball.r + 1); // +1 per renderla più visibile

    // 7. Disegno Particelle
    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        if (p.life > 0) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 1, 1); // Pixel particella
            ctx.globalAlpha = 1.0;
        } else {
            particles.splice(index, 1);
        }
    });

    // HUD
    drawText(`SCORE ${score}`, RES / 2, 10, C.GRAY, 8, 'center');
    if (!ball.active) {
        drawText('PRESS TO START', RES / 2, 80, C.WHITE, 8, 'center');
    }
}

// ==========================================
// GAME 2: MARIO JUMP (Invariato)
// ==========================================

const PHY = { G: 0.5, JUMP: -8.5, Y_GND: RES - 28, X: 20 };
let m2 = { y: PHY.Y_GND, vy: 0, w: 12, h: 16, jump: false };
let enemies = [];
let spd2 = 2.0;
let spawnTimer = 0;

function initGame2() {
    gameState = 'GAME2';
    score = 0;
    spd2 = 2.0;
    spawnTimer = 20;
    m2.y = PHY.Y_GND;
    m2.vy = 0;
    m2.jump = false;
    enemies = [];
    frameCount = 0;
    startGameLoop(loopGame2);
}

function loopGame2() {
    score++;
    if (score % 600 === 0) spd2 += 0.25;

    if (inputState.pressed && !m2.jump) {
        m2.vy = PHY.JUMP;
        m2.jump = true;
        inputState.pressed = false;
    }

    if (!inputState.holding && m2.vy < -3) {
        m2.vy = -3;
    }

    m2.vy += PHY.G;
    m2.y += m2.vy;

    if (m2.y >= PHY.Y_GND) {
        m2.y = PHY.Y_GND;
        m2.vy = 0;
        m2.jump = false;
    }

    spawnTimer--;
    if (spawnTimer <= 0) {
        const type = Math.random() > 0.60 ? 'PLANT' : 'GOOMBA';
        const isPlant = type === 'PLANT';
        enemies.push({
            x: RES,
            y: isPlant ? PHY.Y_GND - 10 : PHY.Y_GND + 4,
            w: isPlant ? 16 : 11,
            h: isPlant ? 26 : 12,
            type: type
        });

        spawnTimer = Math.random() * (100 / spd2) + (60 / spd2);
    }

    enemies.forEach(e => e.x -= spd2);
    enemies = enemies.filter(e => e.x + e.w > -20);

    let hit = false;
    const mr = { x: PHY.X + 3, y: m2.y + 3, w: m2.w - 6, h: m2.h - 4 };

    enemies.forEach(e => {
        let pad = 2;
        if (mr.x < e.x + e.w - pad && mr.x + mr.w > e.x + pad &&
            mr.y < e.y + e.h - pad && mr.h + mr.y > e.y + pad) {
            hit = true;
        }
    });

    if (hit) { showGameOver(); return; }

    clearScreen(C.BG_SKY);

    // Terreno
    ctx.fillStyle = C.GREEN;
    ctx.fillRect(0, PHY.Y_GND + 16, RES, 4);
    ctx.fillStyle = C.BROWN;
    ctx.fillRect(0, PHY.Y_GND + 20, RES, RES);
    // Dettaglio terreno
    ctx.fillStyle = '#653300';
    for (let i = 0; i < RES; i += 10) ctx.fillRect(i, PHY.Y_GND + 24, 4, 4);

    // Sole
    ctx.fillStyle = C.WHITE;
    ctx.beginPath();
    ctx.arc(100, 20, 8, 0, Math.PI * 2);
    ctx.fill();

    drawText(`${Math.floor(score / 5)}`, 4, 12, C.WHITE);

    enemies.forEach(e => {
        if (e.type === 'GOOMBA') {
            let flip = (Math.floor(frameCount / 8) % 2 === 0);
            drawPixelSprite(SPRITES.goomba, e.x, e.y, flip);
        } else {
            const pipeH = 14;
            const pipeY = e.y + 12;

            ctx.fillStyle = C.GREEN;
            ctx.fillRect(e.x, pipeY, 16, pipeH);
            ctx.fillRect(e.x - 2, pipeY, 20, 4);

            ctx.fillStyle = C.DARK_GREEN;
            ctx.fillRect(e.x + 4, pipeY, 2, pipeH);

            drawPixelSprite(SPRITES.bigPlantHead, e.x, e.y, false);
        }
    });

    drawPixelSprite(SPRITES.mario, PHY.X, m2.y);
    frameCount++;
}

// --- INPUT & CONTROLS ---

function pressStart(btn) {
    if (gameState === 'GAMEOVER') {
        showMenu();
        return;
    }

    inputState.holding = true;
    inputState.pressed = true;
    inputState.side = btn;

    const btnEl = btn === 'LEFT' ? btnLeftArcade : btnRightArcade;
    if (btnEl) {
        btnEl.style.transform = "translateY(4px)";
        btnEl.style.boxShadow = "none";
    }

    if (gameState === 'MENU') {
        if (btn === 'LEFT') initGame1(); // Arkanoid
        if (btn === 'RIGHT') initGame2(); // Mario
    }
}

function pressEnd(btn) {
    inputState.holding = false;
    const btnEl = btn === 'LEFT' ? btnLeftArcade : btnRightArcade;
    if (btnEl) {
        btnEl.style.transform = "translateY(0)";
        btnEl.style.boxShadow = "0 6px 0 #991b1b";
    }
}

if (btnLeftArcade && btnRightArcade) {
    btnLeftArcade.addEventListener('mousedown', () => pressStart('LEFT'));
    btnLeftArcade.addEventListener('mouseup', () => pressEnd('LEFT'));
    btnLeftArcade.addEventListener('mouseleave', () => pressEnd('LEFT'));
    btnLeftArcade.addEventListener('touchstart', (e) => { e.preventDefault(); pressStart('LEFT'); });
    btnLeftArcade.addEventListener('touchend', (e) => { e.preventDefault(); pressEnd('LEFT'); });

    btnRightArcade.addEventListener('mousedown', () => pressStart('RIGHT'));
    btnRightArcade.addEventListener('mouseup', () => pressEnd('RIGHT'));
    btnRightArcade.addEventListener('mouseleave', () => pressEnd('RIGHT'));
    btnRightArcade.addEventListener('touchstart', (e) => { e.preventDefault(); pressStart('RIGHT'); });
    btnRightArcade.addEventListener('touchend', (e) => { e.preventDefault(); pressEnd('RIGHT'); });
}

setTimeout(showMenu, 200);