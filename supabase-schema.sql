-- Création des tables pour la plateforme de gestion de projets

-- Table des départements
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des utilisateurs (étend auth.users de Supabase)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER')),
  fonction VARCHAR(255),
  departement_id INTEGER REFERENCES departments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des projets
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  statut VARCHAR(50) DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'en_pause', 'termine', 'annule')),
  date_debut DATE,
  date_fin DATE,
  budget DECIMAL(12,2),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des PV de réunion
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  date_reunion DATE NOT NULL,
  description TEXT NOT NULL,
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  taille_fichier INTEGER,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison PV-Projets (many-to-many)
CREATE TABLE IF NOT EXISTS meeting_minutes_projects (
  id SERIAL PRIMARY KEY,
  meeting_minute_id INTEGER REFERENCES meeting_minutes(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meeting_minute_id, project_id)
);

-- Table des tâches
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  statut VARCHAR(50) DEFAULT 'todo' CHECK (statut IN ('todo', 'in_progress', 'done')),
  priorite VARCHAR(50) DEFAULT 'medium' CHECK (priorite IN ('low', 'medium', 'high', 'urgent')),
  date_debut DATE,
  date_fin DATE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des commentaires
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  contenu TEXT NOT NULL,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  lu BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_departement ON users(departement_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(statut);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_date ON meeting_minutes(date_reunion);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_created_by ON meeting_minutes(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(statut);
CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, lu);

-- Triggers pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_minutes_updated_at BEFORE UPDATE ON meeting_minutes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion des données de test
INSERT INTO departments (nom, description) VALUES 
('Développement', 'Équipe de développement logiciel'),
('Marketing', 'Équipe marketing et communication'),
('Ressources Humaines', 'Gestion des ressources humaines')
ON CONFLICT DO NOTHING;

-- RLS (Row Level Security) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Policies pour les utilisateurs
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Policies pour les projets
CREATE POLICY "Users can view all projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create projects" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Project creators and admins can update projects" ON projects FOR UPDATE USING (
  created_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- Policies pour les PV de réunion
CREATE POLICY "Users can view all meeting minutes" ON meeting_minutes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create meeting minutes" ON meeting_minutes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Creators and admins can update meeting minutes" ON meeting_minutes FOR UPDATE USING (
  created_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- Policies pour les liaisons PV-Projets
CREATE POLICY "Users can view meeting minutes projects" ON meeting_minutes_projects FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage meeting minutes projects" ON meeting_minutes_projects FOR ALL USING (auth.role() = 'authenticated');

-- Policies pour les tâches
CREATE POLICY "Users can view all tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tasks" ON tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Task creators, assignees and admins can update tasks" ON tasks FOR UPDATE USING (
  created_by = auth.uid() OR 
  assigned_to = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- Policies pour les commentaires
CREATE POLICY "Users can view all comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Comment creators can update their comments" ON comments FOR UPDATE USING (created_by = auth.uid());

-- Policies pour les notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Policies pour les départements
CREATE POLICY "Users can view all departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admins can manage departments" ON departments FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
);
