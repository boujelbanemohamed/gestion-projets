-- Script de correction des rôles utilisateurs (Version Corrigée)
-- Ce script corrige les incohérences entre auth.users et public.users

-- 1. D'abord, vérifier la structure actuelle
SELECT '=== STRUCTURE DE LA TABLE USERS ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== CONTRAINTES ACTUELLES ===' as info;
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass;

SELECT '=== VALEURS ACTUELLES ROLE ===' as info;
SELECT DISTINCT role, COUNT(*) as count
FROM public.users 
GROUP BY role
ORDER BY role;

-- 2. Supprimer la contrainte problématique si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_role_check' 
    AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_role_check;
    RAISE NOTICE 'Contrainte users_role_check supprimée';
  ELSE
    RAISE NOTICE 'Contrainte users_role_check n''existe pas';
  END IF;
END $$;

-- 3. Créer un type enum pour les rôles si nécessaire
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
    CREATE TYPE user_role_enum AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER');
    RAISE NOTICE 'Type enum user_role_enum créé';
  ELSE
    RAISE NOTICE 'Type enum user_role_enum existe déjà';
  END IF;
END $$;

-- 4. Modifier la colonne role pour utiliser le type enum
ALTER TABLE public.users 
ALTER COLUMN role TYPE user_role_enum 
USING (
  CASE 
    WHEN role = 'UTILISATEUR' THEN 'USER'::user_role_enum
    WHEN role = 'ADMIN' THEN 'ADMIN'::user_role_enum
    WHEN role = 'SUPER_ADMIN' THEN 'SUPER_ADMIN'::user_role_enum
    WHEN role = 'MANAGER' THEN 'MANAGER'::user_role_enum
    ELSE 'USER'::user_role_enum
  END
);

-- 5. Ajouter une contrainte de vérification appropriée
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'));

-- 6. Vérifier les corrections
SELECT '=== CORRECTIONS APPLIQUÉES ===' as info;
SELECT DISTINCT role, COUNT(*) as count
FROM public.users 
GROUP BY role
ORDER BY role;

-- 7. Créer une fonction pour synchroniser automatiquement les métadonnées
CREATE OR REPLACE FUNCTION sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les métadonnées dans auth.users quand le profil est modifié
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  
  UPDATE auth.users 
  SET user_metadata = jsonb_build_object(
    'nom', NEW.nom,
    'prenom', NEW.prenom,
    'role', NEW.role::text,
    'fonction', NEW.fonction,
    'departement_id', NEW.departement_id
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Créer un trigger pour synchronisation automatique
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON public.users;
CREATE TRIGGER sync_user_metadata_trigger
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_metadata();

-- 9. Afficher un résumé final
SELECT '=== RÉSUMÉ FINAL ===' as info;
SELECT 
  'Rôles corrigés' as action,
  COUNT(*) as count
FROM public.users 
WHERE role = 'USER'
UNION ALL
SELECT 
  'Utilisateurs avec métadonnées manquantes' as action,
  COUNT(*) as count
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.user_metadata->>'role' IS NULL;

