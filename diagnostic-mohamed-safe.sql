-- DIAGNOSTIC SÉCURISÉ POUR MOHAMED.BOUJELBANE@ICLOUD.COM
-- Ce script analyse le problème SANS RIEN SUPPRIMER

-- ========================================
-- 1. ANALYSE COMPLÈTE DE L'UTILISATEUR
-- ========================================

-- Voir l'état actuel de mohamed.boujelbane@icloud.com
SELECT '=== ANALYSE COMPLÈTE DE MOHAMED ===' as info;

-- Dans auth.users
SELECT 
  'Auth' as source,
  id,
  email,
  raw_user_meta_data,
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'mohamed.boujelbane@icloud.com';

-- Dans public.users
SELECT 
  'Public' as source,
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
WHERE email = 'mohamed.boujelbane@icloud.com';

-- ========================================
-- 2. ANALYSE DES RÉFÉRENCES (TRÈS IMPORTANT)
-- ========================================

-- Voir TOUTES les références de cet utilisateur
SELECT '=== RÉFÉRENCES DE MOHAMED ===' as info;

-- Projets créés par mohamed
SELECT 
  'Projets créés' as type,
  p.id,
  p.nom,
  p.created_by,
  CASE 
    WHEN p.created_by = au.id THEN 'ID AUTH - OK'
    WHEN p.created_by = pu.id THEN 'ID PUBLIC - À CORRIGER'
    ELSE 'ID INCONNU - PROBLÈME'
  END as statut_id
FROM public.projects p
LEFT JOIN auth.users au ON au.email = 'mohamed.boujelbane@icloud.com'
LEFT JOIN public.users pu ON pu.email = 'mohamed.boujelbane@icloud.com'
WHERE p.created_by IN (au.id, pu.id);

-- Tâches assignées à mohamed
SELECT 
  'Tâches assignées' as type,
  t.id,
  t.titre,
  t.assigned_to,
  CASE 
    WHEN t.assigned_to = au.id THEN 'ID AUTH - OK'
    WHEN t.assigned_to = pu.id THEN 'ID PUBLIC - À CORRIGER'
    ELSE 'ID INCONNU - PROBLÈME'
  END as statut_id
FROM public.tasks t
LEFT JOIN auth.users au ON au.email = 'mohamed.boujelbane@icloud.com'
LEFT JOIN public.users pu ON pu.email = 'mohamed.boujelbane@icloud.com'
WHERE t.assigned_to IN (au.id, pu.id);

-- Tâches créées par mohamed
SELECT 
  'Tâches créées' as type,
  t.id,
  t.titre,
  t.created_by,
  CASE 
    WHEN t.created_by = au.id THEN 'ID AUTH - OK'
    WHEN t.created_by = pu.id THEN 'ID PUBLIC - À CORRIGER'
    ELSE 'ID INCONNU - PROBLÈME'
  END as statut_id
FROM public.tasks t
LEFT JOIN auth.users au ON au.email = 'mohamed.boujelbane@icloud.com'
LEFT JOIN public.users pu ON pu.email = 'mohamed.boujelbane@icloud.com'
WHERE t.created_by IN (au.id, pu.id);

-- ========================================
-- 3. ANALYSE DES DOUBLONS ET INCOHÉRENCES
-- ========================================

-- Voir s'il y a d'autres doublons
SELECT '=== ANALYSE DES DOUBLONS ===' as info;

-- Doublons dans public.users
SELECT 
  email,
  COUNT(*) as occurrences,
  array_agg(id ORDER BY created_at) as ids,
  array_agg(created_at ORDER BY created_at) as dates
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email;

-- Incohérences d'ID entre auth et public
SELECT '=== INCOHÉRENCES D ID ===' as info;
SELECT 
  au.email,
  au.id as auth_id,
  pu.id as public_id,
  CASE 
    WHEN au.id = pu.id THEN 'IDs CORRESPONDENT'
    ELSE 'IDs DIFFÉRENTS - CORRECTION NÉCESSAIRE'
  END as statut
FROM auth.users au
INNER JOIN public.users pu ON au.email = pu.email
WHERE au.id != pu.id;

-- ========================================
-- 4. STRATÉGIE DE CORRECTION RECOMMANDÉE
-- ========================================

SELECT '=== STRATÉGIE DE CORRECTION ===' as info;
SELECT 
  'NE SUPPRIMEZ RIEN MANUELLEMENT !' as warning,
  'Utilisez le script de correction automatique' as recommendation;

-- ========================================
-- 5. VÉRIFICATION DE LA SÉCURITÉ
-- ========================================

-- Vérifier qu'on peut supprimer en toute sécurité
SELECT '=== VÉRIFICATION SÉCURITÉ ===' as info;

-- Utilisateurs avec des références (NE PAS SUPPRIMER)
SELECT 
  'UTILISATEURS AVEC RÉFÉRENCES - NE PAS SUPPRIMER' as warning,
  u.email,
  COUNT(DISTINCT p.id) as projets_crees,
  COUNT(DISTINCT t1.id) as taches_assignees,
  COUNT(DISTINCT t2.id) as taches_creees
FROM public.users u
LEFT JOIN public.projects p ON p.created_by = u.id
LEFT JOIN public.tasks t1 ON t1.assigned_to = u.id
LEFT JOIN public.tasks t2 ON t2.created_by = u.id
WHERE u.email = 'mohamed.boujelbane@icloud.com'
GROUP BY u.email;

-- ========================================
-- 6. RÉSUMÉ ET RECOMMANDATIONS
-- ========================================

SELECT '=== RÉSUMÉ ET RECOMMANDATIONS ===' as info;
SELECT 
  '1. ANALYSEZ les résultats ci-dessus' as action,
  '2. IDENTIFIEZ les références FK' as details,
  '3. UTILISEZ le script de correction automatique' as next_step,
  '4. NE SUPPRIMEZ RIEN MANUELLEMENT' as warning;




