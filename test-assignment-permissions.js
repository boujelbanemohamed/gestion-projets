// Script de test pour vérifier les permissions d'assignation des projets
// À exécuter dans la console du navigateur sur http://localhost:8001

console.log('🔐 TEST DES PERMISSIONS D\'ASSIGNATION DES PROJETS');
console.log('================================================');

async function testAssignmentPermissions() {
    const results = {
        superAdminPermissions: { tested: false, success: false, canAssignAll: false },
        adminPermissions: { tested: false, success: false, canAssignToUsers: false },
        projectManagerPermissions: { tested: false, success: false, canAssignOwnProjects: false },
        regularUserPermissions: { tested: false, success: false, restrictedAccess: false },
        permissionMessages: { tested: false, success: false, hasInformativeMessages: false }
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

    function getCurrentUserRole() {
        // Try to detect current user role from UI elements
        const userInfo = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent && (
                el.textContent.includes('Super Admin') ||
                el.textContent.includes('Admin') ||
                el.textContent.includes('Utilisateur')
            )
        );
        
        if (userInfo) {
            if (userInfo.textContent.includes('Super Admin')) return 'SUPER_ADMIN';
            if (userInfo.textContent.includes('Admin')) return 'ADMIN';
            return 'UTILISATEUR';
        }
        
        return 'UNKNOWN';
    }

    log('🔍 Test des permissions d\'assignation selon les rôles');

    // Test 1: Navigation vers la gestion des membres
    log('\n👥 Test 1: Accès à la gestion des membres');
    try {
        const membersButton = Array.from(document.querySelectorAll('button, a')).find(el => 
            el.textContent && (
                el.textContent.includes('Membres') ||
                el.textContent.includes('Gestion des membres')
            )
        );

        if (membersButton) {
            log('🔄 Navigation vers la gestion des membres...');
            await clickAndWait(membersButton, 2000);

            const currentRole = getCurrentUserRole();
            log(`👤 Rôle détecté: ${currentRole}`);

            // Compter les boutons "Gérer les projets" visibles
            const manageProjectsButtons = Array.from(document.querySelectorAll('*')).filter(el => 
                el.textContent && el.textContent.includes('Gérer les projets')
            );

            log(`🔧 ${manageProjectsButtons.length} bouton(s) "Gérer les projets" visible(s)`);

            // Test selon le rôle
            if (currentRole === 'SUPER_ADMIN') {
                results.superAdminPermissions = {
                    tested: true,
                    success: manageProjectsButtons.length > 0,
                    canAssignAll: manageProjectsButtons.length >= 3 // Assume au moins 3 utilisateurs
                };
                log(`✅ Super Admin: Peut gérer ${manageProjectsButtons.length} utilisateur(s)`);
            } else if (currentRole === 'ADMIN') {
                results.adminPermissions = {
                    tested: true,
                    success: manageProjectsButtons.length > 0,
                    canAssignToUsers: manageProjectsButtons.length > 0
                };
                log(`✅ Admin: Peut gérer ${manageProjectsButtons.length} utilisateur(s)`);
            } else if (currentRole === 'UTILISATEUR') {
                results.regularUserPermissions = {
                    tested: true,
                    success: true, // Success means restrictions are working
                    restrictedAccess: manageProjectsButtons.length < 3 // Should be limited
                };
                log(`✅ Utilisateur: Accès restreint à ${manageProjectsButtons.length} utilisateur(s)`);
            }

        } else {
            log('⚠️ Bouton de gestion des membres non trouvé');
        }
    } catch (error) {
        log(`❌ Erreur lors du test d'accès: ${error.message}`, 'error');
    }

    // Test 2: Test d'un modal d'assignation
    log('\n🎯 Test 2: Modal d\'assignation des projets');
    try {
        const manageProjectsButton = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent && el.textContent.includes('Gérer les projets')
        );

        if (manageProjectsButton) {
            log('🔄 Ouverture du modal d\'assignation...');
            await clickAndWait(manageProjectsButton, 1500);

            const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
            if (modal) {
                // Chercher les messages de permissions
                const permissionMessages = Array.from(modal.querySelectorAll('*')).filter(el => 
                    el.textContent && (
                        el.textContent.includes('Permissions') ||
                        el.textContent.includes('responsable') ||
                        el.textContent.includes('Aucun projet disponible')
                    )
                );

                // Compter les projets disponibles
                const projectCheckboxes = modal.querySelectorAll('input[type="checkbox"]');
                
                // Chercher les badges "Responsable"
                const responsableBadges = Array.from(modal.querySelectorAll('*')).filter(el => 
                    el.textContent && el.textContent.includes('Responsable')
                );

                results.permissionMessages = {
                    tested: true,
                    success: permissionMessages.length > 0,
                    hasInformativeMessages: permissionMessages.length > 0
                };

                const currentRole = getCurrentUserRole();
                if (currentRole === 'UTILISATEUR') {
                    results.projectManagerPermissions = {
                        tested: true,
                        success: projectCheckboxes.length <= 3, // Should be limited to managed projects
                        canAssignOwnProjects: responsableBadges.length > 0
                    };
                    log(`👨‍💼 Responsable de projet: ${projectCheckboxes.length} projet(s) assignable(s)`);
                    log(`🏷️ ${responsableBadges.length} badge(s) "Responsable" trouvé(s)`);
                }

                if (permissionMessages.length > 0) {
                    log(`✅ ${permissionMessages.length} message(s) de permission trouvé(s)`);
                    permissionMessages.forEach((msg, index) => {
                        log(`   ${index + 1}. "${msg.textContent.substring(0, 60)}..."`);
                    });
                } else {
                    log('⚠️ Aucun message de permission trouvé');
                }

                log(`📋 ${projectCheckboxes.length} projet(s) disponible(s) pour assignation`);

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
            log('⚠️ Aucun bouton "Gérer les projets" disponible pour le test');
        }
    } catch (error) {
        log(`❌ Erreur lors du test du modal: ${error.message}`, 'error');
    }

    // Test 3: Vérification des restrictions par rôle
    log('\n🔒 Test 3: Vérification des restrictions par rôle');
    try {
        const currentRole = getCurrentUserRole();
        
        // Compter tous les membres visibles dans le tableau
        const memberRows = document.querySelectorAll('tr:not(:first-child)');
        const manageButtons = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && el.textContent.includes('Gérer les projets')
        );

        log(`👥 ${memberRows.length} membre(s) visible(s) dans le tableau`);
        log(`🔧 ${manageButtons.length} bouton(s) de gestion disponible(s)`);

        // Vérifier la cohérence selon le rôle
        let expectedBehavior = '';
        let isCorrect = false;

        switch (currentRole) {
            case 'SUPER_ADMIN':
                expectedBehavior = 'Peut gérer tous les membres';
                isCorrect = manageButtons.length >= memberRows.length - 1; // -1 for header
                break;
            case 'ADMIN':
                expectedBehavior = 'Peut gérer les utilisateurs réguliers seulement';
                isCorrect = manageButtons.length > 0 && manageButtons.length < memberRows.length;
                break;
            case 'UTILISATEUR':
                expectedBehavior = 'Peut gérer seulement les membres de ses projets';
                isCorrect = manageButtons.length <= 2; // Limited access
                break;
            default:
                expectedBehavior = 'Rôle non identifié';
                isCorrect = false;
        }

        log(`📋 Comportement attendu: ${expectedBehavior}`);
        log(`${isCorrect ? '✅' : '❌'} Restrictions correctes: ${isCorrect ? 'Oui' : 'Non'}`);

    } catch (error) {
        log(`❌ Erreur lors de la vérification des restrictions: ${error.message}`, 'error');
    }

    // Résumé des résultats
    log('\n📊 RÉSUMÉ DES TESTS DE PERMISSIONS');
    log('==================================');

    const totalTested = Object.values(results).filter(r => r.tested).length;
    const totalSuccess = Object.values(results).filter(r => r.success).length;

    log(`🧪 Tests effectués: ${totalTested}/5`);
    log(`✅ Tests réussis: ${totalSuccess}/${totalTested}`);

    Object.entries(results).forEach(([test, result]) => {
        const testNames = {
            superAdminPermissions: 'Permissions Super Admin',
            adminPermissions: 'Permissions Admin',
            projectManagerPermissions: 'Permissions Responsable de projet',
            regularUserPermissions: 'Permissions Utilisateur régulier',
            permissionMessages: 'Messages informatifs'
        };
        
        if (result.tested) {
            const status = result.success ? '✅ OK' : '❌ Problème';
            let details = '';
            
            if (test === 'superAdminPermissions') {
                details = result.canAssignAll ? 'Peut tout assigner' : 'Restrictions détectées';
            } else if (test === 'adminPermissions') {
                details = result.canAssignToUsers ? 'Peut assigner aux utilisateurs' : 'Pas d\'accès';
            } else if (test === 'projectManagerPermissions') {
                details = result.canAssignOwnProjects ? 'Peut assigner ses projets' : 'Pas de projets gérés';
            } else if (test === 'regularUserPermissions') {
                details = result.restrictedAccess ? 'Accès restreint' : 'Accès trop large';
            } else if (test === 'permissionMessages') {
                details = result.hasInformativeMessages ? 'Messages présents' : 'Messages manquants';
            }
            
            log(`${testNames[test]}: ${status} - ${details}`);
        } else {
            log(`${testNames[test]}: ⏭️ Non testé`);
        }
    });

    // Verdict final
    log('\n🏆 VERDICT FINAL:');
    if (totalSuccess === totalTested && totalTested >= 3) {
        log('🎉 EXCELLENT! Le système de permissions fonctionne correctement');
        log('✅ Les restrictions d\'assignation sont bien appliquées');
        log('✅ Les messages informatifs guident les utilisateurs');
    } else if (totalSuccess >= totalTested * 0.7) {
        log('👍 BIEN! La plupart des permissions fonctionnent');
        log('⚠️ Quelques ajustements possibles');
    } else {
        log('❌ PROBLÈME! Le système de permissions nécessite des corrections');
    }

    // Recommandations
    log('\n💡 RECOMMANDATIONS:');
    if (!results.permissionMessages.hasInformativeMessages) {
        log('🔧 Ajouter des messages informatifs sur les permissions');
    }
    if (results.regularUserPermissions.tested && !results.regularUserPermissions.restrictedAccess) {
        log('🔧 Renforcer les restrictions pour les utilisateurs réguliers');
    }
    if (results.superAdminPermissions.tested && results.superAdminPermissions.canAssignAll) {
        log('✅ Super Admin a bien accès à toutes les fonctionnalités');
    }

    return results;
}

