/*
  # Module de gestion budgétaire

  1. Nouvelles tables
    - `projet_depenses` - Stocke les dépenses du projet
    - `devise_taux` - Stocke les taux de conversion des devises
    - `expense_categories` - Catégories de dépenses

  2. Colonnes ajoutées
    - Ajout de colonnes budgétaires au tableau projets

  3. Sécurité
    - RLS activé sur toutes les tables
    - Politiques appropriées pour chaque rôle
*/

-- Ajout de colonnes budgétaires au tableau projets (si elles n'existent pas déjà)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projets' AND column_name = 'budget_initial'
  ) THEN
    ALTER TABLE projets ADD COLUMN budget_initial DECIMAL(15, 2);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projets' AND column_name = 'devise'
  ) THEN
    ALTER TABLE projets ADD COLUMN devise VARCHAR(3);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projets' AND column_name = 'responsable_id'
  ) THEN
    ALTER TABLE projets ADD COLUMN responsable_id UUID REFERENCES users(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projets' AND column_name = 'prestataire_externe'
  ) THEN
    ALTER TABLE projets ADD COLUMN prestataire_externe VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projets' AND column_name = 'nouvelles_fonctionnalites'
  ) THEN
    ALTER TABLE projets ADD COLUMN nouvelles_fonctionnalites TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projets' AND column_name = 'avantages'
  ) THEN
    ALTER TABLE projets ADD COLUMN avantages TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projets' AND column_name = 'type_projet'
  ) THEN
    ALTER TABLE projets ADD COLUMN type_projet VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projets' AND column_name = 'date_debut'
  ) THEN
    ALTER TABLE projets ADD COLUMN date_debut DATE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projets' AND column_name = 'date_fin'
  ) THEN
    ALTER TABLE projets ADD COLUMN date_fin DATE;
  END IF;
END $$;

-- Création de la table des catégories de dépenses
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

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

-- Catégories de dépenses
CREATE POLICY "Tout le monde peut voir les catégories de dépenses"
    ON expense_categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Seuls les admins peuvent gérer les catégories"
    ON expense_categories FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

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
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Les utilisateurs peuvent ajouter des dépenses aux projets auxquels ils sont assignés"
    ON projet_depenses FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM taches t
            JOIN tache_utilisateurs tu ON t.id = tu.tache_id
            WHERE t.projet_id = projet_depenses.projet_id
            AND tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
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

-- Insérer les catégories de dépenses par défaut
INSERT INTO expense_categories (nom, description) VALUES
('Ressources Humaines', 'Salaires, formations, consultants'),
('Matériel', 'Équipements, fournitures'),
('Prestations externes', 'Services externes, sous-traitance'),
('Logiciels', 'Licences, abonnements'),
('Déplacements', 'Voyages, hébergement, transport'),
('Communication', 'Marketing, publicité'),
('Formation', 'Formations, certifications'),
('Autres', 'Dépenses diverses')
ON CONFLICT (nom) DO NOTHING;

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
('TND', 'USD', 0.323),
('EUR', 'CAD', 1.47),
('CAD', 'EUR', 0.68),
('EUR', 'CHF', 0.97),
('CHF', 'EUR', 1.03),
('EUR', 'AUD', 1.63),
('AUD', 'EUR', 0.61)
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