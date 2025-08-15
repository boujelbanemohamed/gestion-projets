-- Script de nettoyage des conflits dans la table users
-- Ce script resout l'erreur 409 en nettoyant les doublons

-- 1. Identifier les doublons d'emails
SELECT 'DOUBLONS D EMAILS TROUVES' as info;
SELECT 
  email,
  COUNT(*) as count,
  array_agg(id) as ids
FROM public.users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 2. Nettoyer les doublons d'emails (garder le plus recent)
WITH duplicates AS (
  SELECT 
    email,
    id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM public.users
  WHERE email IN (
    SELECT email 
    FROM public.users 
    GROUP BY email 
    HAVING COUNT(*) > 1
  )
)
DELETE FROM public.users 
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);

-- 3. Verifier que les doublons sont supprimes
SELECT 'VERIFICATION DOUBLONS SUPPRIMES' as info;
SELECT 
  email,
  COUNT(*) as count
FROM public.users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 4. Identifier les profils orphelins
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

-- 5. Nettoyer les profils orphelins (optionnel)
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

-- 6. Verifier la coherence finale
SELECT 'COHERENCE FINALE' as info;
SELECT 
  'Profils dans public.users' as info,
  COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
  'Utilisateurs dans auth.users' as info,
  COUNT(*) as count
FROM auth.users;

-- 7. Afficher les utilisateurs auth sans profil
SELECT 'UTILISATEURS AUTH SANS PROFIL' as info;
SELECT 
  au.id,
  au.email
FROM auth.users au
LEFT JOIN public.users pu ON au.id = au.id
WHERE pu.id IS NULL;




