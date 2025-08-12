# 🔄 Guide de Synchronisation des Utilisateurs - Version 2.0

## 📋 Vue d'ensemble

Ce document décrit l'architecture de synchronisation bidirectionnelle entre les tables `auth.users` (Supabase Auth) et `public.users` (profil étendu) de la plateforme de gestion de projets.

## 🏗️ Architecture de Synchronisation

### Tables impliquées

1. **`auth.users`** (Supabase Auth)
   - Gère l'authentification et les sessions
   - Stocke les métadonnées utilisateur dans `user_metadata`
   - Champs : `id`, `email`, `user_metadata`, etc.

2. **`public.users`** (Table personnalisée)
   - Stocke les informations de profil étendues
   - Champs : `id`, `email`, `nom`, `prenom`, `role`, `fonction`, `departement_id`, etc.

### Mécanismes de synchronisation

#### 1. Synchronisation automatique lors de la création
- **Trigger PostgreSQL** : `on_auth_user_created`
- **Fonction** : `handle_new_user()`
- **Action** : Crée automatiquement un profil dans `public.users` lors de l'inscription

#### 2. Synchronisation bidirectionnelle lors des mises à jour
- **Fonction** : `updateUser()` dans `supabaseApi.ts`
- **Action** : Met à jour simultanément les deux tables
- **Gestion des erreurs** : Arrêt de l'opération si la synchronisation échoue

#### 3. Vérification et correction automatique
- **Fonction** : `checkAndFixUserSync()`
- **Action** : Détecte et corrige automatiquement les désynchronisations
- **Interface** : Bouton "Synchroniser les utilisateurs" dans la gestion des membres

## 🔧 Implémentation Technique

### 1. Types TypeScript unifiés

```typescript
// Types unifiés pour éviter les incohérences
export interface User {
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'; // Uniformisé
  // ... autres champs
}

export interface AuthUser {
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'; // Même énumération
  // ... autres champs
}
```

### 2. Service de synchronisation

```typescript
// src/services/supabaseApi.ts
class SupabaseApiService {
  // Création avec synchronisation parfaite
  async createUser(userData): Promise<{ user: AuthUser; token: string }> {
    // 1. Créer dans auth.users avec métadonnées complètes
    // 2. Créer dans public.users
    // 3. Vérifier et corriger la synchronisation
    // 4. Retourner l'utilisateur synchronisé
  }

  // Mise à jour bidirectionnelle
  async updateUser(id: string, updates: Partial<AuthUser>): Promise<AuthUser> {
    // 1. Mettre à jour public.users
    // 2. Synchroniser les métadonnées dans auth.users
    // 3. Gérer les erreurs de synchronisation
  }

  // Vérification et correction automatique
  async checkAndFixUserSync(): Promise<{ fixed: number; errors: string[] }> {
    // 1. Analyser les deux tables
    // 2. Créer les profils manquants
    // 3. Synchroniser les métadonnées désynchronisées
    // 4. Retourner le rapport de correction
  }
}
```

### 3. Gestion des erreurs robuste

```typescript
// Gestion des erreurs avec logs détaillés
try {
  await supabase.auth.admin.updateUserById(id, { user_metadata: updates });
  console.log('✅ Métadonnées auth.users mises à jour avec succès');
} catch (error) {
  console.error('❌ Erreur mise à jour métadonnées auth.users:', error);
  throw new Error(`Erreur synchronisation auth.users: ${error.message}`);
}
```

## 📊 Politiques RLS (Row Level Security)

### Table `public.users`

```sql
-- Lecture : Tous les utilisateurs peuvent voir tous les profils
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);

-- Mise à jour : Utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Création : Utilisateurs authentifiés peuvent créer leur profil
CREATE POLICY "Authenticated users can create their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Gestion : Admins peuvent gérer tous les utilisateurs
CREATE POLICY "Admins can manage all users" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
);
```

## 🚀 Utilisation

### 1. Création d'un membre

