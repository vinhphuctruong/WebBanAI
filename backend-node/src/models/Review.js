import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    name: String,
    category: String,
    description: String
  },
  { timestamps: true, collection: "reviews" }
);

export const ReviewModel = mongoose.models.Review || mongoose.model("Review", reviewSchema);
