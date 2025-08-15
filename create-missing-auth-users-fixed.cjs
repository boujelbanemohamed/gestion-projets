const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase ACTUALISÉE
const supabaseUrl = 'https://obdadipsbbrlwetkuyui.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGFkaXBzYmJybHdldGt1eXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQ4ODEyMywiZXhwIjoyMDcwMDY0MTIzfQ.YVuesp3wprnLPM8I1gTAEqhkMCyUoL5E5sedHVJD_ZY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingAuthUsers() {
  console.log('🚀 Début de la création des utilisateurs auth manquants...\n');

  try {
    // 1. Récupérer tous les utilisateurs de public.users
    console.log('📋 Récupération des utilisateurs de public.users...');
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*');

    if (publicError) {
      throw new Error(`Erreur lors de la récupération des utilisateurs public: ${publicError.message}`);
    }

    console.log(`✅ ${publicUsers.length} utilisateurs trouvés dans public.users\n`);

    // 2. Récupérer tous les utilisateurs de auth.users
    console.log('🔐 Récupération des utilisateurs de auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      throw new Error(`Erreur lors de la récupération des utilisateurs auth: ${authError.message}`);
    }

    console.log(`✅ ${authUsers.users.length} utilisateurs trouvés dans auth.users\n`);

    // 3. Identifier les utilisateurs manquants dans auth.users
    const publicEmails = publicUsers.map(u => u.email);
    const authEmails = authUsers.users.map(u => u.email);
    
    const missingInAuth = publicUsers.filter(pu => !authEmails.includes(pu.email));
    
    console.log(`🔍 ${missingInAuth.length} utilisateurs trouvés uniquement dans public.users\n`);

    if (missingInAuth.length === 0) {
      console.log('✅ Tous les utilisateurs sont déjà synchronisés !');
      return;
    }

    // 4. Créer les utilisateurs manquants dans auth.users
    console.log('👥 Création des utilisateurs manquants dans auth.users...\n');

    for (const user of missingInAuth) {
      try {
        console.log(`📝 Création de l'utilisateur: ${user.email}`);
        
        // Créer l'utilisateur avec un mot de passe temporaire
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'TempPassword123!', // Mot de passe temporaire
          email_confirm: true,
          user_metadata: {
            nom: user.nom || user.email.split('@')[0],
            prenom: user.prenom || 'Utilisateur',
            role: user.role || 'USER',
            fonction: user.fonction || '',
            department_id: user.department_id || null
          }
        });

        if (createError) {
          console.log(`❌ Erreur lors de la création de ${user.email}: ${createError.message}`);
          continue;
        }

        console.log(`✅ Utilisateur créé: ${user.email} (ID: ${newUser.user.id})`);
        
        // Mettre à jour l'ID dans public.users pour qu'il corresponde
        const { error: updateError } = await supabase
          .from('users')
          .update({ id: newUser.user.id })
          .eq('email', user.email);

        if (updateError) {
          console.log(`⚠️  Erreur lors de la mise à jour de l'ID pour ${user.email}: ${updateError.message}`);
        } else {
          console.log(`✅ ID mis à jour dans public.users pour ${user.email}`);
        }

      } catch (error) {
        console.log(`❌ Erreur lors du traitement de ${user.email}: ${error.message}`);
      }
      
      console.log('---');
    }

    // 5. Vérification finale
    console.log('\n🔍 Vérification finale...');
    
    const { data: finalAuthUsers, error: finalAuthError } = await supabase.auth.admin.listUsers();
    const { data: finalPublicUsers, error: finalPublicError } = await supabase
      .from('users')
      .select('*');

    if (!finalAuthError && !finalPublicError) {
      const finalAuthEmails = finalAuthUsers.users.map(u => u.email);
      const finalPublicEmails = finalPublicUsers.map(u => u.email);
      
      const stillMissing = finalPublicUsers.filter(pu => !finalAuthEmails.includes(pu.email));
      
      console.log(`\n📊 RÉSULTAT FINAL:`);
      console.log(`   - Auth users: ${finalAuthUsers.users.length}`);
      console.log(`   - Public users: ${finalPublicUsers.length}`);
      console.log(`   - Utilisateurs non synchronisés: ${stillMissing.length}`);
      
      if (stillMissing.length === 0) {
        console.log('\n🎉 SUCCÈS: Tous les utilisateurs sont maintenant synchronisés !');
      } else {
        console.log('\n⚠️  ATTENTION: Certains utilisateurs ne sont toujours pas synchronisés:');
        stillMissing.forEach(u => console.log(`   - ${u.email}`));
      }
    }

  } catch (error) {
    console.error('💥 ERREUR CRITIQUE:', error.message);
    console.error(error);
  }
}

// Exécuter le script
createMissingAuthUsers()
  .then(() => {
    console.log('\n🏁 Script terminé.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });





