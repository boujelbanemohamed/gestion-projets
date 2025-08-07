#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  baseUrl: 'http://localhost:8000',
  collections: [
    'postman_collection.json',
    'postman_users_departments.json',
    'postman_comments_uploads.json',
    'postman_notifications_expenses.json',
    'postman_performance.json'
  ],
  environment: {
    baseUrl: 'http://localhost:8000',
    authToken: '',
    userId: '',
    projectId: '',
    taskId: '',
    departmentId: '',
    commentId: '',
    uploadId: '',
    notificationId: '',
    expenseId: ''
  }
};

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Fonction pour afficher des messages colorés
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Fonction pour vérifier si Newman est installé
function checkNewman() {
  return new Promise((resolve, reject) => {
    exec('newman --version', (error, stdout, stderr) => {
      if (error) {
        reject(new Error('Newman n\'est pas installé. Installez-le avec: npm install -g newman'));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// Fonction pour créer le fichier d'environnement
function createEnvironmentFile() {
  const envContent = {
    id: 'test-environment',
    name: 'GestionProjet Test Environment',
    values: Object.entries(config.environment).map(([key, value]) => ({
      key,
      value,
      enabled: true
    }))
  };

  fs.writeFileSync('environment.json', JSON.stringify(envContent, null, 2));
  log('✅ Fichier d\'environnement créé: environment.json', 'green');
}

// Fonction pour exécuter une collection
function runCollection(collectionFile) {
  return new Promise((resolve, reject) => {
    const command = `newman run "${collectionFile}" -e environment.json --reporters cli,json --reporter-json-export "results_${path.basename(collectionFile, '.json')}.json"`;
    
    log(`🔄 Exécution de ${collectionFile}...`, 'blue');
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log(`❌ Erreur lors de l'exécution de ${collectionFile}:`, 'red');
        log(error.message, 'red');
        reject(error);
      } else {
        log(`✅ ${collectionFile} exécuté avec succès`, 'green');
        console.log(stdout);
        resolve(stdout);
      }
    });
  });
}

// Fonction pour générer un rapport global
function generateReport() {
  const reportFiles = fs.readdirSync('.').filter(file => file.startsWith('results_') && file.endsWith('.json'));
  
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  const results = [];

  reportFiles.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const collectionName = file.replace('results_', '').replace('.json', '');
      
      const stats = data.run.stats;
      const collectionResults = {
        name: collectionName,
        tests: stats.assertions.total,
        passed: stats.assertions.passed,
        failed: stats.assertions.failed,
        requests: stats.requests.total,
        failedRequests: stats.requests.failed
      };
      
      results.push(collectionResults);
      totalTests += stats.assertions.total;
      totalPassed += stats.assertions.passed;
      totalFailed += stats.assertions.failed;
    } catch (error) {
      log(`❌ Erreur lors de la lecture du fichier ${file}: ${error.message}`, 'red');
    }
  });

  // Générer le rapport HTML
  const htmlReport = generateHTMLReport(results, totalTests, totalPassed, totalFailed);
  fs.writeFileSync('test_report.html', htmlReport);
  
  // Afficher le résumé
  log('\n📊 RAPPORT GLOBAL DES TESTS', 'cyan');
  log('='.repeat(50), 'cyan');
  
  results.forEach(result => {
    const status = result.failed === 0 ? '✅' : '❌';
    log(`${status} ${result.name}:`, 'bright');
    log(`   Tests: ${result.passed}/${result.tests} (${result.failed} échecs)`, result.failed === 0 ? 'green' : 'red');
    log(`   Requêtes: ${result.requests - result.failedRequests}/${result.requests}`, 'blue');
  });
  
  log('\n' + '='.repeat(50), 'cyan');
  log(`Total: ${totalPassed}/${totalTests} tests réussis (${totalFailed} échecs)`, totalFailed === 0 ? 'green' : 'red');
  log(`Taux de réussite: ${((totalPassed / totalTests) * 100).toFixed(2)}%`, totalFailed === 0 ? 'green' : 'yellow');
  log('📄 Rapport HTML généré: test_report.html', 'cyan');
}

