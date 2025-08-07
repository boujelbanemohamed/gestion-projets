// Script pour uploader les données mockées dans Supabase
// À exécuter dans la console du navigateur sur votre application

console.log('🚀 UPLOAD DES DONNÉES MOCKÉES VERS SUPABASE');
console.log('='.repeat(60));

const SUPABASE_URL = 'https://obdadipsbbrlwetkuyui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGFkaXBzYmJybHdldGt1eXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODgxMjMsImV4cCI6MjA3MDA2NDEyM30.jracnTOp7Y0QBTbt7qjY4076aBqh3pq7DR-rU_U33fo';

// Données mockées à uploader
const mockData = {
    departments: [
        { nom: 'IT' },
        { nom: 'Design' },
        { nom: 'Marketing' },
        { nom: 'Qualité' },
        { nom: 'RH' }
    ],
    
    // Note: Les utilisateurs seront créés via l'authentification Supabase
    // Leurs profils étendus seront créés automatiquement
    
    projects: [
        {
            nom: 'Refonte Site Web',
            description: 'Modernisation complète du site web de l\'entreprise avec une nouvelle interface utilisateur.',
            type_projet: 'Développement Web',
            budget_initial: 25000,
            devise: 'EUR',
            statut: 'en_cours'
        },
        {
            nom: 'Application Mobile',
            description: 'Développement d\'une application mobile native pour iOS et Android.',
            type_projet: 'Développement Mobile',
            budget_initial: 35000,
            devise: 'EUR',
            statut: 'planifie'
        },
        {
            nom: 'Migration Base de Données',
            description: 'Migration de l\'ancienne base de données vers une nouvelle infrastructure cloud.',
            type_projet: 'Infrastructure',
            budget_initial: 15000,
            devise: 'EUR',
            statut: 'planifie'
        }
    ]
};

async function uploadData(table, data, description) {
    console.log(`\n📤 Upload ${description}...`);
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ ${description}: ${Array.isArray(result) ? result.length : 1} enregistrement(s) créé(s)`);
            return { success: true, data: result };
        } else if (response.status === 401 || response.status === 403) {
            console.log(`🔒 ${description}: Accès restreint (RLS activé) - Normal en production`);
            return { success: false, reason: 'restricted' };
        } else if (response.status === 409) {
            console.log(`⚠️ ${description}: Données déjà existantes (conflit)`);
            return { success: false, reason: 'conflict' };
        } else {
            const error = await response.text();
            console.log(`❌ ${description}: Erreur ${response.status} - ${error}`);
            return { success: false, reason: 'error', details: error };
        }
    } catch (error) {
        console.log(`❌ ${description}: Erreur réseau - ${error.message}`);
        return { success: false, reason: 'network', details: error.message };
    }
}

async function checkExistingData(table, description) {
    console.log(`🔍 Vérification ${description}...`);
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=10`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const count = Array.isArray(data) ? data.length : 0;
            console.log(`📊 ${description}: ${count} enregistrement(s) existant(s)`);
            return { exists: count > 0, count: count, data: data };
        } else if (response.status === 401 || response.status === 403) {
            console.log(`🔒 ${description}: Accès restreint (RLS activé)`);
            return { exists: null, reason: 'restricted' };
        } else {
            console.log(`❌ ${description}: Erreur ${response.status}`);
            return { exists: false, reason: 'error' };
        }
    } catch (error) {
        console.log(`❌ ${description}: Erreur réseau - ${error.message}`);
        return { exists: false, reason: 'network' };
    }
}

async function uploadAllMockData() {
    console.log('\n🔍 ÉTAPE 1: VÉRIFICATION DES DONNÉES EXISTANTES');
    console.log('-'.repeat(50));
    
    const checks = {
        departments: await checkExistingData('departments', 'Départements'),
        projects: await checkExistingData('projects', 'Projets')
    };
    
    console.log('\n📤 ÉTAPE 2: UPLOAD DES DONNÉES MANQUANTES');
    console.log('-'.repeat(50));
    
    const results = {};
    
    // Upload départements si nécessaire
    if (!checks.departments.exists) {
        results.departments = await uploadData('departments', mockData.departments, 'Départements');
    } else {
        console.log('⏭️ Départements: Déjà présents, skip');
        results.departments = { success: true, skipped: true };
    }
    
    // Upload projets si nécessaire
    if (!checks.projects.exists) {
        results.projects = await uploadData('projects', mockData.projects, 'Projets');
    } else {
        console.log('⏭️ Projets: Déjà présents, skip');
        results.projects = { success: true, skipped: true };
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 RÉSUMÉ DE L\'UPLOAD');
    console.log('='.repeat(60));
    
    let successCount = 0;
    let totalCount = 0;
    
    Object.entries(results).forEach(([table, result]) => {
        totalCount++;
        if (result.success) {
            successCount++;
            const status = result.skipped ? 'DÉJÀ PRÉSENT' : 'UPLOADÉ';
            console.log(`✅ ${table}: ${status}`);
        } else {
            const reason = result.reason === 'restricted' ? 'ACCÈS RESTREINT (NORMAL)' : 
                          result.reason === 'conflict' ? 'CONFLIT (DÉJÀ EXISTANT)' : 'ERREUR';
            console.log(`⚠️ ${table}: ${reason}`);
        }
    });
    
    console.log(`\n🎯 Résultat: ${successCount}/${totalCount} tables traitées avec succès`);
    
    if (successCount === totalCount) {
        console.log('🎉 EXCELLENT ! Toutes les données mockées sont maintenant disponibles');
    } else {
        console.log('⚠️ Certaines données n\'ont pas pu être uploadées (souvent normal avec RLS)');
    }
    
    console.log('\n📋 PROCHAINES ÉTAPES:');
    console.log('1. Créez un compte utilisateur via l\'interface d\'authentification');
    console.log('2. Connectez-vous avec votre compte');
    console.log('3. Testez les fonctionnalités de l\'application');
    
    return results;
}

// Fonction pour créer un utilisateur de test (nécessite d'être connecté en tant qu'admin)
async function createTestUser(email, password, role = 'UTILISATEUR') {
    console.log(`\n👤 Création de l'utilisateur de test: ${email}`);
    
    try {
        // Utiliser l'API d'authentification Supabase pour créer l'utilisateur
        const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password,
                data: {
                    role: role,
                    nom: email.split('@')[0].split('.')[1] || 'Test',
                    prenom: email.split('@')[0].split('.')[0] || 'User'
                }
            })
        });

        if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log(`✅ Utilisateur créé: ${email}`);
            return { success: true, user: authData.user };
        } else {
            const error = await authResponse.text();
            console.log(`❌ Erreur création utilisateur: ${error}`);
            return { success: false, error: error };
        }
    } catch (error) {
        console.log(`❌ Erreur réseau: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Lancer l'upload
console.log('🚀 Lancement de l\'upload des données mockées...');
uploadAllMockData().then(results => {
    console.log('\n✅ Upload terminé !');
    
    // Exposer les fonctions globalement pour utilisation manuelle
    window.uploadMockData = uploadAllMockData;
    window.createTestUser = createTestUser;
    window.checkData = checkExistingData;
    
}).catch(error => {
    console.error('❌ Erreur fatale:', error);
});

// Export des fonctions
window.uploadAllMockData = uploadAllMockData;
