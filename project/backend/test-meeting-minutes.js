const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3000/api';

// Test configuration
const testConfig = {
  // You'll need to replace this with a valid JWT token
  authToken: 'your-jwt-token-here',
  testProjectId: 'your-project-id-here'
};

// Create axios instance with auth
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${testConfig.authToken}`
  }
});

async function testMeetingMinutesAPI() {
  console.log('🧪 Testing Meeting Minutes API...\n');

  try {
    // Test 1: Get all meeting minutes
    console.log('1️⃣ Testing GET /meeting-minutes');
    try {
      const response = await api.get('/meeting-minutes');
      console.log('✅ Success:', response.status);
      console.log('📊 Found', response.data.meetingMinutes.length, 'meeting minutes');
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.error);
    }

    // Test 2: Get meeting minutes with filters
    console.log('\n2️⃣ Testing GET /meeting-minutes with filters');
    try {
      const response = await api.get('/meeting-minutes?page=1&limit=5&search=test');
      console.log('✅ Success:', response.status);
      console.log('📊 Pagination:', response.data.pagination);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.error);
    }

    // Test 3: Get meeting minutes by project
    console.log('\n3️⃣ Testing GET /meeting-minutes/project/:projectId');
    try {
      const response = await api.get(`/meeting-minutes/project/${testConfig.testProjectId}`);
      console.log('✅ Success:', response.status);
      console.log('📊 Found', response.data.meetingMinutes.length, 'meeting minutes for project');
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.error);
    }

    // Test 4: Create a test file for upload
    console.log('\n4️⃣ Testing POST /meeting-minutes (file upload)');
    try {
      // Create a test file
      const testFilePath = path.join(__dirname, 'test-pv.txt');
      fs.writeFileSync(testFilePath, 'Test PV content for API testing');

      const formData = new FormData();
      formData.append('titre', 'Test PV API');
      formData.append('date_reunion', '2024-01-15');
      formData.append('description', 'Test PV created via API');
      formData.append('projets', JSON.stringify([testConfig.testProjectId]));
      formData.append('file', fs.createReadStream(testFilePath));

      const response = await api.post('/meeting-minutes', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      console.log('✅ Success:', response.status);
      console.log('📄 Created PV:', response.data.meetingMinutes.titre);
      
      const createdPVId = response.data.meetingMinutes.id;

      // Clean up test file
      fs.unlinkSync(testFilePath);

      // Test 5: Get specific meeting minutes
      console.log('\n5️⃣ Testing GET /meeting-minutes/:id');
      try {
        const getResponse = await api.get(`/meeting-minutes/${createdPVId}`);
        console.log('✅ Success:', getResponse.status);
        console.log('📄 Retrieved PV:', getResponse.data.meetingMinutes.titre);
      } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data?.error);
      }

      // Test 6: Update meeting minutes
      console.log('\n6️⃣ Testing PUT /meeting-minutes/:id');
      try {
        const updateData = {
          titre: 'Test PV API - Updated',
          description: 'Updated description via API'
        };
        const updateResponse = await api.put(`/meeting-minutes/${createdPVId}`, updateData);
        console.log('✅ Success:', updateResponse.status);
        console.log('📄 Updated PV:', updateResponse.data.meetingMinutes.titre);
      } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data?.error);
      }

      // Test 7: Download meeting minutes
      console.log('\n7️⃣ Testing GET /meeting-minutes/:id/download');
      try {
        const downloadResponse = await api.get(`/meeting-minutes/${createdPVId}/download`, {
          responseType: 'blob'
        });
        console.log('✅ Success:', downloadResponse.status);
        console.log('📁 File size:', downloadResponse.data.size, 'bytes');
      } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data?.error);
      }

      // Test 8: Delete meeting minutes
      console.log('\n8️⃣ Testing DELETE /meeting-minutes/:id');
      try {
        const deleteResponse = await api.delete(`/meeting-minutes/${createdPVId}`);
        console.log('✅ Success:', deleteResponse.status);
        console.log('🗑️ Deleted PV successfully');
      } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data?.error);
      }

    } catch (error) {
      console.log('❌ Create Error:', error.response?.status, error.response?.data?.error);
    }

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  }

  console.log('\n🏁 Meeting Minutes API tests completed!');
}

// Validation function
function validateConfig() {
  if (testConfig.authToken === 'your-jwt-token-here') {
    console.log('⚠️  Please update testConfig.authToken with a valid JWT token');
    return false;
  }
  if (testConfig.testProjectId === 'your-project-id-here') {
    console.log('⚠️  Please update testConfig.testProjectId with a valid project ID');
    return false;
  }
  return true;
}

// Run tests
if (validateConfig()) {
  testMeetingMinutesAPI();
} else {
  console.log('\n📝 To run tests:');
  console.log('1. Start the backend server: npm run dev');
  console.log('2. Get a JWT token by logging in');
  console.log('3. Get a valid project ID from the database');
  console.log('4. Update the testConfig object in this file');
  console.log('5. Run: node test-meeting-minutes.js');
}
