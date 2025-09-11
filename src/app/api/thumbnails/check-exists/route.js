import { NextResponse } from 'next/server';
import DBConnection from '../../../utils/config/db';
import Thumbnail from '../../../utils/models/Thumbnail';

// GET - Check if thumbnail already exists for a doctor and language combination
export async function GET(request) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(request.url);
    const doctor = searchParams.get('doctor');
    const language = searchParams.get('language');
    
    if (!doctor || !language) {
      return NextResponse.json(
        { success: false, message: 'Doctor and language are required' },
        { status: 400 }
      );
    }
    
    // Check if thumbnail already exists for this doctor and language
    const existingThumbnail = await Thumbnail.findOne({
      doctor: doctor,
      language: language
    }).populate('doctor', 'name');
    
    const exists = !!existingThumbnail;
    
    return NextResponse.json({
      success: true,
      exists: exists,
      thumbnail: existingThumbnail ? {
        id: existingThumbnail._id,
        doctorName: existingThumbnail.doctor?.name || 'Unknown Doctor',
        language: existingThumbnail.language,
        createdAt: existingThumbnail.createdAt
      } : null
    });
    
  } catch (error) {
    console.error('❌ Error checking thumbnail existence:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check thumbnail existence' },
      { status: 500 }
    );
  }
}
