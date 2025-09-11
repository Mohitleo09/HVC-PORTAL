// Utility function to track user activities
export const trackUserActivity = async (activityData) => {
  try {
    const response = await fetch('/api/user-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...activityData,
        timestamp: new Date().toISOString(),
        sessionId: typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') : null
      }),
    });

    if (!response.ok) {
      console.warn('⚠️ Failed to track user activity:', response.status);
    }
  } catch (error) {
    console.warn('⚠️ Error tracking user activity:', error);
  }
};

// Utility function to track schedule activities
export const trackScheduleActivity = async (scheduleData) => {
  try {
    const response = await fetch('/api/schedule-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...scheduleData,
        timestamp: new Date().toISOString(),
        sessionId: typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') : null
      }),
    });

    if (!response.ok) {
      console.warn('⚠️ Failed to track schedule activity:', response.status);
    }
  } catch (error) {
    console.warn('⚠️ Error tracking schedule activity:', error);
  }
};

// Track login activity
export const trackLogin = async (userId, username) => {
  await trackUserActivity({
    userId,
    username,
    action: 'login',
    details: {
      loginTime: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : null
    }
  });
};

// Track logout activity
export const trackLogout = async (userId, username) => {
  await trackUserActivity({
    userId,
    username,
    action: 'logout',
    details: {
      logoutTime: new Date().toISOString(),
      sessionDuration: calculateSessionDuration()
    }
  });
};

// Track page navigation
export const trackPageNavigation = async (userId, username, toPage, fromPage = null) => {
  await trackUserActivity({
    userId,
    username,
    action: 'page_navigation',
    details: {
      toPage,
      fromPage,
      navigationTime: new Date().toISOString()
    }
  });
};

// Track dashboard access
export const trackDashboardAccess = async (userId, username) => {
  await trackUserActivity({
    userId,
    username,
    action: 'dashboard_access',
    details: {
      accessTime: new Date().toISOString()
    }
  });
};

// Track schedule start
export const trackScheduleStart = async (userId, username, scheduleId, doctorName, stepNumber = null, stepName = null) => {
  await trackScheduleActivity({
    userId,
    username,
    scheduleId,
    doctorName,
    action: 'schedule_start',
    details: {
      startTime: new Date().toISOString(),
      stepNumber,
      stepName
    },
    stepNumber,
    stepName,
    status: 'in_progress'
  });
};

// Track schedule completion
export const trackScheduleComplete = async (userId, username, scheduleId, doctorName, duration = 0, stepNumber = null, stepName = null) => {
  await trackScheduleActivity({
    userId,
    username,
    scheduleId,
    doctorName,
    action: 'schedule_complete',
    details: {
      completionTime: new Date().toISOString(),
      totalDuration: duration,
      stepNumber,
      stepName
    },
    duration,
    stepNumber,
    stepName,
    status: 'completed'
  });
};

// Track workflow step completion
export const trackWorkflowStepComplete = async (userId, username, scheduleId, doctorName, stepNumber, stepName, duration = 0) => {
  await trackScheduleActivity({
    userId,
    username,
    scheduleId,
    doctorName,
    action: 'workflow_step_complete',
    details: {
      stepCompletionTime: new Date().toISOString(),
      stepDuration: duration
    },
    stepNumber,
    stepName,
    duration,
    status: 'completed'
  });
};

// Track workflow step edit
export const trackWorkflowStepEdit = async (userId, username, scheduleId, doctorName, stepNumber, stepName, editReason = '') => {
  await trackScheduleActivity({
    userId,
    username,
    scheduleId,
    doctorName,
    action: 'workflow_step_edit',
    details: {
      editTime: new Date().toISOString(),
      editReason
    },
    stepNumber,
    stepName,
    status: 'in_progress',
    notes: editReason
  });
};

// Track thumbnail activities
export const trackThumbnailActivity = async (userId, username, thumbnailId, doctorName, action, details = {}) => {
  console.log('🔍 trackThumbnailActivity called with:', { userId, username, thumbnailId, doctorName, action });
  try {
    const response = await fetch('/api/thumbnail-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        username,
        thumbnailId,
        doctorName,
        action: `thumbnail_${action}`,
        details: {
          ...details,
          activityTime: new Date().toISOString(),
          thumbnailAction: action
        },
        timestamp: new Date().toISOString(),
        sessionId: typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') : null,
        status: 'success',
        notes: `Thumbnail ${action}: ${details.description || ''}`,
        fileSize: details.fileSize || null,
        fileType: details.fileType || null,
        originalFileName: details.fileName || null,
        thumbnailUrl: details.thumbnailUrl || null,
        language: details.language || null,
        department: details.department || null
      }),
    });

    if (!response.ok) {
      console.warn('⚠️ Failed to track thumbnail activity:', response.status);
    } else {
      console.log(`✅ Thumbnail activity tracked: ${username} - ${action} for Dr. ${doctorName}`);
    }
  } catch (error) {
    console.warn('⚠️ Error tracking thumbnail activity:', error);
  }
};


