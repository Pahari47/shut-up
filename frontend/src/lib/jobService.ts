// Job service utilities for backend communication

export interface JobData {
  userId: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  durationMinutes: number;
  bookedFor?: string | null;
}

export interface JobResponse {
  message: string;
  data: {
    id: string;
    userId: string;
    workerId?: string;
    description: string;
    address: string;
    lat: number;
    lng: number;
    status: string;
    bookedFor?: string;
    durationMinutes: number;
    createdAt: string;
  };
}

/**
 * Create a new job in the backend
 * @param jobData - Job data to create
 * @returns Created job object
 */
export const createJob = async (jobData: JobData): Promise<JobResponse> => {
  try {
    console.log("🚀 [JOB_SERVICE] Creating job with data:", jobData);
    
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
      const errorData = await response.json();
      console.error("❌ [JOB_SERVICE] Job creation failed:", errorData);
      throw new Error(
        errorData.error || errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    console.log("✅ [JOB_SERVICE] Job created successfully:", result.data.id);
    return result;
  } catch (error) {
    console.error("❌ [JOB_SERVICE] Error creating job:", error);
    throw error;
  }
};

/**
 * Parse duration string to minutes
 * @param duration - Duration string like "30-45 min" or "1-2 hours"
 * @returns Duration in minutes
 */
export const parseDurationToMinutes = (duration: string): number => {
  const timeMatch = duration.match(/(\d+)-(\d+)\s*(min|hour|h)/);
  if (!timeMatch) return 60; // Default to 60 minutes

  const [, minStr, maxStr, unit] = timeMatch;
  const min = parseInt(minStr);
  const max = parseInt(maxStr);

  if (unit === "hour" || unit === "h") {
    return Math.round(((min + max) / 2) * 60);
  } else {
    return Math.round((min + max) / 2);
  }
}; 