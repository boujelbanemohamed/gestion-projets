-- Script de verification de la structure de la table users
-- Ce script nous montre exactement quelles colonnes existent

-- 1. Voir toutes les colonnes de la table users
SELECT 'COLONNES DE LA TABLE USERS' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Voir quelques exemples de donnees
SELECT 'EXEMPLES DE DONNEES' as info;
SELECT * FROM public.users LIMIT 3;
