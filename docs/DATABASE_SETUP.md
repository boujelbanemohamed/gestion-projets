# Guide de création de base de données - Gestion de Projets

## 🎯 Vue d'ensemble

Ce guide vous explique comment créer et configurer une base de données pour l'application de gestion de projets.

## 📊 Choix de la base de données

### Options recommandées :

1. **PostgreSQL** (Recommandé) - Robuste, open-source, excellent pour les applications complexes
2. **MySQL/MariaDB** - Populaire, bien documenté
3. **SQLite** - Simple, pour développement/test
4. **MongoDB** - NoSQL, si vous préférez les documents JSON

## 🏗️ Structure de la base de données

### Tables principales :

```sql
-- Table des départements
CREATE TABLE departements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    fonction VARCHAR(100),
    departement_id UUID REFERENCES departements(id),
    role VARCHAR(20) CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'UTILISATEUR')) DEFAULT 'UTILISATEUR',
    mot_de_passe VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des projets
CREATE TABLE projets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(200) NOT NULL,
    description TEXT,
    departement_id UUID REFERENCES departements(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des tâches
CREATE TABLE taches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(200) NOT NULL,
    description TEXT,
    scenario_execution TEXT,
    criteres_acceptation TEXT,
    etat VARCHAR(20) CHECK (etat IN ('non_debutee', 'en_cours', 'cloturee')) DEFAULT 'non_debutee',
    date_realisation DATE NOT NULL,
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison tâches-utilisateurs (many-to-many)
CREATE TABLE tache_utilisateurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tache_id, user_id)
);

-- Table des commentaires
CREATE TABLE commentaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contenu TEXT NOT NULL,
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    auteur_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des pièces jointes projets
CREATE TABLE projet_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    taille BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des pièces jointes tâches
CREATE TABLE tache_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    taille BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des pièces jointes commentaires
CREATE TABLE commentaire_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    taille BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    commentaire_id UUID REFERENCES commentaires(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de l'historique des tâches
CREATE TABLE tache_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    auteur_id UUID REFERENCES users(id),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Méthode d'installation

### Option 1 : PostgreSQL (Recommandé)

#### 1. Installation PostgreSQL

**Sur Ubuntu/Debian :**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**Sur macOS :**
```bash
brew install postgresql
brew services start postgresql
```

**Sur Windows :**
- Télécharger depuis https://www.postgresql.org/download/windows/

#### 2. Configuration initiale

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer une base de données
CREATE DATABASE gestion_projets;

# Créer un utilisateur
CREATE USER app_user WITH PASSWORD 'votre_mot_de_passe_securise';

# Donner les droits
GRANT ALL PRIVILEGES ON DATABASE gestion_projets TO app_user;

# Quitter
\q
```

#### 3. Exécuter le script de création

```bash
# Se connecter à la base
psql -h localhost -U app_user -d gestion_projets

# Copier-coller le script SQL ci-dessus
```

### Option 2 : MySQL/MariaDB

#### 1. Installation

**Sur Ubuntu/Debian :**
```bash
sudo apt update
sudo apt install mysql-server
```

#### 2. Configuration

```bash
# Sécuriser l'installation
sudo mysql_secure_installation

# Se connecter
sudo mysql

# Créer la base
CREATE DATABASE gestion_projets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Créer l'utilisateur
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON gestion_projets.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
```

### Option 3 : SQLite (Pour développement)

```bash
# Installer SQLite
sudo apt install sqlite3

# Créer la base
sqlite3 gestion_projets.db

# Exécuter le script (adapté pour SQLite)
```

## 🔐 Sécurité et bonnes pratiques

### 1. Mots de passe
```sql
-- Utiliser bcrypt pour hasher les mots de passe
-- Exemple en Node.js :
-- const bcrypt = require('bcrypt');
-- const hashedPassword = await bcrypt.hash(password, 10);
```

### 2. Index pour les performances
```sql
-- Index sur les colonnes fréquemment utilisées
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_taches_projet ON taches(projet_id);
CREATE INDEX idx_taches_etat ON taches(etat);
CREATE INDEX idx_commentaires_tache ON commentaires(tache_id);
CREATE INDEX idx_tache_utilisateurs_tache ON tache_utilisateurs(tache_id);
CREATE INDEX idx_tache_utilisateurs_user ON tache_utilisateurs(user_id);
```

### 3. Contraintes et validations
```sql
-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projets_updated_at BEFORE UPDATE ON projets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_taches_updated_at BEFORE UPDATE ON taches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 📝 Données de test

```sql
-- Insérer des départements
INSERT INTO departements (nom) VALUES 
('IT'), ('Design'), ('Marketing'), ('Qualité'), ('RH');

-- Insérer un super admin (mot de passe : "password123" hashé)
INSERT INTO users (nom, prenom, email, fonction, departement_id, role, mot_de_passe) 
SELECT 'Dupont', 'Marie', 'marie.dupont@example.com', 'Chef de projet', 
       d.id, 'SUPER_ADMIN', '$2b$10$example_hash_here'
FROM departements d WHERE d.nom = 'IT';
```

## 🔌 Connexion depuis l'application

### Variables d'environnement (.env)
```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_projets
DB_USER=app_user
DB_PASSWORD=votre_mot_de_passe_securise

# JWT pour l'authentification
JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRES_IN=24h

# Upload de fichiers
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf,application/msword
```

## 🚀 Prochaines étapes

1. **Créer l'API Backend** (Node.js/Express, Python/Django, PHP/Laravel, etc.)
2. **Implémenter l'authentification JWT**
3. **Créer les endpoints REST**
4. **Connecter le frontend React à l'API**
5. **Implémenter l'upload de fichiers**
6. **Ajouter les tests**

## 📚 Ressources utiles

- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Guide MySQL](https://dev.mysql.com/doc/)
- [Prisma ORM](https://www.prisma.io/) - ORM moderne pour TypeScript
- [Sequelize](https://sequelize.org/) - ORM pour Node.js
- [TypeORM](https://typeorm.io/) - ORM TypeScript

---

💡 **Conseil** : Commencez avec PostgreSQL et Prisma pour une expérience de développement optimale avec TypeScript !