import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 GET /api/doctors-simple - Testing simple doctors route...');
    
    return NextResponse.json({
      success: true,
      message: 'Simple doctors route is working',
      timestamp: new Date().toISOString(),
      data: {
        doctors: [],
        count: 0
      }
    });
  } catch (error) {
    console.error('❌ Error in simple doctors route:', error);
    return NextResponse.json(
      { success: false, error: 'Simple doctors route failed' },
      { status: 500 }
    );
  }
}
