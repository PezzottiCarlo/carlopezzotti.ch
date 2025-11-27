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
    BG_DARK: '#000000',
    WHITE: '#ffffff',
    YELLOW: '#fbbf24',
    RED: '#d90000',
    BLUE: '#0033cc',
    GREEN: '#00b300',
    GRAY: '#6b7280',
    BROWN: '#804000',
    SKIN: '#ffcc99',
    BLACK: '#000000',
    DARK_GREEN: '#006400'
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

function showMenu() {
    gameState = 'MENU';
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    clearScreen(C.BG_DARK);

    drawText('PIXEL ARCADE', RES / 2, 30, C.YELLOW, 14, 'center');
    drawText('L: DODGE', 10, 70, C.BLUE, 10);
    drawText('R: MARIO', 10, 90, C.RED, 10);
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

let p1 = { x: 60, w: 12, h: 12, trail: [] };
let obs1 = [];
let spd1 = 1.0;

function initGame1() {
    gameState = 'GAME1';
    score = 0;
    spd1 = 1.0;
    p1.x = RES / 2 - 6;
    p1.trail = [];
    obs1 = [];
    inputState.holding = false;
    startGameLoop(loopGame1);
}

function loopGame1() {
    score++;
    if (score % 500 === 0) spd1 += 0.2;

    if (inputState.holding) {
        if (inputState.side === 'LEFT') p1.x = Math.max(0, p1.x - 2);
        if (inputState.side === 'RIGHT') p1.x = Math.min(RES - p1.w, p1.x + 2);
    }

    if (Math.random() < 0.04) {
        const s = Math.random() * 10 + 6;
        obs1.push({ x: Math.random() * (RES - s), y: -20, w: s, h: s });
    }

    obs1.forEach(o => o.y += spd1);
    obs1 = obs1.filter(o => o.y < RES + 20);

    p1.trail.push({ x: p1.x, y: RES - 20 });
    if (p1.trail.length > 5) p1.trail.shift();

    let crash = false;
    const pr = { x: p1.x, y: RES - 20, w: p1.w, h: p1.w };
    obs1.forEach(o => {
        if (pr.x < o.x + o.w && pr.x + pr.w > o.x &&
            pr.y < o.y + o.h && pr.h + pr.y > o.y) crash = true;
    });

    if (crash) { showGameOver(); return; }

    clearScreen(C.BG_DARK);
    drawText(`${Math.floor(score / 10)}`, 4, 12, C.GRAY);

    ctx.fillStyle = '#1e3a8a';
    p1.trail.forEach((t, i) => ctx.fillRect(t.x + (p1.w - i * 2) / 2, t.y + 4, i * 2, i * 2));
    ctx.fillStyle = C.BLUE;
    ctx.fillRect(p1.x, RES - 20, p1.w, p1.h);
    ctx.fillStyle = C.RED;
    obs1.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
}

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

    ctx.fillStyle = C.GREEN;
    ctx.fillRect(0, PHY.Y_GND + 16, RES, 4);
    ctx.fillStyle = C.BROWN;
    ctx.fillRect(0, PHY.Y_GND + 20, RES, RES);

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
        if (btn === 'LEFT') initGame1();
        if (btn === 'RIGHT') initGame2();
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