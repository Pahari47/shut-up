"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import socketManager from "./socket";

export interface Job {
  id: string;
  userId: string;
  workerId?: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  bookedFor?: string;
  durationMinutes?: number;
  createdAt: string;
}

export interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  experienceYears: number;
}

export interface LocationUpdate {
  jobId: string;
  workerId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

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
}

interface JobTrackingContextType {
  // Current job state
  currentJob: Job | null;
  assignedWorker: Worker | null;
  isJobAccepted: boolean;
  isTrackingActive: boolean;

  // Location tracking
  workerLocation: { lat: number; lng: number } | null;
  lastLocationUpdate: string | null;

  // Job actions
  createJob: (
    jobData: Omit<Job, "id" | "createdAt" | "status">
  ) => Promise<Job>;
  acceptJob: (jobId: string, workerId: string) => void;
  updateLocation: (
    jobId: string,
    workerId: string,
    lat: number,
    lng: number
  ) => void;
  completeJob: (jobId: string, workerId: string) => void;

  // Socket connection
  isSocketConnected: boolean;
  connectSocket: () => void;
  disconnectSocket: () => void;

  // Error handling
  error: string | null;
  clearError: () => void;
}

const JobTrackingContext = createContext<JobTrackingContextType | undefined>(
  undefined
);

export const JobTrackingProvider = ({ children }: { children: ReactNode }) => {
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [assignedWorker, setAssignedWorker] = useState<Worker | null>(null);
  const [isJobAccepted, setIsJobAccepted] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [workerLocation, setWorkerLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Socket event handlers
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) return;

    // Join user room for job updates
    socket.on("connect", () => {
      // This will be handled by the socket manager
    });

    // Job accepted by worker
    socket.on("job_accepted", (data: { job: Job; worker: Worker; trackingEnabled: boolean }) => {
      console.log("✅ Job accepted by worker:", data.worker);
      setCurrentJob(data.job);
      setAssignedWorker(data.worker);
      setIsJobAccepted(true);
      setIsTrackingActive(data.trackingEnabled);
      setError(null);
    });

    // Worker location updates
    socket.on("worker_location_update", (data: {
      jobId: string;
      workerId: string;
      lat: number;
      lng: number;
      timestamp: string;
    }) => {
      console.log("📍 Worker location update:", data);
      setWorkerLocation({ lat: data.lat, lng: data.lng });
      setLastLocationUpdate(data.timestamp);
      setIsTrackingActive(true);
    });

    // Job completed
    socket.on("job_completed_success", (data: { job: Job; trackingStopped: boolean }) => {
      console.log("✅ Job completed:", data.job);
      setCurrentJob(data.job);
      setIsTrackingActive(false);
      setWorkerLocation(null);
      setLastLocationUpdate(null);
    });

    // Job errors
    socket.on("job_error", (data: { message: string }) => {
      console.error("❌ Job error:", data.message);
      setError(data.message);
    });

    // Location errors
    socket.on("location_error", (data: { message: string }) => {
      console.error("❌ Location error:", data.message);
      setError(data.message);
    });

    // Tracking stopped
    socket.on("tracking_stopped", (data: { message: string }) => {
      console.log("📍 Tracking stopped:", data.message);
      setIsTrackingActive(false);
      setWorkerLocation(null);
      setLastLocationUpdate(null);
    });

    return () => {
      socket.off("job_accepted");
      socket.off("worker_location_update");
      socket.off("job_completed_success");
      socket.off("job_error");
      socket.off("location_error");
      socket.off("tracking_stopped");
    };
  }, []);

  // Join user room when user is available
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (socket && socket.connected) {
      // Get user ID from localStorage or context
      const userProfile = localStorage.getItem("userProfile");
      if (userProfile) {
        const user = JSON.parse(userProfile);
        if (user.id) {
          console.log("🏠 [JOB_TRACKING] Joining user room:", user.id);
          socket.emit("join_user_room", { userId: user.id });
        }
      }
    }
  }, []);

  // Create a new job
  const createJob = async (
    jobData: Omit<Job, "id" | "createdAt" | "status">
  ): Promise<Job> => {
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
        }/api/v1/jobs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jobData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create job");
      }

      const result = await response.json();
      const newJob = result.data;

      setCurrentJob(newJob);
      setIsJobAccepted(false);
      setIsTrackingActive(false);
      setAssignedWorker(null);
      setWorkerLocation(null);
      setLastLocationUpdate(null);
      setError(null);

      return newJob;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create job";
      setError(errorMessage);
      throw err;
    }
  };

  // Accept a job (for workers)
  const acceptJob = (jobId: string, workerId: string) => {
    socketManager.emit("accept_job", { jobId, workerId });
  };

  // Update worker location
  const updateLocation = (
    jobId: string,
    workerId: string,
    lat: number,
    lng: number
  ) => {
    socketManager.emit("update_location", { jobId, workerId, lat, lng });
  };

  // Complete a job
  const completeJob = (jobId: string, workerId: string) => {
    socketManager.emit("complete_job", { jobId, workerId });
  };

  // Socket connection management
  const connectSocket = () => {
    socketManager.connect();
  };

  const disconnectSocket = () => {
    socketManager.disconnect();
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue: JobTrackingContextType = {
    currentJob,
    assignedWorker,
    isJobAccepted,
    isTrackingActive,
    workerLocation,
    lastLocationUpdate,
    createJob,
    acceptJob,
    updateLocation,
    completeJob,
    isSocketConnected: socketManager.isSocketConnected(),
    connectSocket,
    disconnectSocket,
    error,
    clearError,
  };

  return (
    <JobTrackingContext.Provider value={contextValue}>
      {children}
    </JobTrackingContext.Provider>
  );
};

