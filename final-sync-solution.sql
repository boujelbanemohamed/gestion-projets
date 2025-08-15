-- Solution finale : Synchronisation sans suppression
-- Ce script corrige les donnees sans violer les contraintes de clé etrangere

-- 1. Identifier TOUTES les contraintes de clé etrangere sur users
SELECT 'CONTRAINTES DE CLE ETRANGERE SUR USERS' as info;
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'users'
  AND tc.table_schema = 'public';

-- 2. Identifier les utilisateurs avec des references (a ne JAMAIS supprimer)
SELECT 'UTILISATEURS AVEC REFERENCES (A CONSERVER)' as info;
SELECT 
  u.id,
  u.email,
  u.nom,
  u.prenom,
  COUNT(DISTINCT p.id) as nb_projets_crees,
  COUNT(DISTINCT t1.id) as nb_taches_assignees,
  COUNT(DISTINCT t2.id) as nb_taches_crees,
  'A CONSERVER' as statut
FROM public.users u
LEFT JOIN public.projects p ON u.id = p.created_by
LEFT JOIN public.tasks t1 ON u.id = t1.assigned_to
LEFT JOIN public.tasks t2 ON u.id = t2.created_by
GROUP BY u.id, u.email, u.nom, u.prenom
HAVING COUNT(DISTINCT p.id) > 0 OR COUNT(DISTINCT t1.id) > 0 OR COUNT(DISTINCT t2.id) > 0
ORDER BY (COUNT(DISTINCT p.id) + COUNT(DISTINCT t1.id) + COUNT(DISTINCT t2.id)) DESC;

-- 3. Identifier les profils en conflit (emails dupliques avec IDs differents)
-- MAIS sans supprimer ceux qui ont des references
SELECT 'PROFILS EN CONFLIT (SAUF AVEC REFERENCES)' as info;
SELECT 
  pu.email,
  pu.id as profile_id,
  au.id as auth_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.projects p WHERE p.created_by = pu.id) THEN 'A des projets - CONSERVER'
    WHEN EXISTS (SELECT 1 FROM public.tasks t WHERE t.assigned_to = pu.id OR t.created_by = pu.id) THEN 'A des taches - CONSERVER'
    WHEN au.id IS NULL THEN 'Profil sans utilisateur auth - SUPPRIMER'
    WHEN pu.id != au.id THEN 'ID different - SUPPRIMER'
    ELSE 'OK'
  END as statut
FROM public.users pu
FULL OUTER JOIN auth.users au ON pu.email = au.email
WHERE (pu.id != au.id OR pu.id IS NULL OR au.id IS NULL)
AND NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.created_by = pu.id)
AND NOT EXISTS (SELECT 1 FROM public.tasks t WHERE t.assigned_to = pu.id OR t.created_by = pu.id);

-- 4. Supprimer SEULEMENT les profils sans references et en conflit
SELECT 'NETTOYAGE DES PROFILS EN CONFLIT (SAUF AVEC REFERENCES)' as info;
DELETE FROM public.users pu
WHERE EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE pu.email = au.email AND pu.id != au.id
)
AND NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.created_by = pu.id)
AND NOT EXISTS (SELECT 1 FROM public.tasks t WHERE t.assigned_to = pu.id OR t.created_by = pu.id);

-- 5. Supprimer SEULEMENT les profils orphelins sans references
SELECT 'NETTOYAGE DES PROFILS ORPHELINS (SAUF AVEC REFERENCES)' as info;
DELETE FROM public.users pu
WHERE NOT EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE pu.id = au.id
)
AND NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.created_by = pu.id)
AND NOT EXISTS (SELECT 1 FROM public.tasks t WHERE t.assigned_to = pu.id OR t.created_by = pu.id);

-- 6. Verifier le nettoyage
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

-- 7. Creer les profils manquants pour les utilisateurs auth
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

-- 8. Synchroniser les metadonnees auth.users avec public.users
SELECT 'SYNCHRONISATION DES METADONNEES AUTH.USERS' as info;
-- Cette etape sera faite par le script Node.js fix-auth-metadata.cjs

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
   OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.assigned_to = u.id OR t.created_by = u.id)
UNION ALL
SELECT 
  'Utilisateurs avec projets' as info,
  COUNT(DISTINCT u.id) as count
FROM public.users u
INNER JOIN public.projects p ON u.id = p.created_by
UNION ALL
SELECT 
  'Utilisateurs avec taches assignees' as info,
  COUNT(DISTINCT u.id) as count
FROM public.users u
INNER JOIN public.tasks t ON u.id = t.assigned_to
UNION ALL
SELECT 
  'Utilisateurs avec taches creees' as info,
  COUNT(DISTINCT u.id) as count
FROM public.users u
INNER JOIN public.tasks t ON u.id = t.created_by;




