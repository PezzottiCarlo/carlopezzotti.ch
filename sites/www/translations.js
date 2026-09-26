/**
 * DATA & TRADUZIONI
 * Unica fonte di verità per i testi e per i dati biografici del sito.
 *
 * Struttura:
 *   SITE          -> configurazione (username GitHub, contatti, coordinate)
 *   translations  -> stringhe UI per lingua (chiavi usate da data-i18n nell'HTML)
 *   historyData   -> esperienze in ordine cronologico
 *   educationData -> formazione
 *   spokenLangs   -> lingue parlate con livello CEFR
 */

/* ============================================================
   1. CONFIGURAZIONE
   ============================================================ */
const SITE = {
    githubUser: 'PezzottiCarlo',
    // TODO Carlo: conferma o cambia questo indirizzo prima di pubblicare.
    email: 'carlo.pezzotti01@gmail.com',
    // Stringa vuota = il link non viene mostrato.
    linkedin: '',
    location: { city: 'Lugano', country: 'Svizzera', zip: 'CH-6900', lat: 46.0037, lon: 8.9511 },
    timeZone: 'Europe/Zurich',
    // Temperatura reale a Lugano via open-meteo (nessuna chiave).
    // Metti false per eliminare del tutto la chiamata di rete.
    showWeather: true
};

/* ============================================================
   2. STRINGHE UI
   ============================================================ */
