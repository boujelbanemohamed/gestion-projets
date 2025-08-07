-- Migration: Add user project assignments
-- This migration adds support for assigning users to projects

-- Add assigned_projects column to users table (JSON array of project IDs)
ALTER TABLE users ADD COLUMN assigned_projects JSONB DEFAULT '[]'::jsonb;

-- Create index for better performance on assigned_projects queries
CREATE INDEX idx_users_assigned_projects ON users USING GIN (assigned_projects);

-- Create user_project_assignments table for more structured approach (alternative)
CREATE TABLE user_project_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique user-project combinations
    UNIQUE(user_id, project_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_project_assignments_user_id ON user_project_assignments(user_id);
CREATE INDEX idx_user_project_assignments_project_id ON user_project_assignments(project_id);
CREATE INDEX idx_user_project_assignments_assigned_by ON user_project_assignments(assigned_by);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_project_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_project_assignments_updated_at
    BEFORE UPDATE ON user_project_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_user_project_assignments_updated_at();

-- Add budget fields to projects table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projets' AND column_name = 'budget_initial') THEN
        ALTER TABLE projets ADD COLUMN budget_initial DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projets' AND column_name = 'devise') THEN
        ALTER TABLE projets ADD COLUMN devise VARCHAR(3) DEFAULT 'EUR';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projets' AND column_name = 'responsable_id') THEN
        ALTER TABLE projets ADD COLUMN responsable_id UUID REFERENCES users(id);
    END IF;
END $$;

-- Create project_expenses table if not exists
CREATE TABLE IF NOT EXISTS project_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id UUID NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    date_depense DATE NOT NULL,
    intitule VARCHAR(255) NOT NULL,
    montant DECIMAL(15,2) NOT NULL,
    devise VARCHAR(3) NOT NULL DEFAULT 'EUR',
    taux_conversion DECIMAL(10,6),
    montant_converti DECIMAL(15,2),
    rubrique VARCHAR(100),
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for project_expenses
CREATE INDEX IF NOT EXISTS idx_project_expenses_projet_id ON project_expenses(projet_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_date_depense ON project_expenses(date_depense);
CREATE INDEX IF NOT EXISTS idx_project_expenses_created_by ON project_expenses(created_by);

-- Add trigger for project_expenses updated_at
CREATE OR REPLACE FUNCTION update_project_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_project_expenses_updated_at ON project_expenses;
CREATE TRIGGER update_project_expenses_updated_at
    BEFORE UPDATE ON project_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_project_expenses_updated_at();

-- Insert sample data for testing
-- Update existing users with some project assignments
UPDATE users SET assigned_projects = '["1", "2", "3"]'::jsonb WHERE email = 'marie.dupont@example.com';
UPDATE users SET assigned_projects = '["1", "3"]'::jsonb WHERE email = 'pierre.martin@example.com';
UPDATE users SET assigned_projects = '["1", "2"]'::jsonb WHERE email = 'sophie.lemoine@example.com';
UPDATE users SET assigned_projects = '["3"]'::jsonb WHERE email = 'jean.moreau@example.com';
UPDATE users SET assigned_projects = '["2", "3"]'::jsonb WHERE email = 'alice.rousseau@example.com';
UPDATE users SET assigned_projects = '["2"]'::jsonb WHERE email = 'thomas.bernard@example.com';

COMMENT ON TABLE user_project_assignments IS 'Table for managing user assignments to projects';
COMMENT ON COLUMN users.assigned_projects IS 'JSON array of project IDs assigned to the user';
COMMENT ON TABLE project_expenses IS 'Table for managing project expenses and budget tracking';
