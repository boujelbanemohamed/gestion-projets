-- CORRECTION FINALE DES DOUBLONS D'EMAILS - ORDRE CORRIGE
-- Ce script corrige tous les doublons dans le bon ordre

-- ========================================
-- 1. DIAGNOSTIC DES DOUBLONS
-- ========================================

-- Voir tous les doublons d'emails
SELECT '=== DOUBLONS DETECTES ===' as info;
SELECT 
  email,
  COUNT(*) as occurrences,
  array_agg(id ORDER BY created_at) as ids_par_date,
  array_agg(created_at ORDER BY created_at) as dates_creation
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email;

-- ========================================
-- 2. ANALYSE DES INCOHERENCES D'ID
-- ========================================

-- Voir les utilisateurs avec des IDs differents
SELECT '=== INCOHERENCES D ID ===' as info;
SELECT 
  au.email,
  au.id as auth_id,
  pu.id as public_id,
  CASE 
    WHEN au.id = pu.id THEN 'IDs CORRESPONDENT'
    ELSE 'IDs DIFFERENTS - CORRECTION NECESSAIRE'
  END as statut
FROM auth.users au
INNER JOIN public.users pu ON au.email = pu.email
WHERE au.id != pu.id;

-- ========================================
-- 3. STRATEGIE CORRIGEE
-- ========================================

-- Ordre correct :
-- 1. Creer d'abord les profils avec les bons IDs
-- 2. Mettre a jour les references FK
-- 3. Supprimer les anciens enregistrements

-- ========================================
-- 4. CREATION DES PROFILS AVEC LES BONS IDS (EN PREMIER)
-- ========================================

-- Creer les profils manquants pour les utilisateurs auth
SELECT '=== CREATION PROFILS AVEC BONS IDS (EN PREMIER) ===' as info;
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- ========================================
-- 5. MAINTENANT ON PEUT METTRE A JOUR LES REFERENCES
-- ========================================

-- Mettre a jour les projets pour utiliser l'ID auth.users
SELECT '=== CORRECTION REFERENCES PROJETS ===' as info;
UPDATE public.projects 
SET created_by = au.id
FROM auth.users au
INNER JOIN public.users pu ON au.email = pu.email
WHERE public.projects.created_by = pu.id 
AND au.id != pu.id;

-- Mettre a jour les taches assignees pour utiliser l'ID auth.users
SELECT '=== CORRECTION REFERENCES TACHES ASSIGNEES ===' as info;
UPDATE public.tasks 
SET assigned_to = au.id
FROM auth.users au
INNER JOIN public.users pu ON au.email = pu.email
WHERE public.tasks.assigned_to = pu.id 
AND au.id != pu.id;

-- Mettre a jour les taches creees pour utiliser l'ID auth.users
SELECT '=== CORRECTION REFERENCES TACHES CREEES ===' as info;
UPDATE public.tasks 
SET created_by = au.id
FROM auth.users au
INNER JOIN public.users pu ON au.email = pu.email
WHERE public.tasks.created_by = pu.id 
AND au.id != pu.id;

-- ========================================
-- 6. SUPPRESSION DES ENREGISTREMENTS PROBLEMATIQUES
-- ========================================

-- Maintenant on peut supprimer en toute securite
SELECT '=== SUPPRESSION ENREGISTREMENTS MAUVAIS ID ===' as info;
DELETE FROM public.users 
WHERE id IN (
  SELECT pu.id
  FROM auth.users au
  INNER JOIN public.users pu ON au.email = pu.email
  WHERE au.id != pu.id
);

-- Supprimer les enregistrements en double (garder le plus recent)
SELECT '=== SUPPRESSION DES DOUBLONS ===' as info;
DELETE FROM public.users 
WHERE id IN (
  SELECT id FROM (
    SELECT id, email, created_at,
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM public.users
    WHERE email IN (
      SELECT email FROM public.users GROUP BY email HAVING COUNT(*) > 1
    )
  ) t WHERE rn > 1
);

-- ========================================
-- 7. VERIFICATION FINALE
-- ========================================

-- Comptage final
SELECT '=== VERIFICATION FINALE ===' as info;
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

-- Verification des doublons restants
SELECT '=== VERIFICATION DOUBLONS RESTANTS ===' as info;
SELECT 
  email,
  COUNT(*) as occurrences
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email;

-- Verification pour mohamed.boujelbane@icloud.com
SELECT '=== VERIFICATION MOHAMED ===' as info;
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

-- Verification des references
SELECT '=== VERIFICATION REFERENCES ===' as info;
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

-- ========================================
-- 8. VERIFICATION DES REFERENCES ORPHELINES
-- ========================================

-- Voir les projets avec des created_by orphelins
SELECT '=== PROJETS AVEC CREATED_BY ORPHELIN ===' as info;
SELECT 
  p.id,
  p.nom,
  p.created_by,
  CASE 
    WHEN u.id IS NULL THEN 'ORPHELIN'
    ELSE 'OK'
  END as statut
FROM public.projects p
LEFT JOIN public.users u ON p.created_by = u.id
WHERE u.id IS NULL;

-- Voir les taches avec des assigned_to orphelins
SELECT '=== TACHES AVEC ASSIGNED_TO ORPHELIN ===' as info;
SELECT 
  t.id,
  t.titre,
  t.assigned_to,
  CASE 
    WHEN u.id IS NULL THEN 'ORPHELIN'
    ELSE 'OK'
  END as statut
FROM public.tasks t
LEFT JOIN public.users u ON t.assigned_to = u.id
WHERE u.id IS NULL;

-- Voir les taches avec des created_by orphelins
SELECT '=== TACHES AVEC CREATED_BY ORPHELIN ===' as info;
SELECT 
  t.id,
  t.titre,
  t.created_by,
  CASE 
    WHEN u.id IS NULL THEN 'ORPHELIN'
    ELSE 'OK'
  END as statut
FROM public.tasks t
LEFT JOIN public.users u ON t.created_by = u.id
WHERE u.id IS NULL;





