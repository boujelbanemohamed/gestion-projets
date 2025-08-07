/*
  # Budget Management Module

  1. New Tables
    - `projet_budget` - Stores project budget information
    - `projet_depenses` - Stores project expenses
    - `devise_taux` - Stores currency conversion rates

  2. Security
    - RLS enabled on all tables
    - Appropriate policies for each role
*/

-- Create project budget table
CREATE TABLE IF NOT EXISTS projet_budget (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    montant_initial DECIMAL(15, 2) NOT NULL,
    devise VARCHAR(3) NOT NULL,
    date_debut DATE,
    date_fin DATE,
    commentaires TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projet_budget ENABLE ROW LEVEL SECURITY;

-- Create project expenses table
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

-- Enable RLS
ALTER TABLE projet_depenses ENABLE ROW LEVEL SECURITY;

-- Create currency conversion rates table
CREATE TABLE IF NOT EXISTS devise_taux (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    devise_source VARCHAR(3) NOT NULL,
    devise_cible VARCHAR(3) NOT NULL,
    taux DECIMAL(15, 6) NOT NULL,
    date_mise_a_jour TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(devise_source, devise_cible)
);

-- Enable RLS
ALTER TABLE devise_taux ENABLE ROW LEVEL SECURITY;

-- Add triggers for updated_at
CREATE TRIGGER update_projet_budget_updated_at BEFORE UPDATE ON projet_budget
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projet_depenses_updated_at BEFORE UPDATE ON projet_depenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_projet_budget_projet_id ON projet_budget(projet_id);
CREATE INDEX IF NOT EXISTS idx_projet_depenses_projet_id ON projet_depenses(projet_id);
CREATE INDEX IF NOT EXISTS idx_devise_taux_devises ON devise_taux(devise_source, devise_cible);

-- RLS Policies

-- Budget policies
CREATE POLICY "Admins can manage project budgets"
    ON projet_budget FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Users can view project budgets they're assigned to"
    ON projet_budget FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM taches t
            JOIN tache_utilisateurs tu ON t.id = tu.tache_id
            WHERE t.projet_id = projet_budget.projet_id
            AND tu.user_id = auth.uid()
        )
    );

-- Expenses policies
CREATE POLICY "Admins can manage project expenses"
    ON projet_depenses FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Users can view project expenses they're assigned to"
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

-- Currency rates policies
CREATE POLICY "Anyone can view currency rates"
    ON devise_taux FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can manage currency rates"
    ON devise_taux FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Insert some common currency conversion rates
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
('JPY', 'USD', 0.00678)
ON CONFLICT (devise_source, devise_cible) DO UPDATE
SET taux = EXCLUDED.taux, date_mise_a_jour = NOW();