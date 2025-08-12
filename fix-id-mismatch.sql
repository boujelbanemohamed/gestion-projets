-- Correction de la difference d'IDs pour mohamed.boujelbane@icloud.com
-- Ce script corrige l'incoherence entre auth.users et public.users

-- 1. Voir les IDs actuels
SELECT 'IDs ACTUELS' as info;
SELECT 
  'Auth users' as source,
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'mohamed.boujelbane@icloud.com'
UNION ALL
SELECT 
  'Public users' as source,
  id,
  email,
  created_at
FROM public.users 
WHERE email = 'mohamed.boujelbane@icloud.com';

-- 2. Identifier quel ID utiliser (celui de auth.users est la reference)
SELECT 'IDENTIFICATION DE L ID DE REFERENCE' as info;
SELECT 
  au.id as auth_id,
  pu.id as public_id,
  CASE 
    WHEN au.id IS NOT NULL AND pu.id IS NOT NULL AND au.id != pu.id THEN 'IDs DIFFERENTS - CORRECTION NECESSAIRE'
    WHEN au.id IS NOT NULL AND pu.id IS NULL THEN 'Utilisateur auth sans profil public'
    WHEN au.id IS NULL AND pu.id IS NOT NULL THEN 'Profil public sans utilisateur auth'
    WHEN au.id = pu.id THEN 'IDs CORRESPONDENT - OK'
    ELSE 'CAS NON PREVU'
  END as statut
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'mohamed.boujelbane@icloud.com' OR pu.email = 'mohamed.boujelbane@icloud.com';

-- 3. Corriger l'ID dans public.users pour qu'il corresponde a auth.users
SELECT 'CORRECTION DE L ID DANS PUBLIC.USERS' as info;

-- D'abord, sauvegarder les donnees actuelles
WITH current_data AS (
  SELECT 
    id as old_id,
    email,
    nom,
    prenom,
    role,
    fonction,
    department_id,
    created_at,
    updated_at
  FROM public.users 
  WHERE email = 'mohamed.boujelbane@icloud.com'
),
auth_data AS (
  SELECT 
    id as new_id,
    email,
    created_at as auth_created_at,
    updated_at as auth_updated_at
  FROM auth.users 
  WHERE email = 'mohamed.boujelbane@icloud.com'
)
-- Supprimer l'ancien enregistrement
DELETE FROM public.users 
WHERE email = 'mohamed.boujelbane@icloud.com';

-- 4. Recréer l'enregistrement avec le bon ID
SELECT 'RECREATION AVEC LE BON ID' as info;
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
WHERE au.email = 'mohamed.boujelbane@icloud.com'
AND NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- 5. Verification de la correction
SELECT 'VERIFICATION DE LA CORRECTION' as info;
SELECT 
  au.id as auth_id,
  pu.id as public_id,
  CASE 
    WHEN au.id = pu.id THEN 'IDs CORRESPONDENT - CORRECTION REUSSIE'
    ELSE 'IDs DIFFERENTS - PROBLEME PERSISTE'
  END as statut
FROM auth.users au
INNER JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'mohamed.boujelbane@icloud.com';

-- 6. Verification finale
SELECT 'VERIFICATION FINALE' as info;
SELECT 
  'Auth users' as source,
  COUNT(*) as count
FROM auth.users 
WHERE email = 'mohamed.boujelbane@icloud.com'
UNION ALL
SELECT 
  'Public users' as source,
  COUNT(*) as count
FROM public.users 
WHERE email = 'mohamed.boujelbane@icloud.com'
UNION ALL
SELECT 
  'Utilisateurs synchronises' as source,
  COUNT(*) as count
FROM auth.users au
INNER JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'mohamed.boujelbane@icloud.com';


