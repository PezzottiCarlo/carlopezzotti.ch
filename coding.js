/**
 * CODING.JS
 * Simula un terminale hacker attivo con digitazione realistica.
 */

const terminalContainer = document.querySelector('.terminal-body');
const terminalOutput = document.getElementById('typewriter-text');

// Configurazione
const TYPING_SPEED_MIN = 30;  // ms
const TYPING_SPEED_MAX = 90;  // ms
const PAUSE_BETWEEN_LINES = 600; // ms
const RESTART_DELAY = 3000;   // ms prima di ricominciare

// La sequenza di comandi "Hacker/Dev"
// Sostituisci la vecchia const sequence con questa:

const sequence = [
    { text: "user@portfolio:~$ npm install --save-dev sanity", type: "input", color: "#fff" },
    { text: "[ERROR] 404 'Sanity' not found.", type: "output", color: "#ef4444" }, // Rosso
    { text: "> Trying coffee fallback...", type: "output", color: "#fbbf24" }, // Giallo
    
    { text: "user@portfolio:~$ sudo download_more_ram.sh", type: "input", color: "#fff" },
    { text: "[SUCCESS] 128GB RAM downloaded wirelessly.", type: "output", color: "#22c55e" }, // Verde
    
    { text: "user@portfolio:~$ git push --force production", type: "input", color: "#fff" },
    { text: "[CRITICAL] 🔥 YOU DELETED THE DATABASE 🔥", type: "output", color: "#ef4444", bold: true },
    { text: "[PANIC] Boss is looking... Act busy.", type: "output", color: "#fbbf24" },
    
    { text: "user@portfolio:~$ google 'how to center a div'", type: "input", color: "#fff" },
    { text: "> Searching StackOverflow...", type: "output", color: "#60a5fa" }, // Blu
    { text: "> Ctrl+C / Ctrl+V sequence initiated.", type: "output", color: "#6b7280" },
    
    { text: "user@portfolio:~$ hack_nasa_with_html.exe", type: "input", color: "#fff" },
    { text: "[ACCESS DENIED] Use Python, script kiddie.", type: "output", color: "#ef4444" },
    
    { text: "user@portfolio:~$ echo 'It works on my machine'", type: "input", color: "#fff" },
    { text: "Deploying 🚀 (Good luck).", type: "output", color: "#22c55e", bold: true },
    
    { text: "_", type: "cursor" } // Placeholder finale
];

// Funzione per dormire (pausa)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Funzione per digitare un singolo carattere
async function typeCharacter(char, span) {
    span.textContent += char;
    // Scrolla sempre in basso
    if (terminalContainer) terminalContainer.scrollTop = terminalContainer.scrollHeight;
    
    // Velocità random per realismo umano
    const randomSpeed = Math.floor(Math.random() * (TYPING_SPEED_MAX - TYPING_SPEED_MIN + 1)) + TYPING_SPEED_MIN;
    await wait(randomSpeed);
}

// Funzione principale che esegue una riga
async function processLine(lineData) {
    if (!terminalOutput) return;

    // Crea un nuovo contenitore per la riga
    const lineDiv = document.createElement('div');
    lineDiv.style.color = lineData.color || '#22c55e';
    lineDiv.style.fontFamily = "'Courier New', monospace";
    lineDiv.style.marginBottom = "4px";
    lineDiv.style.wordBreak = "break-all";
    
    if (lineData.bold) lineDiv.style.fontWeight = "bold";

    // Rimuoviamo il cursore precedente se esiste
    const prevCursor = document.getElementById('active-cursor');
    if (prevCursor) prevCursor.remove();

    terminalOutput.appendChild(lineDiv);

    // Se è un input (l'utente scrive), digitiamo carattere per carattere
    if (lineData.type === "input") {
        // Aggiungi cursore temporaneo alla riga
        const cursorSpan = document.createElement('span');
        cursorSpan.id = "active-cursor";
        cursorSpan.className = "cursor"; // Usa la classe CSS esistente
        cursorSpan.style.display = "inline-block"; // Fix visivo
        
        // Testo digitato
        const textSpan = document.createElement('span');
        lineDiv.appendChild(textSpan);
        lineDiv.appendChild(cursorSpan);

        for (let char of lineData.text) {
            await typeCharacter(char, textSpan);
        }
    } 
    // Se è output di sistema, appare istantaneamente (o con ritardo minimo)
    else if (lineData.type === "output") {
        lineDiv.textContent = lineData.text;
        await wait(100); // Piccola pausa "di calcolo"
    }

    // Scroll finale
    if (terminalContainer) terminalContainer.scrollTop = terminalContainer.scrollHeight;
}

// Loop principale
async function runTerminalLoop() {
    if (!terminalOutput) return;

    while (true) {
        // 1. Pulisci terminale
        terminalOutput.innerHTML = '';
        
        // 2. Esegui sequenza
        for (const line of sequence) {
            if (line.type === 'cursor') continue;
            await processLine(line);
            await wait(PAUSE_BETWEEN_LINES);
        }

        // 3. Aggiungi cursore lampeggiante finale in attesa
        const finalCursor = document.createElement('span');
        finalCursor.className = "cursor";
        terminalOutput.appendChild(finalCursor);

        // 4. Aspetta prima di ricominciare
        await wait(RESTART_DELAY);
    }
}

// Avvio quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    // Osserva quando la sezione diventa visibile per far partire l'animazione
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Controlla se sta già girando per evitare doppi avvii (opzionale)
                if (terminalOutput.innerHTML === "") {
                    runTerminalLoop();
                }
            }
        });
    }, { threshold: 0.3 });

    const section = document.querySelector('.terminal-section');
    if (section) observer.observe(section);
    else runTerminalLoop(); // Fallback
});