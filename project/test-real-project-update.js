// Script de test pour vérifier les mises à jour dynamiques du projet
// À exécuter dans la console du navigateur sur http://localhost:8001

console.log('🔄 Test des Mises à Jour Dynamiques du Projet');

function testProjectUpdate() {
    console.log('\n=== Test des Mises à Jour Dynamiques ===');
    
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
            console.log('🔍 Recherche d\'un projet...');
            
            // Chercher un projet
            const projectCards = document.querySelectorAll('[class*="bg-white"][class*="rounded"]');
            let projectCard = null;
            
            for (const card of projectCards) {
                const titleElement = card.querySelector('h3, h2, h1');
                if (titleElement && titleElement.textContent.includes('Site E-commerce')) {
                    projectCard = card;
                    break;
                }
            }
            
            if (!projectCard) {
                console.log('❌ Projet "Site E-commerce" non trouvé sur la page d\'accueil');
                console.log('💡 Essayez de naviguer vers un projet spécifique');
                return;
            }
            
            console.log('✅ Projet trouvé');
            
            // Capturer l'état initial
            const initialTitle = document.querySelector('h1, h2')?.textContent || '';
            console.log(`📊 Titre initial: "${initialTitle}"`);
            
            // Cliquer sur le projet pour ouvrir les détails
            console.log('🔄 Ouverture du projet...');
            clickElement(projectCard);
            
            // Attendre que la page de détail se charge
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Chercher le bouton "Modifier" ou l'icône d'édition
            console.log('🔍 Recherche du bouton de modification...');
            const editButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent && (
                    btn.textContent.includes('Modifier') ||
                    btn.textContent.includes('Éditer') ||
                    btn.querySelector('[data-lucide="edit"]') ||
                    btn.querySelector('[data-lucide="edit-2"]')
                )
            );
            
            if (!editButton) {
                console.log('❌ Bouton de modification non trouvé');
                console.log('🔍 Boutons disponibles:');
                document.querySelectorAll('button').forEach((btn, index) => {
                    if (btn.textContent) {
                        console.log(`  ${index + 1}. "${btn.textContent.trim()}"`);
                    }
                });
                return;
            }
            
            console.log('✅ Bouton de modification trouvé');
            
            // Cliquer sur le bouton de modification
            console.log('🔄 Ouverture du modal de modification...');
            clickElement(editButton);
            
            // Attendre que le modal s'ouvre
            await waitForElement('[class*="fixed"][class*="inset-0"]');
            console.log('✅ Modal de modification ouvert');
            
            // Chercher les champs de modification
            const nameInput = document.querySelector('input[type="text"]');
            const descriptionInput = document.querySelector('textarea');
            const startDateInput = document.querySelector('input[type="date"]');
            const budgetInput = document.querySelector('input[type="number"]');
            
            if (!nameInput) {
                console.log('❌ Champ nom non trouvé');
                return;
            }
            
            console.log('✅ Champs de modification trouvés');
            
            // Sauvegarder les valeurs originales
            const originalValues = {
                name: nameInput.value,
                description: descriptionInput?.value || '',
                startDate: startDateInput?.value || '',
                budget: budgetInput?.value || ''
            };
            
            console.log('📊 Valeurs originales:', originalValues);
            
            // Modifier les valeurs
            const newValues = {
                name: 'Site E-commerce MODIFIÉ',
                description: 'Description modifiée pour test',
                startDate: '2024-02-01',
                budget: '75000'
            };
            
            console.log('🔄 Modification des valeurs...');
            
            if (nameInput) {
                nameInput.value = newValues.name;
                nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                nameInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            if (descriptionInput) {
                descriptionInput.value = newValues.description;
                descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
                descriptionInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            if (startDateInput) {
                startDateInput.value = newValues.startDate;
                startDateInput.dispatchEvent(new Event('input', { bubbles: true }));
                startDateInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            if (budgetInput) {
                budgetInput.value = newValues.budget;
                budgetInput.dispatchEvent(new Event('input', { bubbles: true }));
                budgetInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            console.log('✅ Valeurs modifiées');
            
            // Chercher le bouton "Enregistrer"
            const saveButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent && (
                    btn.textContent.includes('Enregistrer') ||
                    btn.textContent.includes('Sauvegarder') ||
                    btn.textContent.includes('Save')
                )
            );
            
            if (!saveButton) {
                console.log('❌ Bouton "Enregistrer" non trouvé');
                return;
            }
            
            console.log('🔄 Sauvegarde des modifications...');
            clickElement(saveButton);
            
            // Attendre que le modal se ferme
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Vérifier les changements dans l'interface
            console.log('🔍 Vérification des changements...');
            
            const updatedTitle = document.querySelector('h1, h2')?.textContent || '';
            console.log(`📊 Titre après modification: "${updatedTitle}"`);
            
            // Vérifier si le titre a changé
            if (updatedTitle.includes('MODIFIÉ')) {
                console.log('✅ Le titre a été mis à jour dynamiquement');
            } else {
                console.log('⚠️ Le titre ne semble pas avoir été mis à jour');
            }
            
            // Chercher d'autres éléments qui auraient dû changer
            const descriptionElements = Array.from(document.querySelectorAll('*')).filter(el => 
                el.textContent && el.textContent.includes('Description modifiée')
            );
            
            if (descriptionElements.length > 0) {
                console.log('✅ La description a été mise à jour dynamiquement');
            } else {
                console.log('⚠️ La description ne semble pas avoir été mise à jour');
            }
            
            // Vérifier les alertes (si les dates ont changé)
            const alertElements = document.querySelectorAll('[class*="alert"]');
            console.log(`📊 Alertes après modification: ${alertElements.length}`);
            
            // Vérifier le budget
            const budgetElements = Array.from(document.querySelectorAll('*')).filter(el => 
                el.textContent && el.textContent.includes('75')
            );
            
            if (budgetElements.length > 0) {
                console.log('✅ Le budget semble avoir été mis à jour');
            } else {
                console.log('⚠️ Le budget ne semble pas avoir été mis à jour');
            }
            
            console.log('\n🎉 Test terminé !');
            console.log('📋 Résumé:');
            console.log(`  • Titre: ${updatedTitle.includes('MODIFIÉ') ? '✅' : '❌'}`);
            console.log(`  • Description: ${descriptionElements.length > 0 ? '✅' : '❌'}`);
            console.log(`  • Budget: ${budgetElements.length > 0 ? '✅' : '❌'}`);
            
        } catch (error) {
            console.error('❌ Erreur pendant le test:', error);
        }
    }
    
    return runTest();
}

