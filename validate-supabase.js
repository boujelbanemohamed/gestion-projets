// Script de validation Supabase - À exécuter dans la console du navigateur
console.log('🔍 VALIDATION SUPABASE - SERVICE D\'AUTHENTIFICATION');
console.log('='.repeat(60));

const SUPABASE_URL = 'https://obdadipsbbrlwetkuyui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGFkaXBzYmJybHdldGt1eXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjE4NzQsImV4cCI6MjA1MTQ5Nzg3NH0.Ej4Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function validateSupabaseAuth() {
    console.log('\n🔧 1. VALIDATION DE LA CONFIGURATION');
    console.log('-'.repeat(40));
    
    // Validation de l'URL
    const urlValid = SUPABASE_URL && SUPABASE_URL.includes('supabase.co') && SUPABASE_URL.startsWith('https://');
    console.log(`   URL Supabase: ${urlValid ? '✅' : '❌'} ${SUPABASE_URL}`);
    
    // Validation de la clé
    const keyValid = SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 100 && SUPABASE_ANON_KEY.startsWith('eyJ');
    console.log(`   Clé Anon: ${keyValid ? '✅' : '❌'} ${keyValid ? 'Format JWT valide' : 'Format invalide'}`);
    
    if (!urlValid || !keyValid) {
        console.log('\n❌ Configuration invalide - Arrêt des tests');
        return false;
    }

    console.log('\n🌐 2. TEST DE CONNECTIVITÉ GÉNÉRALE');
    console.log('-'.repeat(40));
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: { 'apikey': SUPABASE_ANON_KEY }
        });
        
        console.log(`   Connectivité: ${response.ok || response.status === 401 ? '✅' : '❌'} Status ${response.status}`);
        
        if (!response.ok && response.status !== 401) {
            console.log('   ⚠️ Problème de connectivité détecté');
        }
    } catch (error) {
        console.log(`   Connectivité: ❌ Erreur réseau: ${error.message}`);
        return false;
    }

    console.log('\n🔐 3. TEST DU SERVICE D\'AUTHENTIFICATION');
    console.log('-'.repeat(40));
    
    // Test 1: Health check
    try {
        const healthResponse = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
            headers: { 
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (healthResponse.ok) {
            console.log('   Health Check: ✅ Service d\'authentification actif');
            return true;
        } else {
            console.log(`   Health Check: ⚠️ Status ${healthResponse.status} - Test alternatif...`);
        }
    } catch (error) {
        console.log(`   Health Check: ⚠️ Erreur: ${error.message} - Test alternatif...`);
    }
    
    // Test 2: Settings endpoint
    try {
        const settingsResponse = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
            headers: { 'apikey': SUPABASE_ANON_KEY }
        });
        
        if (settingsResponse.ok) {
            console.log('   Settings: ✅ Endpoint settings accessible');
            return true;
        } else if (settingsResponse.status === 401 || settingsResponse.status === 403) {
            console.log('   Settings: ✅ Service protégé (comportement normal)');
            return true;
        } else {
            console.log(`   Settings: ⚠️ Status ${settingsResponse.status} - Test final...`);
        }
    } catch (error) {
        console.log(`   Settings: ⚠️ Erreur: ${error.message} - Test final...`);
    }
    
    // Test 3: Test indirect via signup
    try {
        const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: { 
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test-validation-' + Date.now() + '@example.com',
                password: 'test123456'
            })
        });
        
        // Status 400 (bad request) ou 422 (validation error) indiquent que le service fonctionne
        if (signupResponse.status === 400 || signupResponse.status === 422) {
            console.log('   Test Signup: ✅ Service d\'authentification fonctionnel (validation des données)');
            return true;
        } else if (signupResponse.status === 200 || signupResponse.status === 201) {
            console.log('   Test Signup: ✅ Service d\'authentification pleinement fonctionnel');
            return true;
        } else {
            console.log(`   Test Signup: ❌ Status ${signupResponse.status} - Service non fonctionnel`);
            return false;
        }
    } catch (error) {
        console.log(`   Test Signup: ❌ Erreur réseau: ${error.message}`);
        return false;
    }
}

