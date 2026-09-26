/**
 * DATA & TRANSLATIONS
 * Questo file contiene tutti i testi del sito.
 */

// --- DIZIONARIO TRADUZIONI (UI) ---
const translations = {
    it: {
        portfolio: "Portfolio",
        coding: "Coding & Hacking",
        subtitle: "Developer · Student · Tech Enthusiast",
        where_live: "Dove Vivo",
        live_desc: "Tra lago e montagne, un hub perfetto tra natura e innovazione tecnologica.",
        education_title: "Il mio Percorso",
        passions_title: "Le Mie Passioni",
        music: "Musica",
        gamer: "Gamer",
        github_title: "Progetti GitHub",
        fetching: "Dati in tempo reale da",
        extracted_repo: "Linguaggi estratti dalle repo:",
        languages_title: "Lingue",
        experience_title: "Esperienze",
        lang_it: "Italiano",
        lang_en: "Inglese",
        lang_de: "Tedesco",
        lang_fr: "Francese",
        coding: "Coding & Hacking",
        no_desc: "Nessuna descrizione."
    },
    en: {
        portfolio: "Portfolio",
        subtitle: "Developer · Student · Tech Enthusiast",
        where_live: "Where I Live",
        live_desc: "Between lake and mountains, a perfect hub between nature and tech innovation.",
        education_title: "My Journey",
        passions_title: "My Passions",
        music: "Music",
        gamer: "Gamer",
        github_title: "GitHub Projects",
        fetching: "Fetching live data from",
        extracted_repo: "Languages extracted from repos:",
        languages_title: "Languages",
        experience_title: "Experience",
        lang_it: "Italian",
        lang_en: "English",
        lang_de: "German",
        lang_fr: "French",
        coding: "Coding & Hacking",
        no_desc: "No description available."
    },
    fr: {
        portfolio: "Portfolio",
        subtitle: "Développeur · Étudiant · Tech Enthusiast",
        where_live: "Où je vis",
        live_desc: "Entre lac et montagnes, un hub parfait entre nature et innovation technologique.",
        education_title: "Mon Parcours",
        passions_title: "Mes Passions",
        music: "Musique",
        gamer: "Gamer",
        github_title: "Projets GitHub",
        fetching: "Données en direct de",
        extracted_repo: "Langages extraits des dépôts :",
        languages_title: "Langues",
        experience_title: "Expérience",
        lang_it: "Italien",
        lang_en: "Anglais",
        lang_de: "Allemand",
        lang_fr: "Français",
        coding: "Coding & Hacking",
        no_desc: "Aucune description."
    },
    de: {
        portfolio: "Portfolio",
        subtitle: "Entwickler · Student · Tech Enthusiast",
        where_live: "Wo ich lebe",
        live_desc: "Zwischen See und Bergen, ein perfekter Hub zwischen Natur und technischer Innovation.",
        education_title: "Mein Werdegang",
        passions_title: "Meine Leidenschaften",
        music: "Musik",
        gamer: "Gamer",
        github_title: "GitHub Projekte",
        fetching: "Live-Daten von",
        extracted_repo: "Aus Repos extrahierte Sprachen:",
        languages_title: "Sprachen",
        experience_title: "Erfahrung",
        lang_it: "Italienisch",
        lang_en: "Englisch",
        lang_de: "Deutsch",
        lang_fr: "Französisch",
        coding: "Coding & Hacking",
        no_desc: "Keine Beschreibung."
    }
};

