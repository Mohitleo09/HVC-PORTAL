import { NextResponse } from 'next/server';
import DoctorModel from '@/app/utils/models/Doctor';
import DBConnection from '@/app/utils/config/db';
import { MONGODB_URI } from '@/app/utils/config/environment.js';

// POST to fix existing doctors without gender
export async function POST() {
  try {
    console.log('🔧 POST /api/doctors/fix-gender - Fixing doctors without gender...');
    
    if (!MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    // Connect to database
    await DBConnection();
    
    // Find doctors without gender field or with null/empty gender
    const doctorsWithoutGender = await DoctorModel.find({
      $or: [
        { gender: { $exists: false } },
        { gender: null },
        { gender: "" },
        { gender: { $regex: /^\s*$/ } } // Only whitespace
      ]
    });
    
    console.log(`🔍 Found ${doctorsWithoutGender.length} doctors without gender`);
    
    if (doctorsWithoutGender.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All doctors already have gender values',
        fixedCount: 0
      });
    }
    
    // Update doctors to set a default gender
    let fixedCount = 0;
    for (const doctor of doctorsWithoutGender) {
      try {
        // Set default gender based on name or other criteria
        let defaultGender = "Other"; // Default fallback
        
        // You can add logic here to determine gender if needed
        // For now, we'll set it to "Other" and let users update manually
        
        await DoctorModel.findByIdAndUpdate(doctor._id, {
          $set: { gender: defaultGender }
        });
        
        console.log(`✅ Fixed doctor ${doctor.name} (${doctor._id}) - set gender to ${defaultGender}`);
        fixedCount++;
      } catch (updateError) {
        console.error(`❌ Failed to fix doctor ${doctor.name}:`, updateError.message);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} out of ${doctorsWithoutGender.length} doctors`,
      fixedCount,
      totalFound: doctorsWithoutGender.length
    });
    
  } catch (error) {
    console.error('❌ Error fixing doctors gender:', error);
    return NextResponse.json(
      { error: `Failed to fix doctors gender: ${error.message}` },
      { status: 500 }
    );
  }
}

// GET to check current gender status
export async function GET() {
  try {
    console.log('🔍 GET /api/doctors/fix-gender - Checking gender status...');
    
    if (!MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    // Connect to database
    await DBConnection();
    
    // Get total count
    const totalDoctors = await DoctorModel.countDocuments({});
    
    // Get count of doctors with valid gender
    const doctorsWithGender = await DoctorModel.countDocuments({
      gender: { $exists: true, $ne: null, $ne: "" }
    });
    
    // Get count of doctors without gender
    const doctorsWithoutGender = await DoctorModel.countDocuments({
      $or: [
        { gender: { $exists: false } },
        { gender: null },
        { gender: "" },
        { gender: { $regex: /^\s*$/ } }
      ]
    });
    
    // Get sample doctors without gender
    const sampleDoctorsWithoutGender = await DoctorModel.find({
      $or: [
        { gender: { $exists: false } },
        { gender: null },
        { gender: "" },
        { gender: { $regex: /^\s*$/ } }
      ]
    }).select('name department createdAt').limit(5);
    
    return NextResponse.json({
      success: true,
      stats: {
        totalDoctors,
        doctorsWithGender,
        doctorsWithoutGender,
        percentageWithGender: totalDoctors > 0 ? Math.round((doctorsWithGender / totalDoctors) * 100) : 0
      },
      sampleDoctorsWithoutGender: sampleDoctorsWithoutGender.map(d => ({
        id: d._id,
        name: d.name,
        department: d.department,
        createdAt: d.createdAt
      }))
    });
    
  } catch (error) {
    console.error('❌ Error checking gender status:', error);
    return NextResponse.json(
      { error: `Failed to check gender status: ${error.message}` },
      { status: 500 }
    );
  }
}
