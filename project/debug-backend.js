const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testAPI() {
    console.log('🔍 Test de l\'API Backend...\n');
    
    // Test 1: Serveur de base
    try {
        console.log('📡 Test 1: Serveur de base...');
        const response = await axios.get(`${API_BASE}/projects/all`);
        console.log('✅ Serveur accessible');
        console.log(`📊 ${response.data.projects?.length || 0} projets trouvés`);
    } catch (error) {
        console.log('❌ Serveur non accessible');
        console.log('   Erreur:', error.message);
        console.log('   Solution: Démarrez le backend avec "npm run dev"');
        return;
    }
    
    // Test 2: Authentification
    try {
        console.log('\n🔐 Test 2: Authentification...');
        const authResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'marie.dupont@example.com',
            password: 'password123'
        });
        console.log('✅ Authentification réussie');
        console.log(`👤 Utilisateur: ${authResponse.data.user.email} (${authResponse.data.user.role})`);
        
        const token = authResponse.data.token;
        
        // Test 3: API PV avec authentification
        console.log('\n📋 Test 3: API PV de réunion...');
        const pvResponse = await axios.get(`${API_BASE}/meeting-minutes`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ API PV de réunion accessible');
        console.log(`📄 ${pvResponse.data.meetingMinutes?.length || 0} PV trouvés`);
        
        // Test 4: Création de PV (simulation)
        console.log('\n📝 Test 4: Test de création PV...');
        const FormData = require('form-data');
        const fs = require('fs');
        
        // Créer un fichier de test temporaire
        const testContent = 'Test PV de réunion - Contenu de test';
        fs.writeFileSync('test-pv.txt', testContent);
        
        const formData = new FormData();
        formData.append('titre', 'Test PV API');
        formData.append('date_reunion', '2024-01-15');
        formData.append('description', 'Test de création via API');
        formData.append('projets', JSON.stringify(['1'])); // Supposons que le projet 1 existe
        formData.append('file', fs.createReadStream('test-pv.txt'));
        
        try {
            const createResponse = await axios.post(`${API_BASE}/meeting-minutes`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('✅ Création de PV réussie');
            console.log(`📄 PV créé avec ID: ${createResponse.data.meetingMinutes?.id}`);
        } catch (createError) {
            console.log('❌ Erreur lors de la création de PV');
            console.log('   Erreur:', createError.response?.data || createError.message);
        }
        
        // Nettoyer le fichier de test
        fs.unlinkSync('test-pv.txt');
        
    } catch (error) {
        console.log('❌ Erreur d\'authentification');
        console.log('   Erreur:', error.response?.data || error.message);
        console.log('   Solution: Vérifiez que les données de test sont insérées (npx knex seed:run)');
    }
    
    console.log('\n🎯 Résumé:');
    console.log('- Si tous les tests passent: L\'erreur vient du frontend');
    console.log('- Si un test échoue: Le problème est identifié');
    console.log('- Vérifiez les logs du backend pour plus de détails');
}

testAPI().catch(console.error);