const translations = {
    it: {
        skip_link: "Vai al contenuto",
        nav_home: "Inizio",
        nav_about: "Profilo",
        nav_path: "Percorso",
        nav_work: "Banco di lavoro",
        nav_projects: "Progetti",
        nav_contact: "Contatti",
        nav_label: "Sezioni del sito",
        theme_to_dark: "Passa al tema scuro",
        theme_to_light: "Passa al tema chiaro",
        lang_group: "Lingua del sito",

        role: "Sviluppatore full-stack e studente di ingegneria informatica",
        lead: "Costruisco software per il web, dal database al pixel. Studio a Lugano e lavoro come freelance.",
        available: "Disponibile per progetti",
        os_text: "Lo stesso curriculum dentro un sistema operativo a 8 bit, con terminale, giochi e una ventina di segreti da trovare.",
        os_cta: "Accendi Ceresio",
        cta_contact: "Scrivimi",
        cta_code: "Guarda il codice",
        readout_place: "Posizione",
        readout_time: "Ora locale",
        readout_temp: "Temperatura",

        about_title: "Profilo",
        bio_1: "Vivo a Lugano, tra il lago e le montagne. Abbastanza vicino a Milano e Zurigo per lavorare con entrambe, abbastanza lontano per avere silenzio quando serve.",
        bio_2: "Ho iniziato con l'elettronica e il C# a scuola, poi mi sono spostato sul web. Oggi lavoro su applicazioni full-stack, e la parte che mi piace di più resta capire come funziona una cosa prima di riscriverla meglio.",
        spec_base: "Base",
        spec_tz: "Fuso orario",
        spec_studies: "Studi",
        spec_status: "Stato",
        spec_status_v: "Studente e freelance",
        spec_working_langs: "Lingue di lavoro",
        langs_title: "Lingue",
        langs_note: "Livelli secondo il quadro europeo QCER.",
        level_native: "madrelingua",

        path_title: "Percorso",
        edu_title: "Formazione",
        exp_title: "Esperienza",
        kind_dev: "sviluppo",
        kind_job: "lavoro",
        kind_service: "servizio",
        kind_research: "ricerca",
        present: "oggi",

        work_title: "Banco di lavoro",
        work_lead: "Tre cose che mi tengono occupato fuori dal lavoro. Funzionano davvero: provale.",
        inst_vinyl: "Giradischi",
        inst_vinyl_hint: "Trascina il disco per scratchare, clicca il braccio per fermarlo.",
        inst_terminal: "Terminale",
        inst_terminal_hint: "Una giornata di lavoro, più o meno.",
        inst_arcade: "Cabinato",
        inst_arcade_hint: "Sinistra per Arkanoid, destra per Mario.",
        btn_left: "Pulsante sinistro, avvia Arkanoid",
        btn_right: "Pulsante destro, avvia Mario",

        projects_title: "Progetti",
        projects_lead: "Repository pubbliche, lette da GitHub al caricamento della pagina.",
        stat_repos: "repository",
        stat_stars: "stelle",
        stat_langs: "linguaggi",
        filter_all: "Tutti",
        filter_label: "Filtra per linguaggio",
        no_desc: "Nessuna descrizione.",
        updated: "aggiornato",
        loading: "Lettura da GitHub in corso.",
        error_title: "GitHub non risponde",
        error_body: "Il limite di richieste anonime è esaurito, oppure la rete è caduta. Le repository restano visibili sul profilo.",
        view_all: "Tutte le repository su GitHub",
        stack_title: "Tecnologie",
        stack_note: "Linguaggi rilevati nelle repository pubbliche.",

        contact_title: "Contatti",
        contact_lead: "Il modo più rapido è la mail. Rispondo in italiano, inglese, tedesco o francese.",
        email_label: "Email",
        copy: "Copia",
        copied: "Copiato",
        github_label: "GitHub",
        linkedin_label: "LinkedIn",
        location_label: "Dove sono",
        map_title: "Mappa di Lugano",
        footer_note: "Scritto a mano in HTML, CSS e JavaScript. Nessun framework."
    },

    en: {
        skip_link: "Skip to content",
        nav_home: "Start",
        nav_about: "Profile",
        nav_path: "Background",
        nav_work: "Workbench",
        nav_projects: "Projects",
        nav_contact: "Contact",
        nav_label: "Site sections",
        theme_to_dark: "Switch to dark theme",
        theme_to_light: "Switch to light theme",
        lang_group: "Site language",

        role: "Full-stack developer and computer engineering student",
        lead: "I build software for the web, from the database to the pixel. I study in Lugano and work freelance.",
        available: "Available for projects",
        os_text: "The same CV inside an 8-bit operating system, with a terminal, games and about twenty secrets to find.",
        os_cta: "Power on Ceresio",
        cta_contact: "Get in touch",
        cta_code: "See the code",
        readout_place: "Location",
        readout_time: "Local time",
        readout_temp: "Temperature",

        about_title: "Profile",
        bio_1: "I live in Lugano, between the lake and the mountains. Close enough to Milan and Zurich to work with both, far enough to get some quiet when I need it.",
        bio_2: "I started with electronics and C# at school, then moved to the web. Today I work on full-stack applications, and my favourite part is still figuring out how something works before rewriting it better.",
        spec_base: "Based in",
        spec_tz: "Time zone",
        spec_studies: "Studies",
        spec_status: "Status",
        spec_status_v: "Student and freelancer",
        spec_working_langs: "Working languages",
        langs_title: "Languages",
        langs_note: "Levels follow the European CEFR scale.",
        level_native: "native",

        path_title: "Background",
        edu_title: "Education",
        exp_title: "Experience",
        kind_dev: "development",
        kind_job: "job",
        kind_service: "service",
        kind_research: "research",
        present: "now",

        work_title: "Workbench",
        work_lead: "Three things that keep me busy outside work. They all actually run: try them.",
        inst_vinyl: "Turntable",
        inst_vinyl_hint: "Drag the record to scratch, click the arm to stop it.",
        inst_terminal: "Terminal",
        inst_terminal_hint: "A day at work, more or less.",
        inst_arcade: "Cabinet",
        inst_arcade_hint: "Left for Arkanoid, right for Mario.",
        btn_left: "Left button, starts Arkanoid",
        btn_right: "Right button, starts Mario",

        projects_title: "Projects",
        projects_lead: "Public repositories, read from GitHub when the page loads.",
        stat_repos: "repositories",
        stat_stars: "stars",
        stat_langs: "languages",
        filter_all: "All",
        filter_label: "Filter by language",
        no_desc: "No description.",
        updated: "updated",
        loading: "Reading from GitHub.",
        error_title: "GitHub is not answering",
        error_body: "The anonymous rate limit ran out, or the network dropped. The repositories are still on the profile.",
        view_all: "All repositories on GitHub",
        stack_title: "Tech",
        stack_note: "Languages detected in the public repositories.",

        contact_title: "Contact",
        contact_lead: "Email is the fastest way. I answer in Italian, English, German or French.",
        email_label: "Email",
        copy: "Copy",
        copied: "Copied",
        github_label: "GitHub",
        linkedin_label: "LinkedIn",
        location_label: "Where I am",
        map_title: "Map of Lugano",
        footer_note: "Hand-written in HTML, CSS and JavaScript. No framework."
    },

    fr: {
        skip_link: "Aller au contenu",
        nav_home: "Début",
        nav_about: "Profil",
        nav_path: "Parcours",
        nav_work: "Atelier",
        nav_projects: "Projets",
        nav_contact: "Contact",
        nav_label: "Sections du site",
        theme_to_dark: "Passer au thème sombre",
        theme_to_light: "Passer au thème clair",
        lang_group: "Langue du site",

        role: "Développeur full-stack et étudiant en ingénierie informatique",
        lead: "Je construis des logiciels pour le web, de la base de données au pixel. J'étudie à Lugano et je travaille en freelance.",
        available: "Disponible pour des projets",
        os_text: "Le même CV dans un système d'exploitation 8 bits, avec un terminal, des jeux et une vingtaine de secrets à trouver.",
        os_cta: "Allumer Ceresio",
        cta_contact: "Écrivez-moi",
        cta_code: "Voir le code",
        readout_place: "Position",
        readout_time: "Heure locale",
        readout_temp: "Température",

        about_title: "Profil",
        bio_1: "Je vis à Lugano, entre le lac et les montagnes. Assez près de Milan et de Zurich pour travailler avec les deux, assez loin pour avoir du calme quand il en faut.",
        bio_2: "J'ai commencé avec l'électronique et le C# à l'école, puis je suis passé au web. Aujourd'hui je travaille sur des applications full-stack, et ce que je préfère reste comprendre comment une chose fonctionne avant de la réécrire mieux.",
        spec_base: "Base",
        spec_tz: "Fuseau horaire",
        spec_studies: "Études",
        spec_status: "Statut",
        spec_status_v: "Étudiant et freelance",
        spec_working_langs: "Langues de travail",
        langs_title: "Langues",
        langs_note: "Niveaux selon le cadre européen CECRL.",
        level_native: "langue maternelle",

        path_title: "Parcours",
        edu_title: "Formation",
        exp_title: "Expérience",
        kind_dev: "développement",
        kind_job: "emploi",
        kind_service: "service",
        kind_research: "recherche",
        present: "aujourd'hui",

        work_title: "Atelier",
        work_lead: "Trois choses qui m'occupent en dehors du travail. Elles fonctionnent vraiment : essayez.",
        inst_vinyl: "Tourne-disque",
        inst_vinyl_hint: "Faites glisser le disque pour scratcher, cliquez sur le bras pour l'arrêter.",
        inst_terminal: "Terminal",
        inst_terminal_hint: "Une journée de travail, à peu près.",
        inst_arcade: "Borne d'arcade",
        inst_arcade_hint: "Gauche pour Arkanoid, droite pour Mario.",
        btn_left: "Bouton gauche, lance Arkanoid",
        btn_right: "Bouton droit, lance Mario",

        projects_title: "Projets",
        projects_lead: "Dépôts publics, lus depuis GitHub au chargement de la page.",
        stat_repos: "dépôts",
        stat_stars: "étoiles",
        stat_langs: "langages",
        filter_all: "Tous",
        filter_label: "Filtrer par langage",
        no_desc: "Aucune description.",
        updated: "mis à jour",
        loading: "Lecture depuis GitHub.",
        error_title: "GitHub ne répond pas",
        error_body: "La limite de requêtes anonymes est atteinte, ou le réseau est tombé. Les dépôts restent visibles sur le profil.",
        view_all: "Tous les dépôts sur GitHub",
        stack_title: "Technologies",
        stack_note: "Langages détectés dans les dépôts publics.",

        contact_title: "Contact",
        contact_lead: "Le plus rapide est l'e-mail. Je réponds en italien, anglais, allemand ou français.",
        email_label: "E-mail",
        copy: "Copier",
        copied: "Copié",
        github_label: "GitHub",
        linkedin_label: "LinkedIn",
        location_label: "Où je suis",
        map_title: "Carte de Lugano",
        footer_note: "Écrit à la main en HTML, CSS et JavaScript. Aucun framework."
    },

    de: {
        skip_link: "Zum Inhalt springen",
        nav_home: "Start",
        nav_about: "Profil",
        nav_path: "Werdegang",
        nav_work: "Werkbank",
        nav_projects: "Projekte",
        nav_contact: "Kontakt",
        nav_label: "Bereiche der Website",
        theme_to_dark: "Zum dunklen Thema wechseln",
        theme_to_light: "Zum hellen Thema wechseln",
        lang_group: "Sprache der Website",

        role: "Full-Stack-Entwickler und Student der Informatik",
        lead: "Ich baue Software für das Web, von der Datenbank bis zum Pixel. Ich studiere in Lugano und arbeite freiberuflich.",
        available: "Für Projekte verfügbar",
        os_text: "Derselbe Lebenslauf in einem 8-Bit-Betriebssystem, mit Terminal, Spielen und rund zwanzig versteckten Geheimnissen.",
        os_cta: "Ceresio einschalten",
        cta_contact: "Schreib mir",
        cta_code: "Code ansehen",
        readout_place: "Standort",
        readout_time: "Ortszeit",
        readout_temp: "Temperatur",

        about_title: "Profil",
        bio_1: "Ich lebe in Lugano, zwischen See und Bergen. Nah genug an Mailand und Zürich, um mit beiden zu arbeiten, weit genug weg für Ruhe, wenn ich sie brauche.",
        bio_2: "Angefangen habe ich in der Schule mit Elektronik und C#, danach kam das Web. Heute arbeite ich an Full-Stack-Anwendungen, und das Liebste ist mir immer noch zu verstehen, wie etwas funktioniert, bevor ich es besser neu schreibe.",
        spec_base: "Standort",
        spec_tz: "Zeitzone",
        spec_studies: "Studium",
        spec_status: "Status",
        spec_status_v: "Student und Freelancer",
        spec_working_langs: "Arbeitssprachen",
        langs_title: "Sprachen",
        langs_note: "Niveaus nach dem europäischen Referenzrahmen GER.",
        level_native: "Muttersprache",

        path_title: "Werdegang",
        edu_title: "Ausbildung",
        exp_title: "Erfahrung",
        kind_dev: "Entwicklung",
        kind_job: "Arbeit",
        kind_service: "Dienst",
        kind_research: "Forschung",
        present: "heute",

        work_title: "Werkbank",
        work_lead: "Drei Dinge, die mich neben der Arbeit beschäftigen. Sie laufen wirklich: probier sie aus.",
        inst_vinyl: "Plattenspieler",
        inst_vinyl_hint: "Zieh die Platte zum Scratchen, klick den Arm zum Stoppen.",
        inst_terminal: "Terminal",
        inst_terminal_hint: "Ein Arbeitstag, mehr oder weniger.",
        inst_arcade: "Automat",
        inst_arcade_hint: "Links für Arkanoid, rechts für Mario.",
        btn_left: "Linke Taste, startet Arkanoid",
        btn_right: "Rechte Taste, startet Mario",

        projects_title: "Projekte",
        projects_lead: "Öffentliche Repositories, beim Laden der Seite von GitHub gelesen.",
        stat_repos: "Repositories",
        stat_stars: "Sterne",
        stat_langs: "Sprachen",
        filter_all: "Alle",
        filter_label: "Nach Sprache filtern",
        no_desc: "Keine Beschreibung.",
        updated: "aktualisiert",
        loading: "Lese von GitHub.",
        error_title: "GitHub antwortet nicht",
        error_body: "Das Limit für anonyme Anfragen ist erreicht, oder das Netz ist weg. Die Repositories stehen weiterhin im Profil.",
        view_all: "Alle Repositories auf GitHub",
        stack_title: "Technologien",
        stack_note: "In den öffentlichen Repositories erkannte Sprachen.",

        contact_title: "Kontakt",
        contact_lead: "Am schnellsten per E-Mail. Ich antworte auf Italienisch, Englisch, Deutsch oder Französisch.",
        email_label: "E-Mail",
        copy: "Kopieren",
        copied: "Kopiert",
        github_label: "GitHub",
        linkedin_label: "LinkedIn",
        location_label: "Wo ich bin",
        map_title: "Karte von Lugano",
        footer_note: "Von Hand in HTML, CSS und JavaScript geschrieben. Kein Framework."
    }
};

