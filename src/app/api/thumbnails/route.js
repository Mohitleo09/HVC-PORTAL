import { NextResponse } from 'next/server';
import DBConnection from '../../utils/config/db';
import Thumbnail from '../../utils/models/Thumbnail';
import ThumbnailActivity from '../../utils/models/ThumbnailActivity';
import { MONGODB_URI, NODE_ENV } from '../../utils/config/environment.js';

// GET - Fetch all thumbnails
export async function GET(request) {
  try {
    console.log('🔄 Testing thumbnail database connection...');
    console.log('🔧 Environment check:', {
      hasMongoURI: !!MONGODB_URI,
      mongoURILength: MONGODB_URI ? MONGODB_URI.length : 0,
      nodeEnv: NODE_ENV
    });
    
    try {
      // Use the standard database connection
      await DBConnection();
      console.log('✅ Thumbnail database connection successful');
    } catch (dbError) {
      console.error('❌ Thumbnail database connection failed:', dbError);
      console.error('❌ Error details:', {
        name: dbError.name,
        message: dbError.message,
        stack: dbError.stack
      });
      return NextResponse.json(
        { success: false, message: 'Database connection failed for thumbnails' },
        { status: 500 }
      );
    }
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');
    const doctorName = searchParams.get('doctorName');
    const department = searchParams.get('department');
    const language = searchParams.get('language');
    
    // Build query object
    let query = {};
    if (userId) query.userId = userId;
    if (username) query.username = username;
    if (doctorName) query.doctorName = doctorName;
    if (department) query.department = department;
    if (language) query.language = language;
    
    const thumbnails = await Thumbnail.find(query)
      .populate('department', 'name')
      .populate('doctor', 'name')
      .sort({ createdAt: -1 });

    console.log(`📊 Found ${thumbnails.length} thumbnails`);

    // Format the response to include department and doctor names
    const formattedThumbnails = thumbnails.map(thumb => ({
      _id: thumb._id,
      thumbnailUrl: thumb.thumbnailUrl,
      department: thumb.department?._id,
      departmentName: thumb.department?.name,
      doctor: thumb.doctor?._id,
      doctorName: thumb.doctor?.name,
      language: thumb.language,
      createdAt: thumb.createdAt,
      updatedAt: thumb.updatedAt
    }));

    return NextResponse.json({
      success: true,
      thumbnails: formattedThumbnails
    });
  } catch (error) {
    console.error('❌ Error fetching thumbnails:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch thumbnails' },
      { status: 500 }
    );
  }
}

// POST - Create new thumbnail
export async function POST(request) {
  try {
    console.log('🔄 Starting thumbnail creation...');
    console.log('🔧 Environment check:', {
      hasMongoURI: !!MONGODB_URI,
      mongoURILength: MONGODB_URI ? MONGODB_URI.length : 0,
      nodeEnv: NODE_ENV
    });
    
    // Test database connection first
    try {
      await DBConnection();
      console.log('✅ Thumbnail database connection successful');
    } catch (dbError) {
      console.error('❌ Thumbnail database connection failed:', dbError);
      console.error('❌ Error details:', {
        name: dbError.name,
        message: dbError.message,
        stack: dbError.stack
      });
      return NextResponse.json(
        { success: false, message: 'Database connection failed for thumbnails' },
        { status: 500 }
      );
    }
    
    const formData = await request.formData();
    const department = formData.get('department');
    const doctor = formData.get('doctor');
    const language = formData.get('language');
    const thumbnail = formData.get('thumbnail');
    const userId = formData.get('userId');
    const username = formData.get('username');
    const doctorName = formData.get('doctorName');

    console.log('📋 Received form data:', { 
      department, 
      doctor, 
      language,
      userId,
      username,
      doctorName,
      thumbnailName: thumbnail?.name,
      thumbnailSize: thumbnail?.size,
      thumbnailType: thumbnail?.type,
      hasThumbnail: !!thumbnail
    });

    // Validate required fields
    if (!department || !doctor || !language || !thumbnail) {
      console.error('❌ Missing required fields:', { 
        department: !!department, 
        doctor: !!doctor, 
        language: !!language,
        hasThumbnail: !!thumbnail 
      });
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!thumbnail.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', thumbnail.type);
      return NextResponse.json(
        { success: false, message: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    console.log('🔄 Converting file to base64...');
    
    // Convert file to base64 for storage (in production, use cloud storage)
    const arrayBuffer = await thumbnail.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = `data:${thumbnail.type};base64,${buffer.toString('base64')}`;
    
    console.log('✅ File converted to base64, size:', buffer.length, 'bytes');
    
    // Create thumbnail record with base64 data
    const newThumbnail = new Thumbnail({
      userId: userId || 'unknown',
      username: username || 'unknown',
      department,
      doctor,
      doctorName: doctorName || 'Unknown Doctor',
      language,
      thumbnailUrl: base64Data, // Store base64 data as URL
      originalFileName: thumbnail.name,
      fileSize: thumbnail.size,
      mimeType: thumbnail.type
    });

    console.log('💾 Saving thumbnail to database...');
    await newThumbnail.save();
    console.log('✅ Thumbnail saved successfully with ID:', newThumbnail._id);

    // Track thumbnail creation activity
    try {
      const thumbnailActivity = new ThumbnailActivity({
        userId: userId || 'unknown',
        username: username || 'unknown',
        thumbnailId: newThumbnail._id.toString(),
        doctorName: doctorName || 'Unknown Doctor',
        action: 'thumbnail_create',
        details: {
          page: 'thumbnail_management',
          notes: `Created thumbnail for ${language} language`,
          thumbnailData: {
            language: language,
            department: department,
            doctor: doctor,
            fileSize: thumbnail.size,
            fileType: thumbnail.type,
            originalFileName: thumbnail.name,
            timestamp: new Date().toISOString()
          }
        },
        language: language,
        department: department,
        fileSize: thumbnail.size,
        fileType: thumbnail.type,
        originalFileName: thumbnail.name,
        thumbnailUrl: base64Data,
        status: 'success'
      });
      
      await thumbnailActivity.save();
      console.log('✅ Thumbnail creation activity tracked');
    } catch (activityError) {
      console.error('❌ Failed to track thumbnail creation activity:', activityError);
      // Don't fail the main operation if activity tracking fails
    }

    // Populate the response
    const populatedThumbnail = await Thumbnail.findById(newThumbnail._id)
      .populate('department', 'name')
      .populate('doctor', 'name');

    const formattedThumbnail = {
      _id: populatedThumbnail._id,
      thumbnailUrl: populatedThumbnail.thumbnailUrl,
      department: populatedThumbnail.department?._id,
      departmentName: populatedThumbnail.department?.name,
      doctor: populatedThumbnail.doctor?._id,
      doctorName: populatedThumbnail.doctor?.name,
      language: populatedThumbnail.language,
      createdAt: populatedThumbnail.createdAt,
      updatedAt: populatedThumbnail.updatedAt
    };

    console.log('🎉 Thumbnail created successfully:', {
      id: formattedThumbnail._id,
      departmentName: formattedThumbnail.departmentName,
      doctorName: formattedThumbnail.doctorName
    });

    return NextResponse.json({
      success: true,
      message: 'Thumbnail created successfully',
      thumbnail: formattedThumbnail
    });
  } catch (error) {
    console.error('❌ Error creating thumbnail:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { success: false, message: `Failed to create thumbnail: ${error.message}` },
      { status: 500 }
    );
  }
}
