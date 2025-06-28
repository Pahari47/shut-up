const axios = require('axios');

async function createTestJob() {
  try {
    console.log('🚀 Creating test job...');
    
    const jobData = {
      userId: "550e8400-e29b-41d4-a716-446655440000", // Replace with actual user ID
      description: "Need a plumber to fix leaking pipe in kitchen",
      address: "123 Test Street, Test City",
      lat: 22.5726, // Kolkata coordinates
      lng: 88.3639,
      durationMinutes: 60
    };

    const response = await axios.post('http://localhost:5000/api/v1/jobs', jobData);
    
    console.log('✅ Test job created successfully!');
    console.log('Job ID:', response.data.data.id);
    console.log('📡 Job should now be broadcasted to nearby workers');
    
  } catch (error) {
    console.error('❌ Error creating test job:', error.response?.data || error.message);
  }
}

createTestJob(); 