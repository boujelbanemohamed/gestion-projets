-- SOLUTION RADICALE - ÉLIMINER L'ERREUR 409
-- Cette solution nettoie complètement les données problématiques

-- ========================================
-- PHASE 1: DIAGNOSTIC RAPIDE
-- ========================================

SELECT '=== DIAGNOSTIC RAPIDE ===' as info;

-- Voir l'état actuel
SELECT 
  'Auth users' as source,
  COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
  'Public users' as source,
  COUNT(*) as total
FROM public.users;

-- ========================================
-- PHASE 2: NETTOYAGE COMPLET
-- ========================================

SELECT '=== NETTOYAGE COMPLET ===' as info;

-- 1. Supprimer TOUS les utilisateurs public (on les recréera)
DELETE FROM public.users;

-- 2. Vérifier que la table est vide
SELECT 'Utilisateurs public après suppression' as info, COUNT(*) as total FROM public.users;

-- ========================================
-- PHASE 3: RECRÉATION PROPRE
-- ========================================

SELECT '=== RECRÉATION PROPRE ===' as info;

-- Recréer les profils public pour TOUS les utilisateurs auth
INSERT INTO public.users (
  id,
  email,
  nom,
  prenom,
  role,
  fonction,
  department_id,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'nom', au.email) as nom,
  COALESCE(au.raw_user_meta_data->>'prenom', 'Utilisateur') as prenom,
  COALESCE(au.raw_user_meta_data->>'role', 'USER') as role,
  COALESCE(au.raw_user_meta_data->>'fonction', '') as fonction,
  COALESCE(au.raw_user_meta_data->>'department_id', NULL) as department_id,
  au.created_at,
  au.updated_at
FROM auth.users au;

-- ========================================
-- PHASE 4: VÉRIFICATION FINALE
-- ========================================

SELECT '=== VÉRIFICATION FINALE ===' as info;

-- Vérifier la synchronisation
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

-- Vérifier qu'il n'y a plus de doublons
SELECT 
  'Doublons d emails' as check_type,
  COUNT(*) as total
FROM (
  SELECT email, COUNT(*) 
  FROM public.users 
  GROUP BY email 
  HAVING COUNT(*) > 1
) as doublons;

-- ========================================
-- PHASE 5: TEST DE CONNEXION
-- ========================================

SELECT '=== TEST DE CONNEXION ===' as info;

-- Vérifier qu'on peut faire un SELECT sans erreur
SELECT 
  'Test SELECT réussi' as status,
  COUNT(*) as users_count
FROM public.users;

SELECT '✅ SOLUTION RADICALE TERMINÉE' as result;
SELECT '🎯 Testez maintenant la connexion dans l application' as next_step;




