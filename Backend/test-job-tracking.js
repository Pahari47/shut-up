const { io } = require('socket.io-client');

// Test configuration
const BACKEND_URL = 'http://localhost:5000';
const TEST_JOB_ID = 'test-job-123';
const TEST_USER_ID = 'test-user-456';
const TEST_WORKER_ID = 'test-worker-789';

// Test scenarios
const testScenarios = {
  normal: {
    jobId: 'test-job-123',
    userId: 'test-user-456',
    description: 'Normal tracking test'
  },
  pending: {
    jobId: 'test-pending-job',
    userId: 'test-pending-user',
    description: 'Pending job test'
  },
  no_workers: {
    jobId: 'test-no-workers-job',
    userId: 'test-no-workers-user',
    description: 'No workers available test'
  },
  cancelled: {
    jobId: 'test-cancelled-job',
    userId: 'test-cancelled-user',
    description: 'Cancelled job test'
  },
  not_found: {
    jobId: 'non-existent-job-id',
    userId: 'non-existent-user-id',
    description: 'Job not found test'
  },
  unauthorized: {
    jobId: 'test-unauthorized-job',
    userId: 'wrong-user-id',
    description: 'Unauthorized access test'
  }
};

class JobTrackingTester {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // Connect to backend
  connect() {
    console.log('🔌 Connecting to backend...');
    
    this.socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to backend');
      console.log('🆔 Socket ID:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      this.isConnected = false;
    });

    // Listen for tracking events
    this.socket.on('tracking_started', (data) => {
      console.log('✅ Tracking started:', data);
    });

    this.socket.on('tracking_error', (data) => {
      console.log('❌ Tracking error:', data);
    });

    this.socket.on('worker_location_update', (data) => {
      console.log('📍 Worker location update:', data);
    });

    this.socket.on('worker_assigned', (data) => {
      console.log('👷 Worker assigned:', data);
    });
  }

  // Test a specific scenario
  testScenario(scenarioName) {
    if (!this.isConnected) {
      console.error('❌ Not connected to backend');
      return;
    }

    const scenario = testScenarios[scenarioName];
    if (!scenario) {
      console.error('❌ Unknown scenario:', scenarioName);
      return;
    }

    console.log(`\n🧪 Testing scenario: ${scenario.description}`);
    console.log(`📋 Job ID: ${scenario.jobId}`);
    console.log(`👤 User ID: ${scenario.userId}`);

    // Join job tracking
    this.socket.emit('join_job_tracking', {
      jobId: scenario.jobId,
      userId: scenario.userId
    });
  }

  // Simulate worker location updates
  simulateWorkerLocation(jobId, workerId, duration = 30) {
    if (!this.isConnected) {
      console.error('❌ Not connected to backend');
      return;
    }

    console.log(`\n🛠️ Simulating worker location updates for ${duration} seconds...`);
    
    let count = 0;
    const interval = setInterval(() => {
      count++;
      
      // Simulate movement (starting from Kolkata)
      const baseLat = 22.5726;
      const baseLng = 88.3639;
      const lat = baseLat + (count * 0.001); // Move north
      const lng = baseLng + (count * 0.001); // Move east

      this.socket.emit('update_location', {
        jobId,
        workerId,
        lat,
        lng
      });

      console.log(`📍 Location update ${count}: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);

      if (count >= duration) {
        clearInterval(interval);
        console.log('✅ Worker simulation completed');
      }
    }, 3000); // Update every 3 seconds
  }

  // Run all test scenarios
  runAllTests() {
    console.log('🚀 Running all test scenarios...\n');
    
    Object.keys(testScenarios).forEach((scenarioName, index) => {
      setTimeout(() => {
        this.testScenario(scenarioName);
      }, index * 5000); // Wait 5 seconds between tests
    });
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('🔌 Disconnected from backend');
    }
  }
}

// CLI interface
function showHelp() {
  console.log(`
Job Tracking Test Script

Usage: node test-job-tracking.js [command] [options]

Commands:
  connect                    Connect to backend
  test <scenario>           Test a specific scenario
  simulate <jobId> <workerId> [duration]  Simulate worker location updates
  all                       Run all test scenarios
  help                      Show this help

Scenarios:
  normal                    Normal tracking test
  pending                   Pending job test
  no_workers                No workers available test
  cancelled                 Cancelled job test
  not_found                 Job not found test
  unauthorized              Unauthorized access test

Examples:
  node test-job-tracking.js connect
  node test-job-tracking.js test normal
  node test-job-tracking.js simulate test-job-123 test-worker-789 30
  node test-job-tracking.js all
`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    showHelp();
    return;
  }

  const tester = new JobTrackingTester();

  try {
    switch (command) {
      case 'connect':
        tester.connect();
        break;

      case 'test':
        const scenario = args[1];
        if (!scenario) {
          console.error('❌ Please specify a scenario');
          showHelp();
          return;
        }
        tester.connect();
        setTimeout(() => {
          tester.testScenario(scenario);
        }, 2000);
        break;

      case 'simulate':
        const jobId = args[1];
        const workerId = args[2];
        const duration = parseInt(args[3]) || 30;
        
        if (!jobId || !workerId) {
          console.error('❌ Please specify jobId and workerId');
          showHelp();
          return;
        }
        
        tester.connect();
        setTimeout(() => {
          tester.simulateWorkerLocation(jobId, workerId, duration);
        }, 2000);
        break;

      case 'all':
        tester.connect();
        setTimeout(() => {
          tester.runAllTests();
        }, 2000);
        break;

      default:
        console.error('❌ Unknown command:', command);
        showHelp();
        return;
    }

    // Keep the process running for a while
    setTimeout(() => {
      console.log('\n⏰ Test completed. Disconnecting...');
      tester.disconnect();
      process.exit(0);
    }, 60000); // Run for 1 minute

  } catch (error) {
    console.error('❌ Error:', error);
    tester.disconnect();
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Cleaning up...');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = JobTrackingTester; 