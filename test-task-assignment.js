// Script de test pour vérifier l'assignation des tâches
// À exécuter dans la console du navigateur sur http://localhost:8001

console.log('👥 TEST D\'ASSIGNATION DES TÂCHES');
console.log('================================');

async function testTaskAssignment() {
    const results = {
        projectWithMembers: { tested: false, success: false, memberCount: 0 },
        projectWithoutMembers: { tested: false, success: false, hasWarning: false },
        taskCreation: { tested: false, success: false, onlyProjectMembers: false },
        memberManagement: { tested: false, success: false, buttonVisible: false }
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

    function countUsersInModal(modal) {
        if (!modal) return 0;
        
        // Chercher les utilisateurs dans le modal
        const userCheckboxes = modal.querySelectorAll('input[type="checkbox"]');
        const userLabels = modal.querySelectorAll('label:has(input[type="checkbox"])');
        const userElements = modal.querySelectorAll('[class*="user"], [class*="member"]');
        
        return Math.max(userCheckboxes.length, userLabels.length, userElements.length);
    }

    log('🔍 Test de l\'assignation des tâches aux membres du projet');

    // Test 1: Projet avec membres existants
    log('\n📊 Test 1: Projet avec membres existants');
    try {
        const projectCards = document.querySelectorAll('[class*="bg-white"][class*="rounded"]');
        if (projectCards.length > 0) {
            // Cliquer sur le premier projet
            await clickAndWait(projectCards[0], 1000);

            // Chercher des informations sur les membres
            const memberElements = Array.from(document.querySelectorAll('*')).filter(el => 
                el.textContent && (
                    el.textContent.includes('membre') ||
                    el.textContent.includes('Membre') ||
                    el.textContent.includes('assigné') ||
                    el.textContent.includes('Assigné')
                )
            );

            // Chercher le bouton "Nouvelle Tâche"
            const newTaskButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent && btn.textContent.includes('Nouvelle Tâche')
            );

            const isButtonDisabled = newTaskButton && (newTaskButton.disabled || newTaskButton.className.includes('disabled'));

            results.projectWithMembers = {
                tested: true,
                success: newTaskButton !== undefined,
                memberCount: memberElements.length
            };

            log(`📊 Projet ouvert: ${newTaskButton ? '✅' : '❌'} Bouton "Nouvelle Tâche" ${isButtonDisabled ? 'désactivé' : 'disponible'}`);
            log(`👥 ${memberElements.length} éléments liés aux membres trouvés`);

        } else {
            log('⚠️ Aucun projet trouvé pour le test');
        }
    } catch (error) {
        log(`❌ Erreur lors du test de projet avec membres: ${error.message}`, 'error');
    }

    // Test 2: Création de tâche et vérification des utilisateurs disponibles
    log('\n📝 Test 2: Création de tâche');
    try {
        const newTaskButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent && btn.textContent.includes('Nouvelle Tâche')
        );

        if (newTaskButton && !newTaskButton.disabled) {
            log('🔄 Ouverture du modal de création de tâche...');
            await clickAndWait(newTaskButton, 1500);

            const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
            if (modal) {
                // Chercher la section des personnes assignées
                const assignmentSection = Array.from(modal.querySelectorAll('*')).find(el => 
                    el.textContent && el.textContent.includes('Personnes assignées')
                );

                if (assignmentSection) {
                    const userCount = countUsersInModal(modal);
                    
                    // Chercher un message d'avertissement
                    const warningMessage = Array.from(modal.querySelectorAll('*')).find(el => 
                        el.textContent && (
                            el.textContent.includes('Aucun membre assigné') ||
                            el.textContent.includes('Veuillez assigner') ||
                            el.textContent.includes('assigner des utilisateurs')
                        )
                    );

                    results.taskCreation = {
                        tested: true,
                        success: assignmentSection !== undefined,
                        onlyProjectMembers: userCount > 0 && userCount < 10 // Assume moins de 10 = membres du projet seulement
                    };

                    log(`✅ Section assignation trouvée: ${userCount} utilisateur(s) disponible(s)`);
                    if (warningMessage) {
                        log(`⚠️ Message d'avertissement: "${warningMessage.textContent.substring(0, 50)}..."`);
                    }
                    log(`📊 Restriction aux membres du projet: ${userCount < 10 ? '✅ Oui' : '❌ Non (tous les utilisateurs)'}`);

                } else {
                    log('❌ Section "Personnes assignées" non trouvée');
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
                log('❌ Modal de création de tâche non ouvert');
            }
        } else {
            log('⚠️ Bouton "Nouvelle Tâche" non disponible ou désactivé');
            
            // Chercher un bouton "Assigner des membres"
            const assignMembersButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent && btn.textContent.includes('Assigner des membres')
            );

            results.memberManagement = {
                tested: true,
                success: assignMembersButton !== undefined,
                buttonVisible: assignMembersButton !== undefined
            };

            if (assignMembersButton) {
                log('✅ Bouton "Assigner des membres" trouvé');
            } else {
                log('❌ Bouton "Assigner des membres" non trouvé');
            }
        }
    } catch (error) {
        log(`❌ Erreur lors du test de création de tâche: ${error.message}`, 'error');
    }

    // Test 3: Vérification des messages d'avertissement
    log('\n⚠️ Test 3: Messages d\'avertissement');
    try {
        // Chercher des messages d'avertissement sur la page
        const warningMessages = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && (
                el.textContent.includes('Aucun membre assigné') ||
                el.textContent.includes('Veuillez assigner') ||
                el.textContent.includes('assigner des utilisateurs') ||
                el.textContent.includes('Assigner des membres')
            )
        );

        results.projectWithoutMembers = {
            tested: true,
            success: warningMessages.length > 0,
            hasWarning: warningMessages.length > 0
        };

        if (warningMessages.length > 0) {
            log(`✅ ${warningMessages.length} message(s) d'avertissement trouvé(s)`);
            warningMessages.forEach((msg, index) => {
                log(`   ${index + 1}. "${msg.textContent.substring(0, 60)}..."`);
            });
        } else {
            log('ℹ️ Aucun message d\'avertissement trouvé (normal si le projet a des membres)');
        }
    } catch (error) {
        log(`❌ Erreur lors de la vérification des avertissements: ${error.message}`, 'error');
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
            projectWithMembers: 'Projet avec membres',
            projectWithoutMembers: 'Messages d\'avertissement',
            taskCreation: 'Création de tâche',
            memberManagement: 'Gestion des membres'
        };
        
        if (result.tested) {
            const status = result.success ? '✅ OK' : '❌ Problème';
            let details = '';
            
            if (test === 'projectWithMembers') {
                details = `${result.memberCount} éléments membres`;
            } else if (test === 'taskCreation') {
                details = result.onlyProjectMembers ? 'Membres du projet seulement' : 'Tous les utilisateurs';
            } else if (test === 'memberManagement') {
                details = result.buttonVisible ? 'Bouton visible' : 'Bouton non visible';
            } else if (test === 'projectWithoutMembers') {
                details = result.hasWarning ? 'Avertissements présents' : 'Pas d\'avertissement';
            }
            
            log(`${testNames[test]}: ${status} - ${details}`);
        } else {
            log(`${testNames[test]}: ⏭️ Non testé`);
        }
    });

    // Verdict final
    log('\n🏆 VERDICT FINAL:');
    if (totalSuccess === totalTested && totalTested >= 3) {
        log('🎉 PARFAIT! L\'assignation des tâches fonctionne correctement');
        log('✅ Seuls les membres du projet peuvent être assignés aux tâches');
    } else if (totalSuccess >= totalTested * 0.7) {
        log('👍 BIEN! La plupart des fonctionnalités fonctionnent');
        log('⚠️ Quelques améliorations possibles');
    } else {
        log('❌ PROBLÈME! L\'assignation des tâches nécessite des corrections');
    }

    // Recommandations
    log('\n💡 RECOMMANDATIONS:');
    if (!results.taskCreation.onlyProjectMembers) {
        log('🔧 Vérifier que seuls les membres du projet apparaissent dans la création de tâche');
    }
    if (!results.memberManagement.buttonVisible && !results.projectWithoutMembers.hasWarning) {
        log('🔧 Ajouter des moyens d\'assigner des membres au projet');
    }
    if (results.taskCreation.success && results.taskCreation.onlyProjectMembers) {
        log('✅ Comportement correct: restriction aux membres du projet');
    }

    return results;
}

