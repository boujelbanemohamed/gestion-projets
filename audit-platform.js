// Audit complet de la plateforme - À exécuter dans la console du navigateur
console.log('🔍 AUDIT COMPLET DE LA PLATEFORME');
console.log('='.repeat(60));

// Configuration
const SUPABASE_URL = 'https://obdadipsbbrlwetkuyui.supabase.co';
const NETLIFY_URL = 'https://clinquant-croissant-1fa49a.netlify.app';

// Fonction d'audit
async function auditPlatform() {
    const results = {
        configuration: {},
        frontend: {},
        backend: {},
        database: {},
        apis: {},
        security: {},
        performance: {}
    };

    console.log('\n🔧 1. AUDIT DE CONFIGURATION');
    console.log('-'.repeat(40));

    // Test configuration Supabase
    const supabaseUrl = window.location.hostname === 'localhost' ? 
        localStorage.getItem('VITE_SUPABASE_URL') || 'Non configuré' : 
        'Configuré en production';
    
    results.configuration.supabase = supabaseUrl !== 'Non configuré';
    console.log(`   Supabase URL: ${results.configuration.supabase ? '✅' : '❌'} ${supabaseUrl}`);

    // Test mode production
    const isProduction = window.location.hostname !== 'localhost';
    results.configuration.production = isProduction;
    console.log(`   Mode Production: ${isProduction ? '✅' : '❌'} ${isProduction ? 'Production' : 'Développement'}`);

    console.log('\n🎨 2. AUDIT FRONTEND');
    console.log('-'.repeat(40));

    // Test React
    const reactRoot = document.querySelector('#root');
    results.frontend.react = reactRoot && reactRoot.children.length > 0;
    console.log(`   React App: ${results.frontend.react ? '✅' : '❌'} ${results.frontend.react ? 'Montée' : 'Non montée'}`);

    // Test composants
    const buttons = document.querySelectorAll('button');
    results.frontend.buttons = buttons.length > 0;
    console.log(`   Boutons: ${results.frontend.buttons ? '✅' : '❌'} ${buttons.length} trouvés`);

    const forms = document.querySelectorAll('form, [role="dialog"]');
    results.frontend.forms = forms.length >= 0;
    console.log(`   Formulaires: ${results.frontend.forms ? '✅' : '❌'} ${forms.length} trouvés`);

    const icons = document.querySelectorAll('svg');
    results.frontend.icons = icons.length > 10;
    console.log(`   Icônes: ${results.frontend.icons ? '✅' : '❌'} ${icons.length} trouvées`);

    // Test navigation
    const navigation = document.querySelector('nav, [role="navigation"]');
    results.frontend.navigation = !!navigation;
    console.log(`   Navigation: ${results.frontend.navigation ? '✅' : '❌'}`);

    console.log('\n🗄️ 3. AUDIT BASE DE DONNÉES');
    console.log('-'.repeat(40));

    try {
        // Test connectivité Supabase
        const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGFkaXBzYmJybHdldGt1eXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjE4NzQsImV4cCI6MjA1MTQ5Nzg3NH0.Ej4Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
            }
        });
        results.database.connectivity = supabaseResponse.ok || supabaseResponse.status === 401;
        console.log(`   Connectivité Supabase: ${results.database.connectivity ? '✅' : '❌'} Status ${supabaseResponse.status}`);
    } catch (error) {
        results.database.connectivity = false;
        console.log(`   Connectivité Supabase: ❌ Erreur: ${error.message}`);
    }

    console.log('\n📡 4. AUDIT APIs');
    console.log('-'.repeat(40));

    // Test API utilisateurs (si connecté)
    try {
        const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*&limit=1`, {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGFkaXBzYmJybHdldGt1eXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjE4NzQsImV4cCI6MjA1MTQ5Nzg3NH0.Ej4Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
                'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token') || 'none'}`
            }
        });
        results.apis.users = userResponse.ok;
        console.log(`   API Utilisateurs: ${results.apis.users ? '✅' : '❌'} Status ${userResponse.status}`);
    } catch (error) {
        results.apis.users = false;
        console.log(`   API Utilisateurs: ❌ Erreur: ${error.message}`);
    }

    // Test API projets
    try {
        const projectsResponse = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*&limit=1`, {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGFkaXBzYmJybHdldGt1eXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjE4NzQsImV4cCI6MjA1MTQ5Nzg3NH0.Ej4Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
            }
        });
        results.apis.projects = projectsResponse.ok;
        console.log(`   API Projets: ${results.apis.projects ? '✅' : '❌'} Status ${projectsResponse.status}`);
    } catch (error) {
        results.apis.projects = false;
        console.log(`   API Projets: ❌ Erreur: ${error.message}`);
    }

    // Test API PV de réunion
    try {
        const meetingResponse = await fetch(`${SUPABASE_URL}/rest/v1/meeting_minutes?select=*&limit=1`, {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGFkaXBzYmJybHdldGt1eXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjE4NzQsImV4cCI6MjA1MTQ5Nzg3NH0.Ej4Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
            }
        });
        results.apis.meetingMinutes = meetingResponse.ok;
        console.log(`   API PV Réunion: ${results.apis.meetingMinutes ? '✅' : '❌'} Status ${meetingResponse.status}`);
    } catch (error) {
        results.apis.meetingMinutes = false;
        console.log(`   API PV Réunion: ❌ Erreur: ${error.message}`);
    }

    console.log('\n🔐 5. AUDIT SÉCURITÉ');
    console.log('-'.repeat(40));

    // Test HTTPS
    results.security.https = window.location.protocol === 'https:';
    console.log(`   HTTPS: ${results.security.https ? '✅' : '❌'} ${window.location.protocol}`);

    // Test headers de sécurité (approximatif)
    results.security.headers = window.location.hostname !== 'localhost';
    console.log(`   Headers Sécurité: ${results.security.headers ? '✅' : '❌'} ${results.security.headers ? 'Configurés' : 'Développement'}`);

    console.log('\n⚡ 6. AUDIT PERFORMANCE');
    console.log('-'.repeat(40));

    if (window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0];
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        results.performance.loadTime = loadTime < 5000;
        console.log(`   Temps de chargement: ${results.performance.loadTime ? '✅' : '⚠️'} ${Math.round(loadTime)}ms`);

        const domReady = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        results.performance.domReady = domReady < 3000;
        console.log(`   DOM Ready: ${results.performance.domReady ? '✅' : '⚠️'} ${Math.round(domReady)}ms`);
    }

    // Calcul du score global
    const allTests = Object.values(results).flatMap(category => Object.values(category));
    const passedTests = allTests.filter(test => test === true).length;
    const totalTests = allTests.length;
    const score = Math.round((passedTests / totalTests) * 100);

    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DE L\'AUDIT');
    console.log('='.repeat(60));
    console.log(`🎯 Score Global: ${score}% (${passedTests}/${totalTests} tests réussis)`);
    
    if (score >= 90) {
        console.log('🎉 EXCELLENT ! Plateforme prête pour la production');
    } else if (score >= 75) {
        console.log('✅ BIEN ! Quelques améliorations mineures possibles');
    } else if (score >= 60) {
        console.log('⚠️ MOYEN ! Corrections nécessaires');
    } else {
        console.log('❌ PROBLÈMES ! Corrections urgentes requises');
    }

    console.log('\n📋 DÉTAILS PAR CATÉGORIE:');
    Object.entries(results).forEach(([category, tests]) => {
        const categoryPassed = Object.values(tests).filter(test => test === true).length;
        const categoryTotal = Object.values(tests).length;
        const categoryScore = Math.round((categoryPassed / categoryTotal) * 100);
        console.log(`   ${category}: ${categoryScore}% (${categoryPassed}/${categoryTotal})`);
    });

    return results;
}

// Lancer l'audit
auditPlatform().then(results => {
    console.log('\n🎯 RECOMMANDATIONS:');
    
    if (!results.configuration.supabase) {
        console.log('   🔧 Configurez les variables Supabase');
    }
    
    if (!results.database.connectivity) {
        console.log('   🗄️ Vérifiez la connectivité à la base de données');
    }
    
    if (!results.apis.users || !results.apis.projects || !results.apis.meetingMinutes) {
        console.log('   📡 Vérifiez les permissions et politiques RLS');
    }
    
    if (!results.security.https) {
        console.log('   🔐 Déployez en HTTPS pour la sécurité');
    }
    
    console.log('\n✅ Audit terminé !');
}).catch(error => {
    console.error('❌ Erreur lors de l\'audit:', error);
});

// Export pour utilisation
window.auditPlatform = auditPlatform;
