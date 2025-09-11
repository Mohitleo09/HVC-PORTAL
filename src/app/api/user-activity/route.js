import { NextResponse } from 'next/server';
import DBConnection from '../../utils/config/db';
import UserActivity from '../../utils/models/UserActivity';

export async function POST(request) {
  try {
    await DBConnection();
    
    const body = await request.json();
    const { userId, username, action, details, timestamp, sessionId } = body;
    
    if (!userId || !username || !action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: userId, username, action' 
      }, { status: 400 });
    }
    
    const activity = new UserActivity({
      userId,
      username,
      action,
      details: details || {},
      timestamp: timestamp || new Date(),
      sessionId: sessionId || null
    });
    
    await activity.save();
    
    console.log(`✅ User activity logged: ${username} - ${action}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Activity logged successfully',
      activity 
    });
    
  } catch (error) {
    console.error('❌ Error logging user activity:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to log activity' 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit')) || 100;
    
    let query = {};
    if (userId) query.userId = userId;
    if (username) query.username = username;
    if (action) query.action = action;
    
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
    
    const activities = await UserActivity.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    
    return NextResponse.json({ 
      success: true, 
      activities,
      count: activities.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching user activities:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch activities' 
    }, { status: 500 });
  }
}
