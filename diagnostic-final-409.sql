-- DIAGNOSTIC FINAL - ERREUR 409
-- Ce script identifie la cause exacte de l'erreur 409

-- ========================================
-- 1. VÉRIFICATION DES CONFLITS D'EMAILS
-- ========================================

SELECT '=== CONFLITS D EMAILS ===' as info;

-- Voir tous les doublons d'emails
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
-- 2. VÉRIFICATION DES INCOHÉRENCES D'ID
-- ========================================

SELECT '=== INCOHÉRENCES D ID ===' as info;

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
-- 3. VÉRIFICATION DES RÉFÉRENCES FK
-- ========================================

SELECT '=== RÉFÉRENCES FK ===' as info;

-- Utilisateurs avec des références (ne peuvent pas être supprimés)
SELECT 
  u.email,
  COUNT(DISTINCT p.id) as projets_crees,
  COUNT(DISTINCT t1.id) as taches_assignees,
  COUNT(DISTINCT t2.id) as taches_creees
FROM public.users u
LEFT JOIN public.projects p ON p.created_by = u.id
LEFT JOIN public.tasks t1 ON t1.assigned_to = u.id
LEFT JOIN public.tasks t2 ON t2.created_by = u.id
GROUP BY u.email
HAVING COUNT(DISTINCT p.id) > 0 OR COUNT(DISTINCT t1.id) > 0 OR COUNT(DISTINCT t2.id) > 0
ORDER BY u.email;

-- ========================================
-- 4. VÉRIFICATION DES UTILISATEURS ORPHELINS
-- ========================================

SELECT '=== UTILISATEURS ORPHELINS ===' as info;

-- Utilisateurs public sans compte auth
SELECT 
  'Public sans Auth' as type,
  pu.email,
  pu.id
FROM public.users pu
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au WHERE au.email = pu.email
);

-- Utilisateurs auth sans profil public
SELECT 
  'Auth sans Public' as type,
  au.email,
  au.id
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.email = au.email
);

-- ========================================
-- 5. VÉRIFICATION DES CONTRAINTES
-- ========================================

SELECT '=== CONTRAINTES ===' as info;

-- Voir les contraintes sur la table users
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  ccu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'users' AND tc.table_schema = 'public';

-- ========================================
-- 6. RÉSUMÉ ET ACTIONS
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

-- Recommandations
SELECT 
  '1. Identifiez les doublons d emails' as action,
  '2. Corrigez les incohérences d ID' as details,
  '3. Résolvez les références FK' as next_step;