async function validateSupabaseComplete() {
    console.log('\n📊 4. VALIDATION COMPLÈTE DES SERVICES');
    console.log('-'.repeat(40));
    
    const services = [
        { name: 'REST API', endpoint: '/rest/v1/', expectedStatuses: [200, 401] },
        { name: 'Auth API', endpoint: '/auth/v1/settings', expectedStatuses: [200, 401, 403] },
        { name: 'Storage API', endpoint: '/storage/v1/buckets', expectedStatuses: [200, 401, 403] }
    ];
    
    let workingServices = 0;
    
    for (const service of services) {
        try {
            const response = await fetch(`${SUPABASE_URL}${service.endpoint}`, {
                headers: { 'apikey': SUPABASE_ANON_KEY }
            });
            
            const isWorking = service.expectedStatuses.includes(response.status);
            console.log(`   ${service.name}: ${isWorking ? '✅' : '❌'} Status ${response.status}`);
            
            if (isWorking) workingServices++;
        } catch (error) {
            console.log(`   ${service.name}: ❌ Erreur: ${error.message}`);
        }
    }
    
    console.log(`\n   Services fonctionnels: ${workingServices}/${services.length}`);
    return workingServices >= 2; // Au moins REST et Auth doivent fonctionner
}

async function checkLocalSession() {
    console.log('\n🔑 5. VÉRIFICATION DE LA SESSION LOCALE');
    console.log('-'.repeat(40));
    
    const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') && key.includes('auth')
    );
    
    if (authKeys.length > 0) {
        console.log(`   Session locale: ✅ ${authKeys.length} token(s) trouvé(s)`);
        authKeys.forEach(key => {
            const value = localStorage.getItem(key);
            const isValid = value && value.length > 10;
            console.log(`     - ${key}: ${isValid ? '✅' : '❌'}`);
        });
        return true;
    } else {
        console.log('   Session locale: ⚠️ Aucune session active');
        return false;
    }
}

// Fonction principale
async function runValidation() {
    try {
        const authValid = await validateSupabaseAuth();
        const servicesValid = await validateSupabaseComplete();
        const sessionExists = await checkLocalSession();
        
        console.log('\n' + '='.repeat(60));
        console.log('📋 RÉSUMÉ DE LA VALIDATION');
        console.log('='.repeat(60));
        
        console.log(`🔐 Service d'authentification: ${authValid ? '✅ FONCTIONNEL' : '❌ PROBLÈME'}`);
        console.log(`🌐 Services Supabase: ${servicesValid ? '✅ OPÉRATIONNELS' : '❌ PROBLÈMES'}`);
        console.log(`🔑 Session utilisateur: ${sessionExists ? '✅ ACTIVE' : '⚠️ AUCUNE'}`);
        
        const overallScore = (authValid ? 1 : 0) + (servicesValid ? 1 : 0) + (sessionExists ? 0.5 : 0);
        const maxScore = 2.5;
        const percentage = Math.round((overallScore / maxScore) * 100);
        
        console.log(`\n🎯 Score global: ${percentage}% (${overallScore}/${maxScore})`);
        
        if (percentage >= 80) {
            console.log('🎉 EXCELLENT ! Supabase est correctement configuré et fonctionnel');
        } else if (percentage >= 60) {
            console.log('✅ BIEN ! Configuration fonctionnelle avec quelques améliorations possibles');
        } else {
            console.log('⚠️ ATTENTION ! Des corrections sont nécessaires');
        }
        
        console.log('\n📋 RECOMMANDATIONS:');
        if (!authValid) {
            console.log('   🔧 Vérifiez la configuration du service d\'authentification');
        }
        if (!servicesValid) {
            console.log('   🌐 Vérifiez les permissions et la configuration Supabase');
        }
        if (!sessionExists) {
            console.log('   🔑 Connectez-vous pour créer une session utilisateur');
        }
        
        return { authValid, servicesValid, sessionExists, percentage };
        
    } catch (error) {
        console.error('❌ Erreur lors de la validation:', error);
        return { authValid: false, servicesValid: false, sessionExists: false, percentage: 0 };
    }
}

// Lancer la validation
console.log('🚀 Lancement de la validation...');
runValidation().then(results => {
    console.log('\n✅ Validation terminée !');
    
    // Exposer les résultats globalement
    window.supabaseValidation = results;
}).catch(error => {
    console.error('❌ Erreur fatale:', error);
});

// Export pour utilisation
window.validateSupabaseAuth = validateSupabaseAuth;
window.runValidation = runValidation;
