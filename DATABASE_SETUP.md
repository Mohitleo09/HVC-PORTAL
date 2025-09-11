# HCV Portal Database Setup Guide

## Overview

The HCV Portal is now fully connected to MongoDB with comprehensive database management, automatic initialization, and robust error handling. Every piece of data is stored in the database, ensuring data persistence and scalability.

## Database Configuration

### Environment Variables

The system uses centralized configuration with fallback values. Create a `.env.local` file in your project root with:

```bash
MONGODB_URI="mongodb+srv://Hvcpotal:12345@cluster0.rw8ipin.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
NEXTAUTH_SECRET="12345"
NEXTAUTH_URL="http://localhost:3000"
SECRET_KEY="12345"
```

**Note**: If `.env.local` is not accessible, the system will use the fallback values defined in `src/app/utils/config/environment.js`.

### Database Connection

- **Connection String**: MongoDB Atlas cluster
- **Database Name**: hcv_portal (auto-created)
- **Connection Pool**: 10 connections
- **Timeout**: 30 seconds
- **Auto-reconnection**: Enabled

## Database Models

### 1. User Model
- **Fields**: username, email, password (hashed), role, status
- **Indexes**: email (unique), username (unique), role, status
- **Features**: Password hashing with bcrypt, role-based access control

### 2. Department Model
- **Fields**: name, status
- **Indexes**: name (unique), status
- **Features**: Active/Inactive status management

### 3. Doctor Model
- **Fields**: name, department, languages, photos, specialization, experience, education, contact, availability
- **Indexes**: name, department, status, contact.email
- **Features**: Photo storage (base64), availability scheduling

### 4. Language Model
- **Fields**: name, status
- **Indexes**: name (unique), status
- **Features**: Multi-language support

### 5. Question Model
- **Fields**: text, department, languages, status
- **Indexes**: text, department, status
- **Features**: Department-specific questions with language support

### 6. Schedule Model
- **Fields**: department, doctor, languages, question, date, status
- **Indexes**: date, doctor, department, status
- **Features**: Appointment scheduling with language preferences

### 7. Trend Model
- **Fields**: topic, views, description, status
- **Indexes**: topic, status, createdAt
- **Features**: Trending topics with view tracking

### 8. Workflow Model
- **Fields**: scheduleId, doctorName, departmentName, steps, workflowStatus, currentStep
- **Indexes**: scheduleId, doctorName, workflowStatus, lastUpdated
- **Features**: Multi-step workflow management with status tracking

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration

### Core APIs
- `GET/POST/PUT/DELETE /api/users` - User management
- `GET/POST/PUT/DELETE /api/departments` - Department management
- `GET/POST/PUT/DELETE /api/doctors` - Doctor management
- `GET/POST/PUT/DELETE /api/languages` - Language management
- `GET/POST/PUT/DELETE /api/questions` - Question management
- `GET/POST/PUT/DELETE /api/schedule` - Schedule management
- `GET/POST/PUT/DELETE /api/trends` - Trend management
- `GET/POST/PUT/DELETE /api/workflows` - Workflow management

### System APIs
- `GET /api/health` - System health check
- `GET/POST/DELETE /api/init` - Database initialization and management

## Database Initialization

### Automatic Initialization
The system automatically initializes the database when the app starts:

1. **Connection Check**: Verifies MongoDB connection
2. **Collection Creation**: Creates all necessary collections
3. **Default Data**: Populates with sample data if collections are empty
4. **Index Creation**: Sets up performance indexes
5. **Status Monitoring**: Continuous health monitoring

### Default Data
- **Admin User**: admin@hvc.com / admin123
- **Departments**: Cardiology, Neurology, Orthopedics, Pediatrics, General Medicine
- **Languages**: English, Hindi, Spanish, French, German
- **Sample Questions**: Health-related questions in multiple languages
- **Sample Trends**: Health awareness topics

### Manual Initialization
You can manually initialize or reset the database:

```bash
# Check database status
GET /api/init

# Initialize database
POST /api/init

# Reset database (development only)
DELETE /api/init
```

