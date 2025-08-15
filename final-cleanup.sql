-- Script de nettoyage final et synchronisation
-- Ce script resout definitivement les conflits et synchronise les tables

-- 1. Supprimer les profils en conflit (emails dupliques avec IDs differents)
SELECT 'NETTOYAGE DES PROFILS EN CONFLIT' as info;
DELETE FROM public.users pu
WHERE EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE pu.email = au.email AND pu.id != au.id
);

-- 2. Supprimer les profils orphelins (sans utilisateur auth correspondant)
SELECT 'NETTOYAGE DES PROFILS ORPHELINS' as info;
DELETE FROM public.users pu
WHERE NOT EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE pu.id = au.id
);

-- 3. Verifier le nettoyage
SELECT 'VERIFICATION DU NETTOYAGE' as info;
SELECT 
  'Profils dans public.users' as info,
  COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
  'Utilisateurs dans auth.users' as info,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Utilisateurs avec profils' as info,
  COUNT(*) as count
FROM auth.users au
INNER JOIN public.users pu ON au.id = pu.id;

-- 4. Creer les profils manquants pour les utilisateurs auth
SELECT 'CREATION DES PROFILS MANQUANTS' as info;
INSERT INTO public.users (id, email, nom, prenom, role, fonction, department_id, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'nom', split_part(au.email, '@', 1)) as nom,
  COALESCE(au.raw_user_meta_data->>'prenom', 'Utilisateur') as prenom,
  COALESCE(au.raw_user_meta_data->>'role', 'USER')::user_role_enum as role,
  au.raw_user_meta_data->>'fonction' as fonction,
  (au.raw_user_meta_data->>'department_id')::uuid as department_id,
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 5. Verification finale
SELECT 'SYNCHRONISATION FINALE' as info;
SELECT 
  'Profils dans public.users' as info,
  COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
  'Utilisateurs dans auth.users' as info,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Utilisateurs avec profils' as info,
  COUNT(*) as count
FROM auth.users au
INNER JOIN public.users pu ON au.id = pu.id
UNION ALL
SELECT 
  'Utilisateurs sans profil' as info,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;




