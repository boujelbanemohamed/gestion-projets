-- Correction securisee de l'ID pour mohamed.boujelbane@icloud.com
-- Ce script corrige l'incoherence sans supprimer l'utilisateur

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

-- 3. Voir les references de l'utilisateur public actuel
SELECT 'REFERENCES DE L UTILISATEUR PUBLIC ACTUEL' as info;
SELECT 
  'Projets crees' as type,
  COUNT(*) as count
FROM public.projects 
WHERE created_by = (SELECT id FROM public.users WHERE email = 'mohamed.boujelbane@icloud.com')
UNION ALL
SELECT 
  'Taches assignees' as type,
  COUNT(*) as count
FROM public.tasks 
WHERE assigned_to = (SELECT id FROM public.users WHERE email = 'mohamed.boujelbane@icloud.com')
UNION ALL
SELECT 
  'Taches creees' as type,
  COUNT(*) as count
FROM public.tasks 
WHERE created_by = (SELECT id FROM public.users WHERE email = 'mohamed.boujelbane@icloud.com');

-- 4. Corriger l'ID en mettant a jour les references d'abord
SELECT 'CORRECTION DES REFERENCES' as info;

-- Mettre a jour les projets crees par cet utilisateur
UPDATE public.projects 
SET created_by = (SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com')
WHERE created_by = (SELECT id FROM public.users WHERE email = 'mohamed.boujelbane@icloud.com');

-- Mettre a jour les taches assignees a cet utilisateur
UPDATE public.tasks 
SET assigned_to = (SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com')
WHERE assigned_to = (SELECT id FROM public.users WHERE email = 'mohamed.boujelbane@icloud.com');

-- Mettre a jour les taches creees par cet utilisateur
UPDATE public.tasks 
SET created_by = (SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com')
WHERE created_by = (SELECT id FROM public.users WHERE email = 'mohamed.boujelbane@icloud.com');

-- 5. Maintenant on peut supprimer l'ancien enregistrement en toute securite
SELECT 'SUPPRESSION DE L ANCIEN ENREGISTREMENT' as info;
DELETE FROM public.users 
WHERE email = 'mohamed.boujelbane@icloud.com';

-- 6. Recréer l'enregistrement avec le bon ID
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

-- 7. Verification de la correction
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

-- 8. Verification finale
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

-- 9. Verification des references
SELECT 'VERIFICATION DES REFERENCES' as info;
SELECT 
  'Projets crees' as type,
  COUNT(*) as count
FROM public.projects 
WHERE created_by = (SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com')
UNION ALL
SELECT 
  'Taches assignees' as type,
  COUNT(*) as count
FROM public.tasks 
WHERE assigned_to = (SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com')
UNION ALL
SELECT 
  'Taches creees' as type,
  COUNT(*) as count
FROM public.tasks 
WHERE created_by = (SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com');




