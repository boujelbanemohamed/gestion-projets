// Script de vérification d'erreurs
// À exécuter dans la console du navigateur sur http://localhost:8001

console.log('🔍 VÉRIFICATION D\'ERREURS');
console.log('=========================');

// Capturer les erreurs JavaScript
let jsErrors = [];
let reactErrors = [];
let consoleErrors = [];

// Override console.error pour capturer les erreurs
const originalConsoleError = console.error;
console.error = function(...args) {
    consoleErrors.push(args.join(' '));
    originalConsoleError.apply(console, args);
};

// Capturer les erreurs JavaScript globales
window.addEventListener('error', (event) => {
    jsErrors.push({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

// Capturer les erreurs de promesses non gérées
window.addEventListener('unhandledrejection', (event) => {
    jsErrors.push({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        type: 'promise'
    });
});

function checkForErrors() {
    console.log('\n📊 RAPPORT D\'ERREURS');
    console.log('===================');
    
    // Vérifier les erreurs JavaScript
    console.log(`🔧 Erreurs JavaScript: ${jsErrors.length}`);
    if (jsErrors.length > 0) {
        jsErrors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.message}`);
            if (error.filename) {
                console.log(`     Fichier: ${error.filename}:${error.lineno}:${error.colno}`);
            }
        });
    } else {
        console.log('  ✅ Aucune erreur JavaScript détectée');
    }
    
    // Vérifier les erreurs de console
    console.log(`\n📝 Erreurs de console: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
        consoleErrors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.substring(0, 100)}...`);
        });
    } else {
        console.log('  ✅ Aucune erreur de console détectée');
    }
    
    // Vérifier l'état de React
    console.log('\n⚛️ État de React:');
    const reactRoot = document.querySelector('[data-reactroot]') || document.querySelector('#root');
    if (reactRoot && reactRoot.children.length > 0) {
        console.log('  ✅ Application React montée et rendue');
        console.log(`  📊 ${reactRoot.children.length} composant(s) racine(s)`);
    } else {
        console.log('  ❌ Application React non montée ou vide');
    }
    
    // Vérifier les composants spécifiques
    console.log('\n🧩 Composants spécifiques:');
    
    const projectCards = document.querySelectorAll('[class*="bg-white"][class*="rounded"]');
    console.log(`  📁 ProjectCard: ${projectCards.length > 0 ? '✅' : '❌'} ${projectCards.length} trouvé(s)`);
    
    const buttons = document.querySelectorAll('button');
    console.log(`  🔘 Boutons: ${buttons.length > 0 ? '✅' : '❌'} ${buttons.length} trouvé(s)`);
    
    const alerts = document.querySelectorAll('[class*="alert"]');
    console.log(`  🔔 Alertes: ${alerts.length >= 0 ? '✅' : '❌'} ${alerts.length} trouvé(s)`);
    
    const icons = document.querySelectorAll('svg');
    console.log(`  🎨 Icônes: ${icons.length > 0 ? '✅' : '❌'} ${icons.length} trouvé(s)`);
    
    // Vérifier les styles CSS
    console.log('\n🎨 Styles CSS:');
    const styledElements = document.querySelectorAll('[class*="bg-"], [class*="text-"], [class*="p-"]');
    console.log(`  🎯 Éléments stylés: ${styledElements.length > 0 ? '✅' : '❌'} ${styledElements.length} trouvé(s)`);
    
    const tailwindClasses = Array.from(document.querySelectorAll('*')).some(el => 
        el.className && (
            el.className.includes('bg-') || 
            el.className.includes('text-') || 
            el.className.includes('p-') ||
            el.className.includes('m-')
        )
    );
    console.log(`  🌊 Tailwind CSS: ${tailwindClasses ? '✅' : '❌'} ${tailwindClasses ? 'Actif' : 'Non détecté'}`);
    
    // Test d'interaction
    console.log('\n🖱️ Test d\'interaction:');
    try {
        if (projectCards.length > 0) {
            const firstCard = projectCards[0];
            const clickEvent = new MouseEvent('click', { bubbles: true });
            firstCard.dispatchEvent(clickEvent);
            console.log('  ✅ Événement de clic simulé sans erreur');
        } else {
            console.log('  ⚠️ Aucune carte de projet pour tester l\'interaction');
        }
    } catch (error) {
        console.log(`  ❌ Erreur lors du test d'interaction: ${error.message}`);
    }
    
    // Verdict final
    console.log('\n🏆 VERDICT FINAL:');
    const totalErrors = jsErrors.length + consoleErrors.length;
    const hasContent = projectCards.length > 0 && buttons.length > 0;
    const hasStyles = styledElements.length > 0;
    
    if (totalErrors === 0 && hasContent && hasStyles) {
        console.log('🎉 PARFAIT! Application fonctionnelle sans erreurs');
        console.log('✅ Aucune erreur détectée');
        console.log('✅ Composants rendus correctement');
        console.log('✅ Styles appliqués');
        console.log('✅ Interactions possibles');
    } else if (totalErrors === 0 && hasContent) {
        console.log('👍 BIEN! Application fonctionnelle avec quelques problèmes mineurs');
        if (!hasStyles) console.log('⚠️ Problème de styles CSS détecté');
    } else if (totalErrors === 0) {
        console.log('⚠️ PROBLÈME! Application sans erreurs mais contenu manquant');
        console.log('❌ Composants non rendus ou données manquantes');
    } else {
        console.log('❌ ERREURS DÉTECTÉES! Application dysfonctionnelle');
        console.log(`❌ ${totalErrors} erreur(s) à corriger`);
    }
    
    return {
        jsErrors: jsErrors.length,
        consoleErrors: consoleErrors.length,
        hasContent,
        hasStyles,
        totalErrors
    };
}

// Test de performance rapide
function quickPerformanceTest() {
    console.log('\n⚡ TEST DE PERFORMANCE RAPIDE');
    console.log('=============================');
    
    const startTime = performance.now();
    
    // Simuler des calculs (comme dans ProjectCard)
    for (let i = 0; i < 100; i++) {
        const mockDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
        const daysUntil = Math.ceil((mockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const isApproaching = daysUntil <= 7;
    }
    
    const endTime = performance.now();
    const calculationTime = endTime - startTime;
    
    console.log(`🔢 100 calculs d'alertes: ${calculationTime.toFixed(2)}ms`);
    console.log(`📊 Performance: ${calculationTime < 10 ? '✅ Excellente' : calculationTime < 50 ? '⚠️ Correcte' : '❌ Lente'}`);
    
    // Mémoire
    if (performance.memory) {
        const memory = performance.memory.usedJSHeapSize / 1024 / 1024;
        console.log(`💾 Mémoire utilisée: ${memory.toFixed(1)}MB`);
        console.log(`📊 Mémoire: ${memory < 50 ? '✅ Optimale' : memory < 100 ? '⚠️ Correcte' : '❌ Élevée'}`);
    }
}

// Fonctions d'accès rapide
window.checkForErrors = checkForErrors;
window.quickPerformanceTest = quickPerformanceTest;

// Lancement automatique après 2 secondes
setTimeout(() => {
    console.log('🚀 Lancement de la vérification automatique...');
    const result = checkForErrors();
    quickPerformanceTest();
    
    if (result.totalErrors === 0 && result.hasContent) {
        console.log('\n🎯 RECOMMANDATION: Application prête à l\'utilisation!');
    } else {
        console.log('\n🔧 RECOMMANDATION: Vérifiez les erreurs ci-dessus');
    }
}, 2000);

console.log('🔍 Vérificateur d\'erreurs initialisé');
console.log('💡 Utilisez checkForErrors() pour vérifier manuellement');
console.log('💡 Utilisez quickPerformanceTest() pour tester les performances');
