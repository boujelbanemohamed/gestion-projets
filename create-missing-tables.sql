-- CRÉATION DES TABLES MANQUANTES
-- Ce script crée les tables nécessaires si elles n'existent pas

-- ========================================
-- 1. CRÉATION DU TYPE ENUM USER_ROLE
-- ========================================

-- Créer le type enum pour les rôles utilisateur
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
    CREATE TYPE user_role_enum AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER');
    RAISE NOTICE 'Type user_role_enum créé avec succès';
  ELSE
    RAISE NOTICE 'Type user_role_enum existe déjà';
  END IF;
END $$;

-- ========================================
-- 2. CRÉATION DE LA TABLE DEPARTMENTS
-- ========================================

-- Créer la table departments si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. CRÉATION DE LA TABLE USERS
-- ========================================

-- Créer la table users si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  role user_role_enum DEFAULT 'USER',
  fonction VARCHAR(255),
  department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. CRÉATION DE LA TABLE PROJECTS
-- ========================================

-- Créer la table projects si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  statut VARCHAR(50) DEFAULT 'EN_COURS',
  date_debut DATE,
  date_fin DATE,
  budget DECIMAL(10,2),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. CRÉATION DE LA TABLE TASKS
-- ========================================

-- Créer la table tasks si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  statut VARCHAR(50) DEFAULT 'À_FAIRE',
  priorite VARCHAR(20) DEFAULT 'MOYENNE',
  date_debut DATE,
  date_fin DATE,
  assigned_to UUID REFERENCES public.users(id),
  created_by UUID REFERENCES public.users(id),
  project_id UUID REFERENCES public.projects(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6. CRÉATION DES INDEX
-- ========================================

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);

-- ========================================
-- 7. VÉRIFICATION FINALE
-- ========================================

-- Vérifier que toutes les tables ont été créées
SELECT '=== VÉRIFICATION CRÉATION TABLES ===' as info;

SELECT 
  table_name,
  'CRÉÉE' as statut
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'projects', 'tasks', 'departments')
ORDER BY table_name;

-- Vérifier le type enum
SELECT 
  'user_role_enum' as type_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') 
    THEN 'CRÉÉ' 
    ELSE 'MANQUANT' 
  END as statut;

-- ========================================
-- 8. MESSAGE DE SUCCÈS
-- ========================================

SELECT '=== SUCCÈS ===' as info;
SELECT 
  'Toutes les tables ont été créées avec succès !' as message,
  'Vous pouvez maintenant exécuter les scripts de synchronisation' as next_step;





