import mongoose from "mongoose";

const tutorialStepSchema = new mongoose.Schema(
  {
    order: Number,
    title: String,
    content: String
  },
  { _id: false }
);

const gemSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    categoryId: String,
    price: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 },
    description: String,
    thumbnail: String,
    gallery: [String],
    productType: String,
    chatbotLink: String,
    workflowLink: String,
    videoUrl: String,
    tutorialVideo: String,
    tutorialSteps: [tutorialStepSchema],
    linkedAiToolId: String,
    promptInstruction: { type: String, default: "" },
    promptContent: { type: String, default: "" }
  },
  { timestamps: true, collection: "gems" }
);

export const GemModel = mongoose.models.Gem || mongoose.model("Gem", gemSchema);
