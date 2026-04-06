import mongoose from "mongoose";

const compareRowSchema = new mongoose.Schema(
  {
    feature: String,
    free: String,
    premium: String
  },
  { _id: false }
);

const pricingSchema = new mongoose.Schema(
  {
    monthly: Number,
    yearly: Number,
    yearlySavingsPercent: Number,
    compareRows: [compareRowSchema]
  },
  { timestamps: true, collection: "pricing" }
);

export const PricingModel = mongoose.models.Pricing || mongoose.model("Pricing", pricingSchema);
