-- CORRECTION FINALE DES DOUBLONS D'EMAILS - VERSION CORRIGEE
-- Ce script corrige tous les doublons et synchronise les IDs

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
-- 3. CORRECTION DES REFERENCES POUR LES INCOHERENCES
-- ========================================

-- Mettre a jour les projets pour les utilisateurs avec IDs differents
SELECT '=== MISE A JOUR REFERENCES PROJETS (INCOHERENCES) ===' as info;
UPDATE public.projects 
SET created_by = au.id
FROM auth.users au
INNER JOIN public.users pu ON au.email = pu.email
WHERE public.projects.created_by = pu.id 
AND au.id != pu.id;

-- Mettre a jour les taches assignees pour les utilisateurs avec IDs differents
SELECT '=== MISE A JOUR REFERENCES TACHES ASSIGNEES (INCOHERENCES) ===' as info;
UPDATE public.tasks 
SET assigned_to = au.id
FROM auth.users au
INNER JOIN public.users pu ON au.email = pu.email
WHERE public.tasks.assigned_to = pu.id 
AND au.id != pu.id;

-- Mettre a jour les taches creees pour les utilisateurs avec IDs differents
SELECT '=== MISE A JOUR REFERENCES TACHES CREEES (INCOHERENCES) ===' as info;
UPDATE public.tasks 
SET created_by = au.id
FROM auth.users au
INNER JOIN public.users pu ON au.email = pu.email
WHERE public.tasks.created_by = pu.id 
AND au.id != pu.id;

-- ========================================
-- 4. SUPPRESSION DES ENREGISTREMENTS AVEC MAUVAIS ID
-- ========================================

-- Supprimer les enregistrements public.users avec le mauvais ID
SELECT '=== SUPPRESSION ENREGISTREMENTS MAUVAIS ID ===' as info;
DELETE FROM public.users 
WHERE id IN (
  SELECT pu.id
  FROM auth.users au
  INNER JOIN public.users pu ON au.email = pu.email
  WHERE au.id != pu.id
);

-- ========================================
-- 5. CORRECTION DES DOUBLONS D'EMAILS
-- ========================================

-- Mettre a jour les projets crees par les doublons
SELECT '=== MISE A JOUR REFERENCES PROJETS (DOUBLONS) ===' as info;
UPDATE public.projects 
SET created_by = (
  SELECT id FROM public.users 
  WHERE email = (
    SELECT email FROM public.users 
    WHERE id = public.projects.created_by
  )
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE created_by IN (
  SELECT id FROM (
    SELECT id, email, created_at,
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM public.users
    WHERE email IN (
      SELECT email FROM public.users GROUP BY email HAVING COUNT(*) > 1
    )
  ) t WHERE rn > 1
);

-- Mettre a jour les taches assignees aux doublons
SELECT '=== MISE A JOUR REFERENCES TACHES ASSIGNEES (DOUBLONS) ===' as info;
UPDATE public.tasks 
SET assigned_to = (
  SELECT id FROM public.users 
  WHERE email = (
    SELECT email FROM public.users 
    WHERE id = public.tasks.assigned_to
  )
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE assigned_to IN (
  SELECT id FROM (
    SELECT id, email, created_at,
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM public.users
    WHERE email IN (
      SELECT email FROM public.users GROUP BY email HAVING COUNT(*) > 1
    )
  ) t WHERE rn > 1
);

-- Mettre a jour les taches creees par les doublons
SELECT '=== MISE A JOUR REFERENCES TACHES CREEES (DOUBLONS) ===' as info;
UPDATE public.tasks 
SET created_by = (
  SELECT id FROM public.users 
  WHERE email = (
    SELECT email FROM public.users 
    WHERE id = public.tasks.created_by
  )
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE created_by IN (
  SELECT id FROM (
    SELECT id, email, created_at,
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM public.users
    WHERE email IN (
      SELECT email FROM public.users GROUP BY email HAVING COUNT(*) > 1
    )
  ) t WHERE rn > 1
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
-- 6. CREATION DES PROFILS MANQUANTS
-- ========================================

-- Creer les profils manquants pour les utilisateurs auth
SELECT '=== CREATION PROFILS MANQUANTS ===' as info;
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





