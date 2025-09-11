import { NextResponse } from 'next/server';
import DBConnection from '@/app/utils/config/db';
import LoginLog from '@/app/utils/models/LoginLog';
import User from '@/app/utils/models/User';

// GET: Retrieve login/logout logs with real-time user session data
export async function GET() {
  try {
    await DBConnection();
    
    // Get all login logs
    const allLogs = await LoginLog.find({})
      .sort({ timestamp: -1 })
      .limit(1000); // Limit to last 1000 logs for performance
    
    // Get current active sessions (users who logged in but haven't logged out)
    const activeSessions = await LoginLog.aggregate([
      {
        $group: {
          _id: "$username",
          lastAction: { $last: "$action" },
          lastTimestamp: { $last: "$timestamp" },
          totalLogins: { $sum: { $cond: [{ $eq: ["$action", "login"] }, 1, 0] } },
          totalLogouts: { $sum: { $cond: [{ $eq: ["$action", "logout"] }, 1, 0] } },
          email: { $first: "$email" },
          department: { $first: "$department" },
          role: { $first: "$role" }
        }
      },
      {
        $match: {
          lastAction: "login" // Only users whose last action was login
        }
      }
    ]);

    // Get detailed session information for each user
    const userSessions = await Promise.all(
      activeSessions.map(async (session) => {
        const userLogs = await LoginLog.find({ username: session._id })
          .sort({ timestamp: -1 })
          .limit(50); // Last 50 actions per user
        
        // Calculate current session duration if user is still logged in
        let currentSessionDuration = null;
        if (session.lastAction === "login") {
          const now = new Date();
          const loginTime = new Date(session.lastTimestamp);
          currentSessionDuration = Math.round((now - loginTime) / (1000 * 60)); // in minutes
        }

        // Get last logout time
        const lastLogout = userLogs.find(log => log.action === "logout");
        
        return {
          username: session._id,
          email: session.email,
          department: session.department,
          role: session.role,
          isCurrentlyLoggedIn: session.lastAction === "login",
          lastLogin: session.lastTimestamp,
          lastLogout: lastLogout ? lastLogout.timestamp : null,
          currentSessionDuration,
          totalLogins: session.totalLogins,
          totalLogouts: session.totalLogouts,
          recentActivity: userLogs.slice(0, 10) // Last 10 activities
        };
      })
    );

    // Get overall statistics
    const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });
    const currentlyLoggedIn = userSessions.filter(s => s.isCurrentlyLoggedIn).length;
    
    return NextResponse.json({
      success: true,
      logs: allLogs,
      userSessions,
      statistics: {
        totalUsers,
        currentlyLoggedIn,
        totalLogs: allLogs.length,
        activeSessions: userSessions.length
      },
      message: 'Login logs and user sessions retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching login logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch login logs' },
      { status: 500 }
    );
  }
}

// POST: Log a new login/logout event
export async function POST(request) {
  try {
    const { username, email, action, ipAddress, userAgent, sessionId, department, role } = await request.json();

    if (!username || !email || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['login', 'logout'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "login" or "logout"' },
        { status: 400 }
      );
    }

    await DBConnection();
    
    // Create new login log
    const newLog = new LoginLog({
      username,
      email,
      action,
      ipAddress: ipAddress || 'Unknown',
      userAgent: userAgent || 'Unknown',
      sessionId: sessionId || `session_${Date.now()}`,
      department,
      role
    });

    await newLog.save();

    // If this is a logout, calculate session duration
    let sessionDuration = null;
    if (action === "logout" && sessionId) {
      const loginLog = await LoginLog.findOne({ 
        username, 
        sessionId, 
        action: "login" 
      }).sort({ timestamp: -1 });
      
      if (loginLog) {
        sessionDuration = Math.round((new Date() - new Date(loginLog.timestamp)) / (1000 * 60));
      }
    }

    return NextResponse.json({
      success: true,
      log: newLog,
      sessionDuration,
      message: `${action} logged successfully`
    });

  } catch (error) {
    console.error('Error logging login/logout event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log event' },
      { status: 500 }
    );
  }
}

// GET: Get user-specific login statistics
export async function PUT(request) {
  try {
    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    await DBConnection();
    
    // Get user's login/logout history
    const userLogs = await LoginLog.find({ username })
      .sort({ timestamp: -1 })
      .limit(100);
    
    // Calculate statistics
    const totalLogins = userLogs.filter(log => log.action === "login").length;
    const totalLogouts = userLogs.filter(log => log.action === "logout").length;
    
    // Get current session info
    const lastLogin = userLogs.find(log => log.action === "login");
    const lastLogout = userLogs.find(log => log.action === "logout");
    
    let isCurrentlyLoggedIn = false;
    let currentSessionDuration = null;
    
    if (lastLogin && (!lastLogout || lastLogin.timestamp > lastLogout.timestamp)) {
      isCurrentlyLoggedIn = true;
      currentSessionDuration = Math.round((new Date() - new Date(lastLogin.timestamp)) / (1000 * 60));
    }
    
    return NextResponse.json({
      success: true,
      userStats: {
        username,
        totalLogins,
        totalLogouts,
        isCurrentlyLoggedIn,
        lastLogin: lastLogin ? lastLogin.timestamp : null,
        lastLogout: lastLogout ? lastLogout.timestamp : null,
        currentSessionDuration,
        recentActivity: userLogs.slice(0, 20)
      }
    });

  } catch (error) {
    console.error('Error getting user login stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user stats' },
      { status: 500 }
    );
  }
}
