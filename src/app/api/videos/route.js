import { NextResponse } from 'next/server';
import DBConnection from '@/app/utils/config/db';
import Video from '@/app/utils/models/Video';

// GET - Fetch all videos or video counts
export async function GET(request) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get('count') === 'true';
    const status = searchParams.get('status');
    
    if (countOnly) {
      // Return only counts
      let query = {};
      if (status) {
        query.status = status;
      }
      
      const totalCount = await Video.countDocuments();
      const completedCount = await Video.countDocuments({ status: 'completed' });
      const pendingCount = await Video.countDocuments({ status: 'pending' });
      const inProgressCount = await Video.countDocuments({ status: 'in_progress' });
      
      return NextResponse.json({
        success: true,
        counts: {
          total: totalCount,
          completed: completedCount,
          pending: pendingCount,
          inProgress: inProgressCount
        }
      });
    }
    
    // Return full video data
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const videos = await Video.find(query).sort({ createdAt: -1 });
    
    const formattedVideos = videos.map(video => ({
      id: video._id.toString(),
      title: video.title,
      status: video.status,
      doctorName: video.doctorName,
      departmentName: video.departmentName,
      scheduleId: video.scheduleId,
      completedAt: video.completedAt,
      duration: video.duration,
      description: video.description,
      tags: video.tags,
      views: video.views,
      likes: video.likes,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt
    }));
    
    return NextResponse.json({
      success: true,
      videos: formattedVideos,
      count: formattedVideos.length
    });
    
  } catch (error) {
    console.error('Error in videos API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch videos',
      details: error.message
    }, { status: 500 });
  }
}

// POST - Create a new video
export async function POST(request) {
  try {
    await DBConnection();
    
    const body = await request.json();
    const { title, doctorName, departmentName, scheduleId, description, tags } = body;
    
    // Validate required fields
    if (!title || !doctorName || !departmentName) {
      return NextResponse.json({
        success: false,
        error: 'Title, doctor name, and department name are required'
      }, { status: 400 });
    }
    
    const video = new Video({
      title,
      doctorName,
      departmentName,
      scheduleId,
      description,
      tags: tags || [],
      status: 'pending'
    });
    
    await video.save();
    
    return NextResponse.json({
      success: true,
      message: 'Video created successfully',
      video: {
        id: video._id.toString(),
        title: video.title,
        status: video.status,
        doctorName: video.doctorName,
        departmentName: video.departmentName
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create video',
      details: error.message
    }, { status: 500 });
  }
}
