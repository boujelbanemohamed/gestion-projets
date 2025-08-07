// Script de test pour vérifier la synchronisation des devises
// À exécuter dans la console du navigateur sur http://localhost:8001

console.log('💱 TEST DE SYNCHRONISATION DES DEVISES');
console.log('======================================');

async function testCurrencySync() {
    const results = {
        createProject: { tested: false, currencies: [], success: false },
        editProject: { tested: false, currencies: [], success: false },
        budget: { tested: false, currencies: [], success: false },
        consistency: { tested: false, success: false, message: '' }
    };

    function log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    // Fonction pour extraire les devises d'un select
    function extractCurrenciesFromSelect(selectElement) {
        if (!selectElement) return [];
        
        const options = Array.from(selectElement.options);
        return options
            .filter(option => option.value && option.value !== '')
            .map(option => ({
                code: option.value,
                text: option.textContent || option.innerText,
                element: option
            }));
    }

    // Fonction pour simuler un clic et attendre
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

    log('🔍 Test de synchronisation des devises entre les composants');

    // Test 1: Modal de création de projet
    log('\n📝 Test 1: Modal de création de projet');
    try {
        // Chercher le bouton "Nouveau Projet" ou "Créer un projet"
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

            // Chercher le select de devise dans le modal
            const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
            if (modal) {
                const currencySelect = modal.querySelector('select[id="devise"], select[name="devise"]');
                if (currencySelect) {
                    const currencies = extractCurrenciesFromSelect(currencySelect);
                    results.createProject = {
                        tested: true,
                        currencies: currencies,
                        success: currencies.length > 0
                    };
                    log(`✅ Modal création: ${currencies.length} devises trouvées`);
                    currencies.slice(0, 5).forEach((curr, index) => {
                        log(`   ${index + 1}. ${curr.code}: ${curr.text}`);
                    });
                    if (currencies.length > 5) {
                        log(`   ... et ${currencies.length - 5} autres devises`);
                    }
                } else {
                    log('❌ Select de devise non trouvé dans le modal de création');
                }

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
            log('⚠️ Bouton de création de projet non trouvé');
        }
    } catch (error) {
        log(`❌ Erreur lors du test de création: ${error.message}`, 'error');
    }

    // Test 2: Modal d'édition de projet
    log('\n✏️ Test 2: Modal d\'édition de projet');
    try {
        // Chercher un projet et son bouton d'édition
        const projectCards = document.querySelectorAll('[class*="bg-white"][class*="rounded"]');
        if (projectCards.length > 0) {
            // Cliquer sur le premier projet
            await clickAndWait(projectCards[0], 1000);

            // Chercher le bouton d'édition
            const editButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.querySelector('[data-lucide="edit"]') || 
                btn.querySelector('[data-lucide="edit-2"]') ||
                (btn.textContent && btn.textContent.includes('Modifier'))
            );

            if (editButton) {
                log('🔄 Ouverture du modal d\'édition...');
                await clickAndWait(editButton, 1500);

                const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
                if (modal) {
                    const currencySelect = modal.querySelector('select[id="devise"], select[name="devise"]');
                    if (currencySelect) {
                        const currencies = extractCurrenciesFromSelect(currencySelect);
                        results.editProject = {
                            tested: true,
                            currencies: currencies,
                            success: currencies.length > 0
                        };
                        log(`✅ Modal édition: ${currencies.length} devises trouvées`);
                        currencies.slice(0, 3).forEach((curr, index) => {
                            log(`   ${index + 1}. ${curr.code}: ${curr.text}`);
                        });
                    } else {
                        log('❌ Select de devise non trouvé dans le modal d\'édition');
                    }

                    // Fermer le modal
                    const closeButton = modal.querySelector('button[class*="text-gray-400"]');
                    if (closeButton) {
                        await clickAndWait(closeButton, 500);
                    }
                } else {
                    log('❌ Modal d\'édition non ouvert');
                }
            } else {
                log('⚠️ Bouton d\'édition non trouvé');
            }
        } else {
            log('⚠️ Aucun projet trouvé pour tester l\'édition');
        }
    } catch (error) {
        log(`❌ Erreur lors du test d'édition: ${error.message}`, 'error');
    }

    // Test 3: Modal de budget
    log('\n💰 Test 3: Modal de budget');
    try {
        // Chercher le bouton Budget
        const budgetButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent && btn.textContent.includes('Budget')
        );

        if (budgetButton) {
            log('🔄 Ouverture du modal de budget...');
            await clickAndWait(budgetButton, 1500);

            const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
            if (modal) {
                // Chercher le bouton d'ajout de dépense
                const addExpenseButton = Array.from(modal.querySelectorAll('button')).find(btn => 
                    btn.textContent && (
                        btn.textContent.includes('Ajouter') ||
                        btn.textContent.includes('Nouvelle')
                    )
                );

                if (addExpenseButton) {
                    await clickAndWait(addExpenseButton, 1000);

                    const currencySelect = modal.querySelector('select');
                    if (currencySelect) {
                        const currencies = extractCurrenciesFromSelect(currencySelect);
                        results.budget = {
                            tested: true,
                            currencies: currencies,
                            success: currencies.length > 0
                        };
                        log(`✅ Modal budget: ${currencies.length} devises trouvées`);
                        currencies.slice(0, 3).forEach((curr, index) => {
                            log(`   ${index + 1}. ${curr.code}: ${curr.text}`);
                        });
                    } else {
                        log('❌ Select de devise non trouvé dans le modal de budget');
                    }
                } else {
                    log('⚠️ Bouton d\'ajout de dépense non trouvé');
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

    // Test 4: Vérification de la cohérence
    log('\n🔍 Test 4: Vérification de la cohérence');
    try {
        const testedComponents = [results.createProject, results.editProject, results.budget]
            .filter(component => component.tested && component.success);

        if (testedComponents.length >= 2) {
            // Comparer les listes de devises
            const firstCurrencies = testedComponents[0].currencies.map(c => c.code).sort();
            let allConsistent = true;
            let inconsistentComponents = [];

            for (let i = 1; i < testedComponents.length; i++) {
                const currentCurrencies = testedComponents[i].currencies.map(c => c.code).sort();
                
                if (JSON.stringify(firstCurrencies) !== JSON.stringify(currentCurrencies)) {
                    allConsistent = false;
                    inconsistentComponents.push(i);
                }
            }

            results.consistency = {
                tested: true,
                success: allConsistent,
                message: allConsistent 
                    ? 'Toutes les listes de devises sont identiques'
                    : `Incohérences détectées dans ${inconsistentComponents.length} composant(s)`
            };

            log(allConsistent ? '✅ Cohérence parfaite entre tous les composants' : '❌ Incohérences détectées');
            log(`📊 ${firstCurrencies.length} devises communes trouvées`);
            
            if (!allConsistent) {
                log('⚠️ Détails des incohérences:');
                inconsistentComponents.forEach(index => {
                    const componentNames = ['Création', 'Édition', 'Budget'];
                    log(`   • ${componentNames[index]} a une liste différente`);
                });
            }
        } else {
            results.consistency = {
                tested: false,
                success: false,
                message: 'Pas assez de composants testés pour vérifier la cohérence'
            };
            log('⚠️ Pas assez de composants testés pour vérifier la cohérence');
        }
    } catch (error) {
        log(`❌ Erreur lors de la vérification de cohérence: ${error.message}`, 'error');
    }

    // Résumé final
    log('\n📊 RÉSUMÉ DES TESTS');
    log('==================');

    const totalTested = Object.values(results).filter(r => r.tested).length;
    const totalSuccess = Object.values(results).filter(r => r.success).length;

    log(`🧪 Composants testés: ${totalTested}/4`);
    log(`✅ Tests réussis: ${totalSuccess}/${totalTested}`);

    Object.entries(results).forEach(([component, result]) => {
        const componentNames = {
            createProject: 'Création de projet',
            editProject: 'Édition de projet', 
            budget: 'Budget',
            consistency: 'Cohérence'
        };
        
        const status = !result.tested ? '⏭️ Non testé' : 
                      result.success ? '✅ Réussi' : '❌ Échoué';
        
        log(`${componentNames[component]}: ${status}`);
        
        if (result.tested && result.currencies) {
            log(`   └─ ${result.currencies.length} devises trouvées`);
        }
        if (result.message) {
            log(`   └─ ${result.message}`);
        }
    });

    // Verdict final
    log('\n🏆 VERDICT FINAL:');
    if (totalSuccess === totalTested && results.consistency.success) {
        log('🎉 PARFAIT! Toutes les devises sont synchronisées');
    } else if (totalSuccess >= totalTested * 0.75) {
        log('👍 BIEN! La plupart des composants sont synchronisés');
    } else {
        log('⚠️ ATTENTION! Problèmes de synchronisation détectés');
    }

    return results;
}

// Fonction d'accès rapide
window.testCurrencySync = testCurrencySync;

// Message d'aide
console.log('💱 Testeur de synchronisation des devises chargé!');
console.log('💡 Utilisez testCurrencySync() pour lancer le test complet');
console.log('⚠️ Assurez-vous d\'être sur http://localhost:8001 avec des projets disponibles');

// Lancement automatique après 2 secondes
setTimeout(() => {
    console.log('🚀 Lancement automatique du test de synchronisation...');
    testCurrencySync();
}, 2000);
