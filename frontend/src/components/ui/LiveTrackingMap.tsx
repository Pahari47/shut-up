"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

interface JobTrackingData {
  jobId: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  workerAvatar: string;
  currentLocation: Location | null;
  locationHistory: Location[];
  workerStatus: WorkerStatus;
  isConnected: boolean;
  jobStatus: string;
  error?: string;
  errorCode?: string;
  errorDetails?: string;
  isPending?: boolean;
}

interface LiveTrackingMapProps {
  trackingData: JobTrackingData | null;
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
}

// Custom marker icons
const createCustomIcon = (type: 'worker' | 'user' | 'history') => {
  const colors = {
    worker: '#3B82F6',
    user: '#10B981',
    history: '#6B7280'
  };

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: ${colors[type]};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${type === 'worker' ? 'animation: pulse 2s infinite;' : ''}
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Map controller component to handle view updates
const MapController: React.FC<{ currentLocation: Location | null; userLocation?: { lat: number; lng: number } }> = ({ 
  currentLocation, 
  userLocation 
}) => {
  const map = useMap();

  useEffect(() => {
    if (currentLocation && userLocation) {
      // Fit bounds to show both worker and user
      const bounds = L.latLngBounds([
        [currentLocation.lat, currentLocation.lng],
        [userLocation.lat, userLocation.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (currentLocation) {
      // Center on worker location
      map.setView([currentLocation.lat, currentLocation.lng], 15);
    }
  }, [currentLocation, userLocation, map]);

  return null;
};

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  trackingData,
  userLocation,
  className = ""
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{
    worker?: L.Marker;
    user?: L.Marker;
    path?: L.Polyline;
  }>({});

  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Default to Kolkata coordinates if no tracking data
    const defaultLat = 22.5726;
    const defaultLng = 88.3639;

    const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    setMapReady(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle different tracking states
  const renderTrackingState = () => {
    if (!trackingData) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing tracking...</p>
          </div>
        </div>
      );
    }

    // Handle error states
    if (trackingData.error) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 z-10">
          <div className="text-center max-w-md mx-4">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {trackingData.error}
            </h3>
            {trackingData.errorDetails && (
              <p className="text-gray-600 text-sm mb-4">
                {trackingData.errorDetails}
              </p>
            )}
            
            {/* Show different actions based on error type */}
            {trackingData.errorCode === "NO_WORKERS_FOUND" && (
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Try Again Later
              </button>
            )}
            
            {trackingData.errorCode === "JOB_NOT_FOUND" && (
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Go Back to Jobs
              </button>
            )}
            
            {trackingData.errorCode === "UNAUTHORIZED" && (
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                View My Jobs
              </button>
            )}
          </div>
        </div>
      );
    }

    // Handle pending state
    if (trackingData.isPending) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="text-center max-w-md mx-4">
            <div className="animate-pulse text-blue-500 text-6xl mb-4">⏳</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Waiting for Worker
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              We're looking for available workers in your area. This usually takes 2-5 minutes.
            </p>
            <div className="flex space-x-2 justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      );
    }

    // Handle no connection state
    if (!trackingData.isConnected) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="text-center">
            <div className="text-yellow-500 text-6xl mb-4">📡</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Connection Lost
            </h3>
            <p className="text-gray-600 text-sm">
              Trying to reconnect...
            </p>
          </div>
        </div>
      );
    }

    // Normal tracking state - show map
    return null;
  };

  // Update map with tracking data
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady || !trackingData) return;

    const map = mapInstanceRef.current;

    // Clear existing markers and path
    Object.values(markersRef.current).forEach(marker => {
      if (marker) map.removeLayer(marker);
    });
    markersRef.current = {};

    // Add worker marker if location exists
    if (trackingData.currentLocation) {
      const workerIcon = L.divIcon({
        className: 'worker-marker',
        html: `
          <div class="relative">
            <div class="w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <span class="text-white text-xs font-bold">👷</span>
            </div>
            <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const workerMarker = L.marker([
        trackingData.currentLocation.lat,
        trackingData.currentLocation.lng
      ], { icon: workerIcon }).addTo(map);

      markersRef.current.worker = workerMarker;

      // Add popup with worker info
      workerMarker.bindPopup(`
        <div class="text-center">
          <div class="font-semibold text-blue-600">${trackingData.workerName || 'Worker'}</div>
          <div class="text-sm text-gray-600">${trackingData.workerStatus?.message || 'On the way'}</div>
          ${trackingData.workerStatus?.eta > 0 ? `<div class="text-xs text-gray-500">ETA: ${trackingData.workerStatus.eta} min</div>` : ''}
        </div>
      `);
    }

    // Add user location marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `
          <div class="relative">
            <div class="w-6 h-6 bg-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <span class="text-white text-xs">📍</span>
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
      markersRef.current.user = userMarker;

      userMarker.bindPopup(`
        <div class="text-center">
          <div class="font-semibold text-green-600">Your Location</div>
        </div>
      `);
    }

    // Draw path if location history exists
    if (trackingData.locationHistory && trackingData.locationHistory.length > 1) {
      const pathCoords = trackingData.locationHistory.map(loc => [loc.lat, loc.lng]);
      const path = L.polyline(pathCoords as [number, number][], {
        color: '#3B82F6',
        weight: 3,
        opacity: 0.7
      }).addTo(map);

      markersRef.current.path = path;
    }

    // Fit map to show all markers
    const markers = Object.values(markersRef.current).filter(Boolean);
    if (markers.length > 0) {
      const group = new L.FeatureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

  }, [trackingData, userLocation, mapReady]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />
      
      {/* Status overlay */}
      {renderTrackingState()}
      
      {/* Connection status indicator */}
      {trackingData && !trackingData.error && !trackingData.isPending && (
        <div className="absolute top-4 right-4 z-20">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${
            trackingData.isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              trackingData.isConnected ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span>
              {trackingData.isConnected ? 'Connected' : 'Reconnecting...'}
            </span>
          </div>
        </div>
      )}

      {/* Worker status card */}
      {trackingData && !trackingData.error && trackingData.workerName && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <img 
                src={trackingData.workerAvatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"} 
                alt={trackingData.workerName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{trackingData.workerName}</h3>
                <p className="text-sm text-gray-600">{trackingData.workerStatus?.message || 'On the way'}</p>
                {trackingData.workerStatus?.eta > 0 && (
                  <p className="text-xs text-blue-600 font-medium">
                    ETA: {trackingData.workerStatus.eta} minutes
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className={`w-3 h-3 rounded-full ${
                  trackingData.workerStatus?.status === 'completed' ? 'bg-green-500' :
                  trackingData.workerStatus?.status === 'working' ? 'bg-blue-500' :
                  trackingData.workerStatus?.status === 'arrived' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrackingMap; 