import { NextResponse } from 'next/server';
import DBConnection from '../../utils/config/db';
import ThumbnailActivity from '../../utils/models/ThumbnailActivity';

export async function POST(request) {
  try {
    await DBConnection();
    
    const body = await request.json();
    const { 
      userId, 
      username, 
      thumbnailId, 
      doctorName, 
      scheduleId,
      action, 
      details, 
      timestamp,
      sessionId,
      duration,
      language,
      department,
      status,
      notes,
      fileSize,
      fileType,
      originalFileName,
      thumbnailUrl,
      previousValues,
      newValues,
      ipAddress,
      userAgent
    } = body;
    
    if (!userId || !username || !thumbnailId || !doctorName || !action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: userId, username, thumbnailId, doctorName, action' 
      }, { status: 400 });
    }
    
    const thumbnailActivity = new ThumbnailActivity({
      userId,
      username,
      thumbnailId,
      doctorName,
      scheduleId: scheduleId || null,
      action,
      details: details || {},
      timestamp: timestamp || new Date(),
      sessionId: sessionId || null,
      duration: duration || 0,
      language: language || null,
      department: department || null,
      status: status || 'success',
      notes: notes || null,
      fileSize: fileSize || null,
      fileType: fileType || null,
      originalFileName: originalFileName || null,
      thumbnailUrl: thumbnailUrl || null,
      previousValues: previousValues || {},
      newValues: newValues || {},
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    });
    
    await thumbnailActivity.save();
    
    console.log(`✅ Thumbnail activity logged: ${username} - ${action} for Dr. ${doctorName} (Thumbnail: ${thumbnailId})`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Thumbnail activity logged successfully',
      thumbnailActivity 
    });
    
  } catch (error) {
    console.error('❌ Error logging thumbnail activity:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to log thumbnail activity' 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');
    const thumbnailId = searchParams.get('thumbnailId');
    const doctorName = searchParams.get('doctorName');
    const scheduleId = searchParams.get('scheduleId');
    const action = searchParams.get('action');
    const language = searchParams.get('language');
    const department = searchParams.get('department');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit')) || 100;
    const status = searchParams.get('status');
    
    let query = {};
    if (userId) query.userId = userId;
    if (username) query.username = username;
    if (thumbnailId) query.thumbnailId = thumbnailId;
    if (doctorName) query.doctorName = doctorName;
    if (scheduleId) query.scheduleId = scheduleId;
    if (action) query.action = action;
    if (language) query.language = language;
    if (department) query.department = department;
    if (status) query.status = status;
    
    // Add date range filtering if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of day (23:59:59.999)
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endDateTime;
      }
    }
    
    const activities = await ThumbnailActivity.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    
    return NextResponse.json({ 
      success: true, 
      activities,
      count: activities.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching thumbnail activities:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch thumbnail activities' 
    }, { status: 500 });
  }
}

// GET statistics endpoint
export async function GET_STATS(request) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const doctorName = searchParams.get('doctorName');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const days = parseInt(searchParams.get('days')) || 30;
    
    let stats = {};
    
    if (userId) {
      // Get user-specific statistics
      stats = await ThumbnailActivity.getActivityStats(userId, startDate, endDate);
    } else if (doctorName) {
      // Get doctor-specific statistics
      stats = await ThumbnailActivity.getDoctorThumbnailSummary(doctorName, days);
    } else {
      // Get general statistics
      const matchQuery = {};
      if (startDate || endDate) {
        matchQuery.timestamp = {};
        if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
        if (endDate) {
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999);
          matchQuery.timestamp.$lte = endDateTime;
        }
      }
      
      stats = await ThumbnailActivity.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            totalDuration: { $sum: '$duration' },
            avgDuration: { $avg: '$duration' },
            totalFileSize: { $sum: '$fileSize' },
            uniqueUsers: { $addToSet: '$userId' },
            uniqueDoctors: { $addToSet: '$doctorName' },
            uniqueThumbnails: { $addToSet: '$thumbnailId' },
            lastActivity: { $max: '$timestamp' }
          }
        },
        {
          $addFields: {
            uniqueUserCount: { $size: '$uniqueUsers' },
            uniqueDoctorCount: { $size: '$uniqueDoctors' },
            uniqueThumbnailCount: { $size: '$uniqueThumbnails' }
          }
        },
        { $sort: { count: -1 } }
      ]);
    }
    
    return NextResponse.json({ 
      success: true, 
      stats,
      count: Array.isArray(stats) ? stats.length : 1
    });
    
  } catch (error) {
    console.error('❌ Error fetching thumbnail activity statistics:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch thumbnail activity statistics' 
    }, { status: 500 });
  }
}