import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  getReferralSummary,
  regenerateReferralCode,
  createWithdrawal
} from "../services/userService.js";

const router = Router();
router.use(requireAuth);

router.get("/me", async (req, res) => {
  const summary = await getReferralSummary(req.user.sub);
  if (!summary) {
    return res.status(404).json({ message: "Khong tim thay thong tin referral" });
  }
  return res.json(summary);
});

router.post("/code/generate", async (req, res) => {
  const code = await regenerateReferralCode(req.user.sub);
  return res.json({ code });
});

router.post("/withdraw", async (req, res) => {
  try {
    const amount = Number(req.body?.amount || 0);
    const summary = await createWithdrawal(req.user.sub, amount);
    return res.json(summary);
  } catch (err) {
    return res.status(400).json({ message: err.message || "Khong the rut tien" });
  }
});

export default router;
