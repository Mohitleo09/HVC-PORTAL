import { NextResponse } from 'next/server';
import DBConnection from '../../../utils/config/db';
import User from '../../../utils/models/User';
import UserActivity from '../../../utils/models/UserActivity';
import ScheduleActivity from '../../../utils/models/ScheduleActivity';
import ThumbnailActivity from '../../../utils/models/ThumbnailActivity';
import LoginLog from '../../../utils/models/LoginLog';

// GET - Check database health and status
export async function GET() {
  try {
    console.log('🔍 GET /api/init/employee-data - Checking database status...');
    
    await DBConnection();
    
    const stats = {
      users: await User.countDocuments(),
      userActivities: await UserActivity.countDocuments(),
      scheduleActivities: await ScheduleActivity.countDocuments(),
      thumbnailActivities: await ThumbnailActivity.countDocuments(),
      loginLogs: await LoginLog.countDocuments(),
      lastUpdated: new Date()
    };
    
    const health = {
      status: 'healthy',
      connected: true,
      stats
    };
    
    return NextResponse.json({
      success: true,
      message: 'Employee Weekly Data database status retrieved',
      health
    });
  } catch (error) {
    console.error('❌ Error checking Employee Weekly Data database status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to check database status: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

// POST - Initialize Employee Weekly Data database
export async function POST() {
  try {
    console.log('🚀 POST /api/init/employee-data - Initializing database...');
    
    await DBConnection();
    
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
    
    const result = {
      success: true,
      userCount,
      userActivityCount,
      scheduleActivityCount,
      thumbnailActivityCount,
      loginLogCount
    };
    
    return NextResponse.json({
      success: true,
      message: 'Employee Weekly Data database initialized successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error initializing Employee Weekly Data database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to initialize database: ${error.message}` 
      },
      { status: 500 }
    );
  }
}
