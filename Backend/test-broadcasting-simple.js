const axios = require('axios');

async function testJobBroadcasting() {
  try {
    console.log('🧪 Testing job broadcasting system...');

    // Test job data for beauty service
    const jobData = {
      userId: "00010232-3670-4bd8-850f-53699c33c8fa", // Use existing user ID
      description: "Hair Treatment - Deep conditioning and repair",
      address: "Street 247, New Town, West Bengal, 700160, India",
      lat: 22.578704,
      lng: 88.47612,
      bookedFor: null,
      durationMinutes: 60
    };

    console.log('📤 Creating job...');
    console.log('📍 Job location:', jobData.lat, jobData.lng);
    console.log('💇 Job description:', jobData.description);

    const response = await axios.post('http://localhost:3000/api/v1/jobs', jobData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Job created successfully!');
    console.log('📊 Response:', response.data);

    console.log('\n⏰ Job will be held for 2 minutes...');
    console.log('👷 Workers should receive notification within 5-10 seconds');
    console.log('🔔 Check worker dashboard for job requests');

  } catch (error) {
    console.error('❌ Error testing job broadcasting:', error.response?.data || error.message);
  }
}

testJobBroadcasting(); 