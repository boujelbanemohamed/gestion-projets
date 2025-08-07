console.log('🧪 Test de Node.js...');
console.log('✅ Node.js fonctionne !');
console.log('📍 Répertoire actuel:', __dirname);
console.log('📁 Fichier actuel:', __filename);
console.log('🕐 Timestamp:', new Date().toISOString());

// Test de require
try {
  const fs = require('fs');
  console.log('✅ Module fs accessible');
} catch (error) {
  console.log('❌ Erreur module fs:', error.message);
}

// Test d'express
try {
  const express = require('express');
  console.log('✅ Module express accessible');
} catch (error) {
  console.log('❌ Erreur module express:', error.message);
  console.log('💡 Solution: npm install express');
}

console.log('🏁 Test terminé');
