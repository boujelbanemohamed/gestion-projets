const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://obdadipsbbrlwetkuyui.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGFkaXBzYmJybHdldGt1eXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQ4ODEyMywiZXhwIjoyMDcwMDY0MTIzfQ.YVuesp3wprnLPM8I1gTAEqhkMCyUoL5E5sedHVJD_ZY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixAuthMetadata() {
  console.log('🔧 Correction des métadonnées auth.users...\n');

  try {
    // 1. Récupérer tous les utilisateurs auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Erreur récupération auth.users:', authError);
      return;
    }

    console.log(`📊 ${authUsers.users.length} utilisateurs trouvés dans auth.users`);

    // 2. Récupérer tous les profils
    const { data: profileUsers, error: profileError } = await supabase
      .from('users')
      .select('*');
    
    if (profileError) {
      console.error('❌ Erreur récupération public.users:', profileError);
      return;
    }

    console.log(`📊 ${profileUsers.length} profils trouvés dans public.users`);

    // 3. Créer un map des profils
    const profileMap = new Map(profileUsers.map(p => [p.id, p]));

    // 4. Corriger les métadonnées pour chaque utilisateur auth
    let corrected = 0;
    let errors = 0;

    for (const authUser of authUsers.users) {
      try {
        const profile = profileMap.get(authUser.id);
        
        if (profile) {
          // Vérifier si les métadonnées sont correctes
          const metadata = authUser.user_metadata || {};
          const needsUpdate = (
            metadata.nom !== profile.nom ||
            metadata.prenom !== profile.prenom ||
            metadata.role !== profile.role ||
            metadata.fonction !== profile.fonction ||
            metadata.departement_id !== profile.departement_id
          );

          if (needsUpdate) {
            console.log(`🔄 Correction des métadonnées pour ${authUser.email}...`);
            
            const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
              user_metadata: {
                nom: profile.nom,
                prenom: profile.prenom,
                role: profile.role,
                fonction: profile.fonction,
                departement_id: profile.departement_id,
              }
            });

            if (updateError) {
              console.error(`❌ Erreur mise à jour ${authUser.email}:`, updateError);
              errors++;
            } else {
              console.log(`✅ Métadonnées corrigées pour ${authUser.email}`);
              corrected++;
            }
          } else {
            console.log(`✅ Métadonnées déjà correctes pour ${authUser.email}`);
          }
        } else {
          console.log(`⚠️ Pas de profil trouvé pour ${authUser.email}`);
        }
      } catch (error) {
        console.error(`❌ Erreur traitement ${authUser.email}:`, error);
        errors++;
      }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   - Métadonnées corrigées: ${corrected}`);
    console.log(`   - Erreurs: ${errors}`);
    console.log(`   - Total utilisateurs traités: ${authUsers.users.length}`);

    // 5. Vérifier les profils sans utilisateur auth
    const authUserIds = new Set(authUsers.users.map(u => u.id));
    const orphanProfiles = profileUsers.filter(profileUser => !authUserIds.has(profileUser.id));
    
    if (orphanProfiles.length > 0) {
      console.log(`\n⚠️ ${orphanProfiles.length} profils orphelins trouvés:`);
      orphanProfiles.forEach(profile => {
        console.log(`   - ${profile.email} (ID: ${profile.id})`);
      });
    }

    console.log('\n✅ Correction terminée !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la correction
fixAuthMetadata();