## Data Flow

### 1. User Registration/Login
```
Frontend → Server Action → Database → User Model
```

### 2. Content Creation
```
Frontend → API Route → Database → Model → Response
```

### 3. Data Retrieval
```
Frontend → API Route → Database → Model → Frontend
```

### 4. Workflow Management
```
Schedule → Workflow Creation → Step Management → Status Updates
```

## Security Features

### Authentication
- **NextAuth.js**: JWT-based authentication
- **Password Hashing**: bcrypt with 12 salt rounds
- **Session Management**: 24-hour sessions
- **Role-based Access**: User/Admin roles

### Data Validation
- **Input Sanitization**: Trim and format inputs
- **Schema Validation**: Mongoose schema validation
- **Duplicate Prevention**: Unique field constraints
- **Status Management**: Active/Inactive status tracking

### Error Handling
- **Graceful Degradation**: Fallback error messages
- **Detailed Logging**: Comprehensive error logging
- **User Feedback**: Clear error messages
- **Retry Mechanisms**: Automatic reconnection

## Performance Optimization

### Database Indexes
- **Unique Indexes**: Email, username, department names
- **Compound Indexes**: Doctor department + status
- **Time-based Indexes**: Created/updated timestamps
- **Search Indexes**: Text search optimization

### Connection Management
- **Connection Pooling**: Efficient connection reuse
- **Auto-reconnection**: Automatic recovery from disconnections
- **Timeout Handling**: Configurable timeouts
- **Health Monitoring**: Continuous connection status

## Monitoring and Health Checks

### Health Endpoint
`GET /api/health` provides comprehensive system status:

```json
{
  "success": true,
  "status": "healthy",
  "database": {
    "status": "healthy",
    "connected": true
  },
  "configuration": {
    "valid": true,
    "environment": {...}
  },
  "system": {
    "uptime": 12345,
    "memory": {...},
    "platform": "win32"
  }
}
```

### Database Status
- **Connection Status**: Connected/Disconnected/Error
- **Collection Health**: Existence and document counts
- **Index Status**: Performance index verification
- **Error Tracking**: Detailed error logging

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check MongoDB URI format
   - Verify network connectivity
   - Check MongoDB Atlas settings

2. **Authentication Errors**
   - Verify NEXTAUTH_SECRET
   - Check user credentials
   - Verify database permissions

3. **Data Not Persisting**
   - Check database connection
   - Verify model schemas
   - Check error logs

### Debug Mode
Enable debug logging by setting `NODE_ENV=development`:

```bash
# Windows
set NODE_ENV=development

# Linux/Mac
export NODE_ENV=development
```

### Manual Database Reset
For development/testing, you can reset the database:

```javascript
// Via API
fetch('/api/init', { method: 'DELETE' })

// Via component
<DatabaseInitializer />
```

## Development Workflow

### 1. Setup
```bash
npm install
npm run dev
```

### 2. Database Initialization
- Automatic on app start
- Manual via `/api/init` endpoint
- Reset via DELETE `/api/init`

### 3. Data Management
- Create/Read/Update/Delete via API endpoints
- Real-time database monitoring
- Automatic error recovery

### 4. Testing
- Health check endpoint
- Database status monitoring
- Error simulation and recovery

## Production Considerations

### Environment Variables
- Set proper `MONGODB_URI` for production cluster
- Use strong `NEXTAUTH_SECRET`
- Configure `NEXTAUTH_URL` for production domain

### Security
- Enable MongoDB Atlas security features
- Use IP whitelisting
- Enable audit logging
- Regular security updates

### Monitoring
- Set up MongoDB Atlas monitoring
- Configure alerts for connection issues
- Monitor performance metrics
- Regular backup verification

## Support

For database-related issues:

1. Check the health endpoint: `/api/health`
2. Review console logs for error details
3. Verify environment configuration
4. Check MongoDB Atlas dashboard
5. Review this documentation

The system is designed to be self-healing and will automatically attempt to recover from most database issues.
