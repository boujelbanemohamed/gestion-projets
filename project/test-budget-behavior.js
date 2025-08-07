// Script de test pour vérifier le comportement du budget
// À exécuter dans la console du navigateur sur http://localhost:8001

console.log('💰 TEST DU COMPORTEMENT BUDGÉTAIRE');
console.log('==================================');

async function testBudgetBehavior() {
    const results = {
        newProject: { tested: false, hasAutomaticExpenses: false, success: false },
        existingProject: { tested: false, hasAutomaticExpenses: false, success: false },
        budgetModal: { tested: false, hasAutomaticExpenses: false, success: false }
    };

    function log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    function clickAndWait(element, waitTime = 1000) {
        return new Promise((resolve) => {
            if (element) {
                const event = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                element.dispatchEvent(event);
            }
            setTimeout(resolve, waitTime);
        });
    }

    function countExpenseElements(container) {
        if (!container) return 0;
        
        // Chercher différents types d'éléments qui pourraient représenter des dépenses
        const expenseRows = container.querySelectorAll('[class*="expense"], [class*="depense"], tr:not(:first-child)');
        const expenseItems = container.querySelectorAll('li:not(:empty)');
        const expenseCards = container.querySelectorAll('[class*="bg-gray"], [class*="bg-white"]:not([class*="modal"])');
        
        // Chercher des montants (€, $, etc.)
        const amountElements = Array.from(container.querySelectorAll('*')).filter(el => 
            el.textContent && (
                el.textContent.includes('€') ||
                el.textContent.includes('$') ||
                el.textContent.includes('£') ||
                el.textContent.match(/\d+[,.]?\d*\s*(EUR|USD|GBP)/)
            )
        );

        return Math.max(expenseRows.length, expenseItems.length, expenseCards.length, amountElements.length);
    }

    log('🔍 Test du comportement des dépenses automatiques');

    // Test 1: Nouveau projet sans budget
    log('\n📝 Test 1: Création d\'un nouveau projet');
    try {
        const createButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent && (
                btn.textContent.includes('Nouveau') ||
                btn.textContent.includes('Créer') ||
                btn.textContent.includes('Ajouter')
            )
        );

        if (createButton) {
            log('🔄 Ouverture du modal de création...');
            await clickAndWait(createButton, 1500);

            const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
            if (modal) {
                // Vérifier qu'il n'y a pas de dépenses pré-remplies
                const expenseCount = countExpenseElements(modal);
                results.newProject = {
                    tested: true,
                    hasAutomaticExpenses: expenseCount > 0,
                    success: expenseCount === 0
                };

                log(expenseCount === 0 ? 
                    '✅ Nouveau projet: Aucune dépense automatique' : 
                    `❌ Nouveau projet: ${expenseCount} dépense(s) automatique(s) détectée(s)`);

                // Fermer le modal
                const closeButton = modal.querySelector('button[class*="text-gray-400"]') ||
                                  Array.from(modal.querySelectorAll('button')).find(btn => 
                                      btn.textContent && btn.textContent.includes('Annuler')
                                  );
                if (closeButton) {
                    await clickAndWait(closeButton, 500);
                }
            } else {
                log('❌ Modal de création non ouvert');
            }
        } else {
            log('⚠️ Bouton de création non trouvé');
        }
    } catch (error) {
        log(`❌ Erreur lors du test de création: ${error.message}`, 'error');
    }

    // Test 2: Projet existant - vérifier le budget
    log('\n📊 Test 2: Projet existant avec budget');
    try {
        const projectCards = document.querySelectorAll('[class*="bg-white"][class*="rounded"]');
        if (projectCards.length > 0) {
            // Cliquer sur le premier projet
            await clickAndWait(projectCards[0], 1000);

            // Chercher des éléments de budget dans la page
            const budgetElements = Array.from(document.querySelectorAll('*')).filter(el => 
                el.textContent && (
                    el.textContent.includes('Budget') ||
                    el.textContent.includes('€') ||
                    el.textContent.includes('$')
                )
            );

            const expenseCount = countExpenseElements(document);
            results.existingProject = {
                tested: true,
                hasAutomaticExpenses: expenseCount > 2, // Plus de 2 car il peut y avoir des éléments UI
                success: expenseCount <= 2
            };

            log(`📊 Projet existant: ${budgetElements.length} éléments budgétaires, ${expenseCount} dépenses potentielles`);
            log(expenseCount <= 2 ? 
                '✅ Projet existant: Pas de dépenses automatiques excessives' : 
                `⚠️ Projet existant: ${expenseCount} dépenses détectées (peut être normal)`);

        } else {
            log('⚠️ Aucun projet trouvé pour le test');
        }
    } catch (error) {
        log(`❌ Erreur lors du test de projet existant: ${error.message}`, 'error');
    }

    // Test 3: Modal de budget
    log('\n💰 Test 3: Modal de budget');
    try {
        const budgetButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent && btn.textContent.includes('Budget')
        );

        if (budgetButton) {
            log('🔄 Ouverture du modal de budget...');
            await clickAndWait(budgetButton, 1500);

            const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
            if (modal) {
                // Attendre que le contenu se charge
                await new Promise(resolve => setTimeout(resolve, 1000));

                const expenseCount = countExpenseElements(modal);
                results.budgetModal = {
                    tested: true,
                    hasAutomaticExpenses: expenseCount > 0,
                    success: expenseCount === 0
                };

                log(expenseCount === 0 ? 
                    '✅ Modal budget: Aucune dépense automatique' : 
                    `❌ Modal budget: ${expenseCount} dépense(s) automatique(s) détectée(s)`);

                // Chercher spécifiquement des lignes de dépenses
                const expenseRows = modal.querySelectorAll('tr:not(:first-child), [class*="expense-row"]');
                const expenseList = modal.querySelectorAll('li:not(:empty)');
                
                if (expenseRows.length > 0) {
                    log(`📋 ${expenseRows.length} ligne(s) de dépense dans le tableau`);
                }
                if (expenseList.length > 0) {
                    log(`📋 ${expenseList.length} élément(s) de dépense dans la liste`);
                }

                // Fermer le modal
                const closeButton = modal.querySelector('button[class*="text-gray-400"]');
                if (closeButton) {
                    await clickAndWait(closeButton, 500);
                }
            } else {
                log('❌ Modal de budget non ouvert');
            }
        } else {
            log('⚠️ Bouton Budget non trouvé');
        }
    } catch (error) {
        log(`❌ Erreur lors du test de budget: ${error.message}`, 'error');
    }

    // Résumé des résultats
    log('\n📊 RÉSUMÉ DES TESTS');
    log('==================');

    const totalTested = Object.values(results).filter(r => r.tested).length;
    const totalSuccess = Object.values(results).filter(r => r.success).length;

    log(`🧪 Tests effectués: ${totalTested}/3`);
    log(`✅ Tests réussis: ${totalSuccess}/${totalTested}`);

    Object.entries(results).forEach(([test, result]) => {
        const testNames = {
            newProject: 'Nouveau projet',
            existingProject: 'Projet existant',
            budgetModal: 'Modal budget'
        };
        
        if (result.tested) {
            const status = result.success ? '✅ OK' : '❌ Problème';
            const detail = result.hasAutomaticExpenses ? 'Dépenses automatiques détectées' : 'Pas de dépenses automatiques';
            log(`${testNames[test]}: ${status} - ${detail}`);
        } else {
            log(`${testNames[test]}: ⏭️ Non testé`);
        }
    });

    // Verdict final
    log('\n🏆 VERDICT FINAL:');
    if (totalSuccess === totalTested && totalTested >= 2) {
        log('🎉 PARFAIT! Aucune dépense automatique détectée');
        log('✅ Le problème a été résolu avec succès');
    } else if (totalSuccess >= totalTested * 0.7) {
        log('👍 BIEN! La plupart des tests sont OK');
        log('⚠️ Quelques dépenses automatiques peuvent subsister');
    } else {
        log('❌ PROBLÈME! Des dépenses automatiques sont encore présentes');
        log('🔧 Vérification supplémentaire nécessaire');
    }

    // Recommandations
    log('\n💡 RECOMMANDATIONS:');
    if (results.budgetModal.hasAutomaticExpenses) {
        log('🔧 Vérifier le modal de budget - des dépenses s\'ajoutent automatiquement');
    }
    if (results.newProject.hasAutomaticExpenses) {
        log('🔧 Vérifier la création de projet - des dépenses pré-remplies');
    }
    if (totalSuccess === totalTested) {
        log('✅ Comportement correct: les utilisateurs doivent ajouter manuellement leurs dépenses');
    }

    return results;
}

