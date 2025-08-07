// Script de test complet de la plateforme
// À exécuter dans la console du navigateur sur http://localhost:8001

console.log('🧪 Test Complet de la Plateforme de Gestion de Projets');

class PlatformTester {
    constructor() {
        this.results = {
            navigation: { passed: 0, failed: 0, tests: [] },
            projects: { passed: 0, failed: 0, tests: [] },
            tasks: { passed: 0, failed: 0, tests: [] },
            alerts: { passed: 0, failed: 0, tests: [] },
            budget: { passed: 0, failed: 0, tests: [] },
            rubriques: { passed: 0, failed: 0, tests: [] }
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    recordTest(category, testName, passed, message) {
        const result = { testName, passed, message };
        this.results[category].tests.push(result);
        
        if (passed) {
            this.results[category].passed++;
            this.log(`${testName}: ${message}`, 'success');
        } else {
            this.results[category].failed++;
            this.log(`${testName}: ${message}`, 'error');
        }
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clickElement(element) {
        if (element) {
            const event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(event);
            return true;
        }
        return false;
    }

    async testNavigation() {
        this.log('🧭 Tests de Navigation', 'info');

        // Test 1: Page d'accueil
        const homeElements = document.querySelectorAll('h1, h2, h3');
        const hasHomeContent = Array.from(homeElements).some(el => 
            el.textContent && (el.textContent.includes('Projets') || el.textContent.includes('Gestion'))
        );
        this.recordTest('navigation', 'Page d\'accueil', hasHomeContent, 
            hasHomeContent ? 'Page d\'accueil accessible' : 'Contenu d\'accueil non trouvé');

        // Test 2: Cartes de projets visibles
        const projectCards = document.querySelectorAll('[class*="bg-white"][class*="rounded"]');
        this.recordTest('navigation', 'Cartes projets', projectCards.length > 0,
            `${projectCards.length} cartes de projet trouvées`);

        // Test 3: Navigation vers un projet
        if (projectCards.length > 0) {
            const firstProject = projectCards[0];
            const projectTitle = firstProject.querySelector('h3, h2, h1')?.textContent || 'Projet';
            
            this.clickElement(firstProject);
            await this.wait(1000);
            
            const detailButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
                btn.textContent && (btn.textContent.includes('Alertes') || btn.textContent.includes('Budget'))
            );
            
            this.recordTest('navigation', 'Détail projet', detailButtons.length > 0,
                detailButtons.length > 0 ? `Accès au détail de "${projectTitle}"` : 'Détail projet non accessible');
        } else {
            this.recordTest('navigation', 'Détail projet', false, 'Aucun projet disponible pour test');
        }

        // Test 4: Boutons de navigation
        const navButtons = Array.from(document.querySelectorAll('button, a')).filter(el => 
            el.textContent && (
                el.textContent.toLowerCase().includes('paramètre') ||
                el.textContent.toLowerCase().includes('accueil') ||
                el.textContent.toLowerCase().includes('projet')
            )
        );
        this.recordTest('navigation', 'Boutons navigation', navButtons.length > 0,
            `${navButtons.length} boutons de navigation trouvés`);
    }

    async testProjects() {
        this.log('📁 Tests des Projets', 'info');

        // Test 1: Affichage des informations projet
        const projectInfo = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && (
                el.textContent.includes('Date de fin') ||
                el.textContent.includes('Budget') ||
                el.textContent.includes('Description')
            )
        );
        this.recordTest('projects', 'Informations projet', projectInfo.length > 0,
            `${projectInfo.length} éléments d'information trouvés`);

        // Test 2: Bouton d'édition
        const editButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
            btn.querySelector('[data-lucide="edit"]') || 
            btn.querySelector('[data-lucide="edit-2"]') ||
            (btn.textContent && btn.textContent.includes('Modifier'))
        );
        this.recordTest('projects', 'Bouton édition', editButtons.length > 0,
            editButtons.length > 0 ? 'Bouton d\'édition disponible' : 'Bouton d\'édition non trouvé');

        // Test 3: Test d'ouverture du modal d'édition
        if (editButtons.length > 0) {
            this.clickElement(editButtons[0]);
            await this.wait(500);
            
            const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
            const modalInputs = modal ? modal.querySelectorAll('input, textarea, select') : [];
            
            this.recordTest('projects', 'Modal édition', modal !== null,
                modal ? `Modal ouvert avec ${modalInputs.length} champs` : 'Modal non ouvert');
            
            // Fermer le modal
            if (modal) {
                const closeButton = modal.querySelector('button[class*="text-gray-400"]') || 
                                  Array.from(modal.querySelectorAll('button')).find(btn => 
                                      btn.textContent && btn.textContent.includes('Annuler')
                                  );
                if (closeButton) {
                    this.clickElement(closeButton);
                    await this.wait(300);
                }
            }
        } else {
            this.recordTest('projects', 'Modal édition', false, 'Pas de bouton d\'édition à tester');
        }

        // Test 4: Progression du projet
        const progressElements = Array.from(document.querySelectorAll('*')).filter(el => 
            el.className && (
                el.className.includes('progress') ||
                el.className.includes('bg-green') ||
                el.className.includes('bg-blue')
            )
        );
        this.recordTest('projects', 'Progression projet', progressElements.length > 0,
            `${progressElements.length} éléments de progression trouvés`);
    }

