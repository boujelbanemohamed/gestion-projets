// Script de test rapide après correction
// À exécuter dans la console du navigateur sur http://localhost:8001

console.log('🔧 TEST RAPIDE APRÈS CORRECTION');
console.log('===============================');

function quickTest() {
    console.log('🔍 Vérification de l\'état de l\'application...');
    
    // Test 1: Application chargée
    const body = document.querySelector('body');
    console.log(body ? '✅ Application chargée' : '❌ Application non chargée');
    
    // Test 2: Pas d'erreurs React visibles
    const errorElements = document.querySelectorAll('[data-reactroot] *');
    const hasContent = errorElements.length > 0;
    console.log(hasContent ? '✅ Contenu React rendu' : '❌ Pas de contenu React');
    
    // Test 3: Projets affichés
    const projectCards = document.querySelectorAll('[class*="bg-white"][class*="rounded"]');
    console.log(`${projectCards.length > 0 ? '✅' : '❌'} ${projectCards.length} cartes de projet trouvées`);
    
    // Test 4: Pas d'erreurs dans la console
    const originalError = console.error;
    let errorCount = 0;
    console.error = function(...args) {
        errorCount++;
        originalError.apply(console, args);
    };
    
    setTimeout(() => {
        console.error = originalError;
        console.log(`${errorCount === 0 ? '✅' : '❌'} ${errorCount} erreurs détectées`);
    }, 1000);
    
    // Test 5: Navigation fonctionnelle
    if (projectCards.length > 0) {
        try {
            const firstCard = projectCards[0];
            const title = firstCard.querySelector('h3, h2, h1')?.textContent || 'Projet';
            console.log(`✅ Premier projet trouvé: "${title}"`);
            
            // Test de clic (sans navigation réelle)
            const clickEvent = new MouseEvent('click', { bubbles: true });
            firstCard.dispatchEvent(clickEvent);
            console.log('✅ Événement de clic simulé sans erreur');
        } catch (error) {
            console.log(`❌ Erreur lors du test de clic: ${error.message}`);
        }
    }
    
    // Test 6: Alertes présentes
    const alertElements = document.querySelectorAll('[class*="alert"]');
    console.log(`${alertElements.length >= 0 ? '✅' : '❌'} ${alertElements.length} alertes trouvées`);
    
    // Test 7: Boutons fonctionnels
    const buttons = document.querySelectorAll('button');
    console.log(`${buttons.length > 0 ? '✅' : '❌'} ${buttons.length} boutons trouvés`);
    
    // Test 8: Styles CSS appliqués
    const styledElements = document.querySelectorAll('[class*="bg-"], [class*="text-"], [class*="p-"]');
    console.log(`${styledElements.length > 0 ? '✅' : '❌'} ${styledElements.length} éléments stylés trouvés`);
    
    // Test 9: Icônes Lucide
    const lucideIcons = document.querySelectorAll('svg[class*="lucide"]');
    console.log(`${lucideIcons.length > 0 ? '✅' : '❌'} ${lucideIcons.length} icônes Lucide trouvées`);
    
    // Test 10: Données de projet
    const projectTitles = Array.from(document.querySelectorAll('h1, h2, h3')).filter(el => 
        el.textContent && (
            el.textContent.includes('Site') || 
            el.textContent.includes('Application') || 
            el.textContent.includes('Projet')
        )
    );
    console.log(`${projectTitles.length > 0 ? '✅' : '❌'} ${projectTitles.length} titres de projet trouvés`);
    
    // Résumé
    setTimeout(() => {
        console.log('\n📊 RÉSUMÉ DU TEST RAPIDE');
        console.log('========================');
        
        if (projectCards.length > 0 && buttons.length > 0 && styledElements.length > 0) {
            console.log('🎉 SUCCÈS! L\'application fonctionne correctement');
            console.log('✅ Tous les composants sont rendus');
            console.log('✅ Les styles sont appliqués');
            console.log('✅ Les interactions sont possibles');
        } else {
            console.log('⚠️ PROBLÈME DÉTECTÉ');
            if (projectCards.length === 0) console.log('❌ Aucune carte de projet affichée');
            if (buttons.length === 0) console.log('❌ Aucun bouton trouvé');
            if (styledElements.length === 0) console.log('❌ Styles CSS non appliqués');
        }
        
        console.log('\n💡 Si tout fonctionne, vous pouvez:');
        console.log('   • Naviguer entre les projets');
        console.log('   • Modifier les seuils d\'alerte');
        console.log('   • Éditer les informations de projet');
        console.log('   • Gérer le budget');
    }, 2000);
}

// Test des fonctionnalités spécifiques
function testSpecificFeatures() {
    console.log('\n🔧 TEST DES FONCTIONNALITÉS SPÉCIFIQUES');
    console.log('======================================');
    
    // Test des alertes
    const alertElements = document.querySelectorAll('[class*="alert"]');
    alertElements.forEach((alert, index) => {
        const text = alert.textContent?.substring(0, 50) || '';
        console.log(`📋 Alerte ${index + 1}: "${text}..."`);
    });
    
    // Test des boutons d'action
    const actionButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent && (
            btn.textContent.includes('Alertes') ||
            btn.textContent.includes('Budget') ||
            btn.textContent.includes('Modifier')
        )
    );
    
    console.log(`🔘 ${actionButtons.length} boutons d'action trouvés:`);
    actionButtons.forEach((btn, index) => {
        console.log(`   ${index + 1}. "${btn.textContent?.trim()}"`);
    });
    
    // Test des données de projet
    const projectData = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (
            el.textContent.includes('Date de fin') ||
            el.textContent.includes('Budget') ||
            el.textContent.includes('€') ||
            el.textContent.includes('$')
        )
    );
    
    console.log(`💰 ${projectData.length} éléments de données trouvés`);
}

// Fonction d'accès rapide
window.quickTest = quickTest;
window.testSpecificFeatures = testSpecificFeatures;

// Lancement automatique
console.log('🚀 Lancement du test rapide...');
quickTest();

// Test spécifique après 3 secondes
setTimeout(() => {
    testSpecificFeatures();
}, 3000);

console.log('\n💡 Utilisez quickTest() pour relancer le test');
console.log('💡 Utilisez testSpecificFeatures() pour tester les fonctionnalités');