// Hook to use the job tracking context
export const useJobTrackingContext = () => {
  const context = useContext(JobTrackingContext);
  if (context === undefined) {
    throw new Error("useJobTrackingContext must be used within a JobTrackingProvider");
  }
  return context;
};

export const useJobTracking = (jobId: string, userId: string) => {
  const [trackingState, setTrackingState] = useState<JobTrackingData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize tracking
  const startTracking = useCallback(() => {
    if (!jobId || !userId) {
      setError("Job ID and User ID are required");
      return;
    }

    console.log("🚀 [JOB_TRACKING] Starting job tracking:", { jobId, userId });
    
    // Join job tracking room
    socketManager.joinJobTracking(jobId, userId);
    setIsTracking(true);
    setError(null);
  }, [jobId, userId]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    console.log("🛑 [JOB_TRACKING] Stopping job tracking");
    setIsTracking(false);
    setTrackingState(null);
  }, []);

  useEffect(() => {
    if (!isTracking) return;

    // Listen for tracking started
    const handleTrackingStarted = (data: any) => {
      console.log("✅ [JOB_TRACKING] Tracking started:", data);
      
      // Check if this is a test scenario
      const isTestScenario = data.jobId?.startsWith('test-') || data.workerId?.startsWith('test-');
      
      setTrackingState(prev => ({
        ...prev,
        jobId: data.jobId,
        jobStatus: data.jobStatus,
        workerId: data.workerId,
        isConnected: true,
        currentLocation: null,
        locationHistory: [],
        workerStatus: {
          status: "on_way",
          message: "Worker is on the way",
          eta: 15
        },
        // Add test data for test scenarios
        ...(isTestScenario && {
          workerName: "Test Worker",
          workerPhone: "+91 98765 43210",
          workerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
        })
      }));
    };

    // Listen for worker location updates
    const handleWorkerLocationUpdate = (data: any) => {
      console.log("📍 [JOB_TRACKING] Worker location update:", data);
      
      const newLocation: Location = {
        lat: data.lat,
        lng: data.lng,
        timestamp: data.timestamp
      };

      setTrackingState(prev => {
        if (!prev) return null;

        const locationHistory = [...prev.locationHistory, newLocation];
        // Keep only last 20 locations
        if (locationHistory.length > 20) {
          locationHistory.splice(0, locationHistory.length - 20);
        }

        // Calculate ETA based on progress (simplified)
        const progress = Math.min(locationHistory.length * 5, 90); // Simple progress calculation
        let status: WorkerStatus["status"] = "on_way";
        let message = "Worker is on the way";
        let eta = Math.max(1, Math.ceil((100 - progress) / 6));

        if (progress > 80) {
          status = "arrived";
          message = "Worker has arrived";
          eta = 0;
        } else if (progress > 60) {
          message = "Worker is approaching";
        }

        return {
          ...prev,
          currentLocation: newLocation,
          locationHistory,
          workerStatus: {
            status,
            message,
            eta
          }
        };
      });
    };

    // Listen for job status updates
    const handleJobAccepted = (data: any) => {
      console.log("✅ [JOB_TRACKING] Job accepted:", data);
      setTrackingState(prev => ({
        ...prev,
        workerId: data.worker.id,
        workerName: `${data.worker.firstName} ${data.worker.lastName}`,
        workerPhone: data.worker.phoneNumber,
        workerAvatar: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face`,
        jobStatus: "confirmed"
      }));
    };

    const handleJobStarted = (data: any) => {
      console.log("🚀 [JOB_TRACKING] Job started:", data);
      setTrackingState(prev => ({
        ...prev,
        jobStatus: "in_progress",
        workerStatus: {
          status: "working",
          message: "Worker is currently working",
          eta: 0
        }
      }));
    };

    const handleJobCompleted = (data: any) => {
      console.log("🎉 [JOB_TRACKING] Job completed:", data);
      setTrackingState(prev => ({
        ...prev,
        jobStatus: "completed",
        workerStatus: {
          status: "completed",
          message: "Job completed successfully!",
          eta: 0
        }
      }));
      // Stop tracking after completion
      setTimeout(() => {
        stopTracking();
      }, 5000);
    };

    // Listen for tracking stopped
    const handleTrackingStopped = (data: any) => {
      console.log("🛑 [JOB_TRACKING] Tracking stopped:", data);
      setTrackingState(prev => ({
        ...prev,
        isConnected: false,
        workerStatus: {
          status: "on_way",
          message: "Worker disconnected. Tracking stopped.",
          eta: 0
        }
      }));
    };

    // Handle tracking errors
    const handleTrackingError = (error: any) => {
      console.error("❌ [JOB_TRACKING] Tracking error received:", error);
      console.error("❌ [JOB_TRACKING] Error type:", typeof error);
      console.error("❌ [JOB_TRACKING] Error keys:", Object.keys(error || {}));
      console.error("❌ [JOB_TRACKING] Error stringified:", JSON.stringify(error));
      
      // Handle empty or malformed error objects
      if (!error || typeof error !== 'object' || Object.keys(error).length === 0) {
        console.warn("⚠️ [JOB_TRACKING] Received empty error object, using default error");
        error = {
          message: "Connection error occurred",
          code: "CONNECTION_ERROR",
          details: "Unable to establish tracking connection. Please check your internet connection and try again."
        };
      }
      
      setTrackingState(prev => ({
        ...prev,
        isTracking: false,
        error: error.message || "Unknown error occurred",
        errorCode: error.code,
        errorDetails: error.details
      }));

      // Handle specific error scenarios
      if (error.code === "JOB_NOT_FOUND") {
        setTrackingState(prev => ({
          ...prev,
          status: "error",
          error: "Job not found",
          errorDetails: "The requested job does not exist in our system."
        }));
      } else if (error.code === "UNAUTHORIZED") {
        setTrackingState(prev => ({
          ...prev,
          status: "error",
          error: "Not authorized",
          errorDetails: "You can only track jobs that you created."
        }));
      } else if (error.code === "NO_WORKERS_FOUND") {
        setTrackingState(prev => ({
          ...prev,
          status: "no_workers",
          error: "No workers available",
          errorDetails: "We couldn't find any available workers in your area. Please try again later."
        }));
      } else if (error.code === "JOB_CANCELLED") {
        setTrackingState(prev => ({
          ...prev,
          status: "cancelled",
          error: "Job was cancelled",
          errorDetails: "This job has been cancelled and cannot be tracked."
        }));
      } else if (error.code === "CONNECTION_ERROR") {
        setTrackingState(prev => ({
          ...prev,
          status: "error",
          error: "Connection error",
          errorDetails: "Unable to connect to tracking service. Please check your internet connection."
        }));
      } else {
        setTrackingState(prev => ({
          ...prev,
          status: "error",
          error: error.message || "Failed to start tracking",
          errorDetails: error.details || "An unexpected error occurred."
        }));
      }
    };

    // Register event listeners
    socketManager.on("tracking_started", handleTrackingStarted);
    socketManager.on("worker_location_update", handleWorkerLocationUpdate);
    socketManager.on("job_accepted", handleJobAccepted);
    socketManager.on("job_started", handleJobStarted);
    socketManager.on("job_completed", handleJobCompleted);
    socketManager.on("tracking_stopped", handleTrackingStopped);
    socketManager.on("tracking_error", handleTrackingError);

    // Cleanup function
    return () => {
      socketManager.off("tracking_started", handleTrackingStarted);
      socketManager.off("worker_location_update", handleWorkerLocationUpdate);
      socketManager.off("job_accepted", handleJobAccepted);
      socketManager.off("job_started", handleJobStarted);
      socketManager.off("job_completed", handleJobCompleted);
      socketManager.off("tracking_stopped", handleTrackingStopped);
      socketManager.off("tracking_error", handleTrackingError);
    };
  }, [isTracking, stopTracking]);

  return {
    trackingState,
    isTracking,
    error,
    startTracking,
    stopTracking
  };
};
