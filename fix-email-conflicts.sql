-- Script de resolution des conflits d'emails
-- Ce script identifie et corrige les incohérences entre auth.users et public.users

-- 1. Identifier les emails en conflit
SELECT 'EMAILS EN CONFLIT' as info;
SELECT 
  pu.email,
  pu.id as profile_id,
  au.id as auth_id,
  CASE 
    WHEN au.id IS NULL THEN 'Profil sans utilisateur auth'
    WHEN pu.id IS NULL THEN 'Utilisateur auth sans profil'
    WHEN pu.id != au.id THEN 'IDs differents'
    ELSE 'OK'
  END as statut
FROM public.users pu
FULL OUTER JOIN auth.users au ON pu.email = au.email
WHERE pu.id != au.id OR pu.id IS NULL OR au.id IS NULL;

-- 2. Voir les profils orphelins (sans utilisateur auth)
SELECT 'PROFILS ORPHELINS' as info;
SELECT 
  pu.id,
  pu.email,
  pu.nom,
  pu.prenom,
  pu.role
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;

-- 3. Voir les utilisateurs auth sans profil
SELECT 'UTILISATEURS AUTH SANS PROFIL' as info;
SELECT 
  au.id,
  au.email
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 4. Nettoyer les profils orphelins (optionnel)
-- Decommentez si vous voulez supprimer les profils sans utilisateur auth
/*
DELETE FROM public.users 
WHERE id IN (
  SELECT pu.id
  FROM public.users pu
  LEFT JOIN auth.users au ON pu.id = au.id
  WHERE au.id IS NULL
);
*/

-- 5. Verifier la coherence finale
SELECT 'COHERENCE FINALE' as info;
SELECT 
  'Profils dans public.users' as info,
  COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
  'Utilisateurs dans auth.users' as info,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Utilisateurs avec profils' as info,
  COUNT(*) as count
FROM auth.users au
INNER JOIN public.users pu ON au.id = pu.id;





