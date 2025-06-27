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

  // Toggle theme
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('worker-theme', newTheme);
    document.documentElement.className = newTheme === 'dark' ? 'dark-theme' : '';
  }, [theme]);

  // Toggle live status
  const toggleLiveStatus = useCallback(async (workerId: string) => {
    const newStatus = !isLive;
    try {
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
      
      // Start/stop location tracking
      if (newStatus) {
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            console.error('Error getting location:', error);
            setLocationError('Could not get location. Please enable location services.');
            setIsLive(false);
          },
          { enableHighAccuracy: true }
        );
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  }, [isLive, location]);

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
    if (!jobRequest || !user?.id) return;

    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit('accept_job', {
        jobId: jobRequest.id,
        workerId: user.id,
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
  }, [jobRequest, user?.id, location]);

  // Decline job
  const handleDeclineJob = useCallback(() => {
    if (!jobRequest || !user?.id) return;

    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit('decline_job', {
        jobId: jobRequest.id,
        workerId: user.id,
        reason: 'Worker declined',
      });
    }

    setJobHistory((prev) => [{ ...jobRequest, status: 'declined' }, ...prev]);
    setJobStatus('idle');
    setJobRequest(null);
    setRoute(null);
  }, [jobRequest, user?.id]);

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
    if (!user?.id) return;

    const socket = socketManager.getSocket();
    if (!socket) return;

    socket.on('new_job_broadcast', handleNewJobBroadcast);
    socket.on('job_accepted_success', () => {
      setJobStatus('accepted');
      setJobRequest(null);
    });

    return () => {
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
    fetchWorkerProfile
  };
};