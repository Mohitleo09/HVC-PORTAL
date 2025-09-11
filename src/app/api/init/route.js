import { NextResponse } from 'next/server';
import DBConnection from '../../utils/config/db';
import { MONGODB_URI, NEXTAUTH_SECRET, NEXTAUTH_URL, YOUTUBE_API_KEY, SECRET_KEY } from '../../utils/config/environment.js';

// GET - Initialize database and check configuration
export async function GET() {
  try {
    console.log('🚀 GET /api/init - Starting initialization...');
    
    // Check environment variables
    const envCheck = {
      mongodb_uri: MONGODB_URI ? '✅ Set' : '❌ Missing',
      nextauth_secret: NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing',
      nextauth_url: NEXTAUTH_URL ? '✅ Set' : '❌ Missing',
      youtube_api_key: YOUTUBE_API_KEY ? '✅ Set' : '❌ Missing',
      secret_key: SECRET_KEY ? '✅ Set' : '❌ Missing'
    };
    
    console.log('🔧 Environment check:', envCheck);
    
    // Check if required environment variables are set
    const missingVars = [];
    if (!MONGODB_URI) missingVars.push('MONGODB_URI');
    if (!NEXTAUTH_SECRET) missingVars.push('NEXTAUTH_SECRET');
    if (!NEXTAUTH_URL) missingVars.push('NEXTAUTH_URL');
    
    if (missingVars.length > 0) {
      console.warn(`⚠️ Missing required environment variables: ${missingVars.join(', ')}`);
      console.warn('⚠️ Some features may not work properly');
    }
    
    // Test database connection
    let dbStatus = '❌ Not tested';
    let dbError = null;
    
    if (MONGODB_URI) {
      try {
        console.log('🔌 Testing database connection...');
        await DBConnection();
        console.log('✅ Database connection successful');
        dbStatus = '✅ Connected';
      } catch (error) {
        console.error('❌ Database connection failed:', error);
        dbStatus = '❌ Failed';
        dbError = error.message;
      }
    } else {
      dbStatus = '❌ No URI configured';
    }
    
    // Return initialization status
    return NextResponse.json({
      success: true,
      message: 'Initialization check completed',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        status: dbStatus,
        error: dbError
      },
      recommendations: {
        mongodb: MONGODB_URI ? '✅ MongoDB URI is configured' : '⚠️ Set MONGODB_URI for database functionality',
        nextauth: NEXTAUTH_SECRET ? '✅ NextAuth secret is configured' : '⚠️ Set NEXTAUTH_SECRET for authentication',
        nextauth_url: NEXTAUTH_URL ? '✅ NextAuth URL is configured' : '⚠️ Set NEXTAUTH_URL for authentication',
        youtube: YOUTUBE_API_KEY ? '✅ YouTube API key is configured' : '⚠️ Set YOUTUBE_API_KEY for YouTube integration',
        secret: SECRET_KEY ? '✅ Secret key is configured' : '⚠️ Set SECRET_KEY for additional security'
      }
    });
    
  } catch (error) {
    console.error('❌ Error in initialization:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Initialization failed',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST - Force database reconnection
export async function POST() {
  try {
    console.log('🔄 POST /api/init - Force database reconnection...');
    
    if (!MONGODB_URI) {
      return NextResponse.json({
        success: false,
        error: 'MONGODB_URI not configured',
        message: 'Please check your environment configuration'
      }, { status: 500 });
    }
    
    try {
      // Force a new connection
      await DBConnection();
      console.log('✅ Database reconnection successful');
      
      return NextResponse.json({
        success: true,
        message: 'Database reconnection successful',
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('❌ Database reconnection failed:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database reconnection failed',
        details: dbError.message,
        message: 'Check your MongoDB connection string and network connection'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error in force reconnection:', error);
    return NextResponse.json({
      success: false,
      error: 'Force reconnection failed',
      details: error.message
    }, { status: 500 });
  }
}
