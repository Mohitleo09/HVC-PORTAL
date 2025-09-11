import mongoose from 'mongoose';

const scheduleActivitySchema = new mongoose.Schema({
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
  scheduleId: {
    type: String,
    required: true,
    index: true
  },
  doctorName: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'schedule_view',
      'schedule_start',
      'schedule_pause',
      'schedule_resume',
      'schedule_complete',
      'schedule_cancel',
      'schedule_reschedule',
      'schedule_edit',
      'schedule_update',
      'schedule_delete',
      'schedule_duplicate',
      'schedule_archive',
      'schedule_restore',
      'schedule_export',
      'schedule_import',
      'schedule_share',
      'schedule_comment',
      'schedule_tag',
      'schedule_search',
      'schedule_filter',
      'schedule_sort',
      'schedule_bulk_action',
      'schedule_backup',
      'schedule_restore_backup',
      'workflow_view',
      'workflow_start',
      'workflow_pause',
      'workflow_resume',
      'workflow_complete',
      'workflow_cancel',
      'workflow_step_view',
      'workflow_step_start',
      'workflow_step_complete',
      'workflow_step_edit',
      'workflow_step_fail',
      'workflow_step_skip',
      'workflow_step_redo',
      'workflow_step_undo',
      'workflow_step_comment',
      'workflow_step_approve',
      'workflow_step_reject',
      'workflow_step_assign',
      'workflow_step_delegate',
      'workflow_step_review',
      'workflow_step_feedback',
      'workflow_step_download',
      'workflow_step_upload',
      'workflow_step_preview',
      'workflow_step_validate',
      'workflow_step_test',
      'workflow_step_deploy',
      'workflow_step_publish',
      'workflow_step_unpublish',
      'workflow_step_archive',
      'workflow_step_restore',
      'workflow_step_export',
      'workflow_step_import',
      'workflow_step_duplicate',
      'workflow_step_move',
      'workflow_step_copy',
      'workflow_step_rename',
      'workflow_step_delete',
      'workflow_step_restore_deleted',
      'workflow_step_bulk_action',
      'workflow_step_search',
      'workflow_step_filter',
      'workflow_step_sort',
      'workflow_step_timeline_view',
      'workflow_step_progress_update',
      'workflow_step_status_change',
      'workflow_step_priority_change',
      'workflow_step_due_date_update',
      'workflow_step_assignee_change',
      'workflow_step_dependency_add',
      'workflow_step_dependency_remove',
      'workflow_step_milestone_add',
      'workflow_step_milestone_remove',
      'workflow_step_notification_send',
      'workflow_step_reminder_set',
      'workflow_step_reminder_cancel',
      'workflow_step_time_tracking_start',
      'workflow_step_time_tracking_stop',
      'workflow_step_time_tracking_pause',
      'workflow_step_time_tracking_resume',
      'workflow_step_time_tracking_update',
      'workflow_step_time_tracking_delete',
      'workflow_step_attachment_add',
      'workflow_step_attachment_remove',
      'workflow_step_attachment_download',
      'workflow_step_attachment_upload',
      'workflow_step_attachment_preview',
      'workflow_step_attachment_rename',
      'workflow_step_attachment_move',
      'workflow_step_attachment_copy',
      'workflow_step_attachment_share',
      'workflow_step_attachment_archive',
      'workflow_step_attachment_restore',
      'workflow_step_attachment_delete',
      'workflow_step_attachment_restore_deleted',
      'workflow_step_attachment_bulk_action',
      'workflow_step_attachment_search',
      'workflow_step_attachment_filter',
      'workflow_step_attachment_sort',
      'workflow_step_collaboration_invite',
      'workflow_step_collaboration_remove',
      'workflow_step_collaboration_update_role',
      'workflow_step_collaboration_view',
      'workflow_step_collaboration_comment',
      'workflow_step_collaboration_reply',
      'workflow_step_collaboration_mention',
      'workflow_step_collaboration_notification',
      'workflow_step_collaboration_approval',
      'workflow_step_collaboration_rejection',
      'workflow_step_collaboration_suggestion',
      'workflow_step_collaboration_feedback',
      'workflow_step_collaboration_rating',
      'workflow_step_collaboration_review',
      'workflow_step_collaboration_edit',
      'workflow_step_collaboration_delete',
      'workflow_step_collaboration_restore',
      'workflow_step_collaboration_archive',
      'workflow_step_collaboration_export',
      'workflow_step_collaboration_import',
      'workflow_step_collaboration_duplicate',
      'workflow_step_collaboration_move',
      'workflow_step_collaboration_copy',
      'workflow_step_collaboration_rename',
      'workflow_step_collaboration_share',
      'workflow_step_collaboration_permission_update',
      'workflow_step_collaboration_access_grant',
      'workflow_step_collaboration_access_revoke',
      'workflow_step_collaboration_access_update',
      'workflow_step_collaboration_access_view',
      'workflow_step_collaboration_access_audit',
      'workflow_step_collaboration_access_log',
      'workflow_step_collaboration_access_report',
      'workflow_step_collaboration_access_export',
      'workflow_step_collaboration_access_import',
      'workflow_step_collaboration_access_backup',
      'workflow_step_collaboration_access_restore',
      'workflow_step_collaboration_access_archive',
      'workflow_step_collaboration_access_delete',
      'workflow_step_collaboration_access_restore_deleted',
      'workflow_step_collaboration_access_bulk_action',
      'workflow_step_collaboration_access_search',
      'workflow_step_collaboration_access_filter',
      'workflow_step_collaboration_access_sort',
      'workflow_step_collaboration_access_timeline_view',
      'workflow_step_collaboration_access_progress_update',
      'workflow_step_collaboration_access_status_change',
      'workflow_step_collaboration_access_priority_change',
      'workflow_step_collaboration_access_due_date_update',
      'workflow_step_collaboration_access_assignee_change',
      'workflow_step_collaboration_access_dependency_add',
      'workflow_step_collaboration_access_dependency_remove',
      'workflow_step_collaboration_access_milestone_add',
      'workflow_step_collaboration_access_milestone_remove',
      'workflow_step_collaboration_access_notification_send',
      'workflow_step_collaboration_access_reminder_set',
      'workflow_step_collaboration_access_reminder_cancel',
      'workflow_step_collaboration_access_time_tracking_start',
      'workflow_step_collaboration_access_time_tracking_stop',
      'workflow_step_collaboration_access_time_tracking_pause',
      'workflow_step_collaboration_access_time_tracking_resume',
      'workflow_step_collaboration_access_time_tracking_update',
      'workflow_step_collaboration_access_time_tracking_delete',
      'workflow_step_collaboration_access_attachment_add',
      'workflow_step_collaboration_access_attachment_remove',
      'workflow_step_collaboration_access_attachment_download',
      'workflow_step_collaboration_access_attachment_upload',
      'workflow_step_collaboration_access_attachment_preview',
      'workflow_step_collaboration_access_attachment_rename',
      'workflow_step_collaboration_access_attachment_move',
      'workflow_step_collaboration_access_attachment_copy',
      'workflow_step_collaboration_access_attachment_share',
      'workflow_step_collaboration_access_attachment_archive',
      'workflow_step_collaboration_access_attachment_restore',
      'workflow_step_collaboration_access_attachment_delete',
      'workflow_step_collaboration_access_attachment_restore_deleted',
      'workflow_step_collaboration_access_attachment_bulk_action',
      'workflow_step_collaboration_access_attachment_search',
      'workflow_step_collaboration_access_attachment_filter',
      'workflow_step_collaboration_access_attachment_sort',
      'workflow_step_collaboration_access_attachment_timeline_view',
      'workflow_step_collaboration_access_attachment_progress_update',
      'workflow_step_collaboration_access_attachment_status_change',
      'workflow_step_collaboration_access_attachment_priority_change',
      'workflow_step_collaboration_access_attachment_due_date_update',
      'workflow_step_collaboration_access_attachment_assignee_change',
      'workflow_step_collaboration_access_attachment_dependency_add',
      'workflow_step_collaboration_access_attachment_dependency_remove',
      'workflow_step_collaboration_access_attachment_milestone_add',
      'workflow_step_collaboration_access_attachment_milestone_remove',
      'workflow_step_collaboration_access_attachment_notification_send',
      'workflow_step_collaboration_access_attachment_reminder_set',
      'workflow_step_collaboration_access_attachment_reminder_cancel',
      'workflow_step_collaboration_access_attachment_time_tracking_start',
      'workflow_step_collaboration_access_attachment_time_tracking_stop',
      'workflow_step_collaboration_access_attachment_time_tracking_pause',
      'workflow_step_collaboration_access_attachment_time_tracking_resume',
      'workflow_step_collaboration_access_attachment_time_tracking_update',
      'workflow_step_collaboration_access_attachment_time_tracking_delete'
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
  stepNumber: {
    type: Number,
    default: null
  },
  stepName: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'failed', 'paused'],
    default: 'in_progress'
  },
  notes: {
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
  },
  workflowId: {
    type: String,
    default: null,
    index: true
  },
  stepDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  attachments: [{
    type: mongoose.Schema.Types.Mixed,
    default: []
  }],
  collaborators: [{
    type: mongoose.Schema.Types.Mixed,
    default: []
  }],
  comments: [{
    type: mongoose.Schema.Types.Mixed,
    default: []
  }],
  tags: [{
    type: String,
    default: []
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    default: null
  },
  estimatedDuration: {
    type: Number,
    default: null
  },
  actualDuration: {
    type: Number,
    default: null
  },
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  milestones: [{
    type: mongoose.Schema.Types.Mixed,
    default: []
  }],
  dependencies: [{
    type: mongoose.Schema.Types.Mixed,
    default: []
  }],
  notifications: [{
    type: mongoose.Schema.Types.Mixed,
    default: []
  }],
  reminders: [{
    type: mongoose.Schema.Types.Mixed,
    default: []
  }],
  timeTracking: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  permissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  accessLog: [{
    type: mongoose.Schema.Types.Mixed,
    default: []
  }],
  auditTrail: [{
    type: mongoose.Schema.Types.Mixed,
    default: []
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
scheduleActivitySchema.index({ userId: 1, scheduleId: 1, timestamp: -1 });
scheduleActivitySchema.index({ scheduleId: 1, action: 1, timestamp: -1 });
scheduleActivitySchema.index({ doctorName: 1, timestamp: -1 });
scheduleActivitySchema.index({ action: 1, timestamp: -1 });

// Virtual for formatted timestamp
scheduleActivitySchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Virtual for formatted duration
scheduleActivitySchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return 'N/A';
  const minutes = Math.floor(this.duration / 60000);
  const seconds = Math.floor((this.duration % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
});

// Method to get schedule timeline
scheduleActivitySchema.statics.getScheduleTimeline = async function(scheduleId) {
  return await this.find({ scheduleId })
    .sort({ timestamp: 1 })
    .select('action timestamp details stepNumber stepName status notes')
    .lean();
};

// Method to get user schedule summary
scheduleActivitySchema.statics.getUserScheduleSummary = async function(userId, days = 30) {
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
          doctorName: '$doctorName'
        },
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Method to get doctor schedule summary
scheduleActivitySchema.statics.getDoctorScheduleSummary = async function(doctorName, days = 30) {
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
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

const ScheduleActivity = mongoose.models.ScheduleActivity || mongoose.model('ScheduleActivity', scheduleActivitySchema);

export default ScheduleActivity;