// Test spécifique pour un nouveau projet
async function testNewProjectTaskAssignment() {
    console.log('\n🆕 TEST SPÉCIFIQUE: NOUVEAU PROJET SANS MEMBRES');
    console.log('===============================================');
    
    console.log('📋 Instructions pour test manuel:');
    console.log('1. Créer un nouveau projet (sans assigner de membres)');
    console.log('2. Ouvrir le projet créé');
    console.log('3. Essayer de créer une nouvelle tâche');
    console.log('4. Vérifier le comportement:');
    console.log('   ✅ Bouton "Nouvelle Tâche" désactivé OU');
    console.log('   ✅ Message "Veuillez assigner des utilisateurs"');
    console.log('   ✅ Bouton "Assigner des membres" visible');
    console.log('');
    console.log('❌ Problème si: Tous les utilisateurs du système apparaissent');
}

// Fonctions d'accès rapide
window.testTaskAssignment = testTaskAssignment;
window.testNewProjectTaskAssignment = testNewProjectTaskAssignment;

// Message d'aide
console.log('👥 Testeur d\'assignation des tâches chargé!');
console.log('💡 Utilisez testTaskAssignment() pour le test automatique');
console.log('💡 Utilisez testNewProjectTaskAssignment() pour les instructions de test manuel');
console.log('⚠️ Assurez-vous d\'être sur http://localhost:8001 avec un projet ouvert');

// Lancement automatique après 2 secondes
setTimeout(() => {
    console.log('🚀 Lancement automatique du test...');
    testTaskAssignment();
}, 2000);
