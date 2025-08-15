-- SOLUTION DÉFINITIVE - DIAGNOSTIC PUIS CORRECTION CIBLÉE
-- Ce script diagnostique d'abord, puis corrige uniquement le problème

-- ========================================
-- 1. DIAGNOSTIC COMPLET DU PROBLÈME
-- ========================================

-- Voir exactement ce qui se passe avec mohamed.boujelbane@icloud.com
SELECT '=== DIAGNOSTIC MOHAMED ===' as info;
SELECT 
  'Auth' as source,
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE email = 'mohamed.boujelbane@icloud.com';

SELECT 
  'Public' as source,
  id,
  email,
  nom,
  prenom,
  role,
  fonction,
  department_id,
  created_at
FROM public.users 
WHERE email = 'mohamed.boujelbane@icloud.com';

-- Voir les références de cet utilisateur
SELECT '=== RÉFÉRENCES DE MOHAMED ===' as info;
SELECT 
  'Projets créés' as type,
  p.id,
  p.nom,
  p.created_by
FROM public.projects p
WHERE p.created_by IN (
  SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com'
  UNION
  SELECT id FROM public.users WHERE email = 'mohamed.boujelbane@icloud.com'
);

SELECT 
  'Tâches assignées' as type,
  t.id,
  t.titre,
  t.assigned_to
FROM public.tasks t
WHERE t.assigned_to IN (
  SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com'
  UNION
  SELECT id FROM public.users WHERE email = 'mohamed.boujelbane@icloud.com'
);

SELECT 
  'Tâches créées' as type,
  t.id,
  t.titre,
  t.created_by
FROM public.tasks t
WHERE t.created_by IN (
  SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com'
  UNION
  SELECT id FROM public.users WHERE email = 'mohamed.boujelbane@icloud.com'
);

-- ========================================
-- 2. STRATÉGIE DE CORRECTION CIBLÉE
-- ========================================

-- Au lieu de créer, on va CORRIGER l'existant
-- 1. Mettre à jour l'ID dans public.users pour qu'il corresponde à auth.users
-- 2. Mettre à jour toutes les références FK
-- 3. Supprimer l'ancien enregistrement

-- ========================================
-- 3. CORRECTION DE L'ID DANS PUBLIC.USERS
-- ========================================

-- D'abord, créer un profil temporaire avec le bon ID
SELECT '=== CRÉATION PROFIL TEMPORAIRE ===' as info;
INSERT INTO public.users (id, email, nom, prenom, role, fonction, department_id, created_at, updated_at)
SELECT 
  au.id,  -- ID de auth.users
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

-- ========================================
-- 4. MISE À JOUR DES RÉFÉRENCES FK
-- ========================================

-- Maintenant on peut mettre à jour les références
SELECT '=== MISE À JOUR RÉFÉRENCES ===' as info;

-- Mettre à jour les projets
UPDATE public.projects 
SET created_by = (
  SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com'
)
WHERE created_by = (
  SELECT id FROM public.users WHERE email = 'mohamed.boujelbane@icloud.com' 
  AND id != (SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com')
);

-- Mettre à jour les tâches assignées
UPDATE public.tasks 
SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com'
)
WHERE assigned_to = (
  SELECT id FROM public.users WHERE email = 'mohamed.boujelbane@icloud.com' 
  AND id != (SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com')
);

-- Mettre à jour les tâches créées
UPDATE public.tasks 
SET created_by = (
  SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com'
)
WHERE created_by = (
  SELECT id FROM public.users WHERE email = 'mohamed.boujelbane@icloud.com' 
  AND id != (SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com')
);

-- ========================================
-- 5. SUPPRESSION DE L'ANCIEN ENREGISTREMENT
-- ========================================

-- Maintenant on peut supprimer l'ancien enregistrement
SELECT '=== SUPPRESSION ANCIEN ENREGISTREMENT ===' as info;
DELETE FROM public.users 
WHERE email = 'mohamed.boujelbane@icloud.com' 
AND id != (
  SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com'
);

-- ========================================
-- 6. VÉRIFICATION FINALE
-- ========================================

-- Vérifier que tout est synchronisé
SELECT '=== VÉRIFICATION FINALE ===' as info;
SELECT 
  'Auth' as source,
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'mohamed.boujelbane@icloud.com'
UNION ALL
SELECT 
  'Public' as source,
  id,
  email,
  created_at
FROM public.users 
WHERE email = 'mohamed.boujelbane@icloud.com';

-- Vérifier les références
SELECT '=== VÉRIFICATION RÉFÉRENCES ===' as info;
SELECT 
  'Projets créés' as type,
  COUNT(*) as count
FROM public.projects 
WHERE created_by = (SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com')
UNION ALL
SELECT 
  'Tâches assignées' as type,
  COUNT(*) as count
FROM public.tasks 
WHERE assigned_to = (SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com')
UNION ALL
SELECT 
  'Tâches créées' as type,
  COUNT(*) as count
FROM public.tasks 
WHERE created_by = (SELECT id FROM auth.users WHERE email = 'mohamed.boujelbane@icloud.com');

-- Vérifier la synchronisation globale
SELECT '=== SYNCHRONISATION GLOBALE ===' as info;
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




