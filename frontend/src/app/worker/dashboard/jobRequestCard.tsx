import styles from './dashboard.module.css';
import { FiMapPin, FiDollarSign, FiStar, FiClock } from 'react-icons/fi';
import { useEffect, useState } from 'react';

interface JobRequest {
  id: string;
  distance: number;
  fare: number;
  bonus: number;
  clientLocationName: string;
  specialization: string;
  createdAt: Date;
  expiresIn: number; // seconds
}

interface JobRequestCardProps {
  job: JobRequest;
  onAccept: () => void;
  onDecline: () => void;
  isAccepting?: boolean;
}

export default function JobRequestCard({ 
  job, 
  onAccept, 
  onDecline,
  isAccepting 
}: JobRequestCardProps) {
  const [timeLeft, setTimeLeft] = useState(job.expiresIn);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.confirmationOverlay}>
      <div className={styles.jobRequestCard}>
        <div className={styles.jobRequestHeader}>
          <h3>New {job.specialization} Job</h3>
          <p>{job.clientLocationName}</p>
        </div>
        
        <div className={styles.jobTimer}>
          <FiClock />
          <span>{timeLeft}s remaining</span>
        </div>

        {/* ... rest of your existing JSX ... */}

        <div className={styles.jobActions}>
          <button 
            className={styles.declineButton} 
            onClick={onDecline}
            disabled={isAccepting}
          >
            Decline
          </button>
          <button 
            className={styles.acceptButton} 
            onClick={onAccept}
            disabled={isAccepting}
          >
            {isAccepting ? 'Accepting...' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}