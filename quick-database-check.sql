-- 🔍 DIAGNOSTIC RAPIDE - Table users
-- Exécutez ces requêtes une par une dans Supabase SQL Editor

-- 1. Structure de la table users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Contraintes sur la colonne role
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE check_clause LIKE '%role%';

-- 3. Valeurs actuelles dans la colonne role
SELECT DISTINCT role, COUNT(*) as count
FROM users 
GROUP BY role
ORDER BY role;

-- 4. Politiques RLS sur la table users
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 5. Test de mise à jour (remplacez [USER_ID] par un vrai ID)
-- SELECT id, email, role FROM users LIMIT 5; -- D'abord, voir les utilisateurs disponibles
-- UPDATE users SET role = 'MANAGER' WHERE id = '[USER_ID]' RETURNING *;

-- 6. Vérifier les permissions de l'utilisateur connecté
SELECT current_user, session_user;

-- 7. Vérifier si RLS est activé sur la table users
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';
