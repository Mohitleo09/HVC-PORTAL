# User Activity Tracking System

## Overview

The HCV Portal now includes a comprehensive user activity tracking system that monitors user actions from login to logout, including navigation patterns and schedule workflow activities. This system provides administrators with detailed insights into user behavior and system usage.

## Features

### 1. User Activity Tracking
- **Login/Logout Tracking**: Records when users log in and out of the system
- **Page Navigation**: Tracks user movement between different sections of the portal
- **Dashboard Access**: Monitors when users access their dashboard
- **Session Management**: Tracks session duration and user sessions

### 2. Schedule Activity Tracking
- **Schedule Start**: Records when users begin working on a schedule
- **Workflow Step Completion**: Tracks completion of individual workflow steps
- **Step Editing**: Monitors when users edit previously completed steps
- **Schedule Completion**: Records when entire schedules are completed
- **Duration Tracking**: Measures time spent on schedules and individual steps

### 3. Activity Analytics
- **Real-time Monitoring**: View current user activities
- **Historical Data**: Access past activity records
- **User-specific Reports**: Generate activity reports for individual users
- **Performance Metrics**: Track efficiency and productivity

## Database Models

### UserActivity Model
```javascript
{
  userId: String,           // User identifier
  username: String,         // Username for display
  action: String,           // Action type (login, logout, navigation, etc.)
  details: Object,          // Additional action details
  timestamp: Date,          // When the action occurred
  sessionId: String,        // Session identifier
  ipAddress: String,        // User's IP address
  userAgent: String         // Browser/device information
}
```

### ScheduleActivity Model
```javascript
{
  userId: String,           // User identifier
  username: String,         // Username for display
  scheduleId: String,       // Schedule identifier
  doctorName: String,       // Doctor name for the schedule
  action: String,           // Schedule action type
  details: Object,          // Action details
  timestamp: Date,          // When the action occurred
  duration: Number,         // Time spent in milliseconds
  stepNumber: Number,       // Workflow step number
  stepName: String,         // Workflow step name
  status: String,           // Current status
  notes: String             // Additional notes
}
```

## API Endpoints

### User Activity API
- `POST /api/user-activity` - Log user activity
- `GET /api/user-activity` - Retrieve user activities with filters

### Schedule Activity API
- `POST /api/schedule-activity` - Log schedule activity
- `GET /api/schedule-activity` - Retrieve schedule activities with filters

## Usage Examples

### Tracking User Login
```javascript
import { trackLogin } from '../utils/activityTracker';

await trackLogin(userId, username);
```

### Tracking Page Navigation
```javascript
import { trackPageNavigation } from '../utils/activityTracker';

await trackPageNavigation(userId, username, 'Dashboard', 'Login');
```

### Tracking Schedule Start
```javascript
import { trackScheduleStart } from '../utils/activityTracker';

await trackScheduleStart(userId, username, scheduleId, doctorName, stepNumber, stepName);
```

### Tracking Workflow Step Completion
```javascript
import { trackWorkflowStepComplete } from '../utils/activityTracker';

await trackWorkflowStepComplete(userId, username, scheduleId, doctorName, stepNumber, stepName, duration);
```

## Admin Interface

### Roles & Permission Page
The admin can now view detailed activity information for each user:

1. **View Activity Button**: Shows general user activities (login, logout, navigation)
2. **Schedule History Button**: Shows schedule-specific activities and workflow progress

### Activity Details Displayed
- **Action Type**: What the user did
- **Timestamp**: When the action occurred
- **Details**: Additional context information
- **Duration**: Time spent on activities (where applicable)
- **Step Information**: Workflow step details for schedule activities

## Implementation Details

### Automatic Tracking
The system automatically tracks:
- User login/logout events
- Page navigation between sections
- Dashboard access
- Schedule workflow activities
- Step completion and editing

### Session Management
- Unique session IDs for each login
- Session start/end timestamps
- Session duration calculation
- Cross-browser session persistence

### Error Handling
- Graceful degradation if tracking fails
- Non-blocking activity logging
- Comprehensive error logging
- Fallback mechanisms

## Security Features

### Data Privacy
- No sensitive information is logged
- User passwords are never recorded
- Session data is anonymized
- IP addresses are optional and configurable

### Access Control
- Only administrators can view activity data
- User-specific activity filtering
- Secure API endpoints
- Rate limiting on tracking requests

## Performance Considerations

### Database Optimization
- Indexed fields for fast queries
- Efficient aggregation queries
- Configurable result limits
- Automatic cleanup of old records

### Real-time Updates
- Asynchronous activity logging
- Non-blocking user experience
- Efficient data transmission
- Minimal impact on system performance

## Configuration

### Environment Variables
```bash
# Enable/disable activity tracking
ACTIVITY_TRACKING_ENABLED=true

# Database connection for activity logs
ACTIVITY_DB_URI=mongodb://localhost:27017/hcv_activities

# Activity retention period (days)
ACTIVITY_RETENTION_DAYS=90
```

### Customization Options
- Configurable tracking levels
- Custom activity types
- Flexible detail schemas
- Adjustable retention policies

## Monitoring and Alerts

### System Health
- Database connection monitoring
- API endpoint health checks
- Error rate monitoring
- Performance metrics tracking

### Alert System
- Failed tracking notifications
- Database connection alerts
- High activity volume warnings
- System performance alerts

## Future Enhancements

### Planned Features
- **Real-time Dashboard**: Live activity monitoring
- **Advanced Analytics**: Machine learning insights
- **Export Functionality**: CSV/PDF report generation
- **Integration APIs**: Third-party system integration
- **Mobile Tracking**: Mobile app activity monitoring

### Scalability Improvements
- **Distributed Logging**: Multi-server activity tracking
- **Caching Layer**: Redis-based activity caching
- **Data Archiving**: Long-term storage solutions
- **Load Balancing**: High-traffic handling

## Troubleshooting

### Common Issues
1. **Activity Not Logging**: Check database connection and API endpoints
2. **Performance Issues**: Verify database indexes and query optimization
3. **Missing Data**: Ensure tracking functions are properly called
4. **Session Issues**: Check browser compatibility and storage settings

### Debug Mode
Enable debug logging for detailed tracking information:
```javascript
// In development environment
console.log('Activity tracking debug:', activityData);
```

## Support

For technical support or feature requests related to the activity tracking system, please contact the development team or create an issue in the project repository.

---

**Note**: This tracking system is designed to improve user experience and system monitoring while maintaining user privacy and system performance. All tracking is transparent and can be disabled if needed.