```typescript
// Dans App.tsx
const handleCreateMember = async (memberData) => {
  try {
    const { user, token } = await supabaseApiService.createUser({
      email: memberData.email,
      password: memberData.mot_de_passe || 'password123',
      nom: memberData.nom,
      prenom: memberData.prenom,
      role: memberData.role,
      fonction: memberData.fonction,
      departement_id: undefined,
    });
    
    // L'utilisateur est automatiquement synchronisé
    setUsers(prev => [...prev, newMember]);
  } catch (error) {
    console.error('Erreur création membre:', error);
  }
};
```

### 2. Mise à jour d'un membre

```typescript
// Dans App.tsx
const handleUpdateMember = async (id: string, memberData) => {
  try {
    // Utilise updateUser qui synchronise automatiquement les deux tables
    await supabaseApiService.updateUser(id, memberData);
    
    // Mise à jour de l'état local
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...memberData, id, created_at: user.created_at } : user
    ));
  } catch (error) {
    console.error('Erreur mise à jour membre:', error);
  }
};
```

### 3. Synchronisation manuelle

```typescript
// Dans App.tsx
const syncUsers = async () => {
  try {
    const result = await supabaseApiService.checkAndFixUserSync();
    console.log(`${result.fixed} problèmes résolus, ${result.errors.length} erreurs`);
    
    // Recharger les utilisateurs
    await loadUsers();
  } catch (error) {
    console.error('Erreur synchronisation:', error);
  }
};
```

## 🧪 Tests et Validation

### 1. Script de test automatisé

```bash
# Exécuter le test de synchronisation
./test-sync-users.bat

# Ou directement avec Node.js
node test-sync-users.js
```

### 2. Vérification manuelle

1. **Créer un membre** dans l'interface
2. **Vérifier la connexion** avec ce compte
3. **Modifier le rôle** et vérifier la synchronisation
4. **Utiliser le bouton "Synchroniser les utilisateurs"**
5. **Vérifier les logs** dans la console du navigateur

### 3. Vérification dans Supabase

1. **Dashboard Supabase** → Authentication → Users
2. **Vérifier les métadonnées** d'un utilisateur
3. **Dashboard Supabase** → Table Editor → users
4. **Comparer les données** avec auth.users

## 🔍 Dépannage

### Problèmes courants

1. **Erreur 400 lors de la connexion**
   - Vérifier que l'utilisateur est confirmé dans Supabase
   - Vérifier les paramètres d'authentification du projet

2. **Erreur 406 lors de la récupération du profil**
   - Utiliser le bouton "Synchroniser les utilisateurs"
   - Vérifier que le profil existe dans `public.users`

3. **Rôle non synchronisé**
   - Vérifier que `updateUser` est utilisé pour les mises à jour
   - Exécuter `checkAndFixUserSync` pour corriger

### Logs de débogage

```typescript
// Activer les logs détaillés
console.log('🔄 Mise à jour de l\'utilisateur:', id, 'avec les données:', updates);
console.log('📋 Métadonnées auth.users:', user.user_metadata);
console.log('✅ Synchronisation complète réussie pour l\'utilisateur:', id);
```

## 📈 Avantages de cette Architecture

1. **Synchronisation automatique** : Pas d'intervention manuelle requise
2. **Cohérence garantie** : Les deux tables restent synchronisées
3. **Gestion d'erreurs robuste** : Détection et correction automatiques
4. **Performance optimisée** : Pas de requêtes redondantes
5. **Maintenance simplifiée** : Un seul point de vérité pour les données

## 🔮 Évolutions Futures

1. **Synchronisation en temps réel** avec les webhooks Supabase
2. **Historique des modifications** pour audit
3. **Synchronisation des permissions** basées sur les rôles
4. **Backup automatique** des métadonnées critiques

---

## 📞 Support

Pour toute question ou problème de synchronisation :
1. Vérifiez les logs de la console
2. Exécutez `test-sync-users.bat`
3. Utilisez le bouton "Synchroniser les utilisateurs"
4. Consultez ce guide de dépannage
