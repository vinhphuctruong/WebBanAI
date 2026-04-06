import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { createPayment, getPaymentById, confirmPayment } from "../services/paymentService.js";
import { query } from "../config/postgres.js";

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

router.post("/check-existing", async (req, res) => {
  try {
    const { itemType, slug } = req.body || {};
    if (!itemType || !slug) return res.json({ exists: false });
    const normalizedType = itemType === "ai" ? "ai_tool" : itemType;
    const result = await query(
      `SELECT p.id as payment_id, p.status 
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE p.user_id = $1 AND o.item_type = $2 AND o.item_slug = $3
       ORDER BY p.created_at DESC LIMIT 1`,
      [req.user.sub, normalizedType, slug]
    );
    if (result.rows.length > 0) {
      return res.json({ exists: true, paymentId: result.rows[0].payment_id, status: result.rows[0].status });
    }
    return res.json({ exists: false });
  } catch (err) {
    return res.json({ exists: false });
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
