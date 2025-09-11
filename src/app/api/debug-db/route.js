import { NextResponse } from 'next/server';
import DBConnection from '@/app/utils/config/db';
import DoctorModel from '@/app/utils/models/Doctor';
import { MONGODB_URI } from '@/app/utils/config/environment.js';

export async function GET() {
  try {
    console.log('🔍 DEBUG: Testing database connection and Doctor model...');
    
    // Check environment
    console.log('🔍 MONGODB_URI available:', !!MONGODB_URI);
    console.log('🔍 MONGODB_URI length:', MONGODB_URI?.length);
    
    if (!MONGODB_URI) {
      return NextResponse.json({
        success: false,
        error: 'MONGODB_URI not configured',
        step: 'environment_check'
      });
    }
    
    // Test database connection
    try {
      console.log('🔌 Attempting database connection...');
      await DBConnection();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: dbError.message,
        step: 'database_connection'
      });
    }
    
    // Test Doctor model
    try {
      console.log('🔍 Testing Doctor model...');
      console.log('🔍 DoctorModel type:', typeof DoctorModel);
      console.log('🔍 DoctorModel methods:', Object.getOwnPropertyNames(DoctorModel));
      
      // Try to find doctors
      const doctors = await DoctorModel.find({}).limit(5);
      console.log('✅ Found doctors:', doctors.length);
      
      return NextResponse.json({
        success: true,
        message: 'Database and Doctor model working correctly',
        doctorsCount: doctors.length,
        sampleDoctors: doctors.slice(0, 2),
        step: 'model_test'
      });
      
    } catch (modelError) {
      console.error('❌ Doctor model error:', modelError);
      return NextResponse.json({
        success: false,
        error: 'Doctor model error',
        details: modelError.message,
        step: 'model_test'
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error in debug route:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error.message,
      step: 'unexpected_error'
    });
  }
}
