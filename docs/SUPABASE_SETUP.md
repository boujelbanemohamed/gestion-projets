# Configuration Supabase pour la Gestion de Projets

## 🎯 Vue d'ensemble

Ce guide vous explique comment configurer Supabase pour l'application de gestion de projets.

## 📋 Étapes de configuration

### 1. Créer un projet Supabase

1. Allez sur [Supabase](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur "New Project"
4. Choisissez votre organisation
5. Donnez un nom à votre projet (ex: "gestion-projets")
6. Créez un mot de passe pour la base de données
7. Choisissez une région proche de vos utilisateurs
8. Cliquez sur "Create new project"

### 2. Configurer l'authentification

1. Dans le dashboard Supabase, allez dans "Authentication" > "Settings"
2. Dans "Site URL", ajoutez l'URL de votre application :
   - Développement : `http://localhost:5173`
   - Production : votre domaine de production
3. Dans "Redirect URLs", ajoutez les mêmes URLs
4. Activez "Enable email confirmations" si souhaité
5. Configurez les providers d'authentification selon vos besoins

### 3. Créer le schéma de base de données

Allez dans "SQL Editor" et exécutez le script suivant :

```sql
-- Créer les départements
CREATE TABLE IF NOT EXISTS departements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE departements ENABLE ROW LEVEL SECURITY;

-- Politique pour les départements
CREATE POLICY "Départements visibles par tous les utilisateurs authentifiés"
    ON departements FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Seuls les admins peuvent modifier les départements"
    ON departements FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Créer la table des utilisateurs étendus
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    fonction VARCHAR(100),
    departement_id UUID REFERENCES departements(id),
    role VARCHAR(20) CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'UTILISATEUR')) DEFAULT 'UTILISATEUR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politiques pour les utilisateurs
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Les admins peuvent voir tous les utilisateurs"
    ON users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Créer les projets
CREATE TABLE IF NOT EXISTS projets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(200) NOT NULL,
    description TEXT,
    departement_id UUID REFERENCES departements(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE projets ENABLE ROW LEVEL SECURITY;

-- Créer les tâches
CREATE TABLE IF NOT EXISTS taches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(200) NOT NULL,
    description TEXT,
    scenario_execution TEXT,
    criteres_acceptation TEXT,
    etat VARCHAR(20) CHECK (etat IN ('non_debutee', 'en_cours', 'cloturee')) DEFAULT 'non_debutee',
    date_realisation DATE NOT NULL,
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE taches ENABLE ROW LEVEL SECURITY;

-- Table de liaison tâches-utilisateurs
CREATE TABLE IF NOT EXISTS tache_utilisateurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tache_id, user_id)
);

-- Activer RLS
ALTER TABLE tache_utilisateurs ENABLE ROW LEVEL SECURITY;

-- Créer les commentaires
CREATE TABLE IF NOT EXISTS commentaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contenu TEXT NOT NULL,
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    auteur_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE commentaires ENABLE ROW LEVEL SECURITY;

-- Créer les pièces jointes projets
CREATE TABLE IF NOT EXISTS projet_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    taille BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE projet_attachments ENABLE ROW LEVEL SECURITY;

-- Créer les pièces jointes tâches
CREATE TABLE IF NOT EXISTS tache_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    taille BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE tache_attachments ENABLE ROW LEVEL SECURITY;

-- Créer les pièces jointes commentaires
CREATE TABLE IF NOT EXISTS commentaire_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    taille BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    commentaire_id UUID REFERENCES commentaires(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE commentaire_attachments ENABLE ROW LEVEL SECURITY;

-- Créer l'historique des tâches
CREATE TABLE IF NOT EXISTS tache_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tache_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    auteur_id UUID REFERENCES users(id),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE tache_history ENABLE ROW LEVEL SECURITY;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projets_updated_at BEFORE UPDATE ON projets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_taches_updated_at BEFORE UPDATE ON taches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Insérer des données de test

```sql
-- Insérer des départements
INSERT INTO departements (nom) VALUES 
('IT'), ('Design'), ('Marketing'), ('Qualité'), ('RH')
ON CONFLICT (nom) DO NOTHING;

-- Note: Les utilisateurs seront créés via l'interface d'authentification
```

### 5. Configurer le stockage (Storage)

1. Allez dans "Storage" dans le dashboard Supabase
2. Créez un bucket appelé "attachments"
3. Configurez les politiques de sécurité :

```sql
-- Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent uploader"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'attachments');

-- Politique pour permettre la lecture aux utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent lire"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'attachments');

-- Politique pour permettre la suppression aux propriétaires
CREATE POLICY "Propriétaires peuvent supprimer"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 6. Configurer les variables d'environnement

Dans votre application, vous aurez besoin de ces variables :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anonyme
```

Vous pouvez les trouver dans "Settings" > "API" de votre projet Supabase.

### 7. Politiques RLS détaillées

Ajoutez ces politiques pour sécuriser l'accès aux données :

```sql
-- Politiques pour les projets
CREATE POLICY "Admins peuvent tout faire sur les projets"
    ON projets FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Utilisateurs peuvent voir leurs projets assignés"
    ON projets FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM taches t
            JOIN tache_utilisateurs tu ON t.id = tu.tache_id
            WHERE t.projet_id = projets.id
            AND tu.user_id = auth.uid()
        )
    );

-- Politiques pour les tâches
CREATE POLICY "Utilisateurs peuvent voir leurs tâches"
    ON taches FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tache_utilisateurs tu
            WHERE tu.tache_id = taches.id
            AND tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Politiques pour les commentaires
CREATE POLICY "Utilisateurs peuvent voir les commentaires de leurs tâches"
    ON commentaires FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tache_utilisateurs tu
            WHERE tu.tache_id = commentaires.tache_id
            AND tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );
```

## 🔧 Configuration de l'application

### 1. Installer les dépendances Supabase

```bash
npm install @supabase/supabase-js
```

### 2. Créer le client Supabase

Le client est déjà configuré dans `src/services/api.ts`.

### 3. Utiliser le bouton "Connect to Supabase"

L'application inclut un bouton pour connecter facilement Supabase. Cliquez dessus et suivez les instructions.

## 🚀 Déploiement

### Variables d'environnement pour la production

Assurez-vous de configurer ces variables dans votre plateforme de déploiement :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Sécurité en production

1. Configurez les domaines autorisés dans Supabase
2. Activez les confirmations par email si nécessaire
3. Configurez les politiques RLS appropriées
4. Surveillez les logs d'authentification

## 📝 Notes importantes

- Les mots de passe sont gérés par Supabase Auth
- Les fichiers sont stockés dans Supabase Storage
- Toutes les tables utilisent Row Level Security (RLS)
- Les politiques garantissent que les utilisateurs ne voient que leurs données autorisées

## 🔍 Dépannage

### Erreurs courantes

1. **Erreur de connexion** : Vérifiez vos variables d'environnement
2. **Erreur RLS** : Vérifiez que les politiques sont correctement configurées
3. **Erreur d'upload** : Vérifiez les politiques du bucket Storage

### Logs et débogage

- Consultez les logs dans le dashboard Supabase
- Utilisez la console du navigateur pour voir les erreurs côté client
- Vérifiez les politiques RLS dans l'onglet "Authentication" > "Policies"