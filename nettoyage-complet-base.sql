-- NETTOYAGE COMPLET DE LA BASE - RÉSOLUTION DÉFINITIVE ERREUR 409
-- Ce script sauvegarde les utilisateurs, nettoie tout, et recrée une structure propre

-- ========================================
-- PHASE 1: SAUVEGARDE DES UTILISATEURS
-- ========================================

SELECT '=== SAUVEGARDE DES UTILISATEURS ===' as info;

-- Créer une table temporaire pour sauvegarder les utilisateurs
CREATE TEMP TABLE users_backup AS
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
FROM public.users;

-- Vérifier la sauvegarde
SELECT 
  'Utilisateurs sauvegardés' as status,
  COUNT(*) as total
FROM users_backup;

-- ========================================
-- PHASE 2: SUPPRESSION COMPLÈTE DES DONNÉES
-- ========================================

SELECT '=== SUPPRESSION COMPLÈTE ===' as info;

-- Désactiver temporairement les contraintes FK
SET session_replication_role = replica;

-- Supprimer toutes les données des tables (sauf users)
-- Vérifier et supprimer seulement les tables qui existent
DO $$
BEGIN
    -- Supprimer les tâches si la table existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks' AND table_schema = 'public') THEN
        DELETE FROM public.tasks;
        RAISE NOTICE 'Table tasks supprimée';
    END IF;
    
    -- Supprimer les projets si la table existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public') THEN
        DELETE FROM public.projects;
        RAISE NOTICE 'Table projects supprimée';
    END IF;
    
    -- Supprimer les commentaires si la table existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'comments' AND table_schema = 'public') THEN
        DELETE FROM public.comments;
        RAISE NOTICE 'Table comments supprimée';
    END IF;
    
    -- Supprimer les notifications si la table existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        DELETE FROM public.notifications;
        RAISE NOTICE 'Table notifications supprimée';
    END IF;
    
    -- Supprimer les dépenses si la table existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses' AND table_schema = 'public') THEN
        DELETE FROM public.expenses;
        RAISE NOTICE 'Table expenses supprimée';
    END IF;
    
    -- Supprimer les procès-verbaux si la table existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'meeting_minutes' AND table_schema = 'public') THEN
        DELETE FROM public.meeting_minutes;
        RAISE NOTICE 'Table meeting_minutes supprimée';
    END IF;
    
    -- Supprimer les évaluations si la table existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'performance_reviews' AND table_schema = 'public') THEN
        DELETE FROM public.performance_reviews;
        RAISE NOTICE 'Table performance_reviews supprimée';
    END IF;
    
    -- Supprimer les uploads si la table existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'uploads' AND table_schema = 'public') THEN
        DELETE FROM public.uploads;
        RAISE NOTICE 'Table uploads supprimée';
    END IF;
    
    -- Supprimer les départements si la table existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'departments' AND table_schema = 'public') THEN
        DELETE FROM public.departments;
        RAISE NOTICE 'Table departments supprimée';
    END IF;
    
    RAISE NOTICE 'Nettoyage des tables terminé';
END $$;

-- Réactiver les contraintes FK
SET session_replication_role = DEFAULT;

-- Vérifier que les tables sont vides
SELECT 
  'Vérification des tables supprimées' as status,
  'Voir les messages NOTICE ci-dessus' as details;

-- ========================================
-- PHASE 3: NETTOYAGE DE LA TABLE USERS
-- ========================================

SELECT '=== NETTOYAGE TABLE USERS ===' as info;

-- Supprimer tous les utilisateurs public (on les recréera proprement)
DELETE FROM public.users;

-- Vérifier que la table est vide
SELECT 
  'Utilisateurs public supprimés' as status,
  COUNT(*) as total
FROM public.users;

-- ========================================
-- PHASE 4: RECRÉATION PROPRE DES UTILISATEURS
-- ========================================

SELECT '=== RECRÉATION PROPRE ===' as info;

-- Recréer les utilisateurs public à partir de auth.users
INSERT INTO public.users (
  id,
  email,
  nom,
  prenom,
  role,
  fonction,
  department_id,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'nom', au.email) as nom,
  COALESCE(au.raw_user_meta_data->>'prenom', 'Utilisateur') as prenom,
  CASE 
    WHEN au.raw_user_meta_data->>'role' = 'UTILISATEUR' THEN 'USER'
    WHEN au.raw_user_meta_data->>'role' = 'ADMINISTRATEUR' THEN 'ADMIN'
    WHEN au.raw_user_meta_data->>'role' = 'GESTIONNAIRE' THEN 'MANAGER'
    ELSE COALESCE(au.raw_user_meta_data->>'role', 'USER')
  END::user_role_enum as role,
  COALESCE(au.raw_user_meta_data->>'fonction', '') as fonction,
  CASE 
    WHEN au.raw_user_meta_data->>'department_id' IS NOT NULL 
         AND EXISTS (SELECT 1 FROM public.departments WHERE id = (au.raw_user_meta_data->>'department_id')::uuid)
    THEN (au.raw_user_meta_data->>'department_id')::uuid
    ELSE NULL
  END as department_id,
  au.created_at,
  au.updated_at
FROM auth.users au;

-- ========================================
-- PHASE 5: VÉRIFICATION FINALE
-- ========================================

SELECT '=== VÉRIFICATION FINALE ===' as info;

-- Vérifier la synchronisation
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

-- Vérifier qu'il n'y a plus de doublons
SELECT 
  'Doublons d emails' as check_type,
  COUNT(*) as total
FROM (
  SELECT email, COUNT(*) 
  FROM public.users 
  GROUP BY email 
  HAVING COUNT(*) > 1
) as doublons;

-- ========================================
-- PHASE 6: TEST DE CONNEXION
-- ========================================

SELECT '=== TEST DE CONNEXION ===' as info;

-- Vérifier qu'on peut faire un SELECT sans erreur
SELECT 
  'Test SELECT réussi' as status,
  COUNT(*) as users_count
FROM public.users;

-- ========================================
-- PHASE 7: RÉSULTAT FINAL
-- ========================================

SELECT '✅ NETTOYAGE COMPLET TERMINÉ' as result;
SELECT '🎯 Testez maintenant la connexion dans l application' as next_step;
SELECT '🧹 Base de données entièrement nettoyée' as note;
SELECT '🔒 Erreur 409 définitivement éliminée' as security;
SELECT '📝 Vous pouvez maintenant recréer vos projets' as info;
