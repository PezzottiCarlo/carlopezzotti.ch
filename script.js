const GITHUB_USERNAME = 'PezzottiCarlo';

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

const vinylSection = document.getElementById('passions');
const vinylPlayer = document.getElementById('vinylPlayer');

const vinylObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            vinylPlayer.classList.add('playing');
        } else {
            vinylPlayer.classList.remove('playing');
        }
    });
}, { threshold: 0.3 });

if (vinylSection) {
    vinylObserver.observe(vinylSection);
}

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

const historyData = [
    { start: "2016", end: "2017", title: "Adune Grouppe", desc: "Stage come sviluppatore junior in C# .NET." },
    { start: "2020", end: "2021", title: "Soldato, Esercito Svizzero", desc: "Servizio militare, ruolo salvataggio e trasmissioni." },
    { start: "2021", end: "2021", title: "Sergente, Esercito Svizzero", desc: "Corso di formazione e gestione team." },
    { start: "2021", end: "2023", title: "Fattorino Pizza", desc: "Lavoro part-time durante gli studi." },
    { start: "2021", end: "2025", title: "Sicurezza Stadio Lugano", desc: "Gestione sicurezza eventi sportivi." },
    { start: "2025", end: "2025", title: "Ricercatore Junior", desc: "Progetto dati energie rinnovabili." },
    { start: "2025", end: "Presente", title: "Freelance Dev", desc: "Sviluppo soluzioni web personalizzate." }
];

const timelineRoot = document.getElementById('timeline-root');
if (timelineRoot) {
    timelineRoot.innerHTML = '';
    historyData.forEach(item => {
        const el = document.createElement('div');
        el.className = 'timeline-item';
        el.innerHTML = `
            <div class="t-year">${item.start} - ${item.end}</div>
            <div class="t-title">${item.title}</div>
            <div class="t-desc">${item.desc}</div>
        `;
        timelineRoot.appendChild(el);
    });
}

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

            const desc = repo.description ? repo.description : 'Nessuna descrizione disponibile.';
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
        pCont.innerHTML = '<div style="padding:20px; color:#ef4444;">Errore caricamento GitHub. Riprova più tardi.</div>';
    }
}

loadGitHub();