// Fonction pour générer le rapport HTML
function generateHTMLReport(results, totalTests, totalPassed, totalFailed) {
  const successRate = ((totalPassed / totalTests) * 100).toFixed(2);
  const status = totalFailed === 0 ? 'success' : 'warning';
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport des Tests - GestionProjet API</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
        .summary-item { text-align: center; padding: 20px; border-radius: 8px; }
        .success { background-color: #d4edda; color: #155724; }
        .warning { background-color: #fff3cd; color: #856404; }
        .danger { background-color: #f8d7da; color: #721c24; }
        .results { margin-top: 30px; }
        .result-item { margin-bottom: 20px; padding: 15px; border-radius: 8px; border-left: 4px solid; }
        .result-success { background-color: #f8f9fa; border-left-color: #28a745; }
        .result-failed { background-color: #f8f9fa; border-left-color: #dc3545; }
        .progress-bar { width: 100%; height: 20px; background-color: #e9ecef; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background-color: #28a745; transition: width 0.3s ease; }
        .progress-fill.warning { background-color: #ffc107; }
        .progress-fill.danger { background-color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Rapport des Tests - GestionProjet API</h1>
            <p>Généré le ${new Date().toLocaleString('fr-FR')}</p>
        </div>
        
        <div class="summary">
            <div class="summary-item ${status}">
                <h3>Total Tests</h3>
                <h2>${totalTests}</h2>
            </div>
            <div class="summary-item success">
                <h3>Tests Réussis</h3>
                <h2>${totalPassed}</h2>
            </div>
            <div class="summary-item ${totalFailed > 0 ? 'danger' : 'success'}">
                <h3>Tests Échoués</h3>
                <h2>${totalFailed}</h2>
            </div>
            <div class="summary-item ${status}">
                <h3>Taux de Réussite</h3>
                <h2>${successRate}%</h2>
            </div>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill ${totalFailed === 0 ? 'success' : totalFailed < totalTests * 0.1 ? 'warning' : 'danger'}" 
                 style="width: ${successRate}%"></div>
        </div>
        
        <div class="results">
            <h2>📋 Détails par Collection</h2>
            ${results.map(result => {
                const resultStatus = result.failed === 0 ? 'success' : 'failed';
                const statusIcon = result.failed === 0 ? '✅' : '❌';
                return `
                <div class="result-item result-${resultStatus}">
                    <h3>${statusIcon} ${result.name}</h3>
                    <p><strong>Tests:</strong> ${result.passed}/${result.tests} (${result.failed} échecs)</p>
                    <p><strong>Requêtes:</strong> ${result.requests - result.failedRequests}/${result.requests}</p>
                    <p><strong>Taux de réussite:</strong> ${((result.passed / result.tests) * 100).toFixed(2)}%</p>
                </div>
                `;
            }).join('')}
        </div>
    </div>
</body>
</html>`;
}

// Fonction principale
async function main() {
  try {
    log('🚀 Démarrage des tests automatisés Postman', 'cyan');
    log('='.repeat(50), 'cyan');
    
    // Vérifier Newman
    const newmanVersion = await checkNewman();
    log(`✅ Newman version ${newmanVersion} détecté`, 'green');
    
    // Créer le fichier d'environnement
    createEnvironmentFile();
    
    // Exécuter toutes les collections
    for (const collection of config.collections) {
      if (fs.existsSync(collection)) {
        await runCollection(collection);
      } else {
        log(`⚠️  Collection ${collection} non trouvée, ignorée`, 'yellow');
      }
    }
    
    // Générer le rapport
    generateReport();
    
    log('\n🎉 Tests terminés avec succès!', 'green');
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { main, checkNewman, runCollection, generateReport }; 