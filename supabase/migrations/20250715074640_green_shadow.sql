/*
  # Module de gestion budgétaire

  1. Nouvelles tables
    - `projet_budget` - Stocke les informations budgétaires du projet
    - `projet_depenses` - Stocke les dépenses du projet
    - `devise_taux` - Stocke les taux de conversion des devises

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques appropriées pour chaque rôle
*/

-- Ajout de colonnes au tableau projets
ALTER TABLE projets ADD COLUMN IF NOT EXISTS budget_initial DECIMAL(15, 2);
ALTER TABLE projets ADD COLUMN IF NOT EXISTS devise VARCHAR(3);
ALTER TABLE projets ADD COLUMN IF NOT EXISTS responsable_id UUID REFERENCES users(id);
ALTER TABLE projets ADD COLUMN IF NOT EXISTS prestataire_externe VARCHAR(255);
ALTER TABLE projets ADD COLUMN IF NOT EXISTS nouvelles_fonctionnalites TEXT;
ALTER TABLE projets ADD COLUMN IF NOT EXISTS avantages TEXT;
ALTER TABLE projets ADD COLUMN IF NOT EXISTS type_projet VARCHAR(100);
ALTER TABLE projets ADD COLUMN IF NOT EXISTS date_debut DATE;
ALTER TABLE projets ADD COLUMN IF NOT EXISTS date_fin DATE;

-- Création de la table des dépenses de projet
CREATE TABLE IF NOT EXISTS projet_depenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    date_depense DATE NOT NULL,
    intitule VARCHAR(255) NOT NULL,
    montant DECIMAL(15, 2) NOT NULL,
    devise VARCHAR(3) NOT NULL,
    taux_conversion DECIMAL(15, 6),
    montant_converti DECIMAL(15, 2),
    rubrique VARCHAR(100),
    piece_jointe_url VARCHAR(500),
    piece_jointe_nom VARCHAR(255),
    piece_jointe_type VARCHAR(100),
    piece_jointe_taille BIGINT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE projet_depenses ENABLE ROW LEVEL SECURITY;

-- Créer la table des taux de conversion des devises
CREATE TABLE IF NOT EXISTS devise_taux (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    devise_source VARCHAR(3) NOT NULL,
    devise_cible VARCHAR(3) NOT NULL,
    taux DECIMAL(15, 6) NOT NULL,
    date_mise_a_jour TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(devise_source, devise_cible)
);

-- Activer RLS
ALTER TABLE devise_taux ENABLE ROW LEVEL SECURITY;

-- Ajouter des triggers pour updated_at
CREATE TRIGGER update_projet_depenses_updated_at BEFORE UPDATE ON projet_depenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ajouter des index
CREATE INDEX IF NOT EXISTS idx_projet_depenses_projet_id ON projet_depenses(projet_id);
CREATE INDEX IF NOT EXISTS idx_devise_taux_devises ON devise_taux(devise_source, devise_cible);

-- Politiques RLS

-- Politiques pour les dépenses
CREATE POLICY "Les admins peuvent gérer les dépenses"
    ON projet_depenses FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Les utilisateurs peuvent voir les dépenses des projets auxquels ils sont assignés"
    ON projet_depenses FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM taches t
            JOIN tache_utilisateurs tu ON t.id = tu.tache_id
            WHERE t.projet_id = projet_depenses.projet_id
            AND tu.user_id = auth.uid()
        )
    );

-- Politiques pour les taux de devises
CREATE POLICY "Tout le monde peut consulter les taux de devises"
    ON devise_taux FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Seuls les admins peuvent gérer les taux de devises"
    ON devise_taux FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Insérer des taux de conversion courants
INSERT INTO devise_taux (devise_source, devise_cible, taux) VALUES
('EUR', 'USD', 1.09),
('USD', 'EUR', 0.92),
('EUR', 'GBP', 0.85),
('GBP', 'EUR', 1.18),
('EUR', 'JPY', 160.5),
('JPY', 'EUR', 0.00623),
('USD', 'GBP', 0.78),
('GBP', 'USD', 1.28),
('USD', 'JPY', 147.5),
('JPY', 'USD', 0.00678),
('EUR', 'TND', 3.38),
('TND', 'EUR', 0.296),
('USD', 'TND', 3.10),
('TND', 'USD', 0.323)
ON CONFLICT (devise_source, devise_cible) DO UPDATE
SET taux = EXCLUDED.taux, date_mise_a_jour = NOW();

-- Fonction pour calculer le montant total des dépenses d'un projet
CREATE OR REPLACE FUNCTION calculate_project_expenses(project_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    total DECIMAL(15, 2);
BEGIN
    SELECT COALESCE(SUM(COALESCE(montant_converti, montant)), 0)
    INTO total
    FROM projet_depenses
    WHERE projet_id = project_id;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le pourcentage de consommation du budget
CREATE OR REPLACE FUNCTION calculate_budget_consumption_percentage(project_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    budget DECIMAL(15, 2);
    expenses DECIMAL(15, 2);
    percentage DECIMAL(15, 2);
BEGIN
    -- Get project budget
    SELECT budget_initial INTO budget
    FROM projets
    WHERE id = project_id;
    
    -- If no budget, return 0
    IF budget IS NULL OR budget = 0 THEN
        RETURN 0;
    END IF;
    
    -- Calculate total expenses
    expenses := calculate_project_expenses(project_id);
    
    -- Calculate percentage
    percentage := (expenses / budget) * 100;
    
    RETURN percentage;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le statut budgétaire d'un projet
CREATE OR REPLACE FUNCTION get_budget_status(project_id UUID)
RETURNS TEXT AS $$
DECLARE
    percentage DECIMAL(15, 2);
BEGIN
    percentage := calculate_budget_consumption_percentage(project_id);
    
    IF percentage >= 90 THEN
        RETURN 'danger';
    ELSIF percentage >= 70 THEN
        RETURN 'warning';
    ELSE
        RETURN 'success';
    END IF;
END;
$$ LANGUAGE plpgsql;