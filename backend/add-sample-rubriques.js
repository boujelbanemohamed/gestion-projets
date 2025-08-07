const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

const sampleRubriques = [
  'Matériel informatique',
  'Logiciels et licences',
  'Formation et développement',
  'Frais de déplacement',
  'Prestations externes',
  'Fournitures de bureau',
  'Télécommunications',
  'Marketing et communication'
];

async function addSampleRubriques() {
  console.log('Adding sample rubriques...\n');

  try {
    for (const nom of sampleRubriques) {
      console.log(`Adding: ${nom}`);
      const response = await axios.post(`${BASE_URL}/rubriques`, { nom });
      console.log(`✅ Created: ${response.data.nom} (ID: ${response.data.id})`);
    }

    console.log('\n🎉 All sample rubriques added successfully!');
    
    // Show all rubriques
    console.log('\nCurrent rubriques:');
    const allRubriques = await axios.get(`${BASE_URL}/rubriques`);
    allRubriques.data.forEach((rubrique, index) => {
      console.log(`${index + 1}. ${rubrique.nom}`);
    });

  } catch (error) {
    console.error('❌ Error adding sample rubriques:', error.response?.data || error.message);
  }
}

addSampleRubriques();
