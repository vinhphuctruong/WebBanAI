import mongoose from "mongoose";

const aiToolSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: String,
    description: String,
    features: [String],
    accountPrice: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 },
    availableCount: { type: Number, default: 0 },
    websiteUrl: String,
    tutorialUrl: String,
    logo: String,
    accountInfo: String,
    linkedGemIds: [String]
  },
  { timestamps: true, collection: "ai_tools" }
);

export const AiToolModel = mongoose.models.AiTool || mongoose.model("AiTool", aiToolSchema);
