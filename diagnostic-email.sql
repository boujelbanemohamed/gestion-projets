-- Diagnostic precis pour l'email mohamed.boujelbane@icloud.com
-- Ce script analyse exactement ce qui se passe avec cet email

-- 1. Voir TOUS les enregistrements avec cet email dans public.users
SELECT 'ENREGISTREMENTS AVEC mohamed.boujelbane@icloud.com DANS PUBLIC.USERS' as info;
SELECT 
  id,
  email,
  nom,
  prenom,
  role,
  fonction,
  department_id,
  created_at,
  updated_at
FROM public.users 
WHERE email = 'mohamed.boujelbane@icloud.com'
ORDER BY created_at;

-- 2. Voir TOUS les enregistrements avec cet email dans auth.users
SELECT 'ENREGISTREMENTS AVEC mohamed.boujelbane@icloud.com DANS AUTH.USERS' as info;
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'mohamed.boujelbane@icloud.com'
ORDER BY created_at;

-- 3. Voir les references pour chaque ID dans public.users
SELECT 'REFERENCES POUR CHAQUE ID DANS PUBLIC.USERS' as info;
SELECT 
  u.id,
  u.email,
  u.nom,
  u.prenom,
  COUNT(DISTINCT p.id) as nb_projets_crees,
  COUNT(DISTINCT t1.id) as nb_taches_assignees,
  COUNT(DISTINCT t2.id) as nb_taches_crees,
  CASE 
    WHEN COUNT(DISTINCT p.id) > 0 OR COUNT(DISTINCT t1.id) > 0 OR COUNT(DISTINCT t2.id) > 0 
    THEN 'A DES REFERENCES - CONSERVER'
    ELSE 'SANS REFERENCES - PEUT SUPPRIMER'
  END as statut
FROM public.users u
LEFT JOIN public.projects p ON u.id = p.created_by
LEFT JOIN public.tasks t1 ON u.id = t1.assigned_to
LEFT JOIN public.tasks t2 ON u.id = t2.created_by
WHERE u.email = 'mohamed.boujelbane@icloud.com'
GROUP BY u.id, u.email, u.nom, u.prenom
ORDER BY u.created_at;

-- 4. Voir les projets crees par ces utilisateurs
SELECT 'PROJETS CREES PAR CES UTILISATEURS' as info;
SELECT 
  p.id as projet_id,
  p.nom as projet_nom,
  p.created_by,
  u.email,
  u.nom,
  u.prenom
FROM public.projects p
INNER JOIN public.users u ON p.created_by = u.id
WHERE u.email = 'mohamed.boujelbane@icloud.com'
ORDER BY p.created_at;

-- 5. Voir les taches assignees a ces utilisateurs
SELECT 'TACHES ASSIGNEES A CES UTILISATEURS' as info;
SELECT 
  t.id as tache_id,
  t.titre as tache_titre,
  t.assigned_to,
  u.email,
  u.nom,
  u.prenom
FROM public.tasks t
INNER JOIN public.users u ON t.assigned_to = u.id
WHERE u.email = 'mohamed.boujelbane@icloud.com'
ORDER BY t.created_at;

-- 6. Voir les taches creees par ces utilisateurs
SELECT 'TACHES CREEES PAR CES UTILISATEURS' as info;
SELECT 
  t.id as tache_id,
  t.titre as tache_titre,
  t.created_by,
  u.email,
  u.nom,
  u.prenom
FROM public.tasks t
INNER JOIN public.users u ON t.created_by = u.id
WHERE u.email = 'mohamed.boujelbane@icloud.com'
ORDER BY t.created_at;

-- 7. Recommandation de nettoyage
SELECT 'RECOMMANDATION DE NETTOYAGE' as info;
SELECT 
  'Pour l email mohamed.boujelbane@icloud.com :' as info,
  CASE 
    WHEN COUNT(*) = 1 THEN 'Un seul enregistrement - OK'
    WHEN COUNT(*) > 1 THEN 'Plusieurs enregistrements - NETTOYAGE NECESSAIRE'
    ELSE 'Aucun enregistrement'
  END as statut
FROM public.users 
WHERE email = 'mohamed.boujelbane@icloud.com';


