const { io } = require('socket.io-client');

// Test real job tracking
async function testRealJobTracking() {
  console.log('🧪 Testing Real Job Tracking...');
  
  // First, let's check what jobs exist in the database
  try {
    const response = await fetch('http://localhost:5000/api/v1/jobs', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📋 Available jobs:', data);
      
      // The API returns jobs directly, not in a data property
      if (data && data.length > 0) {
        // Find a confirmed job (has worker assigned)
        const confirmedJob = data.find(job => job.status === 'confirmed' && job.workerId);
        
        if (confirmedJob) {
          console.log('🎯 Using confirmed job:', confirmedJob);
          testJobTracking(confirmedJob.id, confirmedJob.userId);
        } else {
          // Use the first job if no confirmed jobs
          const job = data[0];
          console.log('🎯 Using first job:', job);
          testJobTracking(job.id, job.userId);
        }
      } else {
        console.log('❌ No jobs found in database');
        console.log('💡 Create a job first through the booking system');
      }
    } else {
      console.log('❌ Failed to fetch jobs:', response.status);
    }
  } catch (error) {
    console.log('❌ Error fetching jobs:', error.message);
  }
}

function testJobTracking(jobId, userId) {
  console.log(`🔗 Connecting to socket server...`);
  
  const socket = io('http://localhost:5000', {
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ Connected to socket server');
    console.log(`👤 Joining job tracking: ${jobId} for user: ${userId}`);
    
    // Join job tracking
    socket.emit('join_job_tracking', { jobId, userId });
  });

  socket.on('connect_error', (error) => {
    console.log('❌ Connection error:', error.message);
  });

  socket.on('tracking_started', (data) => {
    console.log('✅ Tracking started:', data);
  });

  socket.on('tracking_error', (data) => {
    console.log('❌ Tracking error:', data);
  });

  socket.on('worker_assigned', (data) => {
    console.log('👷 Worker assigned:', data);
  });

  socket.on('worker_location_update', (data) => {
    console.log('📍 Worker location update:', data);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Disconnected from socket server');
  });

  // Cleanup after 10 seconds
  setTimeout(() => {
    console.log('🛑 Test completed, disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 10000);
}

// Run the test
testRealJobTracking(); 