import mongoose from "mongoose";

const trendSchema = new mongoose.Schema(
  {
    topic: { 
      type: String, 
      required: true, 
      trim: true 
    },
    views: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    description: { 
      type: String, 
      trim: true, 
      default: "" 
    },
    youtubeLink: {
      type: String,
      trim: true,
      default: ""
    },
    status: { 
      type: String, 
      enum: ["Active", "Inactive"], 
      default: "Active" 
    }
  },
  { timestamps: true }
);

const Trend = mongoose.models.Trend || mongoose.model("Trend", trendSchema);

export default Trend;
