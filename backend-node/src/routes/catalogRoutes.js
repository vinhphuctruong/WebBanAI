import { Router } from "express";
import { GemModel } from "../models/Gem.js";
import { AiToolModel } from "../models/AiTool.js";
import { ReviewModel } from "../models/Review.js";
import { PricingModel } from "../models/Pricing.js";

const router = Router();

router.get("/gems", async (_req, res) => {
  const gems = await GemModel.find().sort({ createdAt: -1 }).lean();
  return res.json(gems);
});

router.get("/gems/:slug", async (req, res) => {
  const gem = await GemModel.findOne({ slug: req.params.slug }).lean();
  if (!gem) {
    return res.status(404).json({ message: "Khong tim thay gem" });
  }
  return res.json(gem);
});

router.get("/ai-tools", async (_req, res) => {
  const tools = await AiToolModel.find().sort({ createdAt: -1 }).lean();
  return res.json(tools);
});

router.get("/ai-tools/:slug", async (req, res) => {
  const tool = await AiToolModel.findOne({ slug: req.params.slug }).lean();
  if (!tool) {
    return res.status(404).json({ message: "Khong tim thay ai tool" });
  }
  return res.json(tool);
});

router.get("/reviews", async (_req, res) => {
  const reviews = await ReviewModel.find().sort({ createdAt: -1 }).lean();
  return res.json(reviews);
});

router.get("/pricing", async (_req, res) => {
  const pricing = await PricingModel.findOne().lean();
  if (!pricing) {
    return res.status(404).json({ message: "Chua co du lieu bang gia" });
  }
  return res.json(pricing);
});

export default router;
