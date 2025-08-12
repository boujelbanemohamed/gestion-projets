# 🔄 Synchronisation Bidirectionnelle - Auth.users ↔ Users

## 📋 Vue d'ensemble

Cette plateforme implémente une **synchronisation bidirectionnelle complète** entre :
- **`auth.users`** (Supabase Auth native) - Authentification
- **`users`** (table custom) - Profils étendus avec métadonnées

## 🏗️ Architecture

### Tables impliquées
```sql
-- Table Supabase Auth native
auth.users (id, email, encrypted_password, user_metadata, ...)

-- Table custom étendue
public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'USER',
  fonction VARCHAR(255),
  departement_id INTEGER REFERENCES departments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## 🔄 Mécanismes de synchronisation

### 1. Trigger automatique
```sql
-- Création automatique du profil lors de l'inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 2. Création manuelle via interface
- **Gestion des membres** → Création dans `auth.users` + `users`
- **Inscription** → Création dans `auth.users` + trigger → `users`

### 3. Mise à jour
- **Modification profil** → Synchronisation des deux tables
- **Changement mot de passe** → Mise à jour dans `auth.users`

### 4. Suppression
- **Suppression membre** → Nettoyage des deux tables
- **Suppression compte** → Cascade automatique

## 🛡️ Sécurité (RLS Policies)

### Policies pour la table `users`
```sql
-- Lecture : Tous les utilisateurs authentifiés
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);

-- Mise à jour : Son propre profil
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Création : Son propre profil lors de l'inscription
CREATE POLICY "Authenticated users can create their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Gestion complète : Admins et Super Admins
CREATE POLICY "Admins can manage all users" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
);
```

## 🚀 Fonctionnalités

### Interface utilisateur
- ✅ **Bouton "Synchroniser les utilisateurs"** dans la gestion des membres
- ✅ **Création automatique** des profils manquants
- ✅ **Détection des profils orphelins**
- ✅ **Logs détaillés** de toutes les opérations

### API
- ✅ **`createUser()`** - Création simultanée dans les deux tables
- ✅ **`checkAndFixUserSync()`** - Vérification et correction de la synchronisation
- ✅ **`getAllUsers()`** - Chargement de tous les utilisateurs
- ✅ **Gestion d'erreurs robuste** avec fallbacks

## 📱 Utilisation

### 1. Créer un membre
```typescript
// Via l'interface "Gestion des membres"
// → Création automatique dans auth.users ET users
// → L'utilisateur peut immédiatement se connecter
```

### 2. Synchroniser manuellement
```typescript
// Bouton "Synchroniser les utilisateurs"
// → Vérifie la cohérence entre les deux tables
// → Crée les profils manquants
// → Signale les erreurs éventuelles
```

### 3. Inscription d'un utilisateur
```typescript
// Via l'authentification Supabase
// → Création automatique dans auth.users
// → Trigger → Création automatique dans users
// → L'utilisateur apparaît dans la gestion des membres
```

## 🔧 Déploiement

### 1. Appliquer le schéma
```bash
# Exécuter le script SQL dans Supabase Dashboard
supabase-schema.sql
```

### 2. Vérifier la configuration
```env
VITE_USE_SUPABASE=true
VITE_USE_MOCK_DATA=false
```

### 3. Tester la synchronisation
1. Créer un membre via l'interface
2. Vérifier qu'il peut se connecter
3. Utiliser le bouton de synchronisation si nécessaire

## 🐛 Dépannage

### Erreur 400 sur l'authentification
- ✅ Vérifier que l'utilisateur est "Confirmed" dans Supabase
- ✅ Vérifier que Email/Password est activé
- ✅ Vérifier les variables d'environnement Netlify

### Erreur 406 sur la récupération du profil
- ✅ Utiliser le bouton "Synchroniser les utilisateurs"
- ✅ Vérifier les policies RLS
- ✅ Vérifier que le trigger fonctionne

### Profils manquants
- ✅ Le bouton de synchronisation les créera automatiquement
- ✅ Vérifier les logs dans la console
- ✅ Vérifier les permissions dans Supabase

## 📊 Monitoring

### Logs disponibles
- 🔐 Tentative de connexion
- ✅ Authentification réussie
- ⚠️ Profil non trouvé, création automatique
- 📝 Tentative d'insertion du profil
- ✅ Profil créé avec succès
- 🔄 Synchronisation des utilisateurs

### Métriques
- Nombre d'utilisateurs synchronisés
- Erreurs de synchronisation
- Profils orphelins détectés
- Temps de synchronisation

## 🎯 Avantages

1. **Cohérence des données** - Les deux tables restent toujours alignées
2. **Authentification robuste** - Pas de comptes sans profils
3. **Gestion centralisée** - Interface unifiée pour tous les utilisateurs
4. **Sécurité renforcée** - Policies RLS appropriées
5. **Maintenance simplifiée** - Synchronisation automatique
6. **Développement agile** - Support des données mockées et Supabase

## 🔮 Évolutions futures

- [ ] **Webhooks** pour synchronisation en temps réel
- [ ] **Audit trail** des modifications
- [ ] **Synchronisation bidirectionnelle** avec d'autres systèmes
- [ ] **API GraphQL** pour requêtes complexes
- [ ] **Cache intelligent** pour améliorer les performances
