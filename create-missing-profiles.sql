-- Script de creation des profils manquants
-- Ce script cree les profils dans public.users pour les utilisateurs auth sans profil

-- 1. Identifier les utilisateurs auth sans profil
SELECT 'UTILISATEURS AUTH SANS PROFIL' as info;
SELECT 
  au.id,
  au.email
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 2. Creer les profils manquants
INSERT INTO public.users (id, email, nom, prenom, role, fonction, departement_id, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'nom', split_part(au.email, '@', 1)) as nom,
  COALESCE(au.raw_user_meta_data->>'prenom', 'Utilisateur') as prenom,
  COALESCE(au.raw_user_meta_data->>'role', 'USER')::user_role_enum as role,
  au.raw_user_meta_data->>'fonction' as fonction,
  (au.raw_user_meta_data->>'departement_id')::integer as departement_id,
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 3. Verifier que les profils ont ete crees
SELECT 'VERIFICATION PROFILS CREES' as info;
SELECT 
  'Profils dans public.users' as info,
  COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
  'Utilisateurs dans auth.users' as info,
  COUNT(*) as count
FROM auth.users;

-- 4. Afficher les nouveaux profils crees
SELECT 'NOUVEAUX PROFILS CREES' as info;
SELECT 
  id,
  email,
  nom,
  prenom,
  role,
  fonction,
  departement_id
FROM public.users 
WHERE created_at >= NOW() - INTERVAL '1 minute';

-- 5. Verifier la synchronisation finale
SELECT 'SYNCHRONISATION FINALE' as info;
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