/* ============================================================
   3. ESPERIENZE
   'kind' sceglie l'etichetta mostrata: dev | job | service | research
   'end: null' significa "in corso".
   ============================================================ */
const historyData = [
    {
        start: "2016", end: "2017", kind: "dev",
        title: { it: "Adune Grouppe", en: "Adune Grouppe", fr: "Adune Grouppe", de: "Adune Grouppe" },
        desc: {
            it: "Stage come sviluppatore junior in C# .NET.",
            en: "Junior developer internship in C# .NET.",
            fr: "Stage de développeur junior en C# .NET.",
            de: "Praktikum als Junior-Entwickler in C# .NET."
        }
    },
    {
        start: "2020", end: "2021", kind: "service",
        title: { it: "Soldato, Esercito svizzero", en: "Soldier, Swiss Army", fr: "Soldat, Armée suisse", de: "Soldat, Schweizer Armee" },
        desc: {
            it: "Servizio militare, ruolo salvataggio e trasmissioni.",
            en: "Military service, rescue and signals role.",
            fr: "Service militaire, rôle sauvetage et transmissions.",
            de: "Militärdienst, Rettungs- und Übermittlungsrolle."
        }
    },
    {
        start: "2021", end: "2021", kind: "service",
        title: { it: "Sergente, Esercito svizzero", en: "Sergeant, Swiss Army", fr: "Sergent, Armée suisse", de: "Wachtmeister, Schweizer Armee" },
        desc: {
            it: "Scuola sottufficiali e conduzione di una squadra.",
            en: "Non-commissioned officer school and squad leadership.",
            fr: "École de sous-officiers et conduite d'une équipe.",
            de: "Unteroffiziersschule und Führung einer Gruppe."
        }
    },
    {
        start: "2021", end: "2023", kind: "job",
        title: { it: "Fattorino, pizzeria", en: "Delivery rider, pizzeria", fr: "Livreur, pizzeria", de: "Kurier, Pizzeria" },
        desc: {
            it: "Lavoro part-time durante gli studi.",
            en: "Part-time work during my studies.",
            fr: "Travail à temps partiel pendant mes études.",
            de: "Teilzeitarbeit während des Studiums."
        }
    },
    {
        start: "2021", end: "2025", kind: "job",
        title: { it: "Sicurezza, stadio", en: "Stadium security", fr: "Sécurité, stade", de: "Stadionsicherheit" },
        desc: {
            it: "Gestione della sicurezza durante gli eventi sportivi.",
            en: "Safety and crowd management at sporting events.",
            fr: "Gestion de la sécurité lors d'événements sportifs.",
            de: "Sicherheitsmanagement bei Sportveranstaltungen."
        }
    },
    {
        start: "2025", end: "2025", kind: "research",
        title: { it: "Ricercatore junior", en: "Junior researcher", fr: "Chercheur junior", de: "Junior-Forscher" },
        desc: {
            it: "Progetto sui dati delle energie rinnovabili.",
            en: "Renewable energy data project.",
            fr: "Projet de données sur les énergies renouvelables.",
            de: "Datenprojekt zu erneuerbaren Energien."
        }
    },
    {
        start: "2025", end: null, kind: "dev",
        title: { it: "Sviluppatore freelance", en: "Freelance developer", fr: "Développeur freelance", de: "Freelance-Entwickler" },
        desc: {
            it: "Applicazioni e siti web su misura, dal progetto al deploy.",
            en: "Custom web applications and sites, from design to deploy.",
            fr: "Applications et sites web sur mesure, du projet au déploiement.",
            de: "Individuelle Web-Anwendungen und Websites, von der Planung bis zum Deploy."
        }
    },
    {
        start: "2026", end: "2026", kind: "job",
        title: { it: "Supplente di matematica, scuola media di Mendrisio", en: "Substitute maths teacher, Mendrisio middle school", fr: "Suppléant de mathématiques, école moyenne de Mendrisio", de: "Stellvertretender Mathematiklehrer, Mittelschule Mendrisio" },
        desc: {
            it: "Supplenza di matematica alle medie, da febbraio a maggio.",
            en: "Maths substitute teaching at middle school, from February to May.",
            fr: "Suppléance de mathématiques au secondaire, de février à mai.",
            de: "Mathematik-Stellvertretung an der Mittelschule, von Februar bis Mai."
        }
    }
];

