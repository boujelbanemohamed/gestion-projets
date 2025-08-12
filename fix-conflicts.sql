-- Script de résolution des conflits dans la table users
-- Ce script identifie et corrige les problèmes de synchronisation

-- 1. Vérifier les doublons d'emails
SELECT '=== DOUBLONS D\'EMAILS ===' as info;
SELECT 
  email,
  COUNT(*) as count,
  array_agg(id) as ids
FROM public.users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 2. Vérifier les conflits de clés primaires
SELECT '=== CONFLITS DE CLÉS PRIMAIRES ===' as info;
SELECT 
  id,
  email,
  nom,
  prenom,
  role
FROM public.users 
WHERE id IN (
  SELECT id 
  FROM public.users 
  GROUP BY id 
  HAVING COUNT(*) > 1
);

-- 3. Vérifier les utilisateurs sans email valide
SELECT '=== UTILISATEURS SANS EMAIL VALIDE ===' as info;
SELECT 
  id,
  email,
  nom,
  prenom,
  role
FROM public.users 
WHERE email IS NULL OR email = '';

-- 4. Vérifier la cohérence avec auth.users
SELECT '=== VÉRIFICATION COHÉRENCE AUTH.USERS ===' as info;
SELECT 
  'Profils dans public.users' as info,
  COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
  'Utilisateurs dans auth.users' as info,
  COUNT(*) as count
FROM auth.users;

-- 5. Identifier les profils orphelins
SELECT '=== PROFILS ORPHELINS ===' as info;
SELECT 
  pu.id,
  pu.email,
  pu.nom,
  pu.prenom,
  pu.role
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;

-- 6. Identifier les utilisateurs auth sans profil
SELECT '=== UTILISATEURS AUTH SANS PROFIL ===' as info;
SELECT 
  au.id,
  au.email
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 7. Nettoyer les profils orphelins (optionnel)
-- Décommentez les lignes suivantes si vous voulez supprimer les profils orphelins
/*
DELETE FROM public.users 
WHERE id IN (
  SELECT pu.id
  FROM public.users pu
  LEFT JOIN auth.users au ON pu.id = au.id
  WHERE au.id IS NULL
);
*/

-- 8. Vérifier les contraintes actuelles
SELECT '=== CONTRAINTES ACTUELLES ===' as info;
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass;

-- 9. Vérifier les index
SELECT '=== INDEX ACTUELS ===' as info;
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'users' AND schemaname = 'public';


