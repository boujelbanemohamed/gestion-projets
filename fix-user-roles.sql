-- Script de correction des rôles utilisateurs
-- Ce script corrige les incohérences entre auth.users et public.users

-- 1. Corriger les rôles dans la table public.users
UPDATE public.users 
SET role = 'USER' 
WHERE role = 'UTILISATEUR';

-- 2. Corriger les métadonnées dans auth.users pour tous les utilisateurs
-- Note: Cette requête doit être exécutée pour chaque utilisateur individuellement
-- car Supabase ne permet pas de mettre à jour tous les utilisateurs en une fois

-- 3. Vérifier les utilisateurs avec des métadonnées manquantes
SELECT 
  u.id,
  u.email,
  u.nom,
  u.prenom,
  u.role as profile_role,
  u.fonction,
  u.departement_id,
  au.user_metadata->>'role' as auth_role,
  au.user_metadata->>'nom' as auth_nom,
  au.user_metadata->>'prenom' as auth_prenom,
  au.user_metadata->>'fonction' as auth_fonction,
  au.user_metadata->>'departement_id' as auth_departement_id
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE 
  au.user_metadata->>'role' IS NULL 
  OR au.user_metadata->>'role' != u.role
  OR au.user_metadata->>'nom' IS NULL 
  OR au.user_metadata->>'nom' != u.nom
  OR au.user_metadata->>'prenom' IS NULL 
  OR au.user_metadata->>'prenom' != u.prenom
  OR au.user_metadata->>'fonction' IS DISTINCT FROM u.fonction
  OR au.user_metadata->>'departement_id' IS DISTINCT FROM u.departement_id::text;

-- 4. Créer une fonction pour synchroniser automatiquement les métadonnées
CREATE OR REPLACE FUNCTION sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les métadonnées dans auth.users quand le profil est modifié
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  
  UPDATE auth.users 
  SET user_metadata = jsonb_build_object(
    'nom', NEW.nom,
    'prenom', NEW.prenom,
    'role', NEW.role,
    'fonction', NEW.fonction,
    'departement_id', NEW.departement_id
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Créer un trigger pour synchroniser automatiquement
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON public.users;
CREATE TRIGGER sync_user_metadata_trigger
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_metadata();

-- 6. Vérifier que les policies RLS permettent les opérations nécessaires
-- Les policies existantes devraient permettre :
-- - SELECT pour tous les utilisateurs authentifiés
-- - UPDATE pour son propre profil
-- - INSERT pour les utilisateurs authentifiés (création de profil)
-- - DELETE pour les admins

-- 7. Afficher un résumé des corrections
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
