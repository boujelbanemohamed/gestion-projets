-- SOLUTION AVEC PRÉSERVATION DES PROJETS
-- Cette solution corrige la synchronisation sans perdre les projets

-- ========================================
-- PHASE 1: ANALYSE DES RÉFÉRENCES
-- ========================================

SELECT '=== ANALYSE DES RÉFÉRENCES ===' as info;

-- Voir quels utilisateurs sont référencés par des projets
SELECT 
  u.email,
  u.id,
  COUNT(p.id) as projets_crees,
  COUNT(t1.id) as taches_assignees,
  COUNT(t2.id) as taches_creees
FROM public.users u
LEFT JOIN public.projects p ON p.created_by = u.id
LEFT JOIN public.tasks t1 ON t1.assigned_to = u.id
LEFT JOIN public.tasks t2 ON t2.created_by = u.id
GROUP BY u.email, u.id
HAVING COUNT(p.id) > 0 OR COUNT(t1.id) > 0 OR COUNT(t2.id) > 0
ORDER BY u.email;

-- ========================================
-- PHASE 2: CORRECTION SANS SUPPRESSION
-- ========================================

SELECT '=== CORRECTION SANS SUPPRESSION ===' as info;

-- 1. Mettre à jour les utilisateurs existants avec les bonnes données auth
UPDATE public.users pu
SET 
  nom = COALESCE(au.raw_user_meta_data->>'nom', pu.email),
  prenom = COALESCE(au.raw_user_meta_data->>'prenom', 'Utilisateur'),
  role = COALESCE(au.raw_user_meta_data->>'role', 'USER'),
  fonction = COALESCE(au.raw_user_meta_data->>'fonction', ''),
  department_id = COALESCE(au.raw_user_meta_data->>'department_id', NULL),
  updated_at = NOW()
FROM auth.users au
WHERE pu.email = au.email;

-- 2. Créer les profils manquants pour les utilisateurs auth sans profil public
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
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.email = au.email
);

-- ========================================
-- PHASE 3: VÉRIFICATION FINALE
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

-- Vérifier que les projets sont toujours intacts
SELECT 
  'Projets préservés' as status,
  COUNT(*) as total_projets
FROM public.projects;

-- ========================================
-- PHASE 4: TEST DE CONNEXION
-- ========================================

SELECT '=== TEST DE CONNEXION ===' as info;

-- Vérifier qu'on peut faire un SELECT sans erreur
SELECT 
  'Test SELECT réussi' as status,
  COUNT(*) as users_count
FROM public.users;

SELECT '✅ SOLUTION AVEC PRÉSERVATION TERMINÉE' as result;
SELECT '🎯 Testez maintenant la connexion dans l application' as next_step;
SELECT '💾 Tous vos projets ont été préservés' as note;





