const axios = require('axios');

async function testBroadcastingSystem() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🔍 Testing Broadcasting System...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server availability...');
    const healthResponse = await axios.get(`${baseUrl}/api/v1/jobs/health`);
    console.log(`✅ Server is running - Status: ${healthResponse.status}`);
    
    // Test 2: Check Redis connection
    console.log('\n2️⃣ Testing Redis connection...');
    const redisResponse = await axios.get(`${baseUrl}/api/v1/jobs/broadcast-metrics`);
    console.log(`✅ Redis metrics retrieved - Status: ${redisResponse.status}`);
    console.log('📊 Current metrics:', redisResponse.data);
    
    // Test 3: Check for nearby workers
    console.log('\n3️⃣ Checking for nearby workers...');
    const workersResponse = await axios.get(`${baseUrl}/api/v1/jobs/nearby-workers?lat=22.5726&lng=88.3639&radius=10`);
    console.log(`✅ Workers check - Status: ${workersResponse.status}`);
    console.log('👥 Workers found:', workersResponse.data.length);
    
    if (workersResponse.data.length > 0) {
      console.log('📋 Sample worker:', workersResponse.data[0]);
    } else {
      console.log('⚠️ No workers found in database');
      console.log('\n🔧 To test broadcasting, you need to:');
      console.log('1. Add workers to the database');
      console.log('2. Make sure workers have live_locations entries');
      console.log('3. Workers should be online in the dashboard');
    }
    
    // Test 4: Create a test job
    console.log('\n4️⃣ Creating test job...');
    const jobData = {
      userId: '00010232-3670-4bd8-850f-53699c33c8fa',
      description: 'Test Plumbing Service - Pipe repair needed urgently',
      address: '123 Test Street, Kolkata, West Bengal',
      lat: 22.5726,
      lng: 88.3639,
      durationMinutes: 120
    };
    
    console.log('📝 Creating job with data:', jobData);
    const jobResponse = await axios.post(`${baseUrl}/api/v1/jobs`, jobData);
    console.log(`✅ Job created - Status: ${jobResponse.status}`);
    console.log('📋 Job ID:', jobResponse.data.data.id);
    
    // Test 5: Check updated metrics
    console.log('\n5️⃣ Checking updated metrics...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const updatedMetrics = await axios.get(`${baseUrl}/api/v1/jobs/broadcast-metrics`);
    console.log('📊 Updated metrics:', updatedMetrics.data);
    
    console.log('\n🎉 Broadcasting system test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Add workers to database with live_locations');
    console.log('2. Open worker dashboard and go "Online"');
    console.log('3. Create a job from booking page');
    console.log('4. Watch for job requests with 2-minute countdown');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Server is not running. Please start the backend server:');
      console.log('1. cd Backend');
      console.log('2. npm run dev');
    } else if (error.response) {
      console.log('\n🔧 Server error details:');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    }
  }
}

testBroadcastingSystem(); 