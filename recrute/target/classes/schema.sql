-- ─── UTILISATEURS ─────────────────────────────────────────────────────────────

CREATE TABLE users (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    user_type   ENUM('candidate', 'company') NOT NULL,
    first_name  VARCHAR(100),
    last_name   VARCHAR(100),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── PROFILS ──────────────────────────────────────────────────────────────────

CREATE TABLE candidate_profiles (
    id                  INT PRIMARY KEY AUTO_INCREMENT,
    user_id             INT UNIQUE NOT NULL,
    title               VARCHAR(255),
    location            VARCHAR(255),
    target_location     JSON,
    bio                 TEXT,
    -- AJOUT : données parsées par l'agent, utiles pour filtres rapides
    annees_experience   FLOAT,
    niveau_etudes       ENUM('bac','bac+2','bac+3','bac+5','doctorat','autre'),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE company_profiles (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    user_id      INT UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    industry     VARCHAR(255),
    location     VARCHAR(255),
    description  TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── CVS ──────────────────────────────────────────────────────────────────────

CREATE TABLE cvs (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    candidate_id    INT NOT NULL,
    file_url        VARCHAR(500),
    raw_text        LONGTEXT,
    -- MODIF : parsed_json stocke le CVParse Pydantic complet
    parsed_json     JSON,
    embedding       MEDIUMBLOB,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);

-- ─── OFFRES D'EMPLOI ──────────────────────────────────────────────────────────

CREATE TABLE job_offers (
    id                      INT PRIMARY KEY AUTO_INCREMENT,
    company_id              INT NOT NULL,
    title                   VARCHAR(255) NOT NULL,
    description             LONGTEXT,
    -- AJOUT : description réécrite par Gemini, c'est CE texte qui est vectorisé
    enriched_description    LONGTEXT,
    -- MODIF : parsed_json stocke le OffreParsee Pydantic complet
    parsed_json             JSON,
    embedding               MEDIUMBLOB,
    location                VARCHAR(255),
    contract_type           ENUM('CDI','CDD','freelance','stage','alternance'),
    -- AJOUT : critères filtrables sans parser le JSON
    annees_experience_min   FLOAT,
    niveau_etudes_min       ENUM('bac','bac+2','bac+3','bac+5','doctorat','autre'),
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE
);

-- ─── CATÉGORIES IA ────────────────────────────────────────────────────────────

CREATE TABLE categories (
    id      INT PRIMARY KEY AUTO_INCREMENT,
    -- AJOUT : contrainte unique sur (name, type) pour les upserts propres
    name    VARCHAR(255) NOT NULL,
    type    ENUM('skill', 'domain', 'soft_skill') NOT NULL,
    source  ENUM('ai_generated', 'manual') DEFAULT 'ai_generated',
    UNIQUE KEY uq_category (name, type)
);

CREATE TABLE cv_categories (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    cv_id       INT NOT NULL,
    category_id INT NOT NULL,
    confidence  FLOAT,
    level       ENUM('débutant','intermédiaire','avancé','expert'),
    -- AJOUT : évite les doublons cv/catégorie
    UNIQUE KEY uq_cv_category (cv_id, category_id),
    FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE job_categories (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    job_offer_id    INT NOT NULL,
    category_id     INT NOT NULL,
    required_level  ENUM('débutant','intermédiaire','avancé','expert'),
    is_mandatory    BOOLEAN DEFAULT TRUE,
    -- AJOUT : évite les doublons offre/catégorie
    UNIQUE KEY uq_job_category (job_offer_id, category_id),
    FOREIGN KEY (job_offer_id) REFERENCES job_offers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- ─── RECHERCHES MANUELLES ─────────────────────────────────────────────────────

CREATE TABLE job_searches (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    user_id     INT NOT NULL,
    query       VARCHAR(500) NOT NULL,
    filters     JSON,
    searched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── ÉVALUATIONS ──────────────────────────────────────────────────────────────

CREATE TABLE candidate_job_ratings (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT NOT NULL,
    job_offer_id    INT NOT NULL,
    cv_id           INT NOT NULL,
    rating          ENUM('up','down') NOT NULL,
    ai_score        FLOAT,
    -- AJOUT : détail des sous-scores pour le feedback loop IA
    score_semantique    FLOAT,
    score_structure     FLOAT,
    score_llm           FLOAT,
    rated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_candidate_rating (user_id, job_offer_id, cv_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_offer_id) REFERENCES job_offers(id) ON DELETE CASCADE,
    FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE
);

CREATE TABLE company_candidate_ratings (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    company_id      INT NOT NULL,
    job_offer_id    INT NOT NULL,
    cv_id           INT NOT NULL,
    rating          ENUM('up','down') NOT NULL,
    ai_score        FLOAT,
    -- AJOUT : détail des sous-scores pour le feedback loop IA
    score_semantique    FLOAT,
    score_structure     FLOAT,
    score_llm           FLOAT,
    rated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_company_rating (company_id, job_offer_id, cv_id),
    FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (job_offer_id) REFERENCES job_offers(id) ON DELETE CASCADE,
    FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE
);