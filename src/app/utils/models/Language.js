import mongoose from "mongoose";

const languageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

const Language = mongoose.models.Language || mongoose.model("Language", languageSchema);

export default Language;
