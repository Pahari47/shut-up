const axios = require('axios');

async function completeSetup() {
  try {
    console.log('🚀 Starting complete setup for job broadcasting...');
    
    // Step 1: Create a test user
    console.log('\n1️⃣ Creating test user...');
    const userData = {
      firstName: "Test",
      lastName: "User", 
      email: "testuser@example.com",
      phoneNumber: "1234567890",
      address: "Test Address",
      city: "Test City",
      lat: 22.5726,
      lng: 88.3639
    };
    
    const userResponse = await axios.post('http://localhost:5000/api/v1/users', userData);
    const userId = userResponse.data.data.id;
    console.log('✅ Test user created with ID:', userId);
    
    // Step 2: Create a test worker
    console.log('\n2️⃣ Creating test worker...');
    const workerData = {
      firstName: "Test",
      lastName: "Worker",
      email: "testworker@example.com", 
      phoneNumber: "9876543210",
      dateOfBirth: "1990-01-01",
      address: "Worker Address",
      isActive: true
    };
    
    const workerResponse = await axios.post('http://localhost:5000/api/v1/workers', workerData);
    const workerId = workerResponse.data.data.id;
    console.log('✅ Test worker created with ID:', workerId);
    
    // Step 3: Add specializations to worker
    console.log('\n3️⃣ Adding specializations to worker...');
    const specializations = [
      {
        workerId: workerId,
        category: "plumber",
        subCategory: "pipe_repair",
        proficiency: 4,
        isPrimary: true
      },
      {
        workerId: workerId,
        category: "electrician",
        subCategory: "wiring", 
        proficiency: 3,
        isPrimary: false
      }
    ];
    
    for (const spec of specializations) {
      await axios.post('http://localhost:5000/api/v1/specializations', spec);
      console.log(`✅ Added ${spec.category} specialization`);
    }
    
    // Step 4: Add live location for worker
    console.log('\n4️⃣ Adding live location for worker...');
    const locationData = {
      workerId: workerId,
      lat: 22.5726, // Same as job location for testing
      lng: 88.3639
    };
    
    await axios.post('http://localhost:5000/api/v1/live-locations', locationData);
    console.log('✅ Live location added');
    
    // Step 5: Create a test job
    console.log('\n5️⃣ Creating test job...');
    const jobData = {
      userId: userId,
      description: "Need a plumber to fix leaking pipe in kitchen",
      address: "123 Test Street, Test City", 
      lat: 22.5726,
      lng: 88.3639,
      durationMinutes: 60
    };
    
    const jobResponse = await axios.post('http://localhost:5000/api/v1/jobs', jobData);
    console.log('✅ Test job created with ID:', jobResponse.data.data.id);
    
    console.log('\n🎉 Complete setup finished!');
    console.log('\n📋 Summary:');
    console.log('- User ID:', userId);
    console.log('- Worker ID:', workerId);
    console.log('- Job ID:', jobResponse.data.data.id);
    console.log('\n🔍 Next steps:');
    console.log('1. Start your backend server');
    console.log('2. Start your frontend');
    console.log('3. Login as the worker (testworker@example.com)');
    console.log('4. Go live in the worker dashboard');
    console.log('5. The job should be broadcasted to the worker!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.response?.data || error.message);
  }
}

completeSetup(); 