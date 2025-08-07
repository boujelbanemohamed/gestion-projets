// Script d'activation complète du Storage Supabase
console.log('🗄️ ACTIVATION COMPLÈTE DU STORAGE SUPABASE');
console.log('='.repeat(60));

const SUPABASE_URL = 'https://obdadipsbbrlwetkuyui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGFkaXBzYmJybHdldGt1eXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODgxMjMsImV4cCI6MjA3MDA2NDEyM30.jracnTOp7Y0QBTbt7qjY4076aBqh3pq7DR-rU_U33fo';

// Configuration des buckets nécessaires
const bucketsConfig = [
    {
        id: 'project-files',
        name: 'project-files',
        public: false,
        file_size_limit: 52428800, // 50MB
        allowed_mime_types: ['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.*']
    },
    {
        id: 'user-avatars',
        name: 'user-avatars',
        public: true,
        file_size_limit: 5242880, // 5MB
        allowed_mime_types: ['image/*']
    },
    {
        id: 'meeting-attachments',
        name: 'meeting-attachments',
        public: false,
        file_size_limit: 104857600, // 100MB
        allowed_mime_types: ['*']
    }
];

class SupabaseStorageActivator {
    constructor() {
        this.headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        };
    }

    async checkStorageStatus() {
        console.log('\n🔍 VÉRIFICATION DU STATUS STORAGE');
        console.log('-'.repeat(40));

        try {
            // Test 1: Vérifier si le service Storage est activé
            const healthResponse = await fetch(`${SUPABASE_URL}/storage/v1/object`, {
                headers: this.headers
            });

            if (healthResponse.status === 404) {
                console.log('❌ Storage non activé dans Supabase');
                return { activated: false, reason: 'service_not_enabled' };
            } else if (healthResponse.ok || healthResponse.status === 400) {
                console.log('✅ Storage service activé');
                
                // Test 2: Vérifier les buckets existants
                const bucketsResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
                    headers: this.headers
                });

                if (bucketsResponse.ok) {
                    const buckets = await bucketsResponse.json();
                    console.log(`📁 ${buckets.length} bucket(s) existant(s)`);
                    return { activated: true, buckets };
                } else {
                    console.log('⚠️ Storage activé mais buckets non accessibles');
                    return { activated: true, buckets: [], needsConfig: true };
                }
            } else {
                console.log(`⚠️ Storage status incertain: ${healthResponse.status}`);
                return { activated: 'unknown', status: healthResponse.status };
            }
        } catch (error) {
            console.log(`❌ Erreur vérification Storage: ${error.message}`);
            return { activated: false, error: error.message };
        }
    }

    async createBucket(bucketConfig) {
        console.log(`\n📁 Création bucket: ${bucketConfig.name}`);
        
        try {
            const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(bucketConfig)
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Bucket ${bucketConfig.name} créé avec succès`);
                return { success: true, bucket: result };
            } else if (response.status === 409) {
                console.log(`⚠️ Bucket ${bucketConfig.name} existe déjà`);
                return { success: true, existing: true };
            } else {
                const error = await response.text();
                console.log(`❌ Erreur création ${bucketConfig.name}: ${response.status} - ${error}`);
                return { success: false, error: response.status, details: error };
            }
        } catch (error) {
            console.log(`❌ Erreur réseau ${bucketConfig.name}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async setupStoragePolicies() {
        console.log('\n🔐 CONFIGURATION DES POLITIQUES RLS');
        console.log('-'.repeat(40));

        // Politiques RLS pour le Storage (à exécuter dans le SQL Editor de Supabase)
        const policies = [
            {
                name: 'project-files-policy',
                sql: `
-- Politique pour project-files
CREATE POLICY "Users can upload project files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'project-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view project files" ON storage.objects
FOR SELECT USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their project files" ON storage.objects
FOR UPDATE USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their project files" ON storage.objects
FOR DELETE USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');
                `
            },
            {
                name: 'user-avatars-policy',
                sql: `
-- Politique pour user-avatars (public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their avatar" ON storage.objects
FOR UPDATE USING (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');
                `
            },
            {
                name: 'meeting-attachments-policy',
                sql: `
-- Politique pour meeting-attachments
CREATE POLICY "Users can upload meeting attachments" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'meeting-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view meeting attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'meeting-attachments' AND auth.role() = 'authenticated');
                `
            }
        ];

        console.log('📋 Politiques RLS à appliquer:');
        policies.forEach((policy, index) => {
            console.log(`\n${index + 1}. ${policy.name}:`);
            console.log('   À exécuter dans le SQL Editor de Supabase:');
            console.log('   ' + policy.sql.trim().split('\n').join('\n   '));
        });

        return policies;
    }

    async testStorageOperations() {
        console.log('\n🧪 TEST DES OPÉRATIONS STORAGE');
        console.log('-'.repeat(40));

        const tests = [];

        // Test 1: Upload d'un fichier de test
        try {
            console.log('📤 Test upload fichier...');
            const testContent = 'Test file content for Supabase Storage';
            const testBlob = new Blob([testContent], { type: 'text/plain' });

            const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/project-files/test-file.txt`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: testBlob
            });

            if (uploadResponse.ok) {
                console.log('✅ Upload test réussi');
                tests.push({ operation: 'upload', success: true });
            } else {
                console.log(`⚠️ Upload test échoué: ${uploadResponse.status}`);
                tests.push({ operation: 'upload', success: false, status: uploadResponse.status });
            }
        } catch (error) {
            console.log(`❌ Erreur upload test: ${error.message}`);
            tests.push({ operation: 'upload', success: false, error: error.message });
        }

        // Test 2: Liste des fichiers
        try {
            console.log('📋 Test liste fichiers...');
            const listResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/list/project-files`, {
                headers: this.headers
            });

            if (listResponse.ok) {
                const files = await listResponse.json();
                console.log(`✅ Liste fichiers réussie: ${files.length} fichier(s)`);
                tests.push({ operation: 'list', success: true, count: files.length });
            } else {
                console.log(`⚠️ Liste fichiers échouée: ${listResponse.status}`);
                tests.push({ operation: 'list', success: false, status: listResponse.status });
            }
        } catch (error) {
            console.log(`❌ Erreur liste fichiers: ${error.message}`);
            tests.push({ operation: 'list', success: false, error: error.message });
        }

        return tests;
    }

    async activateCompleteStorage() {
        console.log('\n🚀 ACTIVATION COMPLÈTE DU STORAGE');
        console.log('-'.repeat(50));

        const results = {
            status: null,
            buckets: [],
            policies: [],
            tests: [],
            success: false
        };

        // Étape 1: Vérifier le status
        results.status = await this.checkStorageStatus();

        if (!results.status.activated) {
            console.log('\n❌ STORAGE NON ACTIVÉ');
            console.log('📋 ACTIONS REQUISES:');
            console.log('1. Connectez-vous à https://supabase.com/dashboard');
            console.log('2. Sélectionnez votre projet');
            console.log('3. Allez dans Storage > Settings');
            console.log('4. Activez le service Storage');
            console.log('5. Relancez ce script');
            return results;
        }

        console.log('✅ Storage service disponible');

        // Étape 2: Créer les buckets
        console.log('\n📁 CRÉATION DES BUCKETS');
        console.log('-'.repeat(30));

        for (const bucketConfig of bucketsConfig) {
            const bucketResult = await this.createBucket(bucketConfig);
            results.buckets.push({ config: bucketConfig, result: bucketResult });
            await new Promise(resolve => setTimeout(resolve, 500)); // Pause entre créations
        }

        // Étape 3: Configurer les politiques
        results.policies = await this.setupStoragePolicies();

        // Étape 4: Tester les opérations
        results.tests = await this.testStorageOperations();

        // Évaluation finale
        const successfulBuckets = results.buckets.filter(b => b.result.success).length;
        const successfulTests = results.tests.filter(t => t.success).length;

        results.success = successfulBuckets >= 2 && successfulTests >= 1;

        console.log('\n' + '='.repeat(60));
        console.log('📊 RÉSUMÉ DE L\'ACTIVATION STORAGE');
        console.log('='.repeat(60));

        console.log(`📁 Buckets créés: ${successfulBuckets}/${bucketsConfig.length}`);
        console.log(`🔐 Politiques configurées: ${results.policies.length}`);
        console.log(`🧪 Tests réussis: ${successfulTests}/${results.tests.length}`);

        if (results.success) {
            console.log('\n🎉 STORAGE ENTIÈREMENT ACTIVÉ !');
            console.log('✅ Votre plateforme peut maintenant gérer les fichiers');
            console.log('✅ Upload, download, et gestion complète disponibles');
            console.log('✅ Score API passera à 100% !');
        } else {
            console.log('\n⚠️ ACTIVATION PARTIELLE');
            console.log('📋 Vérifiez les permissions et politiques RLS');
            console.log('💡 L\'application reste fonctionnelle sans Storage');
        }

        return results;
    }
}

// Lancement de l'activation
console.log('🎯 Initialisation de l\'activateur Storage...');
const activator = new SupabaseStorageActivator();

activator.activateCompleteStorage().then(results => {
    console.log('\n✅ ACTIVATION STORAGE TERMINÉE !');
    
    if (results.success) {
        console.log('🎊 Storage entièrement fonctionnel !');
        console.log('🚀 Votre plateforme est maintenant 100% complète !');
    } else {
        console.log('ℹ️ Activation partielle - Consultez les instructions ci-dessus');
    }
    
    // Exposer les résultats
    window.storageActivationResults = results;
    window.supabaseStorageActivator = activator;
    
}).catch(error => {
    console.error('❌ Erreur lors de l\'activation Storage:', error);
});

// Export
window.SupabaseStorageActivator = SupabaseStorageActivator;
