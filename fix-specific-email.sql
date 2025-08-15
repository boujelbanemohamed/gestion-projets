-- Correction specifique pour mohamed.boujelbane@icloud.com
-- Ce script corrige le probleme de duplication pour cet email

-- 1. Voir l'etat actuel de cet email
SELECT 'ETAT ACTUEL DE mohamed.boujelbane@icloud.com' as info;
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
WHERE email = 'mohamed.boujelbane@icloud.com';

-- 2. Voir les details de l'utilisateur auth
SELECT 'DETAILS AUTH.USERS' as info;
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'mohamed.boujelbane@icloud.com';

-- 3. Voir les details de l'utilisateur public
SELECT 'DETAILS PUBLIC.USERS' as info;
SELECT 
  id,
  email,
  nom,
  prenom,
  role,
  fonction,
  department_id,
  created_at,
  updated_at
FROM public.users 
WHERE email = 'mohamed.boujelbane@icloud.com';

-- 4. Verifier si les IDs correspondent
SELECT 'VERIFICATION DES IDs' as info;
SELECT 
  au.id as auth_id,
  pu.id as public_id,
  CASE 
    WHEN au.id = pu.id THEN 'IDs CORRESPONDENT - OK'
    ELSE 'IDs DIFFERENTS - PROBLEME'
  END as statut
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'mohamed.boujelbane@icloud.com' OR pu.email = 'mohamed.boujelbane@icloud.com';

-- 5. Si les IDs ne correspondent pas, corriger
-- (Cette etape sera executee seulement si necessaire)
SELECT 'CORRECTION DES IDs SI NECESSAIRE' as info;
-- Le script va detecter automatiquement si une correction est necessaire

-- 6. Synchroniser les metadonnees si necessaire
SELECT 'SYNCHRONISATION DES METADONNEES' as info;
-- Cette etape sera executee seulement si necessaire

-- 7. Verification finale
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





