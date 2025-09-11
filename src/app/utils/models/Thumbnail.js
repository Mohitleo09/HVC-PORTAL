import mongoose from 'mongoose';

const thumbnailSchema = new mongoose.Schema({
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
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  doctorName: {
    type: String,
    required: true,
    index: true
  },
  language: {
    type: String,
    enum: ['english', 'telugu', 'hindi'],
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Create index for better query performance
thumbnailSchema.index({ userId: 1, timestamp: -1 });
thumbnailSchema.index({ username: 1, timestamp: -1 });
thumbnailSchema.index({ doctorName: 1, timestamp: -1 });
thumbnailSchema.index({ department: 1, doctor: 1 });
thumbnailSchema.index({ status: 1 });

const Thumbnail = mongoose.models.Thumbnail || mongoose.model('Thumbnail', thumbnailSchema);

export default Thumbnail;
