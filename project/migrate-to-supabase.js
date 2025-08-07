const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase (à modifier avec vos vraies valeurs)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateData() {
  console.log('🚀 Début de la migration vers Supabase...');

  try {
    // Lire les données locales
    const dataPath = path.join(__dirname, 'backend', 'app-data.json');
    
    if (!fs.existsSync(dataPath)) {
      console.log('⚠️ Aucun fichier de données local trouvé');
      return;
    }

    const localData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`📄 Données locales trouvées: ${localData.meetingMinutes?.length || 0} PV, ${localData.projects?.length || 0} projets`);

    // Migrer les projets
    if (localData.projects && localData.projects.length > 0) {
      console.log('📊 Migration des projets...');
      
      for (const project of localData.projects) {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            nom: project.nom,
            description: project.description,
            statut: project.statut || 'en_cours',
            created_by: 'uuid-marie-dupont', // À remplacer par un vrai UUID
          })
          .select()
          .single();

        if (error) {
          console.error(`❌ Erreur migration projet ${project.nom}:`, error);
        } else {
          console.log(`✅ Projet migré: ${project.nom} (ID: ${data.id})`);
        }
      }
    }

    // Migrer les PV de réunion
    if (localData.meetingMinutes && localData.meetingMinutes.length > 0) {
      console.log('📝 Migration des PV de réunion...');
      
      for (const pv of localData.meetingMinutes) {
        // Créer le PV
        const { data: pvData, error: pvError } = await supabase
          .from('meeting_minutes')
          .insert({
            titre: pv.titre,
            date_reunion: pv.date_reunion,
            description: pv.description,
            file_name: pv.file_name,
            taille_fichier: pv.taille_fichier,
            created_by: 'uuid-marie-dupont', // À remplacer par un vrai UUID
          })
          .select()
          .single();

        if (pvError) {
          console.error(`❌ Erreur migration PV ${pv.titre}:`, pvError);
          continue;
        }

        console.log(`✅ PV migré: ${pv.titre} (ID: ${pvData.id})`);

        // Associer aux projets
        if (pv.projets && pv.projets.length > 0) {
          for (const projetId of pv.projets) {
            const { error: linkError } = await supabase
              .from('meeting_minutes_projects')
              .insert({
                meeting_minute_id: pvData.id,
                project_id: parseInt(projetId),
              });

            if (linkError) {
              console.error(`❌ Erreur association PV-Projet:`, linkError);
            } else {
              console.log(`🔗 PV ${pvData.id} associé au projet ${projetId}`);
            }
          }
        }
      }
    }

    console.log('✅ Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}

// Fonction de test de connexion
async function testConnection() {
  console.log('🔍 Test de connexion Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Erreur de connexion:', error);
      return false;
    }

    console.log('✅ Connexion Supabase réussie !');
    return true;
  } catch (error) {
    console.error('❌ Erreur de test:', error);
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('🔧 Script de migration vers Supabase');
  console.log('=====================================');
  
  // Vérifier la configuration
  if (supabaseUrl === 'https://your-project.supabase.co') {
    console.error('❌ Veuillez configurer VITE_SUPABASE_URL dans vos variables d\'environnement');
    return;
  }

  if (supabaseServiceKey === 'your-service-role-key') {
    console.error('❌ Veuillez configurer SUPABASE_SERVICE_KEY dans vos variables d\'environnement');
    return;
  }

  // Tester la connexion
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ Impossible de se connecter à Supabase');
    return;
  }

  // Migrer les données
  await migrateData();
  
  console.log('');
  console.log('🎉 Migration terminée !');
  console.log('');
  console.log('📋 Prochaines étapes :');
  console.log('1. Modifiez .env.local avec vos vraies clés Supabase');
  console.log('2. Redémarrez l\'application avec npm run dev');
  console.log('3. Testez la connexion avec les comptes créés');
  console.log('4. Vérifiez que les données sont bien migrées');
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { migrateData, testConnection };
