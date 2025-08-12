const fs = require('fs');
const path = require('path');

// Configuration des remplacements
const replacements = [
  {
    from: "'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR'",
    to: "'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'"
  },
  {
    from: "'UTILISATEUR'",
    to: "'USER'"
  },
  {
    from: "role: 'UTILISATEUR'",
    to: "role: 'USER'"
  },
  {
    from: "case 'UTILISATEUR':",
    to: "case 'USER':"
  },
  {
    from: "filterRole, setFilterRole] = useState<'all' | 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR'>('all')",
    to: "filterRole, setFilterRole] = useState<'all' | 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'>('all')"
  },
  {
    from: "currentUser.role === 'UTILISATEUR'",
    to: "currentUser.role === 'USER'"
  },
  {
    from: "m.role === 'UTILISATEUR'",
    to: "m.role === 'USER'"
  },
  {
    from: "value=\"UTILISATEUR\"",
    to: "value=\"USER\""
  },
  {
    from: "['SUPER_ADMIN', 'ADMIN', 'UTILISATEUR']",
    to: "['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']"
  }
];

// Fonction pour traiter un fichier
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let hasChanges = false;

    replacements.forEach(replacement => {
      if (content.includes(replacement.from)) {
        modifiedContent = modifiedContent.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
        hasChanges = true;
        console.log(`✅ Remplacé dans ${filePath}: ${replacement.from} → ${replacement.to}`);
      }
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour parcourir récursivement les dossiers
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  let totalFiles = 0;
  let modifiedFiles = 0;

  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      const result = processDirectory(fullPath);
      totalFiles += result.totalFiles;
      modifiedFiles += result.modifiedFiles;
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      totalFiles++;
      if (processFile(fullPath)) {
        modifiedFiles++;
      }
    }
  });

  return { totalFiles, modifiedFiles };
}

// Fonction principale
function main() {
  console.log('🔧 Correction automatique des types de rôles...\n');

  const srcDir = path.join(__dirname, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ Dossier src non trouvé. Exécutez ce script depuis la racine du projet.');
    return;
  }

  console.log('📁 Traitement du dossier src...');
  const result = processDirectory(srcDir);

  console.log('\n📊 Résumé des modifications :');
  console.log(`   Total de fichiers traités : ${result.totalFiles}`);
  console.log(`   Fichiers modifiés : ${result.modifiedFiles}`);
  
  if (result.modifiedFiles > 0) {
    console.log('\n✅ Correction terminée !');
    console.log('🔄 Redémarrez votre serveur de développement pour appliquer les changements.');
  } else {
    console.log('\nℹ️ Aucune modification nécessaire.');
  }

  console.log('\n📋 Actions recommandées :');
  console.log('1. Vérifiez que l\'application compile sans erreurs');
  console.log('2. Testez le changement de rôle d\'un utilisateur');
  console.log('3. Vérifiez la console du navigateur pour d\'éventuelles erreurs');
}

// Exécution du script
if (require.main === module) {
  main();
}

module.exports = { processFile, processDirectory };
