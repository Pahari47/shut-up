const axios = require('axios');
const { io } = require('socket.io-client');

async function testFullWorkflow() {
  try {
    console.log('🚀 Starting full workflow test for job tracking system...');
    
    const now = Date.now();
    let userId, workerId, jobId;
    
    // Step 1: Create a test user
    console.log('\n1️⃣ Creating test user...');
    const userData = {
      firstName: "Test",
      lastName: "User", 
      email: `testuser_${now}@example.com`,
      phoneNumber: `${now}`.slice(0, 12),
      address: "Test Address",
      city: "Test City",
      lat: 22.5726,
      lng: 88.3639
    };
    
    const userResponse = await axios.post('http://localhost:5000/api/v1/users', userData);
    userId = userResponse.data.data.id;
    console.log('✅ Test user created with ID:', userId);
    
    // Step 2: Create a test worker
    console.log('\n2️⃣ Creating test worker...');
    const workerData = {
      firstName: "Test",
      lastName: "Worker",
      email: `testworker_${now}@example.com`,
      phoneNumber: `${now}98`.slice(0, 13),
      dateOfBirth: "1990-01-01",
      address: "Worker Address",
      isActive: true
    };
    
    const workerResponse = await axios.post('http://localhost:5000/api/v1/workers', workerData);
    workerId = workerResponse.data.data.id;
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
      lat: 22.5726,
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
    jobId = jobResponse.data.data.id;
    console.log('✅ Test job created with ID:', jobId);
    
    // Step 6: Test WebSocket connection for job tracking
    console.log('\n6️⃣ Testing WebSocket connection for job tracking...');
    await testWebSocketConnection(jobId, userId);
    
    // Step 7: Simulate worker accepting the job
    console.log('\n7️⃣ Simulating worker accepting the job...');
    await simulateJobAcceptance(jobId, workerId);
    
    // Step 8: Test real-time location updates
    console.log('\n8️⃣ Testing real-time location updates...');
    await testLocationUpdates(jobId, workerId, userId);
    
    console.log('\n🎉 Full workflow test completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('- User ID:', userId);
    console.log('- Worker ID:', workerId);
    console.log('- Job ID:', jobId);
    console.log('\n🔍 Manual Testing Steps:');
    console.log('1. Open frontend in browser');
    console.log('2. Navigate to worker dashboard with worker ID:', workerId);
    console.log('3. Go live and accept the job');
    console.log('4. Navigate to user tracking page with jobId:', jobId, 'and userId:', userId);
    console.log('5. Verify real-time location tracking works');
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error.response?.data || error.message);
  }
}

async function testWebSocketConnection(jobId, userId) {
  return new Promise((resolve, reject) => {
    const socket = io('http://localhost:5000', {
      timeout: 5000,
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected');
      
      // Join job tracking room
      socket.emit('join_job_room', { jobId });
      console.log('✅ Sent join job room message');
      
      // Wait a moment then disconnect
      setTimeout(() => {
        socket.disconnect();
        resolve();
      }, 1000);
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      reject(new Error(error.message));
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      socket.disconnect();
      reject(new Error('Socket.IO test timeout'));
    }, 5000);
  });
}

async function simulateJobAcceptance(jobId, workerId) {
  try {
    // Update job status to accepted
    const updateData = {
      status: 'accepted',
      workerId: workerId
    };
    
    await axios.patch(`http://localhost:5000/api/v1/jobs/${jobId}`, updateData);
    console.log('✅ Job accepted by worker');
    
    // Add worker location for tracking
    const locationData = {
      workerId: workerId,
      lat: 22.5726,
      lng: 88.3639
    };
    
    await axios.post('http://localhost:5000/api/v1/live-locations', locationData);
    console.log('✅ Worker location updated for tracking');
    
  } catch (error) {
    console.error('❌ Job acceptance failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testLocationUpdates(jobId, workerId, userId) {
  return new Promise((resolve, reject) => {
    const socket = io('http://localhost:5000', {
      timeout: 5000,
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected for location testing');
      
      // Join job room
      socket.emit('join_job_room', { jobId });
      
      // Simulate location update after 1 second
      setTimeout(() => {
        socket.emit('worker_location_update', {
          jobId: jobId,
          lat: 22.5727,
          lng: 88.3640
        });
        console.log('✅ Sent simulated location update');
      }, 1000);
    });
    
    let locationReceived = false;
    
    socket.on('location_update', (data) => {
      console.log('✅ Received location update:', data);
      locationReceived = true;
      socket.disconnect();
      resolve();
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO error:', error.message);
      reject(new Error(error.message));
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      socket.disconnect();
      if (!locationReceived) {
        reject(new Error('Location update test timeout'));
      }
    }, 10000);
  });
}

// Run the test
testFullWorkflow(); 