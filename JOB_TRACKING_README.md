# Real-Time Job Tracking System

This system provides real-time worker location tracking for service jobs, allowing users to see their assigned worker's live location and movement on a map.

## Features

- **Real-time Location Tracking**: Live worker location updates via WebSocket
- **Interactive Map**: Leaflet-based map with worker and user markers
- **Job Status Management**: Handle different job states (pending, confirmed, in progress, completed)
- **Error Handling**: Comprehensive error handling for various scenarios
- **Test Scenarios**: Built-in testing for different job states and error conditions

## System Architecture

### Backend (Node.js + TypeScript)
- **Socket.IO Server**: Real-time communication
- **PostgreSQL Database**: Job and user data storage
- **Redis**: Session management and caching
- **Job Tracking Handlers**: Manage tracking rooms and authorization

### Frontend (Next.js + React)
- **Socket.IO Client**: Real-time connection to backend
- **Leaflet Maps**: Interactive map visualization
- **React Hooks**: State management for tracking
- **TypeScript**: Type safety and better development experience

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Redis server
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd Backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the Backend directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/your_database
   REDIS_URL=redis://localhost:6379
   PORT=5000
   ```

4. **Set up database**:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the backend server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## Usage

### For Users

1. **Access the tracking page**:
   Navigate to `/booking/worker-assigned?jobId=YOUR_JOB_ID&userId=YOUR_USER_ID`

2. **View live tracking**:
   - See worker's current location on the map
   - View location history trail
   - Check ETA and status updates
   - Monitor connection status

### For Workers

1. **Worker Dashboard**:
   Navigate to `/worker/dashboard`

2. **Enable location tracking**:
   - Toggle "Go Live" to start sharing location
   - Location updates are sent automatically when a job is accepted

### Testing

#### Frontend Test Page
Visit `/test-tracking` to access the comprehensive test interface:

- **Test Scenarios**: Try different job states (pending, no workers, cancelled, etc.)
- **Real Jobs**: Test with actual job IDs from your database
- **Manual Input**: Enter custom job and user IDs
- **Connection Testing**: Verify backend connectivity

#### Backend Test Script
Use the Node.js test script for backend testing:

```bash
cd Backend

# Test connection
node test-job-tracking.js connect

# Test specific scenario
node test-job-tracking.js test normal

# Simulate worker location updates
node test-job-tracking.js simulate test-job-123 test-worker-789 30

# Run all test scenarios
node test-job-tracking.js all
```

## API Endpoints

### Socket.IO Events

#### Client to Server
- `join_job_tracking`: Join job tracking room
- `update_location`: Update worker location (for workers)
- `test_message`: Test connection

#### Server to Client
- `tracking_started`: Confirmation that tracking has started
- `tracking_error`: Error in tracking process
- `worker_location_update`: New worker location
- `worker_assigned`: Worker assignment notification
- `job_accepted`: Job acceptance notification
- `job_started`: Job start notification
- `job_completed`: Job completion notification

## Error Handling

The system handles various error scenarios:

### Job Status Errors
- **JOB_NOT_FOUND**: Job doesn't exist in database
- **UNAUTHORIZED**: User doesn't own the job
- **NO_WORKERS_FOUND**: No available workers in area
- **JOB_CANCELLED**: Job was cancelled

### Connection Errors
- **Backend not running**: Shows connection status
- **Redis not available**: Graceful degradation
- **Network issues**: Automatic reconnection

### User Feedback
- **Pending jobs**: Shows waiting message with animation
- **No workers**: Suggests trying again later
- **Connection lost**: Shows reconnection status
- **Location errors**: Handles geolocation permission issues

## File Structure

```
├── Backend/
│   ├── src/
│   │   ├── sockets/
│   │   │   ├── job.handler.ts          # Job tracking socket handlers
│   │   │   └── socket.server.ts        # Socket.IO server setup
│   │   ├── db/
│   │   │   └── schema.ts               # Database schema
│   │   └── controllers/
│   │       └── job.controller.ts       # Job management
│   └── test-job-tracking.js            # Backend test script
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── jobTracking.tsx         # Job tracking hook
│   │   │   └── socket.ts               # Socket manager
│   │   ├── components/ui/
│   │   │   └── LiveTrackingMap.tsx     # Map component
│   │   └── app/
│   │       ├── booking/worker-assigned/
│   │       │   └── page.tsx            # User tracking page
│   │       └── test-tracking/
│   │           └── page.tsx            # Test interface
│   └── package.json
└── JOB_TRACKING_README.md              # This file
```

## Troubleshooting

### Common Issues

1. **"Not authorized to track this job"**
   - Check if the job exists in the database
   - Verify the user ID matches the job owner
   - Ensure you're using the correct job and user IDs

2. **"Backend: Disconnected"**
   - Make sure the backend server is running on port 5000
   - Check if Redis server is running
   - Verify network connectivity

3. **"Job not found"**
   - The job ID doesn't exist in the database
   - Use test job IDs (starting with "test-") for testing
   - Check database connection and schema

4. **Map not loading**
   - Check internet connection (map tiles require internet)
   - Verify Leaflet CSS is loaded
   - Check browser console for JavaScript errors

### Debug Steps

1. **Check backend logs**:
   ```bash
   cd Backend
   npm run dev
   ```

2. **Check frontend console**:
   Open browser developer tools and check console for errors

3. **Test connection**:
   Use the test page at `/test-tracking` to verify connectivity

4. **Verify database**:
   Check if jobs and users exist in the database

## Security Considerations

- **Authorization**: Users can only track jobs they created
- **Input Validation**: All inputs are validated on both frontend and backend
- **Rate Limiting**: Consider implementing rate limiting for location updates
- **Data Privacy**: Location data is only shared between job owner and assigned worker

## Performance Optimization

- **Location History**: Limited to last 20 locations to prevent memory issues
- **Map Optimization**: Efficient marker and path rendering
- **Connection Management**: Automatic reconnection with exponential backoff
- **Event Cleanup**: Proper cleanup of event listeners and intervals

## Future Enhancements

- **Push Notifications**: Real-time notifications for job updates
- **Route Optimization**: Suggest optimal routes for workers
- **Analytics Dashboard**: Track job completion times and worker performance
- **Offline Support**: Cache location data for offline viewing
- **Multi-language Support**: Internationalization for different regions

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the test scenarios in `/test-tracking`
3. Check backend and frontend logs
4. Verify database and Redis connections

## License

This project is part of the Hack4Bengal initiative. 