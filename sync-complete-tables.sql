-- SYNCHRONISATION COMPLÈTE DES TABLES USERS
-- Ce script duplique et synchronise les utilisateurs entre auth.users et public.users

-- ========================================
-- 1. DIAGNOSTIC DE L'ÉTAT ACTUEL
-- ========================================

-- Voir l'état actuel des deux tables
SELECT '=== ÉTAT ACTUEL DES TABLES ===' as info;

SELECT 
  'Auth users' as source,
  COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
  'Public users' as source,
  COUNT(*) as total
FROM public.users;

-- Voir les utilisateurs qui n'existent que dans public.users
SELECT '=== UTILISATEURS UNIQUEMENT DANS PUBLIC.USERS ===' as info;
SELECT 
  pu.id,
  pu.email,
  pu.nom,
  pu.prenom,
  pu.role,
  pu.fonction,
  pu.department_id,
  pu.created_at
FROM public.users pu
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au WHERE au.email = pu.email
);

-- Voir les utilisateurs qui n'existent que dans auth.users
SELECT '=== UTILISATEURS UNIQUEMENT DANS AUTH.USERS ===' as info;
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.email = au.email
);

-- ========================================
-- 2. CRÉATION DES UTILISATEURS MANQUANTS DANS AUTH.USERS
-- ========================================

-- Créer les utilisateurs manquants dans auth.users
-- Note: On utilise auth.users comme source de vérité pour les IDs
SELECT '=== CRÉATION UTILISATEURS MANQUANTS DANS AUTH.USERS ===' as info;

-- D'abord, on va créer des utilisateurs temporaires dans auth.users
-- Puis on les mettra à jour avec les bonnes données

-- Créer les utilisateurs manquants (cette partie nécessite l'API Supabase)
-- On va plutôt synchroniser les métadonnées

-- ========================================
-- 3. SYNCHRONISATION DES MÉTADONNÉES DANS AUTH.USERS
-- ========================================

-- Mettre à jour les métadonnées des utilisateurs auth existants
-- avec les données de public.users
SELECT '=== SYNCHRONISATION MÉTADONNÉES AUTH.USERS ===' as info;

-- Cette partie nécessite l'API Supabase pour modifier auth.users
-- On va plutôt se concentrer sur la synchronisation de public.users

-- ========================================
-- 4. CRÉATION DES PROFILS MANQUANTS DANS PUBLIC.USERS
-- ========================================

-- Créer les profils manquants dans public.users
SELECT '=== CRÉATION PROFILS MANQUANTS DANS PUBLIC.USERS ===' as info;

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
-- 5. SYNCHRONISATION DES DONNÉES EXISTANTES
-- ========================================

-- Mettre à jour les profils existants dans public.users
-- avec les données les plus récentes
SELECT '=== SYNCHRONISATION DONNÉES EXISTANTES ===' as info;

-- Mettre à jour les champs des utilisateurs existants
UPDATE public.users 
SET 
  nom = COALESCE(
    au.raw_user_meta_data->>'nom', 
    public.users.nom, 
    split_part(au.email, '@', 1)
  ),
  prenom = COALESCE(
    au.raw_user_meta_data->>'prenom', 
    public.users.prenom, 
    'Utilisateur'
  ),
  role = COALESCE(
    (au.raw_user_meta_data->>'role')::user_role_enum, 
    public.users.role, 
    'USER'::user_role_enum
  ),
  fonction = COALESCE(
    au.raw_user_meta_data->>'fonction', 
    public.users.fonction
  ),
  department_id = COALESCE(
    (au.raw_user_meta_data->>'department_id')::uuid, 
    public.users.department_id
  ),
  updated_at = NOW()
FROM auth.users au
WHERE public.users.email = au.email;

-- ========================================
-- 6. CRÉATION D'UTILISATEURS AUTH MANQUANTS (SIMULATION)
-- ========================================

-- Note: Cette partie nécessite l'API Supabase
-- On va créer un script séparé pour cela
SELECT '=== CRÉATION UTILISATEURS AUTH MANQUANTS ===' as info;
SELECT 
  'IMPORTANT: Pour créer des utilisateurs dans auth.users,' as info,
  'utilisez le script Node.js fourni avec l API Supabase' as details;

-- ========================================
-- 7. VÉRIFICATION FINALE
-- ========================================

-- Vérifier la synchronisation
SELECT '=== VÉRIFICATION SYNCHRONISATION ===' as info;

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

-- Vérifier les utilisateurs non synchronisés
SELECT '=== UTILISATEURS NON SYNCHRONISÉS ===' as info;

-- Utilisateurs auth sans profil public
SELECT 
  'Auth sans profil public' as type,
  au.email,
  au.id
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- Utilisateurs public sans compte auth
SELECT 
  'Public sans compte auth' as type,
  pu.email,
  pu.id
FROM public.users pu
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au WHERE au.email = pu.email
);

-- ========================================
-- 8. RÉSUMÉ DES ACTIONS À EFFECTUER
-- ========================================

SELECT '=== RÉSUMÉ DES ACTIONS ===' as info;
SELECT 
  '1. Ce script a créé les profils manquants dans public.users' as action,
  '2. Il a synchronisé les données existantes' as details,
  '3. Pour créer des utilisateurs auth manquants, utilisez le script Node.js' as next_step;


