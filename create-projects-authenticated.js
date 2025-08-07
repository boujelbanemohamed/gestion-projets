// Script pour créer les projets via l'interface authentifiée
console.log('🚀 CRÉATION DES PROJETS VIA INTERFACE AUTHENTIFIÉE');
console.log('='.repeat(60));

// Vérifier si l'utilisateur est connecté
const checkAuth = () => {
    const authToken = localStorage.getItem('sb-obdadipsbbrlwetkuyui-auth-token');
    if (authToken) {
        console.log('✅ Utilisateur authentifié détecté');
        return true;
    } else {
        console.log('❌ Aucune authentification détectée');
        console.log('📋 Veuillez vous connecter avec:');
        console.log('   Email: admin@gestionprojet.com');
        console.log('   Mot de passe: Admin123!');
        return false;
    }
};

// Projets à créer avec format simplifié
const projectsToCreate = [
    {
        nom: 'Refonte Site Web',
        description: 'Modernisation complète du site web de l\'entreprise',
        budget_initial: 25000,
        devise: 'EUR',
        statut: 'en_cours'
    },
    {
        nom: 'Application Mobile',
        description: 'Développement d\'une application mobile native',
        budget_initial: 35000,
        devise: 'EUR',
        statut: 'planifie'
    },
    {
        nom: 'Migration Base de Données',
        description: 'Migration vers une nouvelle infrastructure cloud',
        budget_initial: 15000,
        devise: 'EUR',
        statut: 'planifie'
    }
];

async function createProjectsAuthenticated() {
    if (!checkAuth()) {
        return { error: 'Authentication required' };
    }

    console.log('\n📁 CRÉATION DES PROJETS...');
    console.log('-'.repeat(40));

    const results = [];
    const authToken = localStorage.getItem('sb-obdadipsbbrlwetkuyui-auth-token');
    
    for (const project of projectsToCreate) {
        console.log(`\n📝 Création: ${project.nom}...`);
        
        try {
            const response = await fetch('https://obdadipsbbrlwetkuyui.supabase.co/rest/v1/projects', {
                method: 'POST',
                headers: {
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGFkaXBzYmJybHdldGt1eXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODgxMjMsImV4cCI6MjA3MDA2NDEyM30.jracnTOp7Y0QBTbt7qjY4076aBqh3pq7DR-rU_U33fo',
                    'Authorization': `Bearer ${JSON.parse(authToken).access_token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(project)
            });

            if (response.ok) {
                const created = await response.json();
                console.log(`✅ ${project.nom}: Créé avec succès`);
                results.push({ success: true, project: project.nom, id: created.id });
            } else {
                const error = await response.text();
                console.log(`❌ ${project.nom}: Erreur ${response.status}`);
                console.log(`   Détails: ${error}`);
                results.push({ success: false, project: project.nom, error: response.status });
            }
        } catch (error) {
            console.log(`❌ ${project.nom}: Erreur réseau - ${error.message}`);
            results.push({ success: false, project: project.nom, error: error.message });
        }

        // Pause entre les créations
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 RÉSUMÉ DE LA CRÉATION DES PROJETS');
    console.log('='.repeat(60));

    const successCount = results.filter(r => r.success).length;
    console.log(`🎯 Projets créés: ${successCount}/${projectsToCreate.length}`);

    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} ${result.project}`);
    });

    if (successCount === projectsToCreate.length) {
        console.log('\n🎉 PARFAIT ! Tous les projets ont été créés');
        console.log('✅ Application maintenant 100% autonome');
        return { success: true, created: successCount };
    } else {
        console.log('\n⚠️ Création partielle des projets');
        console.log('💡 Vous pouvez créer les projets manquants via l\'interface');
        return { success: false, created: successCount };
    }
}

// Instructions pour l'utilisateur
console.log('\n📋 INSTRUCTIONS:');
console.log('1. Connectez-vous avec: admin@gestionprojet.com / Admin123!');
console.log('2. Exécutez: createProjectsAuthenticated()');
console.log('3. Vérifiez que les 3 projets sont créés');

// Exposer la fonction
window.createProjectsAuthenticated = createProjectsAuthenticated;

// Auto-exécution si authentifié
if (checkAuth()) {
    console.log('\n🚀 Lancement automatique...');
    createProjectsAuthenticated();
} else {
    console.log('\n⏳ En attente de connexion...');
}
