-- VÉRIFICATION DE L'EXISTENCE DES TABLES
-- Ce script vérifie quelles tables existent dans votre base de données

-- ========================================
-- 1. VÉRIFICATION DES TABLES AUTH
-- ========================================

SELECT '=== TABLES AUTH ===' as info;

-- Vérifier si auth.users existe
SELECT 
  'auth.users' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') 
    THEN 'EXISTE' 
    ELSE 'N EXISTE PAS' 
  END as statut;

-- ========================================
-- 2. VÉRIFICATION DES TABLES PUBLIC
-- ========================================

SELECT '=== TABLES PUBLIC ===' as info;

-- Vérifier toutes les tables public
SELECT 
  table_name,
  'EXISTE' as statut
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'projects', 'tasks', 'departments')
ORDER BY table_name;

-- ========================================
-- 3. VÉRIFICATION DES TABLES MANQUANTES
-- ========================================

SELECT '=== TABLES MANQUANTES ===' as info;

-- Voir quelles tables des scripts précédents essaient d'utiliser
SELECT 
  'users' as table_requise,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') 
    THEN 'EXISTE' 
    ELSE 'MANQUANTE - CRÉER AVANT' 
  END as statut
UNION ALL
SELECT 
  'projects' as table_requise,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') 
    THEN 'EXISTE' 
    ELSE 'MANQUANTE - CRÉER AVANT' 
  END as statut
UNION ALL
SELECT 
  'tasks' as table_requise,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') 
    THEN 'EXISTE' 
    ELSE 'MANQUANTE - CRÉER AVANT' 
  END as statut
UNION ALL
SELECT 
  'departments' as table_requise,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'departments') 
    THEN 'EXISTE' 
    ELSE 'MANQUANTE - CRÉER AVANT' 
  END as statut;

-- ========================================
-- 4. VÉRIFICATION DES SCHÉMAS
-- ========================================

SELECT '=== SCHÉMAS DISPONIBLES ===' as info;

-- Voir tous les schémas disponibles
SELECT 
  schema_name,
  'DISPONIBLE' as statut
FROM information_schema.schemata
WHERE schema_name IN ('public', 'auth', 'information_schema')
ORDER BY schema_name;

-- ========================================
-- 5. VÉRIFICATION DES TYPES ENUM
-- ========================================

SELECT '=== TYPES ENUM ===' as info;

-- Vérifier si user_role_enum existe
SELECT 
  'user_role_enum' as type_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') 
    THEN 'EXISTE' 
    ELSE 'MANQUANT - CRÉER AVANT' 
  END as statut;

-- ========================================
-- 6. RÉSUMÉ ET ACTIONS REQUISES
-- ========================================

SELECT '=== RÉSUMÉ ET ACTIONS ===' as info;

-- Compter les tables existantes
SELECT 
  'Tables public existantes' as info,
  COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'projects', 'tasks', 'departments');

-- Recommandations
SELECT 
  '1. Vérifiez que toutes les tables existent' as action,
  '2. Si des tables manquent, créez-les d abord' as details,
  '3. Puis exécutez les scripts de synchronisation' as next_step;




