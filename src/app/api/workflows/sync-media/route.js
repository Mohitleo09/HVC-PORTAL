import { NextResponse } from 'next/server';
import DBConnection from '../../../utils/config/db';
import Workflow from '../../../utils/models/Workflow';

export async function POST() {
  try {
    await DBConnection();
    
    console.log('🔄 Starting media sync for completed workflows...');
    
    // Call the static method to create media records for existing completed workflows
    await Workflow.createMediaForCompletedWorkflows();
    
    // Get updated counts
    const Video = require('../../../utils/models/Video').default;
    const Short = require('../../../utils/models/Short').default;
    
    const completedVideos = await Video.countDocuments({ status: 'completed' });
    const completedShorts = await Short.countDocuments({ status: 'completed' });
    
    console.log(`📊 Media sync completed. Counts: Videos: ${completedVideos}, Shorts: ${completedShorts}`);
    
    return NextResponse.json({
      success: true,
      message: 'Media records synced successfully',
      counts: {
        videos: completedVideos,
        shorts: completedShorts
      }
    });
    
  } catch (error) {
    console.error('❌ Error syncing media records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync media records' },
      { status: 500 }
    );
  }
}
