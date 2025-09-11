import { NextResponse } from 'next/server';
import DoctorModel from '@/app/utils/models/Doctor';
import DBConnection from '@/app/utils/config/db';
import { MONGODB_URI } from '@/app/utils/config/environment.js';

// GET all doctors
export async function GET() {
  try {
    console.log('🔍 GET /api/doctors - Starting request...');
    
    // Check if MONGODB_URI is available
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not configured');
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    // Connect to database
    try {
      console.log('🔌 Connecting to database...');
      await DBConnection();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      return NextResponse.json(
        { 
          error: 'Database connection failed', 
          details: dbError.message
        },
        { status: 500 }
      );
    }
    
    // Fetch doctors
    try {
      console.log('🔍 Fetching doctors from database...');
      const doctors = await DoctorModel.find({}).sort({ createdAt: -1 });
      console.log(`✅ Found ${doctors.length} doctors`);
      
      return NextResponse.json({ 
        success: true,
        doctors: doctors,
        count: doctors.length
      });
      
    } catch (fetchError) {
      console.error('❌ Error fetching doctors:', fetchError.message);
      return NextResponse.json(
        { 
          error: 'Failed to fetch doctors', 
          details: fetchError.message
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Unexpected error in GET /api/doctors:', error);
    return NextResponse.json(
      { 
        error: 'Unexpected server error', 
        details: error.message
      },
      { status: 500 }
    );
  }
}

// POST new doctor
export async function POST(request) {
  try {
    console.log('🚀 POST /api/doctors - Creating new doctor...');
    
    if (!MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const { name, department, languages, photos = [], specialization, experience, education, contact, availability, gender } = body;

    // Validate required fields
    if (!name || !department || !languages || !gender) {
      return NextResponse.json(
        { error: 'Name, department, languages, and gender are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await DBConnection();
    
    // Check for existing doctor
    const existingDoctor = await DoctorModel.findOne({
      name: name.trim(),
      department: department.trim()
    });
    
    if (existingDoctor) {
      return NextResponse.json(
        { error: 'Doctor with this name and department already exists' },
        { status: 400 }
      );
    }

    // Create new doctor
    const newDoctor = new DoctorModel({
      name: name.trim(),
      department: department.trim(),
      languages: languages.trim(),
      photos: photos,
      status: "Active",
      gender: gender.trim(),
      specialization: specialization?.trim(),
      experience: experience || 0,
      education: education?.trim(),
      contact: contact || {},
      availability: availability || {}
    });

    await newDoctor.save();
    console.log('✅ Doctor created successfully');
    
    const safeDoctor = newDoctor.toSafeObject();
    return NextResponse.json(
      { 
        success: true,
        message: 'Doctor created successfully', 
        doctor: safeDoctor 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('❌ Error creating doctor:', error);
    return NextResponse.json(
      { error: `Failed to create doctor: ${error.message}` },
      { status: 500 }
    );
  }
}

// PUT update doctor
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, department, languages, photos, specialization, experience, education, contact, availability, gender } = body;

    if (!id || !name || !department || !languages || !gender) {
      return NextResponse.json(
        { error: 'ID, name, department, languages, and gender are required' },
        { status: 400 }
      );
    }

    await DBConnection();

    const doctor = await DoctorModel.findById(id);
    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Update doctor fields
    doctor.name = name.trim();
    doctor.department = department.trim();
    doctor.languages = languages.trim();
    doctor.gender = gender.trim();
    doctor.photos = photos || [];
    doctor.specialization = specialization?.trim();
    doctor.experience = experience || 0;
    doctor.education = education?.trim();
    doctor.contact = contact || {};
    doctor.availability = availability || {};

    await doctor.save();
    console.log('✅ Doctor updated successfully');

    const safeDoctor = doctor.toSafeObject();
    return NextResponse.json(
      { 
        success: true,
        message: 'Doctor updated successfully', 
        doctor: safeDoctor 
      }
    );
  } catch (error) {
    console.error('❌ Error updating doctor:', error);
    return NextResponse.json(
      { error: 'Failed to update doctor' },
      { status: 500 }
    );
  }
}

// PATCH update doctor status
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      );
    }

    if (!['Active', 'Inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    await DBConnection();

    const doctor = await DoctorModel.findById(id);
    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    doctor.status = status;
    await doctor.save();
    console.log('✅ Doctor status updated successfully');

    const safeDoctor = doctor.toSafeObject();
    return NextResponse.json(
      { 
        success: true,
        message: 'Doctor status updated successfully', 
        doctor: safeDoctor 
      }
    );
  } catch (error) {
    console.error('❌ Error updating doctor status:', error);
    return NextResponse.json(
      { error: 'Failed to update doctor status' },
      { status: 500 }
    );
  }
}

// DELETE doctor
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    await DBConnection();

    const doctor = await DoctorModel.findByIdAndDelete(id);
    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    console.log('✅ Doctor deleted successfully');
    return NextResponse.json(
      { 
        success: true,
        message: 'Doctor deleted successfully', 
        doctor: doctor.toSafeObject()
      }
    );
  } catch (error) {
    console.error('❌ Error deleting doctor:', error);
    return NextResponse.json(
      { error: 'Failed to delete doctor' },
      { status: 500 }
    );
  }
}