/* ============================================================
   4. FORMAZIONE
   Compila "years" (es. "2021-2025") quando vuoi mostrare le date.
   ============================================================ */
const educationData = [
    {
        school: "SAM Trevano", place: "Canobbio, CH", years: "",
        degree: { it: "Informatica ed elettronica", en: "Computer science and electronics", fr: "Informatique et électronique", de: "Informatik und Elektronik" }
    },
    {
        school: "SUPSI DTI", place: "Lugano, CH", years: "",
        degree: { it: "Bachelor in ingegneria informatica", en: "BSc in computer engineering", fr: "Bachelor en ingénierie informatique", de: "Bachelor in Informatik-Ingenieurwesen" }
    },
    {
        school: "Thomas More", place: "Geel, BE", years: "",
        degree: { it: "Erasmus in informatica", en: "Erasmus in computer science", fr: "Erasmus en informatique", de: "Erasmus in Informatik" }
    },
    {
        school: "KU Leuven", place: "Leuven, BE", years: "",
        degree: { it: "Corso di integrazione sociale", en: "Social integration course", fr: "Cours d'intégration sociale", de: "Kurs zur sozialen Integration" }
    },
    {
        school: "SUPSI DFA", place: "Locarno, CH", years: "",
        degree: { it: "Formazione e apprendimento", en: "Education and learning", fr: "Formation et apprentissage", de: "Bildung und Lernen" }
    }
];

/* ============================================================
   5. LINGUE PARLATE (scala CEFR: A1 A2 B1 B2 C1 C2)
   ============================================================ */
const spokenLangs = [
    { key: 'it', level: 'C2', native: true, name: { it: "Italiano", en: "Italian", fr: "Italien", de: "Italienisch" } },
    { key: 'en', level: 'C1', native: false, name: { it: "Inglese", en: "English", fr: "Anglais", de: "Englisch" } },
    { key: 'de', level: 'B2', native: false, name: { it: "Tedesco", en: "German", fr: "Allemand", de: "Deutsch" } },
    { key: 'fr', level: 'B1', native: false, name: { it: "Francese", en: "French", fr: "Francais", de: "Französisch" } }
];
