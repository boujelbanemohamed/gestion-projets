// Test script pour vérifier les alertes dans l'application
// Ce script peut être exécuté dans la console du navigateur

console.log('🔔 Test des Alertes de Projet - Démarrage');

// Fonction pour tester les alertes
function testProjectAlerts() {
    console.log('\n=== Test des Fonctions d\'Alerte ===');
    
    // Simuler les fonctions d'alerte (normalement importées depuis alertsConfig.ts)
    const DEFAULT_ALERT_THRESHOLD = 7;
    
    const AlertSeverity = {
        INFO: 'info',
        WARNING: 'warning',
        DANGER: 'danger'
    };
    
    function isProjectApproachingDeadline(endDate, threshold = DEFAULT_ALERT_THRESHOLD) {
        if (!endDate) return false;
        const today = new Date();
        const daysUntilDeadline = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDeadline >= 0 && daysUntilDeadline <= threshold;
    }
    
    function isProjectOverdue(endDate) {
        if (!endDate) return false;
        const today = new Date();
        return endDate < today;
    }
    
    function getDaysUntilDeadline(endDate) {
        if (!endDate) return null;
        const today = new Date();
        return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    function getAlertMessage(daysUntilDeadline) {
        if (daysUntilDeadline === null) return '';
        
        if (daysUntilDeadline < 0) {
            return `Projet en dépassement de délai depuis ${Math.abs(daysUntilDeadline)} jour${Math.abs(daysUntilDeadline) > 1 ? 's' : ''}`;
        } else if (daysUntilDeadline === 0) {
            return 'Ce projet arrive à échéance aujourd\'hui';
        } else {
            return `Ce projet arrive à échéance dans ${daysUntilDeadline} jour${daysUntilDeadline > 1 ? 's' : ''}`;
        }
    }
    
    function getAlertSeverity(daysUntilDeadline) {
        if (daysUntilDeadline === null) return AlertSeverity.INFO;
        
        if (daysUntilDeadline < 0) {
            return AlertSeverity.DANGER;
        } else if (daysUntilDeadline <= 2) {
            return AlertSeverity.DANGER;
        } else if (daysUntilDeadline <= 5) {
            return AlertSeverity.WARNING;
        } else {
            return AlertSeverity.INFO;
        }
    }
    
    // Tests avec différentes dates
    const testCases = [
        {
            name: 'Projet dans 5 jours',
            date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            expectedApproaching: true,
            expectedOverdue: false
        },
        {
            name: 'Projet en retard de 3 jours',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            expectedApproaching: false,
            expectedOverdue: true
        },
        {
            name: 'Projet aujourd\'hui',
            date: new Date(),
            expectedApproaching: true,
            expectedOverdue: false
        },
        {
            name: 'Projet dans 15 jours',
            date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            expectedApproaching: false,
            expectedOverdue: false
        }
    ];
    
    let passedTests = 0;
    let totalTests = testCases.length * 3; // 3 tests par cas
    
    testCases.forEach((testCase, index) => {
        console.log(`\n--- Test ${index + 1}: ${testCase.name} ---`);
        
        const isApproaching = isProjectApproachingDeadline(testCase.date);
        const isOverdue = isProjectOverdue(testCase.date);
        const daysUntil = getDaysUntilDeadline(testCase.date);
        const message = getAlertMessage(daysUntil);
        const severity = getAlertSeverity(daysUntil);
        
        console.log(`Date: ${testCase.date.toLocaleDateString('fr-FR')}`);
        console.log(`Jours jusqu'à l'échéance: ${daysUntil}`);
        console.log(`Message: "${message}"`);
        console.log(`Sévérité: ${severity}`);
        
        // Test 1: isApproaching
        if (isApproaching === testCase.expectedApproaching) {
            console.log(`✅ isApproaching: ${isApproaching} (attendu: ${testCase.expectedApproaching})`);
            passedTests++;
        } else {
            console.log(`❌ isApproaching: ${isApproaching} (attendu: ${testCase.expectedApproaching})`);
        }
        
        // Test 2: isOverdue
        if (isOverdue === testCase.expectedOverdue) {
            console.log(`✅ isOverdue: ${isOverdue} (attendu: ${testCase.expectedOverdue})`);
            passedTests++;
        } else {
            console.log(`❌ isOverdue: ${isOverdue} (attendu: ${testCase.expectedOverdue})`);
        }
        
        // Test 3: Message non vide
        if (message && message.length > 0) {
            console.log(`✅ Message généré: "${message}"`);
            passedTests++;
        } else {
            console.log(`❌ Aucun message généré`);
        }
    });
    
    console.log(`\n=== Résultats des Tests ===`);
    console.log(`Tests réussis: ${passedTests}/${totalTests}`);
    console.log(`Pourcentage de réussite: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 Tous les tests sont passés! Les alertes fonctionnent correctement.');
    } else {
        console.log('⚠️ Certains tests ont échoué. Vérifiez la logique des alertes.');
    }
    
    return {
        passed: passedTests,
        total: totalTests,
        success: passedTests === totalTests
    };
}

// Fonction pour tester l'interface utilisateur
function testAlertUI() {
    console.log('\n=== Test de l\'Interface des Alertes ===');
    
    // Vérifier si les éléments d'alerte sont présents dans le DOM
    const alertElements = document.querySelectorAll('[class*="alert"]');
    const bellIcons = document.querySelectorAll('[data-lucide="bell"]');
    const configButtons = document.querySelectorAll('button:contains("Configurer")');
    
    console.log(`Éléments d'alerte trouvés: ${alertElements.length}`);
    console.log(`Icônes de cloche trouvées: ${bellIcons.length}`);
    
    // Vérifier si le bouton "Alertes" est présent dans la barre d'outils
    const alertButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent && btn.textContent.includes('Alertes')
    );
    
    if (alertButton) {
        console.log('✅ Bouton "Alertes" trouvé dans la barre d\'outils');
        
        // Simuler un clic pour tester l'ouverture du modal
        console.log('🔄 Test d\'ouverture du modal de configuration...');
        alertButton.click();
        
        // Vérifier si le modal s'ouvre
        setTimeout(() => {
            const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
            if (modal) {
                console.log('✅ Modal de configuration des alertes ouvert avec succès');
                
                // Fermer le modal
                const closeButton = modal.querySelector('button[class*="text-gray-400"]');
                if (closeButton) {
                    closeButton.click();
                    console.log('✅ Modal fermé avec succès');
                }
            } else {
                console.log('❌ Modal de configuration non trouvé');
            }
        }, 100);
        
    } else {
        console.log('❌ Bouton "Alertes" non trouvé dans la barre d\'outils');
    }
    
    return {
        alertElements: alertElements.length,
        bellIcons: bellIcons.length,
        alertButton: !!alertButton
    };
}

// Fonction pour tester les seuils personnalisés
function testCustomThresholds() {
    console.log('\n=== Test des Seuils Personnalisés ===');
    
    const testDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // Dans 10 jours
    const thresholds = [3, 7, 14, 30];
    
    thresholds.forEach(threshold => {
        // Simuler isProjectApproachingDeadline avec seuil personnalisé
        const today = new Date();
        const daysUntilDeadline = Math.ceil((testDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isApproaching = daysUntilDeadline >= 0 && daysUntilDeadline <= threshold;
        
        const expected = threshold >= 10; // Le projet est dans 10 jours
        const result = isApproaching === expected ? '✅' : '❌';
        
        console.log(`${result} Seuil ${threshold} jours: ${isApproaching ? 'Alerte' : 'Pas d\'alerte'} (attendu: ${expected ? 'Alerte' : 'Pas d\'alerte'})`);
    });
}

// Exécuter tous les tests
function runAllTests() {
    console.log('🚀 Démarrage de tous les tests des alertes...\n');
    
    const functionalTests = testProjectAlerts();
    const uiTests = testAlertUI();
    testCustomThresholds();
    
    console.log('\n=== Résumé Global ===');
    console.log(`Tests fonctionnels: ${functionalTests.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Interface utilisateur: ${uiTests.alertButton ? '✅ PASS' : '❌ FAIL'}`);
    
    return {
        functional: functionalTests,
        ui: uiTests
    };
}

// Exporter les fonctions pour utilisation dans la console
window.testProjectAlerts = testProjectAlerts;
window.testAlertUI = testAlertUI;
window.testCustomThresholds = testCustomThresholds;
window.runAllTests = runAllTests;

// Exécuter automatiquement si le script est chargé
if (typeof window !== 'undefined') {
    console.log('📋 Script de test des alertes chargé.');
    console.log('💡 Utilisez runAllTests() dans la console pour exécuter tous les tests.');
    console.log('💡 Ou utilisez testProjectAlerts(), testAlertUI(), testCustomThresholds() individuellement.');
}
