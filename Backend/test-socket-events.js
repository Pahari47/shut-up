const io = require('socket.io-client');

// Test socket events
async function testSocketEvents() {
  console.log('🧪 [TEST] Starting socket event tests...');

  // Connect as a worker
  const workerSocket = io('http://localhost:5000');
  
  workerSocket.on('connect', () => {
    console.log('✅ [TEST] Worker connected:', workerSocket.id);
    
    // Join worker room
    workerSocket.emit('join_worker_room', { workerId: 'test-worker-123' });
    console.log('🏠 [TEST] Worker joined room');
  });

  // Listen for job broadcasts
  workerSocket.on('new_job_broadcast', (jobData) => {
    console.log('📨 [TEST] Received job broadcast:', jobData);
    
    // Simulate accepting the job
    setTimeout(() => {
      console.log('🤝 [TEST] Accepting job...');
      workerSocket.emit('accept_job', {
        jobId: jobData.id,
        workerId: 'test-worker-123'
      });
    }, 2000);
  });

  // Listen for job acceptance confirmation
  workerSocket.on('job_accepted_success', (data) => {
    console.log('✅ [TEST] Job accepted successfully:', data);
    
    // Simulate location updates
    let updateCount = 0;
    const locationInterval = setInterval(() => {
      updateCount++;
      const lat = 22.5726 + (Math.random() - 0.5) * 0.01;
      const lng = 88.3639 + (Math.random() - 0.5) * 0.01;
      
      console.log(`📍 [TEST] Updating location ${updateCount}:`, { lat, lng });
      workerSocket.emit('update_location', {
        jobId: data.job.id,
        workerId: 'test-worker-123',
        lat,
        lng
      });
      
      if (updateCount >= 5) {
        clearInterval(locationInterval);
        console.log('✅ [TEST] Location updates completed');
        
        // Complete the job
        setTimeout(() => {
          console.log('✅ [TEST] Completing job...');
          workerSocket.emit('complete_job', {
            jobId: data.job.id,
            workerId: 'test-worker-123'
          });
        }, 2000);
      }
    }, 3000);
  });

  // Listen for job completion
  workerSocket.on('job_completed_success', (data) => {
    console.log('🎉 [TEST] Job completed successfully:', data);
    console.log('✅ [TEST] All tests completed successfully!');
    process.exit(0);
  });

  // Listen for errors
  workerSocket.on('job_error', (data) => {
    console.error('❌ [TEST] Job error:', data);
  });

  // Test direct socket events without creating a job
  setTimeout(() => {
    console.log('🧪 [TEST] Testing direct socket events...');
    
    // Test accept_job with a fake job ID
    workerSocket.emit('accept_job', {
      jobId: 'fake-job-123',
      workerId: 'test-worker-123'
    });
    
    // Test decline_job
    setTimeout(() => {
      workerSocket.emit('decline_job', {
        jobId: 'fake-job-456',
        workerId: 'test-worker-123',
        reason: 'Test decline'
      });
    }, 1000);
    
    // Test update_location
    setTimeout(() => {
      workerSocket.emit('update_location', {
        jobId: 'fake-job-789',
        workerId: 'test-worker-123',
        lat: 22.5726,
        lng: 88.3639
      });
    }, 2000);
    
    console.log('✅ [TEST] Direct socket events tested');
    setTimeout(() => {
      console.log('✅ [TEST] Socket event tests completed!');
      process.exit(0);
    }, 5000);
  }, 3000);

  // Timeout after 15 seconds
  setTimeout(() => {
    console.error('⏰ [TEST] Test timeout - taking too long');
    process.exit(1);
  }, 15000);
}

testSocketEvents().catch(console.error); 