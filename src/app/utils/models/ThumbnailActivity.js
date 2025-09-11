import mongoose from 'mongoose';

const thumbnailActivitySchema = new mongoose.Schema({
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
  thumbnailId: {
    type: String,
    required: true,
    index: true
  },
  doctorName: {
    type: String,
    required: true,
    index: true
  },
  scheduleId: {
    type: String,
    default: null,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'thumbnail_view',
      'thumbnail_create',
      'thumbnail_edit',
      'thumbnail_update',
      'thumbnail_delete',
      'thumbnail_download',
      'thumbnail_approve',
      'thumbnail_reject',
      'thumbnail_upload',
      'thumbnail_preview',
      'thumbnail_share',
      'thumbnail_copy',
      'thumbnail_move',
      'thumbnail_rename',
      'thumbnail_duplicate',
      'thumbnail_restore',
      'thumbnail_archive',
      'thumbnail_publish',
      'thumbnail_unpublish',
      'thumbnail_comment',
      'thumbnail_tag',
      'thumbnail_categorize',
      'thumbnail_search',
      'thumbnail_filter',
      'thumbnail_sort',
      'thumbnail_bulk_action',
      'thumbnail_export',
      'thumbnail_import',
      'thumbnail_backup',
      'thumbnail_restore_backup'
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
  duration: {
    type: Number, // Duration in milliseconds
    default: 0
  },
  language: {
    type: String,
    default: null,
    index: true
  },
  department: {
    type: String,
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'in_progress', 'cancelled'],
    default: 'success'
  },
  notes: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  fileType: {
    type: String,
    default: null
  },
  originalFileName: {
    type: String,
    default: null
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  previousValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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

// Compound indexes for efficient querying
thumbnailActivitySchema.index({ userId: 1, thumbnailId: 1, timestamp: -1 });
thumbnailActivitySchema.index({ thumbnailId: 1, action: 1, timestamp: -1 });
thumbnailActivitySchema.index({ doctorName: 1, timestamp: -1 });
thumbnailActivitySchema.index({ action: 1, timestamp: -1 });
thumbnailActivitySchema.index({ language: 1, timestamp: -1 });
thumbnailActivitySchema.index({ department: 1, timestamp: -1 });

// Virtual for formatted timestamp
thumbnailActivitySchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Virtual for formatted duration
thumbnailActivitySchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return 'N/A';
  const minutes = Math.floor(this.duration / 60000);
  const seconds = Math.floor((this.duration % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
});

// Method to get thumbnail timeline
thumbnailActivitySchema.statics.getThumbnailTimeline = async function(thumbnailId) {
  return await this.find({ thumbnailId })
    .sort({ timestamp: 1 })
    .select('action timestamp details status notes duration')
    .lean();
};

// Method to get user thumbnail summary
thumbnailActivitySchema.statics.getUserThumbnailSummary = async function(userId, days = 30) {
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
        _id: {
          action: '$action',
          doctorName: '$doctorName',
          language: '$language'
        },
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        lastActivity: { $max: '$timestamp' },
        totalFileSize: { $sum: '$fileSize' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Method to get doctor thumbnail summary
thumbnailActivitySchema.statics.getDoctorThumbnailSummary = async function(doctorName, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        doctorName: doctorName,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        uniqueUsers: { $addToSet: '$userId' },
        lastActivity: { $max: '$timestamp' },
        totalFileSize: { $sum: '$fileSize' },
        languages: { $addToSet: '$language' },
        departments: { $addToSet: '$department' }
      }
    },
    {
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' },
        uniqueLanguageCount: { $size: '$languages' },
        uniqueDepartmentCount: { $size: '$departments' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Method to get activity statistics
thumbnailActivitySchema.statics.getActivityStats = async function(userId, startDate, endDate) {
  const matchQuery = { userId };
  if (startDate || endDate) {
    matchQuery.timestamp = {};
    if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      matchQuery.timestamp.$lte = endDateTime;
    }
  }

  return await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        avgDuration: { $avg: '$duration' },
        totalFileSize: { $sum: '$fileSize' },
        successCount: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $addFields: {
        successRate: {
          $multiply: [
            { $divide: ['$successCount', '$count'] },
            100
          ]
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

const ThumbnailActivity = mongoose.models.ThumbnailActivity || mongoose.model('ThumbnailActivity', thumbnailActivitySchema);

export default ThumbnailActivity;
