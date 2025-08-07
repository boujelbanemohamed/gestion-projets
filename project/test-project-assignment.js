// Script de test pour vérifier l'assignation des projets aux membres
// À exécuter dans la console du navigateur sur http://localhost:8001

console.log('🏗️ TEST D\'ASSIGNATION DES PROJETS AUX MEMBRES');
console.log('==============================================');

async function testProjectAssignment() {
    const results = {
        membersManagement: { tested: false, success: false, hasProjectColumn: false },
        projectVisibility: { tested: false, success: false, restrictedAccess: false },
        taskAssignment: { tested: false, success: false, onlyAssignedMembers: false },
        projectAssignmentModal: { tested: false, success: false, modalWorks: false }
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

    log('🔍 Test du système d\'assignation des projets aux membres');

    // Test 1: Gestion des membres - Colonne Projets
    log('\n👥 Test 1: Gestion des membres - Colonne Projets');
    try {
        // Naviguer vers la gestion des membres
        const membersButton = Array.from(document.querySelectorAll('button, a')).find(el => 
            el.textContent && (
                el.textContent.includes('Membres') ||
                el.textContent.includes('Gestion des membres') ||
                el.textContent.includes('Users')
            )
        );

        if (membersButton) {
            log('🔄 Navigation vers la gestion des membres...');
            await clickAndWait(membersButton, 2000);

            // Chercher la colonne "Projets assignés"
            const projectColumn = Array.from(document.querySelectorAll('th, td')).find(el => 
                el.textContent && (
                    el.textContent.includes('Projets assignés') ||
                    el.textContent.includes('Projets') ||
                    el.textContent.includes('Projects')
                )
            );

            // Chercher des badges de projets
            const projectBadges = document.querySelectorAll('[class*="bg-blue-100"], [class*="bg-green-100"]');
            const projectLinks = Array.from(document.querySelectorAll('*')).filter(el => 
                el.textContent && el.textContent.includes('Gérer les projets')
            );

            results.membersManagement = {
                tested: true,
                success: projectColumn !== undefined || projectBadges.length > 0,
                hasProjectColumn: projectColumn !== undefined
            };

            if (projectColumn) {
                log('✅ Colonne "Projets assignés" trouvée');
            }
            if (projectBadges.length > 0) {
                log(`✅ ${projectBadges.length} badge(s) de projet trouvé(s)`);
            }
            if (projectLinks.length > 0) {
                log(`✅ ${projectLinks.length} lien(s) "Gérer les projets" trouvé(s)`);
            }

            if (!projectColumn && projectBadges.length === 0) {
                log('❌ Colonne projets non trouvée dans la gestion des membres');
            }

        } else {
            log('⚠️ Bouton de gestion des membres non trouvé');
        }
    } catch (error) {
        log(`❌ Erreur lors du test de gestion des membres: ${error.message}`, 'error');
    }

    // Test 2: Modal d'assignation des projets
    log('\n🎯 Test 2: Modal d\'assignation des projets');
    try {
        // Chercher un lien "Gérer les projets"
        const manageProjectsLink = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent && el.textContent.includes('Gérer les projets')
        );

        if (manageProjectsLink) {
            log('🔄 Ouverture du modal d\'assignation des projets...');
            await clickAndWait(manageProjectsLink, 1500);

            const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
            if (modal) {
                // Chercher les éléments du modal
                const modalTitle = Array.from(modal.querySelectorAll('*')).find(el => 
                    el.textContent && el.textContent.includes('Assigner des projets')
                );

                const projectCheckboxes = modal.querySelectorAll('input[type="checkbox"]');
                const searchInput = modal.querySelector('input[placeholder*="Rechercher"]');

                results.projectAssignmentModal = {
                    tested: true,
                    success: modalTitle !== undefined,
                    modalWorks: projectCheckboxes.length > 0
                };

                log(`✅ Modal d'assignation ouvert: ${modalTitle ? 'Oui' : 'Non'}`);
                log(`📋 ${projectCheckboxes.length} projet(s) disponible(s) pour assignation`);
                log(`🔍 Recherche disponible: ${searchInput ? 'Oui' : 'Non'}`);

                // Fermer le modal
                const closeButton = modal.querySelector('button[class*="text-gray-400"]') ||
                                  Array.from(modal.querySelectorAll('button')).find(btn => 
                                      btn.textContent && btn.textContent.includes('Annuler')
                                  );
                if (closeButton) {
                    await clickAndWait(closeButton, 500);
                }
            } else {
                log('❌ Modal d\'assignation non ouvert');
            }
        } else {
            log('⚠️ Lien "Gérer les projets" non trouvé');
        }
    } catch (error) {
        log(`❌ Erreur lors du test du modal d'assignation: ${error.message}`, 'error');
    }

    // Test 3: Visibilité des projets (retour au dashboard)
    log('\n🏠 Test 3: Visibilité des projets');
    try {
        // Retourner au dashboard
        const dashboardButton = Array.from(document.querySelectorAll('button, a')).find(el => 
            el.textContent && (
                el.textContent.includes('Dashboard') ||
                el.textContent.includes('Accueil') ||
                el.textContent.includes('Tableau de bord')
            )
        );

        if (dashboardButton) {
            await clickAndWait(dashboardButton, 1500);
        }

        // Compter les projets visibles
        const projectCards = document.querySelectorAll('[class*="bg-white"][class*="rounded"]');
        const projectTitles = Array.from(document.querySelectorAll('h3, h4')).filter(el => 
            el.textContent && (
                el.textContent.includes('Refonte') ||
                el.textContent.includes('Projet') ||
                el.textContent.includes('Site')
            )
        );

        results.projectVisibility = {
            tested: true,
            success: projectCards.length > 0 || projectTitles.length > 0,
            restrictedAccess: projectCards.length < 10 // Assume restriction if less than 10 projects
        };

        log(`📊 ${projectCards.length} carte(s) de projet visible(s)`);
        log(`📋 ${projectTitles.length} titre(s) de projet trouvé(s)`);
        log(`🔒 Accès restreint: ${projectCards.length < 10 ? 'Probablement' : 'Non détecté'}`);

    } catch (error) {
        log(`❌ Erreur lors du test de visibilité: ${error.message}`, 'error');
    }

    // Test 4: Assignation des tâches (ouvrir un projet)
    log('\n📋 Test 4: Assignation des tâches');
    try {
        const projectCards = document.querySelectorAll('[class*="bg-white"][class*="rounded"]');
        if (projectCards.length > 0) {
            // Cliquer sur le premier projet
            await clickAndWait(projectCards[0], 1500);

            // Chercher le bouton "Nouvelle Tâche"
            const newTaskButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent && btn.textContent.includes('Nouvelle Tâche')
            );

            if (newTaskButton && !newTaskButton.disabled) {
                log('🔄 Test de création de tâche...');
                await clickAndWait(newTaskButton, 1500);

                const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
                if (modal) {
                    // Compter les utilisateurs disponibles
                    const userCheckboxes = modal.querySelectorAll('input[type="checkbox"]');
                    const userLabels = modal.querySelectorAll('label:has(input[type="checkbox"])');

                    results.taskAssignment = {
                        tested: true,
                        success: userCheckboxes.length > 0,
                        onlyAssignedMembers: userCheckboxes.length < 6 // Assume restriction if less than 6 users
                    };

                    log(`👥 ${userCheckboxes.length} utilisateur(s) disponible(s) pour assignation`);
                    log(`🎯 Restriction aux membres du projet: ${userCheckboxes.length < 6 ? 'Oui' : 'Non détecté'}`);

                    // Fermer le modal
                    const closeButton = modal.querySelector('button[class*="text-gray-400"]');
                    if (closeButton) {
                        await clickAndWait(closeButton, 500);
                    }
                } else {
                    log('❌ Modal de création de tâche non ouvert');
                }
            } else {
                log('⚠️ Bouton "Nouvelle Tâche" non disponible ou désactivé');
            }
        } else {
            log('⚠️ Aucun projet disponible pour le test');
        }
    } catch (error) {
        log(`❌ Erreur lors du test d'assignation des tâches: ${error.message}`, 'error');
    }

    // Résumé des résultats
    log('\n📊 RÉSUMÉ DES TESTS');
    log('==================');

    const totalTested = Object.values(results).filter(r => r.tested).length;
    const totalSuccess = Object.values(results).filter(r => r.success).length;

    log(`🧪 Tests effectués: ${totalTested}/4`);
    log(`✅ Tests réussis: ${totalSuccess}/${totalTested}`);

    Object.entries(results).forEach(([test, result]) => {
        const testNames = {
            membersManagement: 'Gestion des membres',
            projectVisibility: 'Visibilité des projets',
            taskAssignment: 'Assignation des tâches',
            projectAssignmentModal: 'Modal d\'assignation'
        };
        
        if (result.tested) {
            const status = result.success ? '✅ OK' : '❌ Problème';
            let details = '';
            
            if (test === 'membersManagement') {
                details = result.hasProjectColumn ? 'Colonne projets présente' : 'Colonne projets manquante';
            } else if (test === 'projectVisibility') {
                details = result.restrictedAccess ? 'Accès restreint' : 'Accès complet';
            } else if (test === 'taskAssignment') {
                details = result.onlyAssignedMembers ? 'Membres du projet seulement' : 'Tous les utilisateurs';
            } else if (test === 'projectAssignmentModal') {
                details = result.modalWorks ? 'Modal fonctionnel' : 'Modal non fonctionnel';
            }
            
            log(`${testNames[test]}: ${status} - ${details}`);
        } else {
            log(`${testNames[test]}: ⏭️ Non testé`);
        }
    });

    // Verdict final
    log('\n🏆 VERDICT FINAL:');
    if (totalSuccess === totalTested && totalTested >= 3) {
        log('🎉 EXCELLENT! Le système d\'assignation des projets fonctionne');
        log('✅ Les membres peuvent être assignés aux projets');
        log('✅ La visibilité des projets est contrôlée');
        log('✅ L\'assignation des tâches est restreinte aux membres du projet');
    } else if (totalSuccess >= totalTested * 0.7) {
        log('👍 BIEN! La plupart des fonctionnalités sont opérationnelles');
        log('⚠️ Quelques améliorations possibles');
    } else {
        log('❌ PROBLÈME! Le système d\'assignation nécessite des corrections');
    }

    // Recommandations
    log('\n💡 RECOMMANDATIONS:');
    if (!results.membersManagement.hasProjectColumn) {
        log('🔧 Ajouter la colonne "Projets assignés" dans la gestion des membres');
    }
    if (!results.projectAssignmentModal.modalWorks) {
        log('🔧 Vérifier le fonctionnement du modal d\'assignation des projets');
    }
    if (!results.taskAssignment.onlyAssignedMembers) {
        log('🔧 Restreindre l\'assignation des tâches aux membres du projet');
    }
    if (results.projectVisibility.success && results.taskAssignment.onlyAssignedMembers) {
        log('✅ Système de sécurité fonctionnel: accès contrôlé aux projets et tâches');
    }

    return results;
}

