import { NextResponse } from 'next/server';
import DBConnection from '@/app/utils/config/db';
import Video from '@/app/utils/models/Video';
import Short from '@/app/utils/models/Short';
import Workflow from '@/app/utils/models/Workflow';

// GET - Fetch combined media counts
export async function GET() {
  try {
    await DBConnection();
    
    // Get video counts
    const videoCounts = await Video.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get short counts
    const shortCounts = await Short.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get completed schedules count from workflows
    const completedSchedulesCount = await Workflow.countDocuments({ workflowStatus: 'completed' });
    
    // Convert to object format for easier access
    const videoCountsObj = {};
    videoCounts.forEach(item => {
      videoCountsObj[item._id] = item.count;
    });
    
    const shortCountsObj = {};
    shortCounts.forEach(item => {
      shortCountsObj[item._id] = item.count;
    });
    
    // Get total counts
    const totalVideos = await Video.countDocuments();
    const totalShorts = await Short.countDocuments();
    const totalWorkflows = await Workflow.countDocuments();
    
    return NextResponse.json({
      success: true,
      counts: {
        videos: {
          total: totalVideos,
          completed: videoCountsObj.completed || 0,
          pending: videoCountsObj.pending || 0,
          inProgress: videoCountsObj.in_progress || 0
        },
        shorts: {
          total: totalShorts,
          completed: shortCountsObj.completed || 0,
          pending: shortCountsObj.pending || 0,
          inProgress: shortCountsObj.in_progress || 0
        },
        schedules: {
          total: totalWorkflows,
          completed: completedSchedulesCount,
          inProgress: totalWorkflows - completedSchedulesCount
        },
        total: {
          videos: totalVideos,
          shorts: totalShorts,
          schedules: totalWorkflows,
          all: totalVideos + totalShorts + totalWorkflows
        }
      }
    });
    
  } catch (error) {
    console.error('Error in media API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch media counts',
      details: error.message
    }, { status: 500 });
  }
}
