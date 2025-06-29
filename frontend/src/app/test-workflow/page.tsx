'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function TestWorkflowPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testData, setTestData] = useState<any>(null);
  const router = useRouter();

  const addResult = (step: string, status: 'success' | 'error', message: string) => {
    setTestResults(prev => [...prev, { step, status, message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runBackendTest = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/jobs');
      if (response.ok) {
        addResult('Backend Connection', 'success', 'Backend is running and accessible');
        return true;
      } else {
        addResult('Backend Connection', 'error', 'Backend responded with error');
        return false;
      }
    } catch (error) {
      addResult('Backend Connection', 'error', 'Cannot connect to backend');
      return false;
    }
  };

  const testWebSocketConnection = async () => {
    return new Promise<boolean>((resolve) => {
      let socket: Socket;
      
      try {
        socket = io('http://localhost:5000', {
          timeout: 5000,
          transports: ['websocket', 'polling']
        });
        
        socket.on('connect', () => {
          addResult('WebSocket Connection', 'success', 'Socket.IO connection established');
          socket.disconnect();
          resolve(true);
        });
        
        socket.on('connect_error', (error) => {
          addResult('WebSocket Connection', 'error', `Socket.IO connection failed: ${error.message}`);
          resolve(false);
        });
        
        setTimeout(() => {
          if (!socket.connected) {
            addResult('WebSocket Connection', 'error', 'Socket.IO connection timeout');
            socket.disconnect();
            resolve(false);
          }
        }, 5000);
        
      } catch (error) {
        addResult('WebSocket Connection', 'error', 'Failed to create Socket.IO connection');
        resolve(false);
      }
    });
  };

  const runFullTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    addResult('Test Started', 'success', 'Beginning workflow test...');
    
    // Test 1: Backend connection
    const backendOk = await runBackendTest();
    if (!backendOk) {
      addResult('Test Aborted', 'error', 'Backend not available');
      setIsRunning(false);
      return;
    }
    
    // Test 2: WebSocket connection
    const wsOk = await testWebSocketConnection();
    if (!wsOk) {
      addResult('Test Aborted', 'error', 'WebSocket not available');
      setIsRunning(false);
      return;
    }
    
    // Test 3: Create test data
    try {
      const now = Date.now();
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
      
      const userResponse = await fetch('http://localhost:5000/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (!userResponse.ok) {
        addResult('Create Test User', 'error', 'Failed to create test user');
        setIsRunning(false);
        return;
      }
      
      const userResult = await userResponse.json();
      const userId = userResult.data.id;
      addResult('Create Test User', 'success', `User created with ID: ${userId}`);
      
      // Create worker
      const workerData = {
        firstName: "Test",
        lastName: "Worker",
        email: `testworker_${now}@example.com`,
        phoneNumber: `${now}98`.slice(0, 13),
        dateOfBirth: "1990-01-01",
        address: "Worker Address",
        isActive: true
      };
      
      const workerResponse = await fetch('http://localhost:5000/api/v1/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workerData)
      });
      
      if (!workerResponse.ok) {
        addResult('Create Test Worker', 'error', 'Failed to create test worker');
        setIsRunning(false);
        return;
      }
      
      const workerResult = await workerResponse.json();
      const workerId = workerResult.data.id;
      addResult('Create Test Worker', 'success', `Worker created with ID: ${workerId}`);
      
      // Create job
      const jobData = {
        userId: userId,
        description: "Test job for workflow verification",
        address: "123 Test Street, Test City", 
        lat: 22.5726,
        lng: 88.3639,
        durationMinutes: 60
      };
      
      const jobResponse = await fetch('http://localhost:5000/api/v1/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      
      if (!jobResponse.ok) {
        addResult('Create Test Job', 'error', 'Failed to create test job');
        setIsRunning(false);
        return;
      }
      
      const jobResult = await jobResponse.json();
      const jobId = jobResult.data.id;
      addResult('Create Test Job', 'success', `Job created with ID: ${jobId}`);
      
      setTestData({ userId, workerId, jobId });
      addResult('Test Data Created', 'success', 'All test data created successfully');
      
    } catch (error) {
      addResult('Create Test Data', 'error', 'Failed to create test data');
      setIsRunning(false);
      return;
    }
    
    addResult('Test Completed', 'success', 'Workflow test completed successfully!');
    setIsRunning(false);
  };

  const navigateToWorkerDashboard = () => {
    if (testData?.workerId) {
      router.push(`/worker/dashboard?workerId=${testData.workerId}`);
    }
  };

  const navigateToUserTracking = () => {
    if (testData?.jobId && testData?.userId) {
      router.push(`/booking/worker-assigned?jobId=${testData.jobId}&userId=${testData.userId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Workflow Test Dashboard</h1>
          
          <div className="mb-6">
            <button
              onClick={runFullTest}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-semibold ${
                isRunning 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRunning ? 'Running Test...' : 'Run Full Workflow Test'}
            </button>
          </div>
          
          {/* Test Results */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.status === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{result.step}</span>
                    <span className="text-sm">{result.timestamp}</span>
                  </div>
                  <p className="text-sm mt-1">{result.message}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Test Data */}
          {testData && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Data</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">User ID:</span>
                    <p className="text-sm text-gray-600 break-all">{testData.userId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Worker ID:</span>
                    <p className="text-sm text-gray-600 break-all">{testData.workerId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Job ID:</span>
                    <p className="text-sm text-gray-600 break-all">{testData.jobId}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          {testData && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Manual Testing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={navigateToWorkerDashboard}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                >
                  Open Worker Dashboard
                </button>
                <button
                  onClick={navigateToUserTracking}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
                >
                  Open User Tracking
                </button>
              </div>
            </div>
          )}
          
          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Click "Run Full Workflow Test" to create test data</li>
              <li>Open Worker Dashboard and go live</li>
              <li>Accept the test job in the worker dashboard</li>
              <li>Open User Tracking to see real-time location updates</li>
              <li>Verify that location tracking works properly</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 