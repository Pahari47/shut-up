import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@civic/auth/react';
import socketManager from '@/lib/socket';

export const useWorkerDashboard = () => {
  const router = useRouter();
  const { user } = useUser();

  // State
  const [theme, setTheme] = useState('light');
  const [isLive, setIsLive] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'idle' | 'incoming' | 'accepted' | 'in_progress' | 'completed'>('idle');
  const [jobRequest, setJobRequest] = useState<any>(null);
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [countdownTime, setCountdownTime] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [timeWorked, setTimeWorked] = useState(0);
  const [jobsCompleted, setJobsCompleted] = useState(0);
  const [performance] = useState({ rating: 4.8, successRate: 96 });
  const [weeklyGoal, setWeeklyGoal] = useState({ target: 2000 });
  const [goalInput, setGoalInput] = useState('2000');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [profile, setProfile] = useState({ firstName: 'Worker', imageUrl: null });
  const [workerId, setWorkerId] = useState<string | null>(null);

  // Fetch worker profile
  const fetchWorkerProfile = useCallback(async (workerId: string) => {
    try {
      // Replace with your actual API call
      const response = await fetch(`http://localhost:5000/api/v1/workers/${workerId}`);
      const data = await response.json();
      setProfile({
        firstName: data.firstName || 'Worker',
        imageUrl: data.profilePicture || null
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }, []);

  const fetchWorkerId = useCallback(async (userEmail: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/workers?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          return data.data[0].id; // Database worker ID
        }
      }
      throw new Error('Worker not found');
    } catch (error) {
      console.error('Failed to fetch worker ID:', error);
      return null;
    }
  }, []);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('worker-theme', newTheme);
    document.documentElement.className = newTheme === 'dark' ? 'dark-theme' : '';
  }, [theme]);

  // Toggle live status
  const toggleLiveStatus = useCallback(async () => {
    if (!workerId) {
      console.error('Worker ID not available');
      return;
    }
    
    const newStatus = !isLive;
    try {
      // Get current location first
      if (newStatus) {
        setLocationError(null);
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
        });
        
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        setLocation(newLocation);
        
        // Save location to liveLocations table
        try {
          await fetch(`http://localhost:5000/api/v1/live-locations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              workerId: workerId,
              lat: newLocation.lat,
              lng: newLocation.lng,
            })
          });
          console.log('✅ Location saved to database');
        } catch (locationError) {
          console.error('Failed to save location:', locationError);
        }
      }

      // API call to update availability
      const response = await fetch(`http://localhost:5000/api/v1/workers/${workerId}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: newStatus,
          lat: location?.lat,
          lng: location?.lng
        })
      });

      if (!response.ok) throw new Error('Failed to update availability');

      setIsLive(newStatus);
      
    } catch (error: any) {
      console.error('Error updating availability:', error);
      if (error.message?.includes('getCurrentPosition')) {
        setLocationError('Could not get location. Please enable location services.');
        setIsLive(false);
      }
    }
  }, [isLive, location, workerId]);

  // Handle incoming job
  const handleNewJobBroadcast = useCallback((jobData: any) => {
    const newJobRequest = {
      id: jobData.id,
      distance: `${jobData.workerDistance?.toFixed(1) || '2.5'} km`,
      fare: jobData.fare || 500,
      title: jobData.description,
      clientLocation: [jobData.lat, jobData.lng] as [number, number],
      description: jobData.description,
      location: jobData.address || 'Client Location',
      lat: jobData.lat,
      lng: jobData.lng,
      userId: jobData.userId,
      durationMinutes: jobData.durationMinutes || 60,
    };

    setJobRequest(newJobRequest);
    setJobStatus('incoming');
    setCountdownTime(120); // 2 minutes countdown

    const timer = setInterval(() => {
      setCountdownTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setJobStatus('idle');
          setJobRequest(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Accept job
  const handleAcceptJob = useCallback(() => {
    if (!jobRequest || !workerId) return;

    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit('accept_job', {
        jobId: jobRequest.id,
        workerId: workerId,
      });
    }

    setJobStatus('accepted');
    if (location && jobRequest) {
      // Simulate route fetch
      setRoute([
        [location.lat, location.lng],
        jobRequest.clientLocation
      ]);
    }
  }, [jobRequest, workerId, location]);

  // Decline job
  const handleDeclineJob = useCallback(() => {
    if (!jobRequest || !workerId) return;

    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit('decline_job', {
        jobId: jobRequest.id,
        workerId: workerId,
        reason: 'Worker declined',
      });
    }

    setJobHistory((prev) => [{ ...jobRequest, status: 'declined' }, ...prev]);
    setJobStatus('idle');
    setJobRequest(null);
    setRoute(null);
  }, [jobRequest, workerId]);

  // Complete job
  const handleCompleteJob = useCallback(() => {
    if (jobRequest) {
      setEarnings((prev) => prev + jobRequest.fare);
      setJobsCompleted((prev) => prev + 1);
      setJobHistory((prev) => [
        { ...jobRequest, status: 'completed' },
        ...prev,
      ]);
    }
    setJobStatus('idle');
    setJobRequest(null);
    setRoute(null);
  }, [jobRequest]);

  // Goal management
  const handleSetGoal = useCallback(() => {
    const newTarget = parseInt(goalInput, 10);
    if (!isNaN(newTarget)) {
      setWeeklyGoal({ target: newTarget });
      setIsEditingGoal(false);
    }
  }, [goalInput]);

  // Initialize socket connection
  useEffect(() => {
    if (workerId) {
      const socket = socketManager.getSocket();
      if (socket) {
        console.log('🔌 Joining worker room:', workerId);
        socket.emit('join_worker_room', { workerId });
        console.log('✅ Worker room join request sent');
      } else {
        console.log('❌ Socket not available for worker room join');
      }
    }
  }, [workerId]);

  // Initialize socket connection
  useEffect(() => {
    if (!user?.id) return;

    const socket = socketManager.getSocket();
    if (!socket) {
      console.log('❌ Socket not available for event listeners');
      return;
    }

    console.log('🔌 Setting up socket event listeners');
    socket.on('new_job_broadcast', (jobData) => {
      console.log('📨 Received job broadcast:', jobData);
      handleNewJobBroadcast(jobData);
    });
    socket.on('job_accepted_success', () => {
      console.log('✅ Job accepted successfully');
      setJobStatus('accepted');
      setJobRequest(null);
    });

    return () => {
      console.log('🔌 Cleaning up socket event listeners');
      socket.off('new_job_broadcast', handleNewJobBroadcast);
      socket.off('job_accepted_success');
    };
  }, [user?.id, handleNewJobBroadcast]);

  // Time worked counter
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLive) {
      timer = setInterval(() => {
        setTimeWorked((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLive]);

  // Logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('userProfile');
    router.push('/');
  }, [router]);

  useEffect(() => {
    if (!user?.email) return;
    
    fetchWorkerId(user.email).then((dbWorkerId) => {
      if (dbWorkerId) {
        setWorkerId(dbWorkerId);
        fetchWorkerProfile(dbWorkerId); // Update profile fetch too
      }
    });
  }, [user?.email, fetchWorkerId, fetchWorkerProfile]);

  return {
    // State
    theme,
    isLive,
    location,
    locationError,
    jobStatus,
    jobRequest,
    jobHistory,
    route,
    countdownTime,
    earnings,
    timeWorked,
    jobsCompleted,
    performance,
    weeklyGoal,
    isEditingGoal,
    goalInput,
    profile,
    workerId,
    
    // Handlers
    toggleTheme,
    toggleLiveStatus,
    handleAcceptJob,
    handleDeclineJob,
    handleCompleteJob,
    handleSetGoal,
    setGoalInput,
    setIsEditingGoal,
    handleLogout,
    fetchWorkerProfile,
    fetchWorkerId
  };
};