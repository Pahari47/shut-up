"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FiMapPin, FiClock, FiPhone, FiNavigation, FiCheckCircle, FiAlertCircle, FiWifi, FiWifiOff, FiRefreshCw } from "react-icons/fi";
import { useJobTracking } from "@/lib/jobTracking";
import dynamic from "next/dynamic";
import LiveTrackingMap from "@/components/ui/LiveTrackingMap";
import socketManager from "@/lib/socket";

// Dynamically import the map component to avoid SSR issues
const LiveTrackingMapComponent = dynamic(() => import("@/components/ui/LiveTrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

interface Location {
  lat: number;
  lng: number;
  timestamp: string;
}

const WorkerAssignedPage = () => {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const userId = searchParams.get("userId");

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { trackingState, isTracking, error, startTracking, stopTracking } = useJobTracking(
    jobId || "",
    userId || ""
  );

  // Get user's current location
  useEffect(() => {
    if (!jobId || !userId) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Unable to get your location. Please enable location services.");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, [jobId, userId]);

  // Start tracking when component mounts
  useEffect(() => {
    if (jobId && userId && !isTracking) {
      console.log("🚀 [WORKER_ASSIGNED] Starting tracking for job:", jobId);
      console.log("🔌 [WORKER_ASSIGNED] Socket connection status:", socketManager.isSocketConnected());
      
      // Check if socket is connected before starting tracking
      if (!socketManager.isSocketConnected()) {
        console.warn("⚠️ [WORKER_ASSIGNED] Socket not connected, attempting to connect...");
        socketManager.connect();
        
        // Wait a bit for connection to establish
        setTimeout(() => {
          if (socketManager.isSocketConnected()) {
            console.log("✅ [WORKER_ASSIGNED] Socket connected, starting tracking");
            startTracking();
          } else {
            console.error("❌ [WORKER_ASSIGNED] Failed to connect socket");
            setLocationError("Unable to connect to tracking service. Please check your internet connection.");
          }
        }, 2000);
      } else {
        startTracking();
      }
    }
  }, [jobId, userId, isTracking, startTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTracking) {
        console.log("🛑 [WORKER_ASSIGNED] Cleaning up tracking on unmount");
        stopTracking();
      }
    };
  }, [isTracking, stopTracking]);

  // Handle missing parameters
  if (!jobId || !userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Missing Information
            </h1>
            <p className="text-gray-600 mb-6">
              {!jobId && !userId 
                ? "Job ID and User ID are required to track this job."
                : !jobId 
                ? "Job ID is required to track this job."
                : "User ID is required to track this job."
              }
            </p>
            <button 
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-800">
                Live Job Tracking
              </h1>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                socketManager.isSocketConnected()
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  socketManager.isSocketConnected() ? "bg-green-500" : "bg-red-500"
                }`}></div>
                <span>
                  {socketManager.isSocketConnected() ? "Connected" : "Disconnected"}
                </span>
              </div>
              
              {/* Connection Help */}
              {!socketManager.isSocketConnected() && (
                <button
                  onClick={() => {
                    console.log("🔄 [WORKER_ASSIGNED] Manual connection attempt");
                    socketManager.connect();
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Reconnect
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Connection Error Alert */}
        {!socketManager.isSocketConnected() && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-700">
                  Connection lost. Please check your internet connection and try reconnecting.
                </span>
              </div>
              <button
                onClick={() => socketManager.connect()}
                className="text-red-600 hover:text-red-800 text-sm underline"
              >
                Reconnect
              </button>
            </div>
          </div>
        )}

        {/* Location Error Alert */}
        {locationError && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-yellow-700">{locationError}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="h-96 lg:h-[600px]">
                <LiveTrackingMap
                  trackingData={trackingState}
                  userLocation={userLocation}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            {/* Job Status Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Job Status</h2>
              
              {trackingState ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trackingState.jobStatus === "completed" ? "bg-green-100 text-green-800" :
                      trackingState.jobStatus === "in_progress" ? "bg-blue-100 text-blue-800" :
                      trackingState.jobStatus === "confirmed" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {trackingState.jobStatus?.replace("_", " ").toUpperCase() || "UNKNOWN"}
                    </span>
                  </div>

                  {trackingState.workerName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Worker:</span>
                      <span className="text-sm font-medium text-gray-800">
                        {trackingState.workerName}
                      </span>
                    </div>
                  )}

                  {trackingState.workerStatus?.eta > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ETA:</span>
                      <span className="text-sm font-medium text-blue-600">
                        {trackingState.workerStatus.eta} minutes
                      </span>
                    </div>
                  )}

                  {trackingState.currentLocation && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Update:</span>
                      <span className="text-sm text-gray-500">
                        {new Date(trackingState.currentLocation.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading job details...</p>
                </div>
              )}
            </div>

            {/* Worker Info Card */}
            {trackingState?.workerName && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Worker Information</h2>
                <div className="flex items-center space-x-4">
                  <img 
                    src={trackingState.workerAvatar} 
                    alt={trackingState.workerName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{trackingState.workerName}</h3>
                    <p className="text-sm text-gray-600">{trackingState.workerPhone}</p>
                    {trackingState.workerStatus && (
                      <p className="text-sm text-blue-600 font-medium">
                        {trackingState.workerStatus.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Tracking Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerAssignedPage; 