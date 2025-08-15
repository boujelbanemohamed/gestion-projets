-- CORRECTION FINALE DES DOUBLONS D'EMAILS
-- Ce script corrige tous les doublons de maniere securisee

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
-- 2. STRATEGIE DE CORRECTION
-- ========================================

-- Pour chaque email en double, on va :
-- 1. Garder l'enregistrement le plus recent (created_at le plus recent)
-- 2. Mettre a jour toutes les references FK vers cet enregistrement
-- 3. Supprimer les autres enregistrements

-- ========================================
-- 3. CORRECTION DES REFERENCES
-- ========================================

-- Mettre a jour les projets crees par les doublons
SELECT '=== MISE A JOUR REFERENCES PROJETS ===' as info;
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
SELECT '=== MISE A JOUR REFERENCES TACHES ASSIGNEES ===' as info;
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
SELECT '=== MISE A JOUR REFERENCES TACHES CREEES ===' as info;
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

-- ========================================
-- 4. SUPPRESSION DES DOUBLONS
-- ========================================

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
-- 5. SYNCHRONISATION AVEC AUTH.USERS
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
-- 6. VERIFICATION FINALE
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