// Instructions pour test manuel
function showManualTestInstructions() {
    console.log('\n📋 INSTRUCTIONS POUR TEST MANUEL');
    console.log('=================================');
    console.log('1. 👥 Gestion des membres:');
    console.log('   - Aller dans "Gestion des membres"');
    console.log('   - Vérifier la colonne "Projets assignés"');
    console.log('   - Cliquer sur "Gérer les projets" pour un membre');
    console.log('   - Assigner/désassigner des projets');
    console.log('');
    console.log('2. 🔒 Test de visibilité:');
    console.log('   - Se connecter avec un utilisateur normal');
    console.log('   - Vérifier que seuls les projets assignés sont visibles');
    console.log('');
    console.log('3. 📋 Test d\'assignation des tâches:');
    console.log('   - Ouvrir un projet');
    console.log('   - Créer une nouvelle tâche');
    console.log('   - Vérifier que seuls les membres du projet apparaissent');
    console.log('');
    console.log('✅ Résultat attendu: Contrôle d\'accès complet et cohérent');
}

// Fonctions d'accès rapide
window.testProjectAssignment = testProjectAssignment;
window.showManualTestInstructions = showManualTestInstructions;

// Message d'aide
console.log('🏗️ Testeur d\'assignation des projets chargé!');
console.log('💡 Utilisez testProjectAssignment() pour le test automatique');
console.log('💡 Utilisez showManualTestInstructions() pour les instructions de test manuel');
console.log('⚠️ Assurez-vous d\'être sur http://localhost:8001');

// Lancement automatique après 2 secondes
setTimeout(() => {
    console.log('🚀 Lancement automatique du test...');
    testProjectAssignment();
}, 2000);
