"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import socketManager from '@/lib/socket';

const TestTrackingPage = () => {
  const router = useRouter();
  const [testMode, setTestMode] = useState<'real' | 'test'>('test');
  const [jobId, setJobId] = useState('');
  const [userId, setUserId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Real job examples (you can replace these with actual job IDs from your database)
  const realJobExamples = [
    { id: '2d3d7867-69fa-46ea-a082-e8a498689996', userId: '72e7e4ca-53c8-4aab-99f2-14e297e667f3', description: 'Real Job 1' },
    { id: 'test-real-job-2', userId: 'test-real-user-2', description: 'Real Job 2' },
    { id: 'test-real-job-3', userId: 'test-real-user-3', description: 'Real Job 3' },
  ];

  // Check connection status
  const checkConnection = () => {
    const isConnected = socketManager.isSocketConnected();
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    return isConnected;
  };

  // Test different scenarios
  const testScenario = (scenario: string) => {
    let testJobId = '';
    let testUserId = '';

    switch (scenario) {
      case 'pending':
        testJobId = 'test-pending-job';
        testUserId = 'test-pending-user';
        break;
      case 'no_workers':
        testJobId = 'test-no-workers-job';
        testUserId = 'test-no-workers-user';
        break;
      case 'cancelled':
        testJobId = 'test-cancelled-job';
        testUserId = 'test-cancelled-user';
        break;
      case 'not_found':
        testJobId = 'non-existent-job-id';
        testUserId = 'non-existent-user-id';
        break;
      case 'unauthorized':
        testJobId = 'test-unauthorized-job';
        testUserId = 'wrong-user-id';
        break;
      default:
        testJobId = 'test-job-123';
        testUserId = 'test-user-456';
    }

    setJobId(testJobId);
    setUserId(testUserId);
    setTestMode('test');
  };

  // Start tracking
  const startTrackingTest = () => {
    if (!jobId || !userId) {
      alert('Please enter both Job ID and User ID');
      return;
    }

    if (!checkConnection()) {
      alert('Socket not connected. Please check backend server.');
      return;
    }

    const url = `/booking/worker-assigned?jobId=${encodeURIComponent(jobId)}&userId=${encodeURIComponent(userId)}`;
    router.push(url);
  };

  // Test backend connection
  const testBackendConnection = () => {
    console.log('🧪 Testing backend connection...');
    socketManager.testConnection();
    
    // Check connection status after a short delay
    setTimeout(() => {
      checkConnection();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Job Tracking Test Page</h1>
          <p className="text-gray-600 mb-4">
            This page allows you to test different job tracking scenarios and verify the system is working correctly.
          </p>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-4 mb-4">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${
              connectionStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span>
                Backend: {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={testBackendConnection}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Test Connection
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Make sure your backend server is running on port 5000</li>
              <li>• Ensure Redis server is running</li>
              <li>• Test scenarios will simulate different job states</li>
              <li>• Real jobs require valid job and user IDs from your database</li>
            </ul>
          </div>
        </div>

        {/* Test Mode Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Mode</h2>
          
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setTestMode('test')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                testMode === 'test'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Test Scenarios
            </button>
            <button
              onClick={() => setTestMode('real')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                testMode === 'real'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Real Jobs
            </button>
          </div>

          {testMode === 'test' ? (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Test Scenarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  onClick={() => testScenario('normal')}
                  className="bg-green-100 text-green-800 p-3 rounded-lg hover:bg-green-200 transition-colors text-left"
                >
                  <div className="font-medium">Normal Tracking</div>
                  <div className="text-sm">Basic test with mock data</div>
                </button>
                
                <button
                  onClick={() => testScenario('pending')}
                  className="bg-yellow-100 text-yellow-800 p-3 rounded-lg hover:bg-yellow-200 transition-colors text-left"
                >
                  <div className="font-medium">Pending Job</div>
                  <div className="text-sm">Job waiting for worker</div>
                </button>
                
                <button
                  onClick={() => testScenario('no_workers')}
                  className="bg-orange-100 text-orange-800 p-3 rounded-lg hover:bg-orange-200 transition-colors text-left"
                >
                  <div className="font-medium">No Workers</div>
                  <div className="text-sm">No available workers</div>
                </button>
                
                <button
                  onClick={() => testScenario('cancelled')}
                  className="bg-red-100 text-red-800 p-3 rounded-lg hover:bg-red-200 transition-colors text-left"
                >
                  <div className="font-medium">Cancelled Job</div>
                  <div className="text-sm">Job was cancelled</div>
                </button>
                
                <button
                  onClick={() => testScenario('not_found')}
                  className="bg-gray-100 text-gray-800 p-3 rounded-lg hover:bg-gray-200 transition-colors text-left"
                >
                  <div className="font-medium">Job Not Found</div>
                  <div className="text-sm">Invalid job ID</div>
                </button>
                
                <button
                  onClick={() => testScenario('unauthorized')}
                  className="bg-purple-100 text-purple-800 p-3 rounded-lg hover:bg-purple-200 transition-colors text-left"
                >
                  <div className="font-medium">Unauthorized</div>
                  <div className="text-sm">Wrong user ID</div>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Real Job Examples</h3>
              <div className="space-y-3">
                {realJobExamples.map((job, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setJobId(job.id);
                      setUserId(job.userId);
                    }}
                    className="w-full bg-blue-50 text-blue-800 p-3 rounded-lg hover:bg-blue-100 transition-colors text-left"
                  >
                    <div className="font-medium">{job.description}</div>
                    <div className="text-sm">Job ID: {job.id}</div>
                    <div className="text-sm">User ID: {job.userId}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Manual Input */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Manual Input</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job ID
              </label>
              <input
                type="text"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Enter job ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={startTrackingTest}
              disabled={!jobId || !userId}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Start Tracking
            </button>
            
            <button
              onClick={() => {
                setJobId('');
                setUserId('');
              }}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Current Values */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Values</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job ID:</label>
              <div className="text-sm text-gray-600 break-all">
                {jobId || 'Not set'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID:</label>
              <div className="text-sm text-gray-600 break-all">
                {userId || 'Not set'}
              </div>
            </div>
          </div>
          
          {jobId && userId && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                <strong>Ready to track!</strong> Click "Start Tracking" to begin.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestTrackingPage;
