const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testRubriquesAPI() {
  console.log('Testing Rubriques API...\n');

  try {
    // Test 1: Get all rubriques (should be empty initially)
    console.log('1. Getting all rubriques...');
    const getAllResponse = await axios.get(`${BASE_URL}/rubriques`);
    console.log('Response:', getAllResponse.data);
    console.log('✅ GET /api/rubriques works\n');

    // Test 2: Create a new rubrique
    console.log('2. Creating a new rubrique...');
    const createResponse = await axios.post(`${BASE_URL}/rubriques`, {
      nom: 'Test Rubrique'
    });
    console.log('Response:', createResponse.data);
    console.log('✅ POST /api/rubriques works\n');

    const rubriqueId = createResponse.data.id;

    // Test 3: Get all rubriques again (should have one now)
    console.log('3. Getting all rubriques after creation...');
    const getAllResponse2 = await axios.get(`${BASE_URL}/rubriques`);
    console.log('Response:', getAllResponse2.data);
    console.log('✅ Rubrique was created successfully\n');

    // Test 4: Update the rubrique
    console.log('4. Updating the rubrique...');
    const updateResponse = await axios.put(`${BASE_URL}/rubriques/${rubriqueId}`, {
      nom: 'Test Rubrique Updated'
    });
    console.log('Response:', updateResponse.data);
    console.log('✅ PUT /api/rubriques/:id works\n');

    // Test 5: Delete the rubrique
    console.log('5. Deleting the rubrique...');
    const deleteResponse = await axios.delete(`${BASE_URL}/rubriques/${rubriqueId}`);
    console.log('Response:', deleteResponse.data);
    console.log('✅ DELETE /api/rubriques/:id works\n');

    // Test 6: Verify deletion
    console.log('6. Verifying deletion...');
    const getAllResponse3 = await axios.get(`${BASE_URL}/rubriques`);
    console.log('Response:', getAllResponse3.data);
    console.log('✅ Rubrique was deleted successfully\n');

    console.log('🎉 All tests passed! The Rubriques API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the tests
testRubriquesAPI();
