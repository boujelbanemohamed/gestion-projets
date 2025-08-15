-- DIAGNOSTIC COMPLET DE LA STRUCTURE SUPABASE
-- Ce script analyse toutes les tables et leurs donnees

-- ========================================
-- 1. STRUCTURE DES TABLES
-- ========================================

-- Structure de auth.users
SELECT '=== STRUCTURE AUTH.USERS ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Structure de public.users
SELECT '=== STRUCTURE PUBLIC.USERS ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- ========================================
-- 2. CONTRAINTES ET INDEX
-- ========================================

-- Contraintes sur public.users
SELECT '=== CONTRAINTES PUBLIC.USERS ===' as info;
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'users';

-- Index sur public.users
SELECT '=== INDEX PUBLIC.USERS ===' as info;
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- ========================================
-- 3. DONNEES ACTUELLES
-- ========================================

-- Comptage des utilisateurs
SELECT '=== COMPTAGE UTILISATEURS ===' as info;
SELECT 
  'Auth users' as source,
  COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
  'Public users' as source,
  COUNT(*) as total
FROM public.users
UNION ALL
SELECT 
  'Utilisateurs synchronises' as source,
  COUNT(*) as total
FROM auth.users au
INNER JOIN public.users pu ON au.id = pu.id;

-- Tous les utilisateurs auth avec leurs metadata
SELECT '=== TOUS LES UTILISATEURS AUTH ===' as info;
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at,
  updated_at
FROM auth.users
ORDER BY created_at;

-- Tous les utilisateurs public
SELECT '=== TOUS LES UTILISATEURS PUBLIC ===' as info;
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
ORDER BY created_at;

-- ========================================
-- 4. ANALYSE SPECIFIQUE MOHAMED
-- ========================================

-- Analyse detaillee pour mohamed.boujelbane@icloud.com
SELECT '=== ANALYSE MOHAMED.BOUJELBANE@ICLOUD.COM ===' as info;

-- Dans auth.users
SELECT 'Dans auth.users:' as info;
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'mohamed.boujelbane@icloud.com';

-- Dans public.users
SELECT 'Dans public.users:' as info;
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

-- ========================================
-- 5. VERIFICATION DES REFERENCES
-- ========================================

-- References pour mohamed.boujelbane@icloud.com
SELECT '=== REFERENCES POUR MOHAMED ===' as info;

-- Projets crees
SELECT 'Projets crees:' as info;
SELECT 
  p.id,
  p.nom,
  p.created_by,
  u.email
FROM public.projects p
LEFT JOIN public.users u ON p.created_by = u.id
WHERE u.email = 'mohamed.boujelbane@icloud.com';

-- Taches assignees
SELECT 'Taches assignees:' as info;
SELECT 
  t.id,
  t.titre,
  t.assigned_to,
  u.email
FROM public.tasks t
LEFT JOIN public.users u ON t.assigned_to = u.id
WHERE u.email = 'mohamed.boujelbane@icloud.com';

-- Taches creees
SELECT 'Taches creees:' as info;
SELECT 
  t.id,
  t.titre,
  t.created_by,
  u.email
FROM public.tasks t
LEFT JOIN public.users u ON t.created_by = u.id
WHERE u.email = 'mohamed.boujelbane@icloud.com';

-- ========================================
-- 6. VERIFICATION DES DOUBLONS
-- ========================================

-- Doublons d'emails dans public.users
SELECT '=== DOUBLONS EMAILS PUBLIC.USERS ===' as info;
SELECT 
  email,
  COUNT(*) as occurrences,
  array_agg(id) as ids,
  array_agg(created_at) as created_dates
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email;

-- Doublons d'emails dans auth.users
SELECT '=== DOUBLONS EMAILS AUTH.USERS ===' as info;
SELECT 
  email,
  COUNT(*) as occurrences,
  array_agg(id) as ids,
  array_agg(created_at) as created_dates
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email;

-- ========================================
-- 7. VERIFICATION DES ORPHELINS
-- ========================================

-- Utilisateurs auth sans profil public
SELECT '=== UTILISATEURS AUTH SANS PROFIL PUBLIC ===' as info;
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Profils public sans utilisateur auth
SELECT '=== PROFILS PUBLIC SANS UTILISATEUR AUTH ===' as info;
SELECT 
  pu.id,
  pu.email,
  pu.created_at
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;

-- ========================================
-- 8. RECOMMANDATIONS
-- ========================================

SELECT '=== RECOMMANDATIONS ===' as info;
SELECT 
  'Pour resoudre le probleme:' as recommendation,
  '1. Identifier tous les doublons d emails' as step1,
  '2. Determiner quel enregistrement garder' as step2,
  '3. Mettre a jour les references FK' as step3,
  '4. Supprimer les doublons' as step4,
  '5. Synchroniser les IDs' as step5;





