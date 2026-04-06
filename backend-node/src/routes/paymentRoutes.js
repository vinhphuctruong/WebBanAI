import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { createPayment, getPaymentById, confirmPayment } from "../services/paymentService.js";

const router = Router();
router.use(requireAuth);

router.post("/create", async (req, res) => {
  try {
    const { itemType, slug, quantity } = req.body || {};
    if (!itemType || !slug) {
      return res.status(400).json({ message: "Thieu thong tin thanh toan" });
    }

    const data = await createPayment({
      userId: req.user.sub,
      itemType: String(itemType),
      slug: String(slug),
      quantity: Number(quantity || 1)
    });
    return res.json(data);
  } catch (err) {
    return res.status(400).json({ message: err.message || "Khong tao duoc payment" });
  }
});

router.get("/:paymentId", async (req, res) => {
  const payment = await getPaymentById(req.params.paymentId, req.user.sub, ["admin", "staff", "sale"].includes(req.user.role));
  if (!payment) {
    return res.status(404).json({ message: "Khong tim thay payment" });
  }
  return res.json(payment);
});

router.post("/:paymentId/confirm", async (req, res) => {
  try {
    const data = await confirmPayment(req.params.paymentId, req.user.role, req.user.sub);
    return res.json(data);
  } catch (err) {
    const status = /khong tim thay/i.test(err.message) ? 404 : 400;
    return res.status(status).json({ message: err.message || "Confirm that bai" });
  }
});

export default router;
