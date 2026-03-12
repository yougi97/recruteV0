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
    id          INT PRIMARY KEY AUTO_INCREMENT,
    user_id     INT UNIQUE NOT NULL,
    title       VARCHAR(255),
    location    VARCHAR(255),
    target_location    JSON,
    bio         TEXT,
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
    embedding       MEDIUMBLOB,        -- vecteur float32 sérialisé (384 dims)
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);

CREATE TABLE candidate_cvs (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    candidate_id    INT NOT NULL,
    cv_id           INT NOT NULL,
    label           VARCHAR(100),
    FOREIGN KEY (candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE
);

-- ─── OFFRES D'EMPLOI ──────────────────────────────────────────────────────────

CREATE TABLE job_offers (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    company_id      INT NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     LONGTEXT,
    raw_text        LONGTEXT,
    embedding       MEDIUMBLOB,        -- vecteur float32 sérialisé (384 dims)
    location        VARCHAR(255),
    contract_type   ENUM('CDI', 'CDD', 'freelance', 'stage', 'alternance'),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE
);

CREATE TABLE company_job_offers (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    company_id      INT NOT NULL,
    job_offer_id    INT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (job_offer_id) REFERENCES job_offers(id) ON DELETE CASCADE
);

-- ─── CATÉGORIES IA ────────────────────────────────────────────────────────────

CREATE TABLE categories (
    id      INT PRIMARY KEY AUTO_INCREMENT,
    name    VARCHAR(255) NOT NULL,
    type    ENUM('skill', 'domain', 'soft_skill') NOT NULL,
    source  ENUM('ai_generated', 'manual') DEFAULT 'ai_generated'
);

CREATE TABLE cv_categories (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    cv_id       INT NOT NULL,
    category_id INT NOT NULL,
    confidence  FLOAT,
    level       ENUM('débutant', 'intermédiaire', 'avancé', 'expert'),
    FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE job_categories (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    job_offer_id    INT NOT NULL,
    category_id     INT NOT NULL,
    required_level  ENUM('débutant', 'intermédiaire', 'avancé', 'expert'),
    is_mandatory    BOOLEAN DEFAULT TRUE,
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
-- cv_id présent dans les deux tables : snapshot du vecteur actif au moment
-- du vote, essentiel pour réentraîner l'IA sur des données cohérentes

CREATE TABLE candidate_job_ratings (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT NOT NULL,
    job_offer_id    INT NOT NULL,
    cv_id           INT NOT NULL,
    rating          ENUM('up', 'down') NOT NULL,
    ai_score        FLOAT,
    rated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_offer_id) REFERENCES job_offers(id) ON DELETE CASCADE,
    FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE
);

CREATE TABLE company_candidate_ratings (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    company_id      INT NOT NULL,
    job_offer_id    INT NOT NULL,
    cv_id           INT NOT NULL,
    rating          ENUM('up', 'down') NOT NULL,
    ai_score        FLOAT,
    rated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (job_offer_id) REFERENCES job_offers(id) ON DELETE CASCADE,
    FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE
);