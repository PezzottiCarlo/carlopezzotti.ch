/**
 * MAIN LOGIC SCRIPT
 * Gestisce le funzionalità del sito, API e interazioni.
 * Dipende da: translations.js (caricato prima nell'HTML)
 */

const GITHUB_USERNAME = 'PezzottiCarlo';
let currentLang = 'it'; 

// --- 1. FUNZIONE CAMBIO LINGUA ---
function setLanguage(lang) {
    currentLang = lang;

    // 1. Aggiorna testi statici (HTML)
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        // Prende i dati da translations.js
        if (translations[lang] && translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });

    // 2. Aggiorna Bottoni UI
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.toLowerCase() === lang) {
            btn.classList.add('active');
        }
    });

    // 3. Rigenera Liste Dinamiche
    renderTimeline();
    renderEducation();
    
    // NOTA: Se volessimo ricaricare i progetti GitHub (es. per tradurre la card di errore),
    // potremmo richiamare loadGitHub(), ma per ora lasciamo statico per evitare troppe chiamate API.
}

// --- 2. RENDER TIMELINES ---
function renderTimeline() {
    const root = document.getElementById('timeline-root');
    if (!root) return;
    root.innerHTML = '';
    
    // Usa historyData da translations.js
    historyData.forEach(item => {
        const el = document.createElement('div');
        el.className = 'timeline-item';
        el.innerHTML = `
            <div class="t-year">${item.start} - ${item.end}</div>
            <div class="t-title">${item.title[currentLang]}</div>
            <div class="t-desc">${item.desc[currentLang]}</div>
        `;
        root.appendChild(el);
    });
}

function renderEducation() {
    const root = document.getElementById('education-root');
    if (!root) return;
    root.innerHTML = '';

    // Usa educationData da translations.js
    educationData.forEach(item => {
        const el = document.createElement('div');
        el.className = 'timeline-item';
        el.innerHTML = `
            <div class="t-title">${item.school}</div>
            <div class="t-desc">${item.degree[currentLang]}</div>
        `;
        root.appendChild(el);
    });
}

// --- 3. THEME TOGGLE ---
const toggle = document.getElementById('themeToggle');
const body = document.body;

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    body.setAttribute('data-theme', 'dark');
    toggle.innerText = '☀️';
}

toggle.addEventListener('click', () => {
    const isDark = body.getAttribute('data-theme') === 'dark';
    body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    toggle.innerText = isDark ? '🌙' : '☀️';
});

// --- 4. VINYL ANIMATION ---
const vinylSection = document.getElementById('passions');
const vinylPlayer = document.getElementById('vinylPlayer');
const vinylObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) vinylPlayer.classList.add('playing');
        else vinylPlayer.classList.remove('playing');
    });
}, { threshold: 0.3 });
if (vinylSection) vinylObserver.observe(vinylSection);

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
    const recordLabel = document.querySelector('.record-label');
    if (recordLabel && vinylCovers.length > 0) {
        const randomIndex = Math.floor(Math.random() * vinylCovers.length);
        recordLabel.style.backgroundImage = `url('${vinylCovers[randomIndex]}')`;
    }
}
setRandomVinylCover();

// --- 5. GITHUB API FETCH ---
async function loadGitHub() {
    const pCont = document.getElementById('projects-container');
    const sCont = document.getElementById('skills-container');

    if (!pCont || !sCont) return;
    const langs = new Set();

    try {
        const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&direction=desc&per_page=12&type=owner`);
        if (!res.ok) throw new Error("API Error");
        let repos = await res.json();

        pCont.innerHTML = '';
        sCont.innerHTML = '';

        repos.forEach(repo => {
            const card = document.createElement('div');
            card.className = 'project-card';
            
            const desc = repo.description ? repo.description : translations[currentLang].no_desc;
            const lastPush = new Date(repo.pushed_at).toLocaleDateString();

            card.innerHTML = `
                <div>
                    <h3>${repo.name}</h3>
                    <p>${desc}</p>
                </div>
                <div style="margin-top:auto; font-size:0.8rem; display:flex; justify-content:space-between; align-items:flex-end; color:var(--accent);">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:600;">● ${repo.language || 'Code'}</span>
                        <span style="font-size:0.7rem; opacity:0.7; color:var(--text-muted); margin-top:2px;">${lastPush}</span>
                    </div>
                    <span style="font-weight:bold;">★ ${repo.stargazers_count}</span>
                </div>
            `;
            
            card.onclick = () => window.open(repo.html_url, '_blank');
            pCont.appendChild(card);

            if (repo.language) langs.add(repo.language);
        });

        if (langs.size === 0) sCont.innerHTML = '<span style="font-size:0.9rem; opacity:0.7">Nessun dato</span>';

        Array.from(langs).sort().forEach(l => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.innerText = l;
            sCont.appendChild(tag);
        });

    } catch (e) {
        console.error("Github Error:", e);
        pCont.innerHTML = '<div style="padding:20px; color:#ef4444;">Errore GitHub.</div>';
    }
}

// --- AVVIO DELL'APP ---
// Imposta la lingua iniziale (che userà i dati appena caricati da translations.js)
setLanguage('it'); 
loadGitHub();