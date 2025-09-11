import { NextResponse } from 'next/server';
import DBConnection from '../../../utils/config/db';
import User from '../../../utils/models/User';
import { MONGODB_URI, NODE_ENV } from '../../../utils/config/environment.js';

// Test endpoint to verify API is working
export async function GET() {
  try {
    console.log('🧪 GET /api/users/test - Testing endpoint...');
    console.log('🔧 Environment check:', {
      hasMongoURI: !!MONGODB_URI,
      mongoURILength: MONGODB_URI ? MONGODB_URI.length : 0,
      nodeEnv: NODE_ENV
    });
    
    return NextResponse.json({
      success: true,
      message: 'Users test endpoint is working',
      timestamp: new Date().toISOString(),
      environment: {
        hasMongoURI: !!MONGODB_URI,
        mongoURILength: MONGODB_URI ? MONGODB_URI.length : 0,
        nodeEnv: NODE_ENV
      }
    });
  } catch (error) {
    console.error('❌ Error in test endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Test endpoint failed' },
      { status: 500 }
    );
  }
}

// Test database connection
export async function POST() {
  try {
    console.log('🧪 POST /api/users/test - Testing database connection...');
    console.log('🔧 Environment check:', {
      hasMongoURI: !!MONGODB_URI,
      nodeEnv: NODE_ENV
    });
    
    if (!MONGODB_URI) {
      return NextResponse.json({
        success: false,
        error: 'MONGODB_URI not configured',
        message: 'Please check your environment configuration'
      }, { status: 500 });
    }
    
    try {
      await DBConnection();
      console.log('✅ Database connection successful');
      
      // Test a simple query
      const userCount = await User.countDocuments();
      
      return NextResponse.json({
        success: true,
        message: 'Database connection test successful',
        userCount,
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: dbError.message,
        message: 'Check your MongoDB connection string and network connection'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error in database test:', error);
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error.message
    }, { status: 500 });
  }
}

// Test user creation
export async function PUT() {
  try {
    console.log('🧪 PUT /api/users/test - Testing user creation...');
    console.log('🔧 Environment check:', {
      hasMongoURI: !!MONGODB_URI,
      nodeEnv: NODE_ENV
    });
    
    if (!MONGODB_URI) {
      return NextResponse.json({
        success: false,
        error: 'MONGODB_URI not configured',
        message: 'Please check your environment configuration'
      }, { status: 500 });
    }
    
    try {
      await DBConnection();
      console.log('✅ Database connection successful');
      
      // Create a test user
      const testUser = new User({
        username: 'test_user_' + Date.now(),
        email: 'test_' + Date.now() + '@example.com',
        password: 'testpassword123',
        role: 'user'
      });
      
      await testUser.save();
      console.log('✅ Test user created successfully');
      
      // Clean up - delete the test user
      await User.findByIdAndDelete(testUser._id);
      console.log('✅ Test user cleaned up');
      
      return NextResponse.json({
        success: true,
        message: 'User creation test successful',
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('❌ User creation test failed:', dbError);
      return NextResponse.json({
        success: false,
        error: 'User creation test failed',
        details: dbError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error in user creation test:', error);
    return NextResponse.json({
      success: false,
      error: 'User creation test failed',
      details: error.message
    }, { status: 500 });
  }
}
