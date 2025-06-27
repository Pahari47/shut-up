"use client";
import { useSearchParams } from "next/navigation";
import mockWorkers from "../services/mockWorkers";
import React, { useEffect, useState } from "react";
import { FiMapPin, FiClock, FiPhone, FiNavigation, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

interface Location {
  lat: number;
  lng: number;
  timestamp: string;
}

interface WorkerStatus {
  status: "on_way" | "arrived" | "working" | "completed";
  message: string;
  eta: number;
}

// Fallback worker data for demo
const fallbackWorker = {
  id: "demo-worker-123",
  name: "Rajesh Kumar",
  description: "Professional Plumber with 5+ years experience",
  phoneNumber: "+91 98765 43210",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  address: "Kolkata, West Bengal",
  rating: 4.8,
  experienceYears: 5,
  specialization: "Plumber"
};

export default function WorkerAssignedPage() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get("id");
  const actualWorkerId = searchParams.get("workerId");
  const [progress, setProgress] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>({
    status: "on_way",
    message: "Worker is on the way to your location",
    eta: 15
  });
  const [locationHistory, setLocationHistory] = useState<Location[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Try to find worker from mock data, otherwise use fallback
  const worker = mockWorkers.find(w => String(w.id) === String(workerId || actualWorkerId)) || fallbackWorker;

  // Simulate worker's journey with realistic coordinates
  const generateWorkerJourney = () => {
    // Starting location (worker's location)
    const startLat = 22.5726 + (Math.random() - 0.5) * 0.01;
    const startLng = 88.3639 + (Math.random() - 0.5) * 0.01;
    
    // Destination (user's location)
    const endLat = 22.5726 + (Math.random() - 0.5) * 0.005;
    const endLng = 88.3639 + (Math.random() - 0.5) * 0.005;
    
    const journey = [];
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const lat = startLat + (endLat - startLat) * progress + (Math.random() - 0.5) * 0.0005;
      const lng = startLng + (endLng - startLng) * progress + (Math.random() - 0.5) * 0.0005;
      
      journey.push({
        lat,
        lng,
        timestamp: new Date(Date.now() + i * 30000).toISOString(), // 30 seconds apart
        progress: progress * 100
      });
    }
    
    return journey;
  };

  useEffect(() => {
    // Always show demo mode for now
    setIsSocketConnected(false);
    console.log("🔌 Demo mode activated - showing worker tracking simulation");

    // Generate worker journey
    const journey = generateWorkerJourney();
    let currentStep = 0;

    // Simulate real-time location updates
    const locationInterval = setInterval(() => {
      if (currentStep < journey.length) {
        const location = journey[currentStep];
        setCurrentLocation({ lat: location.lat, lng: location.lng, timestamp: location.timestamp });
        setLocationHistory(prev => [...prev, { lat: location.lat, lng: location.lng, timestamp: location.timestamp }]);
        setProgress(location.progress);
        
        // Update status based on progress
        if (location.progress < 30) {
          setWorkerStatus({
            status: "on_way",
            message: "Worker is on the way to your location",
            eta: Math.max(1, Math.ceil((100 - location.progress) / 6))
          });
        } else if (location.progress < 90) {
          setWorkerStatus({
            status: "on_way",
            message: "Worker is approaching your location",
            eta: Math.max(1, Math.ceil((100 - location.progress) / 8))
          });
        } else if (location.progress < 100) {
          setWorkerStatus({
            status: "arrived",
            message: "Worker has arrived at your location",
            eta: 0
          });
        } else {
          setWorkerStatus({
            status: "working",
            message: "Worker is currently working on your job",
            eta: 0
          });
        }
        
        currentStep++;
      } else {
        clearInterval(locationInterval);
        // Simulate job completion after some time
        setTimeout(() => {
          setWorkerStatus({
            status: "completed",
            message: "Job completed successfully!",
            eta: 0
          });
        }, 5000);
      }
    }, 3000); // Update every 3 seconds

    return () => clearInterval(locationInterval);
  }, []); // Remove worker dependency to always run

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_way": return "text-blue-600";
      case "arrived": return "text-green-600";
      case "working": return "text-orange-600";
      case "completed": return "text-green-700";
      default: return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on_way": return <FiNavigation className="w-5 h-5" />;
      case "arrived": return <FiMapPin className="w-5 h-5" />;
      case "working": return <FiClock className="w-5 h-5" />;
      case "completed": return <FiCheckCircle className="w-5 h-5" />;
      default: return <FiAlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Worker Assigned</h1>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Demo Mode
            </div>
          </div>

          {/* Worker Card */}
          <div className="flex items-center gap-4">
            <img 
              src={worker.avatar} 
              alt={worker.name} 
              className="w-16 h-16 rounded-full border-4 border-blue-100" 
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800">{worker.name}</h2>
              <p className="text-gray-600 text-sm">{worker.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-gray-700 text-sm">{worker.phoneNumber}</span>
                <a 
                  href={`tel:${worker.phoneNumber}`} 
                  className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  <FiPhone className="inline w-4 h-4 mr-1" />
                  Call
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${getStatusColor(workerStatus.status)} bg-opacity-10`}>
              {getStatusIcon(workerStatus.status)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{workerStatus.message}</h3>
              {workerStatus.eta > 0 && (
                <p className="text-sm text-gray-600">ETA: {workerStatus.eta} minutes</p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Current Location */}
          {currentLocation && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Current Location</h4>
              <div className="text-sm text-gray-600">
                <p>Latitude: {currentLocation.lat.toFixed(6)}</p>
                <p>Longitude: {currentLocation.lng.toFixed(6)}</p>
                <p>Last Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Map Visualization */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Live Location Tracking</h3>
          <div className="relative w-full h-64 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg overflow-hidden">
            {/* Simulated Map */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <FiMapPin className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">Interactive Map</p>
                <p className="text-gray-500 text-sm">Showing worker's real-time location</p>
              </div>
            </div>

            {/* Worker Location Indicator */}
            {currentLocation && (
              <div 
                className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"
                style={{
                  left: `${50 + (currentLocation.lat - 22.5726) * 10000}%`,
                  top: `${50 + (currentLocation.lng - 88.3639) * 10000}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            )}

            {/* Location History Trail */}
            {locationHistory.slice(-5).map((location, index) => (
              <div
                key={index}
                className="absolute w-2 h-2 bg-blue-300 rounded-full opacity-50"
                style={{
                  left: `${50 + (location.lat - 22.5726) * 10000}%`,
                  top: `${50 + (location.lng - 88.3639) * 10000}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))}
          </div>
        </div>

        {/* Location History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Location History</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {locationHistory.slice(-10).reverse().map((location, index) => (
              <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Update {locationHistory.length - index}</span>
                  <p className="text-gray-600">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                </div>
                <span className="text-gray-500">
                  {new Date(location.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Info */}
        <div className="bg-blue-50 rounded-xl p-4 mt-6">
          <div className="flex items-center gap-2 mb-2">
            <FiAlertCircle className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-800">Demo Information</h4>
          </div>
          <p className="text-blue-700 text-sm">
            This is a demonstration of the worker tracking system. In a real scenario, 
            this would show live data from the worker's device via WebSocket connection.
          </p>
        </div>
      </div>
    </div>
  );
} 