// Fonction pour tester les changements de dates et leur impact sur les alertes
function testDateChangeAlerts() {
    console.log('\n=== Test Impact des Dates sur les Alertes ===');
    
    // Cette fonction pourrait être étendue pour tester spécifiquement
    // l'impact des changements de dates sur les alertes
    console.log('💡 Test à implémenter: changement de dates et impact sur les alertes');
}

// Fonction pour tester les changements de budget
function testBudgetChanges() {
    console.log('\n=== Test Changements de Budget ===');
    
    // Cette fonction pourrait être étendue pour tester spécifiquement
    // l'impact des changements de budget sur l'affichage
    console.log('💡 Test à implémenter: changement de budget et mise à jour de la barre de progression');
}

// Exporter les fonctions pour utilisation dans la console
window.testProjectUpdate = testProjectUpdate;
window.testDateChangeAlerts = testDateChangeAlerts;
window.testBudgetChanges = testBudgetChanges;

// Fonction principale
window.runAllProjectUpdateTests = function() {
    console.log('🚀 Démarrage de tous les tests de mise à jour du projet...\n');
    
    testProjectUpdate().then(() => {
        testDateChangeAlerts();
        testBudgetChanges();
        
        console.log('\n=== Résumé des Tests ===');
        console.log('✅ Tests de mise à jour: Terminé');
        console.log('💡 Tests des dates: À implémenter');
        console.log('💡 Tests du budget: À implémenter');
        console.log('\n🎯 Tous les tests sont terminés !');
    }).catch(error => {
        console.error('❌ Erreur dans les tests:', error);
    });
};

// Message d'aide
console.log('📋 Script de test des mises à jour du projet chargé.');
console.log('💡 Utilisez runAllProjectUpdateTests() pour exécuter tous les tests.');
console.log('💡 Ou utilisez testProjectUpdate(), testDateChangeAlerts(), testBudgetChanges() individuellement.');
console.log('⚠️ Assurez-vous d\'être sur la page d\'accueil avec le projet "Site E-commerce".');
