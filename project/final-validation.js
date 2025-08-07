// Script de validation finale de la plateforme
// À exécuter dans la console du navigateur sur http://localhost:8001

console.log('🔍 VALIDATION FINALE DE LA PLATEFORME');
console.log('=====================================');

async function validatePlatform() {
    const results = {
        critical: [],
        important: [],
        minor: [],
        passed: 0,
        failed: 0
    };

    function test(name, condition, level = 'important', message = '') {
        const result = {
            name,
            passed: condition,
            message: message || (condition ? 'OK' : 'ÉCHEC'),
            level
        };

        results[level].push(result);
        
        if (condition) {
            results.passed++;
            console.log(`✅ ${name}: ${result.message}`);
        } else {
            results.failed++;
            console.log(`❌ ${name}: ${result.message}`);
        }
    }

    console.log('\n🔍 TESTS CRITIQUES (Fonctionnalités essentielles)');
    console.log('================================================');

    // Test 1: Application se charge
    test('Application chargée', 
        document.querySelector('body') !== null, 
        'critical', 
        'Interface utilisateur accessible');

    // Test 2: Projets visibles
    const projectCards = document.querySelectorAll('[class*="bg-white"][class*="rounded"]');
    test('Projets affichés', 
        projectCards.length > 0, 
        'critical', 
        `${projectCards.length} projets trouvés`);

    // Test 3: Navigation fonctionnelle
    if (projectCards.length > 0) {
        const firstProject = projectCards[0];
        const projectTitle = firstProject.querySelector('h3, h2, h1')?.textContent || '';
        
        // Simuler clic sur projet
        firstProject.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const detailButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
            btn.textContent && (btn.textContent.includes('Alertes') || btn.textContent.includes('Budget'))
        );
        
        test('Navigation vers détail', 
            detailButtons.length > 0, 
            'critical', 
            `Accès au détail du projet "${projectTitle}"`);
    }

    console.log('\n⚠️ TESTS IMPORTANTS (Fonctionnalités dynamiques)');
    console.log('===============================================');

    // Test 4: Boutons d'action présents
    const alertButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent && btn.textContent.includes('Alertes')
    );
    test('Bouton Alertes', 
        alertButton !== undefined, 
        'important', 
        'Configuration des alertes accessible');

    const editButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.querySelector('[data-lucide="edit"]') || btn.querySelector('[data-lucide="edit-2"]')
    );
    test('Bouton Édition', 
        editButton !== undefined, 
        'important', 
        'Modification de projet accessible');

    const budgetButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent && btn.textContent.includes('Budget')
    );
    test('Bouton Budget', 
        budgetButton !== undefined, 
        'important', 
        'Gestion budgétaire accessible');

    // Test 5: Alertes présentes
    const alertElements = document.querySelectorAll('[class*="alert"]');
    test('Alertes affichées', 
        alertElements.length > 0, 
        'important', 
        `${alertElements.length} alertes trouvées`);

    // Test 6: Informations projet
    const projectInfo = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (
            el.textContent.includes('Date de fin') ||
            el.textContent.includes('Budget') ||
            el.textContent.includes('Description')
        )
    );
    test('Informations projet', 
        projectInfo.length > 0, 
        'important', 
        `${projectInfo.length} éléments d'information trouvés`);

    console.log('\n💡 TESTS MINEURS (Améliorations)');
    console.log('===============================');

    // Test 7: Éléments visuels
    const progressElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.className && (
            el.className.includes('progress') ||
            el.className.includes('bg-green') ||
            el.className.includes('bg-blue')
        )
    );
    test('Éléments de progression', 
        progressElements.length > 0, 
        'minor', 
        `${progressElements.length} barres de progression trouvées`);

    // Test 8: Dates formatées
    const dateElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.match(/\d{1,2}\/\d{1,2}\/\d{4}/)
    );
    test('Dates formatées', 
        dateElements.length > 0, 
        'minor', 
        `${dateElements.length} dates bien formatées`);

    // Test 9: Montants budgétaires
    const budgetAmounts = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (el.textContent.includes('€') || el.textContent.includes('$'))
    );
    test('Montants budgétaires', 
        budgetAmounts.length > 0, 
        'minor', 
        `${budgetAmounts.length} montants affichés`);

    // Test 10: API des rubriques
    try {
        const response = await fetch('/api/rubriques');
        test('API Rubriques', 
            response.ok, 
            'minor', 
            `API accessible (status: ${response.status})`);
    } catch (error) {
        test('API Rubriques', 
            false, 
            'minor', 
            `Erreur API: ${error.message}`);
    }

    console.log('\n🧪 TESTS DE FONCTIONNALITÉ DYNAMIQUE');
    console.log('===================================');

    // Test 11: Test modal d'alertes
    if (alertButton) {
        alertButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
        const thresholdInput = modal ? modal.querySelector('input[type="number"]') : null;
        
        test('Modal alertes fonctionnel', 
            modal !== null, 
            'important', 
            'Modal de configuration s\'ouvre');
        
        test('Champ seuil présent', 
            thresholdInput !== null, 
            'important', 
            thresholdInput ? `Seuil actuel: ${thresholdInput.value}` : 'Champ non trouvé');
        
        // Fermer le modal
        if (modal) {
            const closeButton = modal.querySelector('button[class*="text-gray-400"]');
            if (closeButton) {
                closeButton.click();
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
    }

    // Test 12: Test modal d'édition
    if (editButton) {
        editButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
        const inputs = modal ? modal.querySelectorAll('input, textarea, select') : [];
        
        test('Modal édition fonctionnel', 
            modal !== null, 
            'important', 
            'Modal d\'édition s\'ouvre');
        
        test('Champs de modification', 
            inputs.length > 0, 
            'important', 
            `${inputs.length} champs de modification trouvés`);
        
        // Fermer le modal
        if (modal) {
            const closeButton = modal.querySelector('button[class*="text-gray-400"]') || 
                              Array.from(modal.querySelectorAll('button')).find(btn => 
                                  btn.textContent && btn.textContent.includes('Annuler')
                              );
            if (closeButton) {
                closeButton.click();
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
    }

    console.log('\n📊 RÉSULTATS DE LA VALIDATION');
    console.log('=============================');

    const total = results.passed + results.failed;
    const percentage = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

    console.log(`✅ Tests réussis: ${results.passed}`);
    console.log(`❌ Tests échoués: ${results.failed}`);
    console.log(`📊 Taux de réussite: ${percentage}%`);

    // Analyse par niveau
    const criticalFailed = results.critical.filter(t => !t.passed).length;
    const importantFailed = results.important.filter(t => !t.passed).length;
    const minorFailed = results.minor.filter(t => !t.passed).length;

    console.log('\n🎯 ANALYSE PAR NIVEAU:');
    console.log(`🔴 Critiques échoués: ${criticalFailed}/${results.critical.length}`);
    console.log(`🟡 Importants échoués: ${importantFailed}/${results.important.length}`);
    console.log(`🔵 Mineurs échoués: ${minorFailed}/${results.minor.length}`);

    // Verdict final
    console.log('\n🏆 VERDICT FINAL:');
    if (criticalFailed === 0 && importantFailed === 0) {
        console.log('🎉 EXCELLENT! La plateforme est entièrement fonctionnelle!');
    } else if (criticalFailed === 0 && importantFailed <= 2) {
        console.log('👍 TRÈS BIEN! La plateforme fonctionne avec quelques améliorations mineures.');
    } else if (criticalFailed === 0) {
        console.log('⚠️ BIEN! Fonctionnalités critiques OK, mais améliorations nécessaires.');
    } else {
        console.log('❌ PROBLÉMATIQUE! Des fonctionnalités critiques ne fonctionnent pas.');
    }

    // Détail des échecs critiques
    if (criticalFailed > 0) {
        console.log('\n🚨 ÉCHECS CRITIQUES À CORRIGER:');
        results.critical.filter(t => !t.passed).forEach(test => {
            console.log(`  • ${test.name}: ${test.message}`);
        });
    }

    // Détail des échecs importants
    if (importantFailed > 0) {
        console.log('\n⚠️ ÉCHECS IMPORTANTS À CORRIGER:');
        results.important.filter(t => !t.passed).forEach(test => {
            console.log(`  • ${test.name}: ${test.message}`);
        });
    }

    console.log('\n✅ VALIDATION TERMINÉE!');
    return results;
}

// Fonction d'accès rapide
window.validatePlatform = validatePlatform;

// Message d'aide
console.log('🔍 Validateur de plateforme chargé!');
console.log('💡 Utilisez validatePlatform() pour lancer la validation complète');
console.log('⚠️ Assurez-vous d\'être sur http://localhost:8001 pour les meilleurs résultats');

// Lancement automatique si demandé
if (window.location.search.includes('autorun')) {
    setTimeout(() => {
        console.log('🚀 Lancement automatique de la validation...');
        validatePlatform();
    }, 2000);
}
