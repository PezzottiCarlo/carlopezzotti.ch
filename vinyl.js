document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('vinylPlayer');
    const record = wrapper.querySelector('.record');
    const toneArm = wrapper.querySelector('.tone-arm');
    const recordLabel = wrapper.querySelector('.record-label');
    const vinylSection = document.getElementById('passions');
    
    // --- CONFIGURAZIONE FISICA ---
    const RPM = 33.3; 
    const ROTATION_SPEED = (RPM * 360) / (60 * 60); // Circa 3.33 gradi per frame a 60fps
    const FRICTION = 0.96; // Attrito quando il motore è spento
    const TORQUE = 0.05;   // Forza del motore per tornare a velocità normale
    const SCRATCH_SENSITIVITY = 1.0;
    const ARM_ANIMATION_DURATION = 1000; // ms - Deve corrispondere alla transition CSS

    // --- COPERTINE RANDOM ---
    const vinylCovers = [
        "https://static.fnac-static.com/multimedia/Images/FR/NR/48/95/d1/13735240/1520-1/tsp20210930082357/Ready-To-Die.jpg",
        "https://i.scdn.co/image/ab67616d0000b2739efeffdf7074481de1cccb39",
        "https://upload.wikimedia.org/wikipedia/it/5/53/Mr._Simpatia.jpg",
        "https://i.scdn.co/image/ab67616d0000b273db216ca805faf5fe35df4ee6",
        "https://upload.wikimedia.org/wikipedia/en/e/eb/Iron_Maiden_-_Fear_Of_The_Dark.jpg",
        "https://i.scdn.co/image/ab67616d0000b2735b96a8c5d61be8878452f8f1",
        "https://media.pitchfork.com/photos/59f8e52ae372437d4a40fdc1/master/pass/21%20savage%20without%20warning.jpg",
    ];

    function setRandomVinylCover() {
        if (recordLabel && vinylCovers.length > 0) {
            const randomIndex = Math.floor(Math.random() * vinylCovers.length);
            recordLabel.style.backgroundImage = `url('${vinylCovers[randomIndex]}')`;
        }
    }
    setRandomVinylCover();

    // --- STATO DEL SISTEMA ---
    let state = {
        isPlaying: false,  // Indica se l'utente/observer vuole che suoni (braccio giù)
        isMotorOn: false,  // Indica se il motore sta effettivamente spingendo (dopo che il braccio è arrivato)
        isDragging: false,
        currentAngle: 0,
        previousAngle: 0,
        velocity: 0,
        lastMouseAngle: 0,
        lastTimestamp: 0
    };

    let motorTimeout; // Variabile per gestire il ritardo dell'avvio

    // Disabilita l'animazione CSS
    record.style.animation = 'none';

    // --- FUNZIONI DI CALCOLO ---
    function getInputAngle(clientX, clientY) {
        const rect = record.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    }

    function getAngleDelta(current, prev) {
        let delta = current - prev;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        return delta;
    }

    // --- GAME LOOP (FISICA) ---
    function update(timestamp) {
        if (!state.lastTimestamp) state.lastTimestamp = timestamp;

        if (state.isDragging) {
            // Calcolo velocità durante il DRAG
            state.velocity = state.currentAngle - state.previousAngle;
        } else {
            // FISICA DEL RILASCIO
            // Usiamo isMotorOn invece di isPlaying per la fisica
            if (state.isMotorOn) {
                // Motore Acceso: Cerca di raggiungere 33 giri
                const targetSpeed = ROTATION_SPEED;
                state.velocity += (targetSpeed - state.velocity) * TORQUE;
            } else {
                // Motore Spento: Attrito
                state.velocity *= FRICTION;
                if (Math.abs(state.velocity) < 0.01) state.velocity = 0;
            }
            
            state.currentAngle += state.velocity;
        }

        record.style.transform = `rotate(${state.currentAngle}deg)`;
        state.previousAngle = state.currentAngle;
        state.lastTimestamp = timestamp;

        requestAnimationFrame(update);
    }

    requestAnimationFrame(update);

    // --- GESTORE PLAY/PAUSE CENTRALIZZATO ---
    function setPlayState(shouldPlay) {
        if (state.isPlaying === shouldPlay) return; // Nessun cambiamento, ignora

        state.isPlaying = shouldPlay;

        if (shouldPlay) {
            // 1. Avvia l'animazione visiva del braccio
            wrapper.classList.add('playing');

            // 2. Aspetta che il braccio si abbassi prima di accendere il motore
            clearTimeout(motorTimeout);
            motorTimeout = setTimeout(() => {
                // Controllo di sicurezza: se nel frattempo abbiamo fatto stop, non partire
                if (state.isPlaying) {
                    state.isMotorOn = true;
                }
            }, ARM_ANIMATION_DURATION);

        } else {
            // 1. Alza il braccio
            wrapper.classList.remove('playing');

            // 2. Spegni subito il motore (l'inerzia farà il resto)
            state.isMotorOn = false;
            clearTimeout(motorTimeout);
        }
    }

    // --- LOGICA AUTOMAZIONE (Intersection Observer) ---
    if (vinylSection) {
        const vinylObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Usa la funzione centralizzata
                setPlayState(entry.isIntersecting);
            });
        }, { threshold: 0.3 });
        
        vinylObserver.observe(vinylSection);
    }

    // --- EVENT LISTENERS (INTERAZIONE) ---

    // 1. Click Manuale sul braccio
    toneArm.addEventListener('click', (e) => {
        e.stopPropagation();
        setPlayState(!state.isPlaying);
    });

    // 2. Scratching (Mouse & Touch)
    const startDrag = (e) => {
        if (e.cancelable) e.preventDefault();
        state.isDragging = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        state.lastMouseAngle = getInputAngle(clientX, clientY);
    };

    const moveDrag = (e) => {
        if (!state.isDragging) return;
        if (e.cancelable) e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const currentMouseAngle = getInputAngle(clientX, clientY);
        const delta = getAngleDelta(currentMouseAngle, state.lastMouseAngle);
        
        state.currentAngle += delta * SCRATCH_SENSITIVITY;
        state.lastMouseAngle = currentMouseAngle;
    };

    const endDrag = () => {
        state.isDragging = false;
    };

    // Binding eventi
    record.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', endDrag);

    record.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', moveDrag, { passive: false });
    window.addEventListener('touchend', endDrag);

    record.style.cursor = 'grab';
    record.addEventListener('mousedown', () => record.style.cursor = 'grabbing');
    record.addEventListener('mouseup', () => record.style.cursor = 'grab');
});