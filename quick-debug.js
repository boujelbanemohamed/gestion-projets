// Script de debug rapide - à coller dans la console du navigateur
// sur http://localhost:8001

console.log('🔍 Debug rapide des alertes');

// 1. Vérifier si on est sur la bonne page
console.log('URL actuelle:', window.location.href);

// 2. Chercher des éléments d'alerte
const alertElements = document.querySelectorAll('[class*="alert"]');
console.log(`Éléments d'alerte trouvés: ${alertElements.length}`);

alertElements.forEach((alert, index) => {
    console.log(`Alerte ${index + 1}:`, alert.textContent.substring(0, 100));
    console.log(`Classes:`, alert.className);
});

// 3. Chercher des projets
const projectCards = document.querySelectorAll('[class*="bg-white"][class*="rounded"]');
console.log(`Cartes de projet trouvées: ${projectCards.length}`);

// 4. Chercher des dates
const dateElements = document.querySelectorAll('*');
let datesFound = [];
dateElements.forEach(el => {
    if (el.textContent && el.textContent.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
        datesFound.push(el.textContent.trim());
    }
});
console.log('Dates trouvées:', [...new Set(datesFound)]);

// 5. Vérifier les fonctions d'alerte
if (typeof window.isProjectApproachingDeadline === 'undefined') {
    console.log('⚠️ Fonctions d\'alerte non disponibles dans window');
    
    // Tester avec une date proche
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 5);
    
    console.log('Test avec date dans 5 jours:', testDate.toLocaleDateString());
    
    // Simuler les fonctions
    const today = new Date();
    const daysUntil = Math.ceil((testDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    console.log('Jours calculés:', daysUntil);
    
    const isApproaching = daysUntil >= 0 && daysUntil <= 7;
    console.log('Devrait déclencher une alerte (seuil 7j):', isApproaching);
} else {
    console.log('✅ Fonctions d\'alerte disponibles');
}

// 6. Chercher le bouton "Alertes"
const alertButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent && btn.textContent.includes('Alertes')
);

if (alertButton) {
    console.log('✅ Bouton "Alertes" trouvé');
    console.log('Texte du bouton:', alertButton.textContent);
    console.log('Classes:', alertButton.className);
} else {
    console.log('❌ Bouton "Alertes" non trouvé');
    
    // Lister tous les boutons
    const allButtons = document.querySelectorAll('button');
    console.log(`Boutons trouvés: ${allButtons.length}`);
    allButtons.forEach((btn, index) => {
        if (btn.textContent) {
            console.log(`Bouton ${index + 1}: "${btn.textContent.trim()}"`);
        }
    });
}

// 7. Vérifier si on est dans un projet
const projectTitle = document.querySelector('h1');
if (projectTitle) {
    console.log('Titre de la page:', projectTitle.textContent);
}

// 8. Chercher des éléments avec "échéance" ou "deadline"
const deadlineElements = Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent && (
        el.textContent.toLowerCase().includes('échéance') ||
        el.textContent.toLowerCase().includes('deadline') ||
        el.textContent.toLowerCase().includes('délai')
    )
);

console.log(`Éléments avec "échéance/délai": ${deadlineElements.length}`);
deadlineElements.forEach((el, index) => {
    console.log(`${index + 1}: ${el.textContent.substring(0, 100)}`);
});

console.log('🏁 Debug terminé');
