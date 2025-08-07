-- Migration: Create meeting minutes tables
-- Description: Tables pour la gestion des PV de réunion

-- Table principale des PV de réunion
CREATE TABLE IF NOT EXISTS pv_reunions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titre VARCHAR(255) NOT NULL,
    date_reunion DATE NOT NULL,
    description TEXT,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier VARCHAR(500) NOT NULL,
    taille_fichier INTEGER NOT NULL,
    type_mime VARCHAR(100) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison entre PV et projets (relation many-to-many)
CREATE TABLE IF NOT EXISTS pv_projets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pv_id UUID NOT NULL REFERENCES pv_reunions(id) ON DELETE CASCADE,
    projet_id UUID NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pv_id, projet_id)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_pv_reunions_date_reunion ON pv_reunions(date_reunion);
CREATE INDEX IF NOT EXISTS idx_pv_reunions_uploaded_by ON pv_reunions(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_pv_reunions_titre ON pv_reunions USING gin(to_tsvector('french', titre));
CREATE INDEX IF NOT EXISTS idx_pv_projets_pv_id ON pv_projets(pv_id);
CREATE INDEX IF NOT EXISTS idx_pv_projets_projet_id ON pv_projets(projet_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_pv_reunions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pv_reunions_updated_at
    BEFORE UPDATE ON pv_reunions
    FOR EACH ROW
    EXECUTE FUNCTION update_pv_reunions_updated_at();

-- Commentaires pour la documentation
COMMENT ON TABLE pv_reunions IS 'Table des procès-verbaux de réunion';
COMMENT ON TABLE pv_projets IS 'Table de liaison entre PV et projets (many-to-many)';
COMMENT ON COLUMN pv_reunions.titre IS 'Titre du PV de réunion';
COMMENT ON COLUMN pv_reunions.date_reunion IS 'Date de la réunion';
COMMENT ON COLUMN pv_reunions.description IS 'Description optionnelle du PV';
COMMENT ON COLUMN pv_reunions.nom_fichier IS 'Nom original du fichier uploadé';
COMMENT ON COLUMN pv_reunions.chemin_fichier IS 'Chemin de stockage du fichier';
COMMENT ON COLUMN pv_reunions.taille_fichier IS 'Taille du fichier en octets';
COMMENT ON COLUMN pv_reunions.type_mime IS 'Type MIME du fichier';
COMMENT ON COLUMN pv_reunions.uploaded_by IS 'Utilisateur qui a uploadé le PV';
