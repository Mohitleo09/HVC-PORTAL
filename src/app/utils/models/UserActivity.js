import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'page_navigation',
      'schedule_start',
      'schedule_complete',
      'schedule_pause',
      'workflow_step_complete',
      'workflow_step_edit',
      'dashboard_access',
      'thumbnail_access',
      'schedule_access',
      'profile_update',
      'password_change'
    ],
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  sessionId: {
    type: String,
    default: null,
    index: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ action: 1, timestamp: -1 });
userActivitySchema.index({ username: 1, timestamp: -1 });

// Virtual for formatted timestamp
userActivitySchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Method to get activity summary
userActivitySchema.statics.getActivitySummary = async function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        userId: userId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Method to get recent activities
userActivitySchema.statics.getRecentActivities = async function(userId, limit = 10) {
  return await this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('action details timestamp')
    .lean();
};

const UserActivity = mongoose.models.UserActivity || mongoose.model('UserActivity', userActivitySchema);

export default UserActivity;
