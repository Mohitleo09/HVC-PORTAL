import DBConnection from './db';
import User from '../models/User';
import UserActivity from '../models/UserActivity';
import ScheduleActivity from '../models/ScheduleActivity';
import ThumbnailActivity from '../models/ThumbnailActivity';
import LoginLog from '../models/LoginLog';

/**
 * Initialize Employee Weekly Data Database
 * This function ensures all necessary collections and indexes are set up
 */
export const initializeEmployeeDataDB = async () => {
  try {
    console.log('🚀 Initializing Employee Weekly Data Database...');
    
    // Connect to database
    await DBConnection();
    console.log('✅ Database connection established');
    
    // Check if we have any users
    const userCount = await User.countDocuments();
    console.log(`📊 Found ${userCount} users in database`);
    
    // Check activity collections
    const userActivityCount = await UserActivity.countDocuments();
    const scheduleActivityCount = await ScheduleActivity.countDocuments();
    const thumbnailActivityCount = await ThumbnailActivity.countDocuments();
    const loginLogCount = await LoginLog.countDocuments();
    
    console.log('📈 Activity Data Summary:');
    console.log(`  - User Activities: ${userActivityCount}`);
    console.log(`  - Schedule Activities: ${scheduleActivityCount}`);
    console.log(`  - Thumbnail Activities: ${thumbnailActivityCount}`);
    console.log(`  - Login Logs: ${loginLogCount}`);
    
    // Create indexes for better performance
    await createIndexes();
    
    // Create sample data if database is empty
    if (userCount === 0) {
      console.log('📝 Creating sample data...');
      await createSampleData();
    }
    
    console.log('✅ Employee Weekly Data Database initialization complete');
    return {
      success: true,
      userCount,
      userActivityCount,
      scheduleActivityCount,
      thumbnailActivityCount,
      loginLogCount
    };
    
  } catch (error) {
    console.error('❌ Error initializing Employee Weekly Data Database:', error);
    throw error;
  }
};

/**
 * Create necessary indexes for optimal performance
 */
const createIndexes = async () => {
  try {
    console.log('🔧 Creating database indexes...');
    
    // User indexes
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1, status: 1 });
    
    // UserActivity indexes
    await UserActivity.collection.createIndex({ userId: 1, timestamp: -1 });
    await UserActivity.collection.createIndex({ username: 1, timestamp: -1 });
    await UserActivity.collection.createIndex({ action: 1, timestamp: -1 });
    await UserActivity.collection.createIndex({ sessionId: 1 });
    
    // ScheduleActivity indexes
    await ScheduleActivity.collection.createIndex({ userId: 1, timestamp: -1 });
    await ScheduleActivity.collection.createIndex({ username: 1, timestamp: -1 });
    await ScheduleActivity.collection.createIndex({ doctorName: 1, timestamp: -1 });
    await ScheduleActivity.collection.createIndex({ action: 1, timestamp: -1 });
    
    // ThumbnailActivity indexes
    await ThumbnailActivity.collection.createIndex({ userId: 1, timestamp: -1 });
    await ThumbnailActivity.collection.createIndex({ username: 1, timestamp: -1 });
    await ThumbnailActivity.collection.createIndex({ doctorName: 1, timestamp: -1 });
    await ThumbnailActivity.collection.createIndex({ action: 1, timestamp: -1 });
    
    // LoginLog indexes
    await LoginLog.collection.createIndex({ username: 1, timestamp: -1 });
    await LoginLog.collection.createIndex({ email: 1, timestamp: -1 });
    await LoginLog.collection.createIndex({ action: 1, timestamp: -1 });
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
};

/**
 * Create sample data for testing
 */
