-- SOLUTION FINALE - ÉVITER LES CONTRAINTES FK
-- Cette solution crée de nouveaux profils sans toucher aux existants

-- ========================================
-- PHASE 1: ANALYSE DE L'ÉTAT ACTUEL
-- ========================================

SELECT '=== ANALYSE DE L ÉTAT ACTUEL ===' as info;

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
-- PHASE 2: CRÉATION DE PROFILS MANQUANTS
-- ========================================

SELECT '=== CRÉATION DE PROFILS MANQUANTS ===' as info;

-- Créer les profils manquants pour les utilisateurs auth sans profil public
-- On utilise ON CONFLICT DO NOTHING pour éviter les erreurs
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
  COALESCE(au.raw_user_meta_data->>'role', 'USER')::user_role_enum as role,
  COALESCE(au.raw_user_meta_data->>'fonction', '') as fonction,
  COALESCE(au.raw_user_meta_data->>'department_id', NULL)::uuid as department_id,
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.email = au.email
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- PHASE 3: VÉRIFICATION DE LA SYNCHRONISATION
-- ========================================

SELECT '=== VÉRIFICATION DE LA SYNCHRONISATION ===' as info;

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
-- PHASE 4: TEST DE CONNEXION
-- ========================================

SELECT '=== TEST DE CONNEXION ===' as info;

-- Vérifier qu'on peut faire un SELECT sans erreur
SELECT 
  'Test SELECT réussi' as status,
  COUNT(*) as users_count
FROM public.users;

-- Vérifier que les projets sont toujours intacts
SELECT 
  'Projets préservés' as status,
  COUNT(*) as total_projets
FROM public.projects;

-- ========================================
-- PHASE 5: RÉSULTAT FINAL
-- ========================================

SELECT '✅ SOLUTION FINALE TERMINÉE' as result;
SELECT '🎯 Testez maintenant la connexion dans l application' as next_step;
SELECT '💾 Tous vos projets ont été préservés' as note;
SELECT '🔒 Aucune contrainte FK violée' as security;
