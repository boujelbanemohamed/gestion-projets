/*
  # Schéma initial pour la gestion de projets

  1. Nouvelles tables
    - `departements` - Départements de l'entreprise
    - `users` - Profils utilisateurs étendus
    - `projets` - Projets avec départements
    - `taches` - Tâches assignables
    - `tache_utilisateurs` - Liaison many-to-many tâches-utilisateurs
    - `commentaires` - Commentaires sur les tâches
    - `projet_attachments` - Pièces jointes des projets
    - `tache_attachments` - Pièces jointes des tâches
    - `commentaire_attachments` - Pièces jointes des commentaires
    - `tache_history` - Historique des modifications

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques appropriées pour chaque rôle
*/

-- Créer les départements
CREATE TABLE IF NOT EXISTS departements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE departements ENABLE ROW LEVEL SECURITY;

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

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_taches_projet ON taches(projet_id);
CREATE INDEX IF NOT EXISTS idx_taches_etat ON taches(etat);
CREATE INDEX IF NOT EXISTS idx_commentaires_tache ON commentaires(tache_id);
CREATE INDEX IF NOT EXISTS idx_tache_utilisateurs_tache ON tache_utilisateurs(tache_id);
CREATE INDEX IF NOT EXISTS idx_tache_utilisateurs_user ON tache_utilisateurs(user_id);

-- Politiques RLS

-- Départements
CREATE POLICY "Départements visibles par tous les utilisateurs authentifiés"
    ON departements FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Seuls les admins peuvent modifier les départements"
    ON departements FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Utilisateurs
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

CREATE POLICY "Les admins peuvent modifier les utilisateurs"
    ON users FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Projets
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
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Tâches
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

CREATE POLICY "Utilisateurs peuvent modifier leurs tâches"
    ON taches FOR UPDATE
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

CREATE POLICY "Utilisateurs peuvent créer des tâches"
    ON taches FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Seuls les admins peuvent supprimer des tâches"
    ON taches FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Tâche utilisateurs
CREATE POLICY "Utilisateurs peuvent voir leurs assignations"
    ON tache_utilisateurs FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Utilisateurs peuvent gérer les assignations"
    ON tache_utilisateurs FOR ALL
    TO authenticated
    USING (true);

-- Commentaires
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

CREATE POLICY "Utilisateurs peuvent ajouter des commentaires"
    ON commentaires FOR INSERT
    TO authenticated
    WITH CHECK (
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

CREATE POLICY "Utilisateurs peuvent supprimer leurs commentaires"
    ON commentaires FOR DELETE
    TO authenticated
    USING (
        auteur_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Pièces jointes (politiques similaires pour toutes les tables d'attachments)
CREATE POLICY "Utilisateurs peuvent voir les pièces jointes de leurs projets"
    ON projet_attachments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM projets p
            JOIN taches t ON p.id = t.projet_id
            JOIN tache_utilisateurs tu ON t.id = tu.tache_id
            WHERE p.id = projet_attachments.projet_id
            AND tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Historique
CREATE POLICY "Utilisateurs peuvent voir l'historique de leurs tâches"
    ON tache_history FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tache_utilisateurs tu
            WHERE tu.tache_id = tache_history.tache_id
            AND tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Utilisateurs peuvent ajouter à l'historique"
    ON tache_history FOR INSERT
    TO authenticated
    WITH CHECK (true);