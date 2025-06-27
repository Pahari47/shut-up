'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Star, TrendingUp, User, Loader2 } from 'lucide-react';

interface WorkerData {
  id: string;
  name: string;
  email: string;
  experienceYears: number;
  profilePicture?: string;
  income: number;
  rating: number;
  completionRate: number;
  totalJobs: number;
  completedJobs: number;
}

interface TopWorkersChartProps {
  data?: WorkerData[]; // Make data optional since we'll fetch it
}

const TopWorkersChart: React.FC<TopWorkersChartProps> = ({ data: propData }) => {
  const [data, setData] = useState<WorkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopWorkers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:5000/api/v1/workers/top');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        console.error('Error fetching top workers:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch worker data');
      } finally {
        setLoading(false);
      }
    };

    // If no data is passed as prop, fetch from API
    if (!propData) {
      fetchTopWorkers();
    } else {
      setData(propData);
      setLoading(false);
    }
  }, [propData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading worker data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">Error loading worker data</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 py-8">No worker data available.</p>;
  }

  const sortedData = [...data].sort((a, b) => b.income - a.income);

  return (
    <div className="space-y-4 -mx-4 px-4 h-full overflow-y-auto">
      {sortedData.map((worker, index) => (
        <motion.div
          key={worker.id}
          className="flex items-center space-x-4 p-3 rounded-xl transition-colors hover:bg-gray-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            {worker.profilePicture ? (
              <img 
                src={worker.profilePicture} 
                alt={worker.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{worker.name}</p>
            <div className="flex items-center text-xs text-gray-500 space-x-2">
                <div className="flex items-center" title="Rating">
                    <Star className="w-3 h-3 text-amber-400 mr-1" fill="currentColor" />
                    <span>{worker.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center" title="Completion Rate">
                    <TrendingUp className="w-3 h-3 text-emerald-500 mr-1" />
                    <span>{worker.completionRate}%</span>
                </div>
                <div className="flex items-center" title="Experience">
                    <span className="text-xs text-gray-400">• {worker.experienceYears} years</span>
                </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">₹{worker.income.toLocaleString()}</p>
            {index === 0 && (
              <div className="flex items-center justify-end text-xs text-amber-500 font-semibold mt-1">
                <Award className="w-3 h-3 mr-1" />
                Top Performer
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TopWorkersChart; 