# Media Management System Setup

This document explains how to set up and use the new media management system for tracking completed videos and shorts in the HCV Portal.

## Overview

The system now includes:
- **Video Model**: Tracks video content with status (pending, in_progress, completed)
- **Short Model**: Tracks short-form content with status (pending, in_progress, completed)
- **API Endpoints**: For managing and counting media content
- **Dashboard Integration**: Real-time counts displayed in admin and user dashboards

## New Models

### Video Model (`src/app/utils/models/Video.js`)
- Tracks video content including title, doctor, department, status, and completion details
- Status options: `pending`, `in_progress`, `completed`
- Includes metadata like duration, views, likes, and tags

### Short Model (`src/app/utils/models/Short.js`)
- Tracks short-form content (typically under 60 seconds)
- Similar structure to Video model but optimized for shorter content
- Same status tracking system

## API Endpoints

### `/api/videos`
- `GET /api/videos?count=true` - Get video counts only
- `GET /api/videos` - Get all video data
- `POST /api/videos` - Create new video

### `/api/shorts`
- `GET /api/shorts?count=true` - Get short counts only
- `GET /api/shorts` - Get all short data
- `POST /api/shorts` - Create new short

### `/api/media`
- `GET /api/media` - Get combined counts for both videos and shorts
- Returns comprehensive statistics for dashboard display

## Dashboard Integration

### Admin Dashboard (`src/app/components/Dashboard/page.jsx`)
- **Completed Videos**: Shows count of videos with status "completed"
- **Completed Shorts**: Shows count of shorts with status "completed"
- Auto-refreshes every 5 seconds
- Manual refresh buttons for each stat
- Real-time updates via event listeners

### User Dashboard (`src/app/Userdashboard/page.jsx`)
- Same functionality as admin dashboard
- Real-time counts for completed videos and shorts
- Auto-refresh and manual refresh capabilities

## Setup Instructions

### 1. Database Models
The new models are automatically created when the application starts. No additional setup required.

### 2. API Endpoints
The new API endpoints are automatically available. They use the existing database connection.

### 3. Dashboard Updates
The dashboards automatically include the new media counts. No additional configuration needed.

## Testing the System

### Populate Sample Data
Run the test script to populate sample data:

```bash
node test-media.js
```

This will create:
- 5 sample videos (3 completed, 1 in progress, 1 pending)
- 6 sample shorts (5 completed, 1 in progress)

### Expected Results
After running the test script, you should see:
- **Completed Videos**: 3
- **Completed Shorts**: 5

## Usage Examples

### Creating a New Video
```javascript
const response = await fetch('/api/videos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "New Medical Video",
    doctorName: "Dr. Smith",
    departmentName: "Cardiology",
    description: "Educational content about heart health",
    tags: ["cardiology", "education", "heart"]
  })
});
```

### Creating a New Short
```javascript
const response = await fetch('/api/shorts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Quick Health Tip",
    doctorName: "Dr. Johnson",
    departmentName: "General Medicine",
    description: "Quick tip for daily health",
    tags: ["health", "tips", "daily"]
  })
});
```

### Getting Media Counts
```javascript
const response = await fetch('/api/media');
const data = await response.json();
console.log('Completed videos:', data.counts.videos.completed);
console.log('Completed shorts:', data.counts.shorts.completed);
```

## Event System

The system includes custom events for real-time updates:
- `mediaUpdated` - Triggered when media content is modified
- Automatically refreshes dashboard counts
- Can be triggered from other components when media status changes

## Status Management

### Video/Short Status Flow
1. **pending** - Content is planned but not started
2. **in_progress** - Content is being created/edited
3. **completed** - Content is finished and ready for viewing

### Updating Status
```javascript
// Example: Mark video as completed
const response = await fetch(`/api/videos/${videoId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'completed',
    completedAt: new Date()
  })
});
```

## Troubleshooting

### Common Issues

1. **Counts not updating**
   - Check browser console for API errors
   - Verify database connection
   - Ensure models are properly imported

2. **API endpoints not found**
   - Restart the development server
   - Check file paths and imports

3. **Database connection issues**
   - Verify MongoDB connection string
   - Check environment variables

### Debug Information
- All API calls include detailed logging
- Dashboard includes loading states and error handling
- Console logs show real-time data flow

## Future Enhancements

Potential improvements for the media system:
- Video/Short upload functionality
- Content management interface
- Analytics and reporting
- Integration with external video platforms
- Content approval workflows
- User engagement metrics

## Support

For issues or questions about the media system:
1. Check the browser console for error messages
2. Verify API endpoint responses
3. Check database connectivity
4. Review the event system for proper updates