// Instructions pour test manuel par rôle
function showRoleBasedTestInstructions() {
    console.log('\n📋 INSTRUCTIONS DE TEST PAR RÔLE');
    console.log('=================================');
    console.log('🔴 SUPER ADMIN:');
    console.log('   - Peut voir tous les boutons "Gérer les projets"');
    console.log('   - Peut assigner n\'importe quel projet à n\'importe qui');
    console.log('   - Aucune restriction dans le modal d\'assignation');
    console.log('');
    console.log('🟡 ADMIN:');
    console.log('   - Peut gérer les utilisateurs réguliers seulement');
    console.log('   - Ne peut pas gérer d\'autres admins/super admins');
    console.log('   - Peut assigner tous les projets aux utilisateurs');
    console.log('');
    console.log('🟢 UTILISATEUR (Responsable de projet):');
    console.log('   - Ne peut gérer que les membres de ses projets');
    console.log('   - Ne voit que les projets dont il est responsable');
    console.log('   - Badge "Responsable" visible sur ses projets');
    console.log('');
    console.log('🔵 UTILISATEUR (Non-responsable):');
    console.log('   - Aucun bouton "Gérer les projets" visible');
    console.log('   - Pas d\'accès à l\'assignation de projets');
    console.log('');
    console.log('✅ Test complet: Se connecter avec chaque type d\'utilisateur');
}

// Fonctions d'accès rapide
window.testAssignmentPermissions = testAssignmentPermissions;
window.showRoleBasedTestInstructions = showRoleBasedTestInstructions;

// Message d'aide
console.log('🔐 Testeur de permissions d\'assignation chargé!');
console.log('💡 Utilisez testAssignmentPermissions() pour le test automatique');
console.log('💡 Utilisez showRoleBasedTestInstructions() pour les instructions par rôle');
console.log('⚠️ Assurez-vous d\'être sur http://localhost:8001 dans la gestion des membres');

// Lancement automatique après 2 secondes
setTimeout(() => {
    console.log('🚀 Lancement automatique du test...');
    testAssignmentPermissions();
}, 2000);
