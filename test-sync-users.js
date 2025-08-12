const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (remplacez par vos vraies clés)
const supabaseUrl = 'https://obdadipsbbrlwetkuyui.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGFkaXBzYmJybHdldGt1eXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQ4ODEyMywiZXhwIjoyMDcwMDY0MTIzfQ.YVuesp3wprnLPM8I1gTAEqhkMCyUoL5E5sedHVJD_ZY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testUserSynchronization() {
  console.log('🧪 Test de synchronisation des utilisateurs...\n');

  try {
    // 1. Récupérer tous les utilisateurs auth
    console.log('📋 1. Récupération des utilisateurs auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erreur auth.users:', authError);
      return;
    }

    console.log(`✅ ${authUsers.users.length} utilisateurs trouvés dans auth.users`);

    // 2. Récupérer tous les profils
    console.log('\n📋 2. Récupération des profils public.users...');
    const { data: profileUsers, error: profileError } = await supabase
      .from('users')
      .select('*');

    if (profileError) {
      console.error('❌ Erreur public.users:', profileError);
      return;
    }

    console.log(`✅ ${profileUsers.length} profils trouvés dans public.users`);

    // 3. Analyser la synchronisation
    console.log('\n🔍 3. Analyse de la synchronisation...');

    const authUserIds = new Set(authUsers.users.map(u => u.id));
    const profileUserIds = new Set(profileUsers.map(u => u.id));

    // Utilisateurs auth sans profil
    const authWithoutProfile = authUsers.users.filter(u => !profileUserIds.has(u.id));

    // Profils sans utilisateur auth
    const profileWithoutAuth = profileUsers.filter(u => !authUserIds.has(u.id));

    // Utilisateurs avec métadonnées manquantes ou désynchronisées
    const usersWithSyncIssues = [];
    const profileMap = new Map(profileUsers.map(p => [p.id, p]));

    for (const authUser of authUsers.users) {
      const profile = profileMap.get(authUser.id);
      if (profile) {
        const metadata = authUser.user_metadata || {};
        const hasIssues = (
          metadata.nom !== profile.nom ||
          metadata.prenom !== profile.prenom ||
          metadata.role !== profile.role ||
          metadata.fonction !== profile.fonction ||
          metadata.departement_id !== profile.departement_id
        );

        if (hasIssues) {
          usersWithSyncIssues.push({
            authUser,
            profile,
            issues: {
              nom: metadata.nom !== profile.nom ? { auth: metadata.nom, profile: profile.nom } : null,
              prenom: metadata.prenom !== profile.prenom ? { auth: metadata.prenom, profile: profile.prenom } : null,
              role: metadata.role !== profile.role ? { auth: metadata.role, profile: profile.role } : null,
              fonction: metadata.fonction !== profile.fonction ? { auth: metadata.fonction, profile: profile.fonction } : null,
              departement_id: metadata.departement_id !== profile.departement_id ? { auth: metadata.departement_id, profile: profile.departement_id } : null,
            }
          });
        }
      }
    }

    console.log(`📊 Résultats de l'analyse:`);
    console.log(`   - Utilisateurs auth sans profil: ${authWithoutProfile.length}`);
    console.log(`   - Profils sans utilisateur auth: ${profileWithoutAuth.length}`);
    console.log(`   - Utilisateurs avec problèmes de synchronisation: ${usersWithSyncIssues.length}`);

    // 4. Afficher les détails des problèmes
    if (authWithoutProfile.length > 0) {
      console.log('\n⚠️ Utilisateurs auth sans profil:');
      authWithoutProfile.forEach(u => {
        console.log(`   - ${u.email} (ID: ${u.id})`);
        console.log(`     Métadonnées:`, u.user_metadata);
      });
    }

    if (profileWithoutAuth.length > 0) {
      console.log('\n⚠️ Profils sans utilisateur auth:');
      profileWithoutAuth.forEach(u => {
        console.log(`   - ${u.email} (ID: ${u.id})`);
      });
    }

    if (usersWithSyncIssues.length > 0) {
      console.log('\n⚠️ Utilisateurs avec problèmes de synchronisation:');
      usersWithSyncIssues.forEach(({ authUser, profile, issues }) => {
        console.log(`   - ${authUser.email} (ID: ${authUser.id})`);
        console.log(`     Métadonnées auth:`, authUser.user_metadata);
        console.log(`     Profil public:`, {
          nom: profile.nom,
          prenom: profile.prenom,
          role: profile.role,
          fonction: profile.fonction,
          departement_id: profile.departement_id
        });

        // Afficher les différences spécifiques
        Object.entries(issues).forEach(([field, diff]) => {
          if (diff) {
            console.log(`       ${field}: auth="${diff.auth}" vs profile="${diff.profile}"`);
          }
        });
      });
    }

    // 5. Suggestions de correction
    console.log('\n💡 Suggestions de correction:');

    if (authWithoutProfile.length > 0) {
      console.log('   - Exécuter la fonction checkAndFixUserSync() depuis l\'interface');
      console.log('   - Ou créer manuellement les profils manquants');
    }

    if (usersWithSyncIssues.length > 0) {
      console.log('   - Utiliser la fonction updateUser() pour synchroniser les métadonnées');
      console.log('   - Ou exécuter checkAndFixUserSync() pour une correction automatique');
    }

    // 6. Test de création d'un utilisateur de test
    console.log('\n🧪 4. Test de création d\'un utilisateur de test...');

    const testUserData = {
      email: `test.sync.${Date.now()}@example.com`,
      password: 'TestPassword123!',
      nom: 'Test',
      prenom: 'Sync',
      role: 'USER',
      fonction: 'Testeur'
    };

    console.log('   Création de l\'utilisateur de test...');
    const { data: testAuthData, error: testAuthError } = await supabase.auth.admin.createUser({
      email: testUserData.email,
      password: testUserData.password,
      user_metadata: {
        nom: testUserData.nom,
        prenom: testUserData.prenom,
        role: testUserData.role,
        fonction: testUserData.fonction
      }
    });

    if (testAuthError) {
      console.error('   ❌ Erreur création utilisateur de test:', testAuthError);
    } else {
      console.log('   ✅ Utilisateur de test créé dans auth.users');
      console.log('   📋 Métadonnées créées:', testAuthData.user.user_metadata);

      // Vérifier si le profil a été créé automatiquement
      setTimeout(async () => {
        const { data: testProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', testAuthData.user.id)
          .single();

        if (testProfile) {
          console.log('   ✅ Profil créé automatiquement dans public.users');
          console.log('   📋 Profil créé:', {
            nom: testProfile.nom,
            prenom: testProfile.prenom,
            role: testProfile.role,
            fonction: testProfile.fonction
          });
        } else {
          console.log('   ⚠️ Profil non créé automatiquement');
        }

        // Nettoyer l'utilisateur de test
        await supabase.auth.admin.deleteUser(testAuthData.user.id);
        console.log('   🧹 Utilisateur de test supprimé');
      }, 2000);
    }

    console.log('\n✅ Test de synchronisation terminé !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testUserSynchronization();
