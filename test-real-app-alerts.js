// Script de test pour vérifier les alertes dynamiques dans l'application réelle
// À exécuter dans la console du navigateur sur http://localhost:8001

console.log('🔔 Test des Alertes Dynamiques - Application Réelle');

function testDynamicAlerts() {
    console.log('\n=== Test des Alertes Dynamiques ===');
    
    // Fonction pour attendre qu'un élément apparaisse
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }
    
    // Fonction pour simuler un clic
    function clickElement(element) {
        const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(event);
    }
    
    // Test principal
    async function runTest() {
        try {
            console.log('🔍 Recherche d\'un projet avec alerte...');
            
            // Chercher un projet avec une date proche
            const projectCards = document.querySelectorAll('[class*="bg-white"][class*="rounded"]');
            let projectWithAlert = null;
            
            for (const card of projectCards) {
                const alertElement = card.querySelector('[class*="alert"]');
                if (alertElement && alertElement.textContent.includes('échéance')) {
                    projectWithAlert = card;
                    break;
                }
            }
            
            if (!projectWithAlert) {
                console.log('❌ Aucun projet avec alerte trouvé sur la page d\'accueil');
                console.log('💡 Essayez de naviguer vers un projet spécifique');
                return;
            }
            
            console.log('✅ Projet avec alerte trouvé');
            
            // Cliquer sur le projet pour ouvrir les détails
            console.log('🔄 Ouverture du projet...');
            clickElement(projectWithAlert);
            
            // Attendre que la page de détail se charge
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Chercher le bouton "Alertes"
            console.log('🔍 Recherche du bouton Alertes...');
            const alertButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent && btn.textContent.includes('Alertes')
            );
            
            if (!alertButton) {
                console.log('❌ Bouton "Alertes" non trouvé');
                return;
            }
            
            console.log('✅ Bouton "Alertes" trouvé');
            
            // Capturer l'état initial des alertes
            const initialAlerts = document.querySelectorAll('[class*="alert"]');
            const initialAlertTexts = Array.from(initialAlerts).map(alert => alert.textContent);
            
            console.log(`📊 État initial: ${initialAlerts.length} alerte(s) trouvée(s)`);
            initialAlertTexts.forEach((text, index) => {
                console.log(`  ${index + 1}. ${text.substring(0, 100)}...`);
            });
            
            // Cliquer sur le bouton Alertes
            console.log('🔄 Ouverture du modal de configuration...');
            clickElement(alertButton);
            
            // Attendre que le modal s'ouvre
            await waitForElement('[class*="fixed"][class*="inset-0"]');
            console.log('✅ Modal de configuration ouvert');
            
            // Chercher le champ de seuil
            const thresholdInput = document.querySelector('input[type="number"]');
            if (!thresholdInput) {
                console.log('❌ Champ de seuil non trouvé');
                return;
            }
            
            const originalThreshold = thresholdInput.value;
            console.log(`📊 Seuil original: ${originalThreshold} jours`);
            
            // Tester différents seuils
            const testThresholds = [3, 14, 30];
            
            for (const newThreshold of testThresholds) {
                console.log(`\n🔄 Test avec seuil: ${newThreshold} jours`);
                
                // Changer la valeur
                thresholdInput.value = newThreshold;
                thresholdInput.dispatchEvent(new Event('input', { bubbles: true }));
                thresholdInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Sauvegarder
                const saveButton = Array.from(document.querySelectorAll('button')).find(btn => 
                    btn.textContent && btn.textContent.includes('Enregistrer')
                );
                
                if (saveButton) {
                    clickElement(saveButton);
                    console.log(`✅ Seuil changé à ${newThreshold} jours`);
                    
                    // Attendre que le modal se ferme
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Vérifier les changements
                    const updatedAlerts = document.querySelectorAll('[class*="alert"]');
                    const updatedAlertTexts = Array.from(updatedAlerts).map(alert => alert.textContent);
                    
                    console.log(`📊 Après changement: ${updatedAlerts.length} alerte(s)`);
                    
                    // Comparer avec l'état initial
                    const alertsChanged = updatedAlerts.length !== initialAlerts.length ||
                                        updatedAlertTexts.some((text, index) => text !== initialAlertTexts[index]);
                    
                    if (alertsChanged) {
                        console.log('✅ Les alertes ont été mises à jour dynamiquement');
                        updatedAlertTexts.forEach((text, index) => {
                            console.log(`  ${index + 1}. ${text.substring(0, 100)}...`);
                        });
                    } else {
                        console.log('⚠️ Aucun changement détecté dans les alertes');
                    }
                    
                    // Rouvrir le modal pour le test suivant
                    if (newThreshold !== testThresholds[testThresholds.length - 1]) {
                        clickElement(alertButton);
                        await waitForElement('input[type="number"]');
                    }
                } else {
                    console.log('❌ Bouton "Enregistrer" non trouvé');
                    break;
                }
            }
            
            console.log('\n🎉 Test terminé avec succès !');
            
        } catch (error) {
            console.error('❌ Erreur pendant le test:', error);
        }
    }
    
    return runTest();
}

// Fonction pour tester les couleurs des alertes
function testAlertColors() {
    console.log('\n=== Test des Couleurs d\'Alerte ===');
    
    const alerts = document.querySelectorAll('[class*="alert"]');
    const colorMap = {
        'red': 'DANGER',
        'orange': 'WARNING', 
        'yellow': 'WARNING',
        'blue': 'INFO',
        'green': 'SUCCESS'
    };
    
    alerts.forEach((alert, index) => {
        const classes = alert.className;
        let detectedColor = 'UNKNOWN';
        
        for (const [color, severity] of Object.entries(colorMap)) {
            if (classes.includes(color)) {
                detectedColor = severity;
                break;
            }
        }
        
        console.log(`Alerte ${index + 1}: ${detectedColor} - "${alert.textContent.substring(0, 50)}..."`);
    });
}

// Fonction pour tester la persistance des paramètres
function testSettingsPersistence() {
    console.log('\n=== Test de Persistance des Paramètres ===');
    
    // Cette fonction pourrait être étendue pour tester la sauvegarde en base de données
    console.log('💡 Test de persistance à implémenter avec la base de données');
}

// Exporter les fonctions pour utilisation dans la console
window.testDynamicAlerts = testDynamicAlerts;
window.testAlertColors = testAlertColors;
window.testSettingsPersistence = testSettingsPersistence;

// Fonction principale
window.runAllAlertTests = function() {
    console.log('🚀 Démarrage de tous les tests d\'alertes...\n');
    
    testDynamicAlerts().then(() => {
        testAlertColors();
        testSettingsPersistence();
        
        console.log('\n=== Résumé des Tests ===');
        console.log('✅ Tests des alertes dynamiques: Terminé');
        console.log('✅ Tests des couleurs: Terminé');
        console.log('💡 Tests de persistance: À implémenter');
        console.log('\n🎯 Tous les tests sont terminés !');
    }).catch(error => {
        console.error('❌ Erreur dans les tests:', error);
    });
};

// Message d'aide
console.log('📋 Script de test des alertes chargé.');
console.log('💡 Utilisez runAllAlertTests() pour exécuter tous les tests.');
console.log('💡 Ou utilisez testDynamicAlerts(), testAlertColors() individuellement.');
console.log('⚠️ Assurez-vous d\'être sur la page d\'un projet avec des alertes.');