// --- DATI ESPERIENZE (Multilingua) ---
const historyData = [
    { 
        start: "2016", end: "2017", 
        title: { it: "Adune Grouppe", en: "Adune Grouppe", fr: "Adune Grouppe", de: "Adune Grouppe" }, 
        desc: { 
            it: "Stage come sviluppatore junior in C# .NET.", 
            en: "Junior developer internship in C# .NET.", 
            fr: "Stage développeur junior en C# .NET.", 
            de: "Praktikum als Junior-Entwickler in C# .NET." 
        } 
    },
    { 
        start: "2020", end: "2021", 
        title: { it: "Soldato, Esercito", en: "Soldier, Swiss Army", fr: "Soldat, Armée suisse", de: "Soldat, Schweizer Armee" }, 
        desc: { 
            it: "Servizio militare, ruolo salvataggio e trasmissioni.", 
            en: "Military service, rescue and transmissions role.", 
            fr: "Service militaire, rôle sauvetage et transmissions.", 
            de: "Militärdienst, Rettungs- und Übermittlungsrolle." 
        } 
    },
    { 
        start: "2021", end: "2021", 
        title: { it: "Sergente, Esercito", en: "Sergeant, Swiss Army", fr: "Sergent, Armée suisse", de: "Wachtmeister, Schweizer Armee" }, 
        desc: { 
            it: "Corso di formazione e gestione team.", 
            en: "Training course and team management.", 
            fr: "Cours de formation et gestion d'équipe.", 
            de: "Ausbildungskurs und Teamführung." 
        } 
    },
    { 
        start: "2021", end: "2023", 
        title: { it: "Fattorino Pizza", en: "Pizza Delivery", fr: "Livreur de pizza", de: "Pizza-Kurier" }, 
        desc: { 
            it: "Lavoro part-time durante gli studi.", 
            en: "Part-time job during studies.", 
            fr: "Travail à temps partiel pendant les études.", 
            de: "Teilzeitjob während des Studiums." 
        } 
    },
    { 
        start: "2021", end: "2025", 
        title: { it: "Sicurezza Stadio", en: "Stadium Security", fr: "Sécurité du stade", de: "Stadionsicherheit" }, 
        desc: { 
            it: "Gestione sicurezza eventi sportivi.", 
            en: "Security management for sports events.", 
            fr: "Gestion de la sécurité des événements sportifs.", 
            de: "Sicherheitsmanagement bei Sportveranstaltungen." 
        } 
    },
    { 
        start: "2025", end: "2025", 
        title: { it: "Ricercatore Junior", en: "Junior Researcher", fr: "Chercheur Junior", de: "Junior-Forscher" }, 
        desc: { 
            it: "Progetto dati energie rinnovabili.", 
            en: "Renewable energy data project.", 
            fr: "Projet de données sur les énergies renouvelables.", 
            de: "Datenprojekt für erneuerbare Energien." 
        } 
    },
    { 
        start: "2025", end: "Pres.", 
        title: { it: "Freelance Dev", en: "Freelance Dev", fr: "Dév Freelance", de: "Freelance Dev" }, 
        desc: { 
            it: "Sviluppo soluzioni web personalizzate.", 
            en: "Development of custom web solutions.", 
            fr: "Développement de solutions web personnalisées.", 
            de: "Entwicklung maßgeschneiderter Web-Lösungen." 
        } 
    }
];

// --- DATI STUDI (Multilingua) ---
const educationData = [
    { 
        school: "SAM Trevano", 
        degree: { it: "Informatica & Elettronica", en: "Computer Science & Electronics", fr: "Informatique & Électronique", de: "Informatik & Elektronik" } 
    },
    { 
        school: "SUPSI DTI", 
        degree: { it: "Bachelor Ingegneria Informatica", en: "Bachelor Computer Engineering", fr: "Bachelor Ingénierie Informatique", de: "Bachelor Informatikingenieurwesen" } 
    },
    { 
        school: "Thomas More", 
        degree: { it: "Erasmus - Computer Science", en: "Erasmus - Computer Science", fr: "Erasmus - Informatique", de: "Erasmus - Informatik" } 
    },
    { 
        school: "KU Leuven", 
        degree: { it: "Corso integrazione sociale", en: "Social Integration Course", fr: "Cours d'intégration sociale", de: "Sozialer Integrationskurs" } 
    },
    { 
        school: "SUPSI DFA", 
        degree: { it: "Formazione & Apprendimento", en: "Education & Learning", fr: "Formation & Apprentissage", de: "Bildung & Lernen" } 
    }
];