import mongoose from 'mongoose';

const shortSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  doctorName: {
    type: String,
    required: true
  },
  departmentName: {
    type: String,
    required: true
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule'
  },
  completedAt: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds (shorts are typically under 60 seconds)
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
shortSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Short = mongoose.models.Short || mongoose.model('Short', shortSchema);

export default Short;