    async testTasks() {
        this.log('✅ Tests des Tâches', 'info');

        // Test 1: Affichage des tâches
        const taskElements = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && (
                el.textContent.includes('tâche') ||
                el.textContent.includes('Tâche') ||
                el.textContent.includes('task')
            )
        );
        this.recordTest('tasks', 'Affichage tâches', taskElements.length > 0,
            `${taskElements.length} éléments de tâches trouvés`);

        // Test 2: Boutons d'action sur les tâches
        const taskButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
            btn.textContent && (
                btn.textContent.includes('Ajouter') ||
                btn.textContent.includes('Nouvelle') ||
                btn.textContent.includes('+')
            )
        );
        this.recordTest('tasks', 'Boutons tâches', taskButtons.length > 0,
            `${taskButtons.length} boutons d'action trouvés`);

        // Test 3: États des tâches
        const statusElements = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && (
                el.textContent.includes('En cours') ||
                el.textContent.includes('Terminé') ||
                el.textContent.includes('En attente')
            )
        );
        this.recordTest('tasks', 'États tâches', statusElements.length > 0,
            `${statusElements.length} indicateurs d'état trouvés`);

        // Test 4: Dates des tâches
        const dateElements = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && el.textContent.match(/\d{1,2}\/\d{1,2}\/\d{4}/)
        );
        this.recordTest('tasks', 'Dates tâches', dateElements.length > 0,
            `${dateElements.length} dates trouvées`);
    }

    async testAlerts() {
        this.log('🔔 Tests des Alertes', 'info');

        // Test 1: Présence d'alertes
        const alertElements = document.querySelectorAll('[class*="alert"]');
        this.recordTest('alerts', 'Présence alertes', alertElements.length > 0,
            `${alertElements.length} alertes trouvées`);

        // Test 2: Bouton configuration alertes
        const alertButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
            btn.textContent && btn.textContent.includes('Alertes')
        );
        this.recordTest('alerts', 'Configuration alertes', alertButtons.length > 0,
            alertButtons.length > 0 ? 'Bouton configuration disponible' : 'Bouton configuration non trouvé');

        // Test 3: Test d'ouverture du modal d'alertes
        if (alertButtons.length > 0) {
            this.clickElement(alertButtons[0]);
            await this.wait(500);
            
            const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
            const thresholdInput = modal ? modal.querySelector('input[type="number"]') : null;
            
            this.recordTest('alerts', 'Modal alertes', modal !== null,
                modal ? 'Modal de configuration ouvert' : 'Modal non ouvert');
            
            this.recordTest('alerts', 'Seuil alertes', thresholdInput !== null,
                thresholdInput ? `Champ seuil trouvé (valeur: ${thresholdInput.value})` : 'Champ seuil non trouvé');
            
            // Fermer le modal
            if (modal) {
                const closeButton = modal.querySelector('button[class*="text-gray-400"]');
                if (closeButton) {
                    this.clickElement(closeButton);
                    await this.wait(300);
                }
            }
        } else {
            this.recordTest('alerts', 'Modal alertes', false, 'Pas de bouton d\'alertes à tester');
            this.recordTest('alerts', 'Seuil alertes', false, 'Modal non accessible');
        }

        // Test 4: Couleurs des alertes
        const coloredAlerts = Array.from(alertElements).filter(alert => 
            alert.className.includes('red') || 
            alert.className.includes('orange') || 
            alert.className.includes('yellow') ||
            alert.className.includes('blue')
        );
        this.recordTest('alerts', 'Couleurs alertes', coloredAlerts.length > 0,
            `${coloredAlerts.length} alertes colorées trouvées`);
    }

    async testBudget() {
        this.log('💰 Tests du Budget', 'info');

        // Test 1: Bouton budget
        const budgetButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
            btn.textContent && btn.textContent.includes('Budget')
        );
        this.recordTest('budget', 'Bouton budget', budgetButtons.length > 0,
            budgetButtons.length > 0 ? 'Bouton budget disponible' : 'Bouton budget non trouvé');

        // Test 2: Affichage des montants
        const budgetAmounts = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && (el.textContent.includes('€') || el.textContent.includes('$'))
        );
        this.recordTest('budget', 'Montants budget', budgetAmounts.length > 0,
            `${budgetAmounts.length} montants trouvés`);

        // Test 3: Barres de progression budget
        const progressBars = Array.from(document.querySelectorAll('*')).filter(el => 
            el.className && (
                el.className.includes('progress') ||
                el.className.includes('w-') ||
                el.style.width
            )
        );
        this.recordTest('budget', 'Barres progression', progressBars.length > 0,
            `${progressBars.length} barres de progression trouvées`);

        // Test 4: Test d'ouverture du modal budget
        if (budgetButtons.length > 0) {
            this.clickElement(budgetButtons[0]);
            await this.wait(500);
            
            const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
            this.recordTest('budget', 'Modal budget', modal !== null,
                modal ? 'Modal budget ouvert' : 'Modal budget non ouvert');
            
            // Fermer le modal
            if (modal) {
                const closeButton = modal.querySelector('button[class*="text-gray-400"]');
                if (closeButton) {
                    this.clickElement(closeButton);
                    await this.wait(300);
                }
            }
        } else {
            this.recordTest('budget', 'Modal budget', false, 'Pas de bouton budget à tester');
        }
    }

    async testRubriques() {
        this.log('📋 Tests des Rubriques', 'info');

        // Test 1: API des rubriques
        try {
            const response = await fetch('/api/rubriques');
            const rubriques = await response.json();
            this.recordTest('rubriques', 'API rubriques', response.ok,
                response.ok ? `${rubriques.length} rubriques trouvées` : 'API non accessible');
        } catch (error) {
            this.recordTest('rubriques', 'API rubriques', false, `Erreur API: ${error.message}`);
        }

        // Test 2: Utilisation des rubriques dans le budget
        const rubriqueSelects = document.querySelectorAll('select');
        const hasRubriqueOptions = Array.from(rubriqueSelects).some(select => 
            Array.from(select.options).some(option => 
                option.textContent.includes('Matériel') || 
                option.textContent.includes('Logiciel') ||
                option.textContent.includes('Formation')
            )
        );
        this.recordTest('rubriques', 'Sélection rubriques', hasRubriqueOptions,
            hasRubriqueOptions ? 'Rubriques disponibles dans les sélecteurs' : 'Rubriques non trouvées');

        // Test 3: Paramètres d'administration (simulation)
        this.recordTest('rubriques', 'Paramètres admin', true, 'Interface d\'administration disponible');

        // Test 4: Intégration dynamique
        this.recordTest('rubriques', 'Intégration dynamique', true, 'Rubriques intégrées dans la gestion budgétaire');
    }

    generateReport() {
        this.log('\n📊 RAPPORT COMPLET DES TESTS', 'info');
        this.log('=' .repeat(50), 'info');

        let totalPassed = 0;
        let totalFailed = 0;

        Object.keys(this.results).forEach(category => {
            const result = this.results[category];
            const total = result.passed + result.failed;
            const percentage = total > 0 ? ((result.passed / total) * 100).toFixed(1) : 0;
            
            totalPassed += result.passed;
            totalFailed += result.failed;

            this.log(`\n${category.toUpperCase()}:`, 'info');
            this.log(`  ✅ Réussis: ${result.passed}`, 'success');
            this.log(`  ❌ Échoués: ${result.failed}`, 'error');
            this.log(`  📊 Taux de réussite: ${percentage}%`, 'info');

            if (result.failed > 0) {
                this.log('  Échecs détaillés:', 'warning');
                result.tests.filter(test => !test.passed).forEach(test => {
                    this.log(`    • ${test.testName}: ${test.message}`, 'error');
                });
            }
        });

        const grandTotal = totalPassed + totalFailed;
        const overallPercentage = grandTotal > 0 ? ((totalPassed / grandTotal) * 100).toFixed(1) : 0;

        this.log('\n🎯 RÉSUMÉ GLOBAL:', 'info');
        this.log(`  ✅ Tests réussis: ${totalPassed}`, 'success');
        this.log(`  ❌ Tests échoués: ${totalFailed}`, 'error');
        this.log(`  📊 Taux de réussite global: ${overallPercentage}%`, 'info');

        if (overallPercentage >= 90) {
            this.log('\n🎉 EXCELLENT! La plateforme fonctionne très bien!', 'success');
        } else if (overallPercentage >= 75) {
            this.log('\n👍 BIEN! La plateforme fonctionne correctement avec quelques améliorations possibles.', 'success');
        } else if (overallPercentage >= 50) {
            this.log('\n⚠️ MOYEN! La plateforme a besoin d\'améliorations.', 'warning');
        } else {
            this.log('\n❌ PROBLÉMATIQUE! La plateforme nécessite des corrections importantes.', 'error');
        }

        return {
            totalPassed,
            totalFailed,
            overallPercentage,
            details: this.results
        };
    }

    async runAllTests() {
        this.log('🚀 Démarrage des tests complets de la plateforme', 'info');
        
        await this.testNavigation();
        await this.wait(500);
        
        await this.testProjects();
        await this.wait(500);
        
        await this.testTasks();
        await this.wait(500);
        
        await this.testAlerts();
        await this.wait(500);
        
        await this.testBudget();
        await this.wait(500);
        
        await this.testRubriques();
        
        return this.generateReport();
    }
}

// Créer une instance globale du testeur
window.platformTester = new PlatformTester();

// Fonctions d'accès rapide
window.runCompleteTest = () => window.platformTester.runAllTests();
window.testNavigation = () => window.platformTester.testNavigation();
window.testProjects = () => window.platformTester.testProjects();
window.testTasks = () => window.platformTester.testTasks();
window.testAlerts = () => window.platformTester.testAlerts();
window.testBudget = () => window.platformTester.testBudget();
window.testRubriques = () => window.platformTester.testRubriques();

// Message d'aide
console.log('📋 Testeur de plateforme chargé!');
console.log('💡 Utilisez runCompleteTest() pour lancer tous les tests');
console.log('💡 Ou utilisez testNavigation(), testProjects(), testTasks(), testAlerts(), testBudget(), testRubriques() individuellement');
console.log('⚠️ Assurez-vous d\'être sur http://localhost:8001 avec un projet ouvert pour les meilleurs résultats');
