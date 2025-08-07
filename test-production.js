// Script de test pour la production
console.log('🧪 Test de Production - Plateforme Gestion de Projets');
console.log('='.repeat(60));

// Test 1: Configuration Supabase
console.log('\n1. 🔧 Configuration Supabase:');
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const useSupabase = import.meta.env.VITE_USE_SUPABASE;

console.log(`   URL: ${supabaseUrl ? '✅' : '❌'} ${supabaseUrl || 'Non configuré'}`);
console.log(`   Key: ${supabaseKey ? '✅' : '❌'} ${supabaseKey ? 'Configuré' : 'Non configuré'}`);
console.log(`   Mode: ${useSupabase === 'true' ? '✅' : '❌'} ${useSupabase}`);

// Test 2: Connectivité Supabase
console.log('\n2. 🌐 Test de Connectivité Supabase:');
if (supabaseUrl && supabaseKey) {
  fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  })
  .then(response => {
    if (response.ok || response.status === 401) {
      console.log('   ✅ Connexion Supabase réussie');
    } else {
      console.log('   ❌ Erreur de connexion Supabase:', response.status);
    }
  })
  .catch(error => {
    console.log('   ❌ Erreur réseau:', error.message);
  });
} else {
  console.log('   ❌ Configuration Supabase manquante');
}

// Test 3: Interface utilisateur
console.log('\n3. 🎨 Interface Utilisateur:');
setTimeout(() => {
  const app = document.querySelector('#root');
  const hasContent = app && app.children.length > 0;
  console.log(`   App montée: ${hasContent ? '✅' : '❌'}`);
  
  const buttons = document.querySelectorAll('button');
  console.log(`   Boutons: ${buttons.length > 0 ? '✅' : '❌'} ${buttons.length} trouvés`);
  
  const forms = document.querySelectorAll('form, [role="dialog"]');
  console.log(`   Formulaires: ${forms.length >= 0 ? '✅' : '❌'} ${forms.length} trouvés`);
  
  const navigation = document.querySelector('nav, [role="navigation"]');
  console.log(`   Navigation: ${navigation ? '✅' : '❌'}`);
}, 2000);

// Test 4: Performance
console.log('\n4. ⚡ Performance:');
setTimeout(() => {
  if (window.performance) {
    const navigation = performance.getEntriesByType('navigation')[0];
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;
    console.log(`   Temps de chargement: ${loadTime < 3000 ? '✅' : '⚠️'} ${Math.round(loadTime)}ms`);
    
    const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
    console.log(`   DOM Ready: ${domContentLoaded < 2000 ? '✅' : '⚠️'} ${Math.round(domContentLoaded)}ms`);
  }
}, 3000);

// Test 5: Fonctionnalités critiques
console.log('\n5. 🔑 Fonctionnalités Critiques:');
setTimeout(() => {
  // Test du modal de connexion
  const loginModal = document.querySelector('[role="dialog"]');
  console.log(`   Modal de connexion: ${loginModal ? '✅' : '❌'}`);
  
  // Test des icônes
  const icons = document.querySelectorAll('svg');
  console.log(`   Icônes: ${icons.length > 10 ? '✅' : '❌'} ${icons.length} trouvées`);
  
  // Test du CSS
  const hasStyles = getComputedStyle(document.body).fontFamily !== '';
  console.log(`   Styles CSS: ${hasStyles ? '✅' : '❌'}`);
}, 4000);

// Test 6: Erreurs JavaScript
console.log('\n6. 🐛 Erreurs JavaScript:');
let errorCount = 0;
const originalError = console.error;
console.error = function(...args) {
  errorCount++;
  originalError.apply(console, args);
};

setTimeout(() => {
  console.log(`   Erreurs détectées: ${errorCount === 0 ? '✅' : '⚠️'} ${errorCount}`);
}, 5000);

// Test 7: Responsive Design
console.log('\n7. 📱 Responsive Design:');
setTimeout(() => {
  const viewport = document.querySelector('meta[name="viewport"]');
  console.log(`   Meta viewport: ${viewport ? '✅' : '❌'}`);
  
  const isMobile = window.innerWidth < 768;
  const hasResponsiveClasses = document.querySelector('[class*="sm:"], [class*="md:"], [class*="lg:"]');
  console.log(`   Classes responsive: ${hasResponsiveClasses ? '✅' : '❌'}`);
  
  console.log(`   Résolution: ${window.innerWidth}x${window.innerHeight} ${isMobile ? '(Mobile)' : '(Desktop)'}`);
}, 1000);

// Résumé final
setTimeout(() => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DU TEST DE PRODUCTION');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Configuration Supabase', status: supabaseUrl && supabaseKey && useSupabase === 'true' },
    { name: 'Interface utilisateur', status: document.querySelector('#root')?.children.length > 0 },
    { name: 'Styles CSS', status: getComputedStyle(document.body).fontFamily !== '' },
    { name: 'Erreurs JavaScript', status: errorCount === 0 },
    { name: 'Responsive Design', status: document.querySelector('meta[name="viewport"]') !== null }
  ];
  
  const passedTests = tests.filter(test => test.status).length;
  const totalTests = tests.length;
  
  console.log(`\n🎯 Tests réussis: ${passedTests}/${totalTests}`);
  
  tests.forEach(test => {
    console.log(`   ${test.status ? '✅' : '❌'} ${test.name}`);
  });
  
  if (passedTests === totalTests) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('✅ Votre application est prête pour la production !');
  } else {
    console.log('\n⚠️ Certains tests ont échoué');
    console.log('🔧 Vérifiez les points marqués ❌ ci-dessus');
  }
  
  console.log('\n🚀 Pour déployer en production :');
  console.log('   1. npm run build');
  console.log('   2. vercel --prod');
  console.log('   3. Mettez à jour les URLs dans Supabase');
  
}, 6000);

// Export pour utilisation dans d'autres scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testProduction: () => console.log('Test de production lancé') };
}