// Track thumbnail upload
export const trackThumbnailUpload = async (userId, username, thumbnailId, doctorName, thumbnailData = {}) => {
  await trackThumbnailActivity(userId, username, thumbnailId, doctorName, 'upload', {
    description: 'Thumbnail uploaded',
    fileName: thumbnailData.fileName,
    fileSize: thumbnailData.fileSize,
    fileType: thumbnailData.fileType,
    language: thumbnailData.language,
    department: thumbnailData.department,
    uploadTime: new Date().toISOString()
  });
};

// Track thumbnail delete
export const trackThumbnailDelete = async (userId, username, thumbnailId, doctorName, thumbnailData = {}) => {
  await trackThumbnailActivity(userId, username, thumbnailId, doctorName, 'delete', {
    description: 'Thumbnail deleted',
    fileName: thumbnailData.fileName,
    deleteReason: thumbnailData.reason || 'User initiated deletion',
    language: thumbnailData.language,
    department: thumbnailData.department,
    deleteTime: new Date().toISOString()
  });
};

// Track thumbnail view
export const trackThumbnailView = async (userId, username, thumbnailId, doctorName, thumbnailData = {}) => {
  await trackThumbnailActivity(userId, username, thumbnailId, doctorName, 'view', {
    description: 'Thumbnail viewed',
    fileName: thumbnailData.fileName,
    language: thumbnailData.language,
    department: thumbnailData.department,
    viewTime: new Date().toISOString(),
    viewDuration: thumbnailData.duration || 0
  });
};

// Track thumbnail edit
export const trackThumbnailEdit = async (userId, username, thumbnailId, doctorName, thumbnailData = {}) => {
  await trackThumbnailActivity(userId, username, thumbnailId, doctorName, 'edit', {
    description: 'Thumbnail edited',
    fileName: thumbnailData.fileName,
    editType: thumbnailData.editType || 'modification',
    editDetails: thumbnailData.editDetails || '',
    language: thumbnailData.language,
    department: thumbnailData.department,
    editTime: new Date().toISOString()
  });
};

// Track thumbnail create
export const trackThumbnailCreate = async (userId, username, thumbnailId, doctorName, thumbnailData = {}) => {
  await trackThumbnailActivity(userId, username, thumbnailId, doctorName, 'create', {
    description: 'Thumbnail created',
    fileName: thumbnailData.fileName,
    fileSize: thumbnailData.fileSize,
    fileType: thumbnailData.fileType,
    language: thumbnailData.language,
    department: thumbnailData.department,
    createTime: new Date().toISOString()
  });
};

// Track thumbnail update
export const trackThumbnailUpdate = async (userId, username, thumbnailId, doctorName, thumbnailData = {}) => {
  await trackThumbnailActivity(userId, username, thumbnailId, doctorName, 'update', {
    description: 'Thumbnail updated',
    fileName: thumbnailData.fileName,
    fileSize: thumbnailData.fileSize,
    fileType: thumbnailData.fileType,
    language: thumbnailData.language,
    department: thumbnailData.department,
    updateTime: new Date().toISOString(),
    previousValues: thumbnailData.previousValues || {},
    newValues: thumbnailData.newValues || {}
  });
};

// Track thumbnail approval/rejection
export const trackThumbnailApproval = async (userId, username, thumbnailId, doctorName, isApproved, feedback = '') => {
  await trackThumbnailActivity(userId, username, thumbnailId, doctorName, isApproved ? 'approve' : 'reject', {
    description: `Thumbnail ${isApproved ? 'approved' : 'rejected'}`,
    feedback: feedback,
    decisionTime: new Date().toISOString(),
    decisionBy: username
  });
};

// Calculate session duration
const calculateSessionDuration = () => {
  const sessionStart = sessionStorage.getItem('sessionStart');
  if (!sessionStart) return 0;
  
  const startTime = new Date(sessionStart);
  const endTime = new Date();
  return endTime.getTime() - startTime.getTime();
};

// Initialize session tracking
export const initializeSessionTracking = (userId, username) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('sessionId', `${userId}_${Date.now()}`);
    sessionStorage.setItem('sessionStart', new Date().toISOString());
    sessionStorage.setItem('currentUser', JSON.stringify({ userId, username }));
  }
};

// Get current session info
export const getCurrentSessionInfo = () => {
  if (typeof window !== 'undefined') {
    return {
      sessionId: sessionStorage.getItem('sessionId'),
      sessionStart: sessionStorage.getItem('sessionStart'),
      currentUser: JSON.parse(sessionStorage.getItem('currentUser') || '{}')
    };
  }
  return {};
};
