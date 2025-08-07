/*
  # Données d'exemple pour la gestion de projets

  1. Départements
  2. Utilisateurs de test (seront créés via l'interface)
  3. Projets d'exemple
*/

-- Insérer des départements
INSERT INTO departements (nom) VALUES 
('IT'), 
('Design'), 
('Marketing'), 
('Qualité'), 
('RH')
ON CONFLICT (nom) DO NOTHING;

-- Note: Les utilisateurs seront créés via l'interface d'authentification Supabase
-- et leurs profils étendus seront créés automatiquement via des triggers ou l'application