const createSampleData = async () => {
  try {
    console.log('📝 Creating sample users and activities...');
    
    // Create sample users
    const sampleUsers = [
      {
        username: 'john_doe',
        email: 'john.doe@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'user',
        status: 'active'
      },
      {
        username: 'jane_smith',
        email: 'jane.smith@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'user',
        status: 'active'
      },
      {
        username: 'admin_user',
        email: 'admin@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'admin',
        status: 'active'
      }
    ];
    
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`✅ Created ${createdUsers.length} sample users`);
    
    // Create sample activities for each user
    for (const user of createdUsers) {
      if (user.role === 'user') {
        await createSampleActivities(user);
      }
    }
    
    console.log('✅ Sample data creation complete');
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  }
};

/**
 * Create sample activities for a user
 */
const createSampleActivities = async (user) => {
  try {
    const now = new Date();
    const activities = [];
    
    // Create login activities
    for (let i = 0; i < 5; i++) {
      const loginTime = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)); // Last 5 days
      const logoutTime = new Date(loginTime.getTime() + (8 * 60 * 60 * 1000)); // 8 hours later
      
      activities.push({
        userId: user._id.toString(),
        username: user.username,
        action: 'login',
        timestamp: loginTime,
        sessionId: `session_${user._id}_${i}`,
        details: { loginMethod: 'email' }
      });
      
      activities.push({
        userId: user._id.toString(),
        username: user.username,
        action: 'logout',
        timestamp: logoutTime,
        sessionId: `session_${user._id}_${i}`,
        details: { logoutMethod: 'manual' }
      });
    }
    
    // Create page navigation activities
    const pages = ['Dashboard', 'Schedule', 'Thumbnails', 'Reports', 'Profile'];
    for (let i = 0; i < 10; i++) {
      const fromPage = pages[Math.floor(Math.random() * pages.length)];
      const toPage = pages[Math.floor(Math.random() * pages.length)];
      
      activities.push({
        userId: user._id.toString(),
        username: user.username,
        action: 'page_navigation',
        timestamp: new Date(now.getTime() - (Math.random() * 5 * 24 * 60 * 60 * 1000)),
        details: { fromPage, toPage }
      });
    }
    
    // Create schedule activities
    const doctors = ['Dr. Smith', 'Dr. Johnson', 'Dr. Brown', 'Dr. Davis'];
    const steps = ['Step 1: Planning', 'Step 2: Preparation', 'Step 3: Execution', 'Step 4: Review'];
    
    for (let i = 0; i < 8; i++) {
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const step = steps[Math.floor(Math.random() * steps.length)];
      
      activities.push({
        userId: user._id.toString(),
        username: user.username,
        action: 'workflow_step_complete',
        timestamp: new Date(now.getTime() - (Math.random() * 3 * 24 * 60 * 60 * 1000)),
        doctorName: doctor,
        stepName: step,
        stepNumber: Math.floor(Math.random() * 4) + 1,
        details: { completed: true }
      });
    }
    
    // Create thumbnail activities
    for (let i = 0; i < 6; i++) {
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const actions = ['thumbnail_create', 'thumbnail_view', 'thumbnail_edit'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      activities.push({
        userId: user._id.toString(),
        username: user.username,
        action: action,
        timestamp: new Date(now.getTime() - (Math.random() * 4 * 24 * 60 * 60 * 1000)),
        doctorName: doctor,
        details: { fileName: `thumbnail_${i}.jpg` }
      });
    }
    
    // Insert all activities
    await UserActivity.insertMany(activities);
    console.log(`✅ Created ${activities.length} sample activities for user ${user.username}`);
    
  } catch (error) {
    console.error('❌ Error creating sample activities:', error);
    throw error;
  }
};

/**
 * Get database health status
 */
export const getEmployeeDataHealth = async () => {
  try {
    await DBConnection();
    
    const stats = {
      users: await User.countDocuments(),
      userActivities: await UserActivity.countDocuments(),
      scheduleActivities: await ScheduleActivity.countDocuments(),
      thumbnailActivities: await ThumbnailActivity.countDocuments(),
      loginLogs: await LoginLog.countDocuments(),
      lastUpdated: new Date()
    };
    
    return {
      status: 'healthy',
      connected: true,
      stats
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message
    };
  }
};

export default initializeEmployeeDataDB;
