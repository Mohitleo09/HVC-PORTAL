import { NextResponse } from 'next/server';
import DBConnection from '@/app/utils/config/db';
import Short from '@/app/utils/models/Short';

// GET - Fetch all shorts or short counts
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
      
      const totalCount = await Short.countDocuments();
      const completedCount = await Short.countDocuments({ status: 'completed' });
      const pendingCount = await Short.countDocuments({ status: 'pending' });
      const inProgressCount = await Short.countDocuments({ status: 'in_progress' });
      
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
    
    // Return full short data
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const shorts = await Short.find(query).sort({ createdAt: -1 });
    
    const formattedShorts = shorts.map(short => ({
      id: short._id.toString(),
      title: short.title,
      status: short.status,
      doctorName: short.doctorName,
      departmentName: short.departmentName,
      scheduleId: short.scheduleId,
      completedAt: short.completedAt,
      duration: short.duration,
      description: short.description,
      tags: short.tags,
      views: short.views,
      likes: short.likes,
      createdAt: short.createdAt,
      updatedAt: short.updatedAt
    }));
    
    return NextResponse.json({
      success: true,
      shorts: formattedShorts,
      count: formattedShorts.length
    });
    
  } catch (error) {
    console.error('Error in shorts API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch shorts',
      details: error.message
    }, { status: 500 });
  }
}

// POST - Create a new short
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
    
    const short = new Short({
      title,
      doctorName,
      departmentName,
      scheduleId,
      description,
      tags: tags || [],
      status: 'pending'
    });
    
    await short.save();
    
    return NextResponse.json({
      success: true,
      message: 'Short created successfully',
      short: {
        id: short._id.toString(),
        title: short.title,
        status: short.status,
        doctorName: short.doctorName,
        departmentName: short.departmentName
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating short:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create short',
      details: error.message
    }, { status: 500 });
  }
}
