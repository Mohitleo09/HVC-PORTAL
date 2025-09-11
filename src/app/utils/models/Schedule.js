import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    department: { type: String, required: true, trim: true },
    doctor: { type: String, required: true, trim: true },
    languages: [{ type: String, required: true }],
    question: [{ type: String, required: true }],
    date: { type: String, required: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

const Schedule = mongoose.models.Schedule || mongoose.model("Schedule", scheduleSchema);

export default Schedule;
