import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    languages: { type: String, required: true, trim: true },
    gender: { 
      type: String, 
      required: true,  // Always required for new documents
      enum: ["Male", "Female", "Other"], 
      trim: true
    },
    photos: [{
      name: { type: String, required: true },
      data: { type: String, required: true }, // base64 data
      type: { type: String, required: true },
      size: { type: Number, default: 0 }
    }],
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    specialization: { type: String, trim: true },
    experience: { type: Number, min: 0 },
    education: { type: String, trim: true },
    contact: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true }
    },
    availability: {
      days: [{ type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] }],
      hours: { type: String, trim: true }
    }
  },
  { timestamps: true }
);

// Index for better search performance
doctorSchema.index({ name: 1, department: 1, status: 1 });

// Method to get doctor without sensitive fields
doctorSchema.methods.toSafeObject = function() {
  const doctorObject = this.toObject();
  console.log('🔍 toSafeObject called');
  console.log('🔍 Original gender:', this.gender);
  console.log('🔍 Converted gender:', doctorObject.gender);
  console.log('🔍 All fields in converted object:', Object.keys(doctorObject));
  
  // Ensure gender field is present
  if (!doctorObject.gender && this.gender) {
    console.log('⚠️ Gender missing from converted object, adding it back');
    doctorObject.gender = this.gender;
  }
  
  return doctorObject;
};

const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);

export default Doctor;