// Test spécifique pour un nouveau projet
async function testNewProjectBudget() {
    console.log('\n🆕 TEST SPÉCIFIQUE: NOUVEAU PROJET AVEC BUDGET');
    console.log('==============================================');
    
    // Instructions pour test manuel
    console.log('📋 Instructions pour test manuel:');
    console.log('1. Créer un nouveau projet');
    console.log('2. Ajouter un budget (ex: 10000 EUR)');
    console.log('3. Sauvegarder le projet');
    console.log('4. Ouvrir le projet créé');
    console.log('5. Cliquer sur "Budget"');
    console.log('6. Vérifier qu\'aucune dépense n\'est pré-remplie');
    console.log('');
    console.log('✅ Résultat attendu: Liste de dépenses vide');
    console.log('❌ Problème si: Des dépenses apparaissent automatiquement');
}

// Fonctions d'accès rapide
window.testBudgetBehavior = testBudgetBehavior;
window.testNewProjectBudget = testNewProjectBudget;

// Message d'aide
console.log('💰 Testeur de comportement budgétaire chargé!');
console.log('💡 Utilisez testBudgetBehavior() pour le test automatique');
console.log('💡 Utilisez testNewProjectBudget() pour les instructions de test manuel');
console.log('⚠️ Assurez-vous d\'être sur http://localhost:8001');

// Lancement automatique après 2 secondes
setTimeout(() => {
    console.log('🚀 Lancement automatique du test...');
    testBudgetBehavior();
}, 2000);
