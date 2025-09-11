import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 GET /api/test - Testing basic API functionality...');
    
    return NextResponse.json({
      success: true,
      message: 'Test API is working correctly',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        hasMongoURI: !!process.env.MONGODB_URI,
        mongoURILength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0
      }
    });
  } catch (error) {
    console.error('❌ Error in test API:', error);
    return NextResponse.json(
      { success: false, error: 'Test API failed' },
      { status: 500 }
    );
  }
}
