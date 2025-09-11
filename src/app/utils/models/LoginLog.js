import mongoose from "mongoose";

const loginLogSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    action: { type: String, enum: ["login", "logout"], required: true },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String, default: "Unknown" },
    userAgent: { type: String, default: "Unknown" },
    sessionId: { type: String }, // To track session duration
    department: { type: String },
    role: { type: String }
  },
  { timestamps: true }
);

// Index for efficient queries
loginLogSchema.index({ username: 1, timestamp: -1 });
loginLogSchema.index({ action: 1, timestamp: -1 });

const LoginLog = mongoose.models.LoginLog || mongoose.model("LoginLog", loginLogSchema);

export default LoginLog;
