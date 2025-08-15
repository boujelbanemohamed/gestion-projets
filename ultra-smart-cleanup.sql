-- Script de nettoyage ultra-intelligent avec gestion de TOUTES les contraintes
-- Ce script resout les conflits en respectant TOUTES les contraintes de clé etrangere

-- 1. Identifier les utilisateurs avec des projets
SELECT 'UTILISATEURS AVEC PROJETS' as info;
SELECT 
  u.id,
  u.email,
  u.nom,
  u.prenom,
  COUNT(p.id) as nb_projets
FROM public.users u
LEFT JOIN public.projects p ON u.id = p.created_by
GROUP BY u.id, u.email, u.nom, u.prenom
HAVING COUNT(p.id) > 0
ORDER BY nb_projets DESC;

-- 2. Identifier les utilisateurs avec des taches assignees
SELECT 'UTILISATEURS AVEC TACHES ASSIGNEES' as info;
SELECT 
  u.id,
  u.email,
  u.nom,
  u.prenom,
  COUNT(t.id) as nb_taches
FROM public.users u
LEFT JOIN public.tasks t ON u.id = t.assigned_to
GROUP BY u.id, u.email, u.nom, u.prenom
HAVING COUNT(t.id) > 0
ORDER BY nb_taches DESC;

-- 3. Identifier les utilisateurs avec des projets OU des taches (a conserver absolument)
SELECT 'UTILISATEURS AVEC PROJETS OU TACHES (A CONSERVER)' as info;
SELECT 
  u.id,
  u.email,
  u.nom,
  u.prenom,
  COUNT(DISTINCT p.id) as nb_projets,
  COUNT(DISTINCT t.id) as nb_taches,
  'A CONSERVER' as statut
FROM public.users u
LEFT JOIN public.projects p ON u.id = p.created_by
LEFT JOIN public.tasks t ON u.id = t.assigned_to
GROUP BY u.id, u.email, u.nom, u.prenom
HAVING COUNT(DISTINCT p.id) > 0 OR COUNT(DISTINCT t.id) > 0
ORDER BY (COUNT(DISTINCT p.id) + COUNT(DISTINCT t.id)) DESC;

-- 4. Identifier les profils en conflit (emails dupliques avec IDs differents)
-- MAIS sans supprimer ceux qui ont des projets OU des taches
SELECT 'PROFILS EN CONFLIT (SAUF AVEC PROJETS OU TACHES)' as info;
SELECT 
  pu.email,
  pu.id as profile_id,
  au.id as auth_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.projects p WHERE p.created_by = pu.id) THEN 'A des projets - CONSERVER'
    WHEN EXISTS (SELECT 1 FROM public.tasks t WHERE t.assigned_to = pu.id) THEN 'A des taches - CONSERVER'
    WHEN au.id IS NULL THEN 'Profil sans utilisateur auth - SUPPRIMER'
    WHEN pu.id != au.id THEN 'ID different - SUPPRIMER'
    ELSE 'OK'
  END as statut
FROM public.users pu
FULL OUTER JOIN auth.users au ON pu.email = au.email
WHERE (pu.id != au.id OR pu.id IS NULL OR au.id IS NULL)
AND NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.created_by = pu.id)
AND NOT EXISTS (SELECT 1 FROM public.tasks t WHERE t.assigned_to = pu.id);

-- 5. Supprimer SEULEMENT les profils sans projets ET sans taches et en conflit
SELECT 'NETTOYAGE DES PROFILS EN CONFLIT (SAUF AVEC PROJETS OU TACHES)' as info;
DELETE FROM public.users pu
WHERE EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE pu.email = au.email AND pu.id != au.id
)
AND NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.created_by = pu.id)
AND NOT EXISTS (SELECT 1 FROM public.tasks t WHERE t.assigned_to = pu.id);

-- 6. Supprimer SEULEMENT les profils orphelins sans projets ET sans taches
SELECT 'NETTOYAGE DES PROFILS ORPHELINS (SAUF AVEC PROJETS OU TACHES)' as info;
DELETE FROM public.users pu
WHERE NOT EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE pu.id = au.id
)
AND NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.created_by = pu.id)
AND NOT EXISTS (SELECT 1 FROM public.tasks t WHERE t.assigned_to = pu.id);

-- 7. Verifier le nettoyage
SELECT 'VERIFICATION DU NETTOYAGE' as info;
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

-- 8. Creer les profils manquants pour les utilisateurs auth
SELECT 'CREATION DES PROFILS MANQUANTS' as info;
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
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 9. Verification finale
SELECT 'SYNCHRONISATION FINALE' as info;
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
INNER JOIN public.users pu ON au.id = pu.id
UNION ALL
SELECT 
  'Utilisateurs sans profil' as info,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 10. Resume des utilisateurs conserves
SELECT 'RESUME DES UTILISATEURS CONSERVES' as info;
SELECT 
  'Total utilisateurs conserves' as info,
  COUNT(*) as count
FROM public.users u
WHERE EXISTS (SELECT 1 FROM public.projects p WHERE p.created_by = u.id)
   OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.assigned_to = u.id)
UNION ALL
SELECT 
  'Utilisateurs avec projets' as info,
  COUNT(DISTINCT u.id) as count
FROM public.users u
INNER JOIN public.projects p ON u.id = p.created_by
UNION ALL
SELECT 
  'Utilisateurs avec taches' as info,
  COUNT(DISTINCT u.id) as count
FROM public.users u
INNER JOIN public.tasks t ON u.id = t.assigned_to;




