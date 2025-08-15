-- DIAGNOSTIC ULTRA-PRÉCIS - ERREUR 409 PERSISTANTE
-- Ce script identifie la cause exacte de l'erreur 409

-- ========================================
-- 1. VÉRIFICATION DES CONTRAINTES UNIQUES
-- ========================================

SELECT '=== CONTRAINTES UNIQUES ===' as info;

-- Voir toutes les contraintes uniques sur la table users
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  kcu.ordinal_position
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users' 
  AND tc.table_schema = 'public'
  AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- ========================================
-- 2. VÉRIFICATION DES DOUBLONS D'EMAILS
-- ========================================

SELECT '=== DOUBLONS D EMAILS ===' as info;

-- Voir tous les doublons d'emails avec leurs IDs
SELECT 
  email,
  COUNT(*) as occurrences,
  array_agg(id ORDER BY created_at) as ids,
  array_agg(created_at ORDER BY created_at) as dates
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email;

-- ========================================
-- 3. VÉRIFICATION DES DOUBLONS D'ID
-- ========================================

SELECT '=== DOUBLONS D ID ===' as info;

-- Voir tous les doublons d'ID avec leurs emails
SELECT 
  id,
  COUNT(*) as occurrences,
  array_agg(email ORDER BY created_at) as emails,
  array_agg(created_at ORDER BY created_at) as dates
FROM public.users
GROUP BY id
HAVING COUNT(*) > 1
ORDER BY id;

-- ========================================
-- 4. VÉRIFICATION DES INCOHÉRENCES AUTH/PUBLIC
-- ========================================

SELECT '=== INCOHÉRENCES AUTH/PUBLIC ===' as info;

-- Voir les utilisateurs avec des IDs différents
SELECT 
  au.email,
  au.id as auth_id,
  pu.id as public_id,
  CASE 
    WHEN au.id = pu.id THEN 'IDs CORRESPONDENT'
    ELSE 'IDs DIFFÉRENTS - PROBLÈME'
  END as statut
FROM auth.users au
INNER JOIN public.users pu ON au.email = pu.email
WHERE au.id != pu.id;

-- ========================================
-- 5. VÉRIFICATION DES RÉFÉRENCES FK
-- ========================================

SELECT '=== RÉFÉRENCES FK ===' as info;

-- Voir tous les utilisateurs référencés par des projets/tâches
SELECT 
  u.email,
  u.id,
  COUNT(DISTINCT p.id) as projets_crees,
  COUNT(DISTINCT t1.id) as taches_assignees,
  COUNT(DISTINCT t2.id) as taches_creees
FROM public.users u
LEFT JOIN public.projects p ON p.created_by = u.id
LEFT JOIN public.tasks t1 ON t1.assigned_to = u.id
LEFT JOIN public.tasks t2 ON t2.created_by = u.id
GROUP BY u.email, u.id
HAVING COUNT(DISTINCT p.id) > 0 OR COUNT(DISTINCT t1.id) > 0 OR COUNT(DISTINCT t2.id) > 0
ORDER BY u.email;

-- ========================================
-- 6. TEST DE REQUÊTE SIMPLE
-- ========================================

SELECT '=== TEST REQUÊTE SIMPLE ===' as info;

-- Tester une requête simple pour voir où ça bloque
SELECT 
  'Test simple réussi' as status,
  COUNT(*) as total_users
FROM public.users;

-- ========================================
-- 7. VÉRIFICATION DES INDEX
-- ========================================

SELECT '=== INDEX ===' as info;

-- Voir tous les index sur la table users
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users' AND schemaname = 'public';

-- ========================================
-- 8. RÉSUMÉ ET ACTIONS
-- ========================================

SELECT '=== RÉSUMÉ ===' as info;

-- Comptage final
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
  'Utilisateurs synchronisés' as source,
  COUNT(*) as total
FROM auth.users au
INNER JOIN public.users pu ON au.id = pu.id;

-- Recommandations spécifiques
SELECT 
  '1. Identifiez les contraintes uniques problématiques' as action,
  '2. Résolvez les doublons d emails/ID' as details,
  '3. Corrigez les incohérences auth/public' as next_step;




