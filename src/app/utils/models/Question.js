import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    languages: [{ type: String, required: true }],
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

const Question = mongoose.models.Question || mongoose.model("Question", questionSchema);

export default Question;
