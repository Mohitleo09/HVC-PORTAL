import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 GET /api/debug-env - Debugging environment variables...');
    
    // Check all environment variables
    const envVars = {
      MONGODB_URI: {
        value: process.env.MONGODB_URI ? 'Set' : 'Not Set',
        length: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
        preview: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 50) + '...' : 'N/A'
      },
      NEXTAUTH_SECRET: {
        value: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not Set',
        length: process.env.NEXTAUTH_SECRET ? process.env.NEXTAUTH_SECRET.length : 0
      },
      NEXTAUTH_URL: {
        value: process.env.NEXTAUTH_URL ? 'Set' : 'Not Set',
        url: process.env.NEXTAUTH_URL || 'N/A'
      },
      YOUTUBE_API_KEY: {
        value: process.env.YOUTUBE_API_KEY ? 'Set' : 'Not Set',
        length: process.env.YOUTUBE_API_KEY ? process.env.YOUTUBE_API_KEY.length : 0
      },
      SECRET_KEY: {
        value: process.env.SECRET_KEY ? 'Set' : 'Not Set',
        length: process.env.SECRET_KEY ? process.env.SECRET_KEY.length : 0
      },
      NODE_ENV: process.env.NODE_ENV || 'Not Set'
    };
    
    console.log('🔧 Environment variables check:', envVars);
    
    return NextResponse.json({
      success: true,
      message: 'Environment variables debug info',
      timestamp: new Date().toISOString(),
      environment: envVars,
      serverInfo: {
        port: process.env.PORT || 'Not Set',
        hostname: process.env.HOSTNAME || 'Not Set'
      }
    });
  } catch (error) {
    console.error('❌ Error in debug-env API:', error);
    return NextResponse.json(
      { success: false, error: 'Debug API failed' },
      { status: 500 }
    );
  }
}
