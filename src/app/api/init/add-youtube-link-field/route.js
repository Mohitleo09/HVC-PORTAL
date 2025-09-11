import { NextResponse } from 'next/server';
import DBConnection from '../../../utils/config/db';
import Trend from '../../../utils/models/Trend';
import { MONGODB_URI } from '../../../utils/config/environment.js';

export async function POST() {
  try {
    console.log('🚀 Adding YouTube link field to existing trends...');
    
    if (!MONGODB_URI) {
      return NextResponse.json({
        success: false,
        error: 'MONGODB_URI not configured',
        message: 'Please check your environment configuration'
      }, { status: 500 });
    }
    
    try {
      await DBConnection();
      console.log('✅ Database connected');
      
      // Find all trends that don't have a youtubeLink field
      const trendsWithoutYoutubeLink = await Trend.find({
        $or: [
          { youtubeLink: { $exists: false } },
          { youtubeLink: null },
          { youtubeLink: "" }
        ]
      });
      
      console.log(`📊 Found ${trendsWithoutYoutubeLink.length} trends without YouTube link field`);
      
      if (trendsWithoutYoutubeLink.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'All trends already have YouTube link field',
          updatedCount: 0
        });
      }
      
      // Update all trends to add the youtubeLink field with a default value
      const updateResult = await Trend.updateMany(
        {
          $or: [
            { youtubeLink: { $exists: false } },
            { youtubeLink: null },
            { youtubeLink: "" }
          ]
        },
        { $set: { youtubeLink: "" } }
      );
      
      console.log(`✅ Updated ${updateResult.modifiedCount} trends with YouTube link field`);
      
      return NextResponse.json({
        success: true,
        message: 'YouTube link field added successfully',
        totalTrends: trendsWithoutYoutubeLink.length,
        updatedCount: updateResult.modifiedCount
      });
      
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database operation failed',
        details: dbError.message
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Error adding YouTube link field:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add YouTube link field',
      details: error.message
    }, { status: 500 });
  }
}
