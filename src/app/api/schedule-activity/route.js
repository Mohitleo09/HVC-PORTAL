import { NextResponse } from 'next/server';
import DBConnection from '../../utils/config/db';
import ScheduleActivity from '../../utils/models/ScheduleActivity';

export async function POST(request) {
  try {
    await DBConnection();
    
    const body = await request.json();
    const { 
      userId, 
      username, 
      scheduleId, 
      doctorName, 
      action, 
      details, 
      timestamp,
      sessionId,
      duration,
      stepNumber,
      stepName,
      status,
      notes,
      previousValues,
      newValues,
      ipAddress,
      userAgent,
      workflowId,
      stepDetails,
      attachments,
      collaborators,
      comments,
      tags,
      priority,
      dueDate,
      estimatedDuration,
      actualDuration,
      progressPercentage,
      milestones,
      dependencies,
      notifications,
      reminders,
      timeTracking,
      permissions,
      accessLog,
      auditTrail,
      metadata
    } = body;
    
    if (!userId || !username || !scheduleId || !doctorName || !action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: userId, username, scheduleId, doctorName, action' 
      }, { status: 400 });
    }
    
    const scheduleActivity = new ScheduleActivity({
      userId,
      username,
      scheduleId,
      doctorName,
      action,
      details: details || {},
      timestamp: timestamp || new Date(),
      sessionId: sessionId || null,
      duration: duration || 0,
      stepNumber: stepNumber || null,
      stepName: stepName || null,
      status: status || 'in_progress',
      notes: notes || null,
      previousValues: previousValues || {},
      newValues: newValues || {},
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      workflowId: workflowId || null,
      stepDetails: stepDetails || {},
      attachments: attachments || [],
      collaborators: collaborators || [],
      comments: comments || [],
      tags: tags || [],
      priority: priority || 'medium',
      dueDate: dueDate || null,
      estimatedDuration: estimatedDuration || null,
      actualDuration: actualDuration || null,
      progressPercentage: progressPercentage || 0,
      milestones: milestones || [],
      dependencies: dependencies || [],
      notifications: notifications || [],
      reminders: reminders || [],
      timeTracking: timeTracking || {},
      permissions: permissions || {},
      accessLog: accessLog || [],
      auditTrail: auditTrail || [],
      metadata: metadata || {}
    });
    
    await scheduleActivity.save();
    
    console.log(`✅ Schedule activity logged: ${username} - ${action} for Dr. ${doctorName}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Schedule activity logged successfully',
      scheduleActivity 
    });
    
  } catch (error) {
    console.error('❌ Error logging schedule activity:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to log schedule activity' 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await DBConnection();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');
    const scheduleId = searchParams.get('scheduleId');
    const doctorName = searchParams.get('doctorName');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit')) || 100;
    
    let query = {};
    if (userId) query.userId = userId;
    if (username) query.username = username;
    if (scheduleId) query.scheduleId = scheduleId;
    if (doctorName) query.doctorName = doctorName;
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
    
    const activities = await ScheduleActivity.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    
    return NextResponse.json({ 
      success: true, 
      activities,
      count: activities.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching schedule activities:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch schedule activities' 
    }, { status: 500 });
  }
}
