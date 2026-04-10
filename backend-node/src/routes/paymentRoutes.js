import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { createPayment, getPaymentById, confirmPayment, autoConfirmPayment } from "../services/paymentService.js";
import { createVnpayPaymentUrl, verifyVnpaySignature } from "../services/vnpayGateway.js";
import { createMomoPaymentUrl, verifyMomoSignature } from "../services/momoGateway.js";
import { query } from "../config/postgres.js";
import { env } from "../config/env.js";

const router = Router();

// ═══════════════════════════════════════════════════════════════
//  PUBLIC callback routes (NO auth) — must be BEFORE /:paymentId
// ═══════════════════════════════════════════════════════════════

// VNPay redirects user here after payment → verify → redirect to frontend
router.get("/vnpay/return", async (req, res) => {
  try {
    const vnpResult = verifyVnpaySignature(req.query);
    console.info("[VNPay Return]", JSON.stringify(vnpResult));

    if (vnpResult.isValid && vnpResult.responseCode === "00") {
      await autoConfirmPayment(vnpResult.paymentId, vnpResult.transactionNo);
    }

    const params = new URLSearchParams({
      provider: "vnpay",
      paymentId: vnpResult.paymentId,
      status: vnpResult.isValid && vnpResult.responseCode === "00" ? "success" : "failed",
      code: vnpResult.responseCode,
    });
    return res.redirect(`${env.appBaseUrl}/pay/result?${params.toString()}`);
  } catch (err) {
    console.error("[VNPay Return] Error:", err);
    return res.redirect(`${env.appBaseUrl}/pay/result?provider=vnpay&status=error`);
  }
});

// VNPay server-to-server IPN
router.post("/vnpay/ipn", async (req, res) => {
  try {
    const vnpResult = verifyVnpaySignature(req.query);
    console.info("[VNPay IPN]", JSON.stringify(vnpResult));

    if (!vnpResult.isValid) {
      return res.json({ RspCode: "97", Message: "Invalid checksum" });
    }

    if (vnpResult.responseCode === "00") {
      const confirmed = await autoConfirmPayment(vnpResult.paymentId, vnpResult.transactionNo);
      if (confirmed) {
        return res.json({ RspCode: "00", Message: "Confirm Success" });
      }
      return res.json({ RspCode: "01", Message: "Order not found" });
    }

    return res.json({ RspCode: "00", Message: "Confirm Success" });
  } catch (err) {
    console.error("[VNPay IPN] Error:", err);
    return res.json({ RspCode: "99", Message: "Unknown error" });
  }
});

// MoMo server-to-server IPN
router.post("/momo/ipn", async (req, res) => {
  try {
    const momoResult = verifyMomoSignature(req.body);
    console.info("[MoMo IPN]", JSON.stringify(momoResult));

    if (!momoResult.isValid) {
      console.warn("[MoMo IPN] Invalid signature");
      return res.status(400).json({ message: "Invalid signature" });
    }

    if (momoResult.resultCode === 0) {
      await autoConfirmPayment(momoResult.paymentId, momoResult.transId);
    }

    return res.status(204).end();
  } catch (err) {
    console.error("[MoMo IPN] Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ═══════════════════════════════════════════════════════════════
//  AUTHENTICATED routes
// ═══════════════════════════════════════════════════════════════

router.post("/create", requireAuth, async (req, res) => {
  try {
    const { itemType, slug, quantity, customerName, customerPhone, customerEmail, provider } = req.body || {};
    if (!itemType || !slug) {
      return res.status(400).json({ message: "Thieu thong tin thanh toan" });
    }

    const data = await createPayment({
      userId: req.user.sub,
      itemType: String(itemType),
      slug: String(slug),
      quantity: Number(quantity || 1),
      customerName,
      customerPhone,
      customerEmail,
      provider: String(provider || "bank_transfer"),
    });

    // ── VNPay: build redirect URL ──
    if (data.provider === "vnpay") {
      const ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
      const paymentUrl = createVnpayPaymentUrl({
        paymentId: data.paymentId,
        orderId: data.orderId,
        amount: data.amount,
        orderInfo: data.orderInfo,
        ipAddr: String(ipAddr).split(",")[0].trim(),
      });
      return res.json({ ...data, paymentUrl, redirect: true });
    }

    // ── MoMo: call API to get payUrl ──
    if (data.provider === "momo") {
      try {
        const momoResult = await createMomoPaymentUrl({
          paymentId: data.paymentId,
          orderId: data.orderId,
          amount: data.amount,
          orderInfo: data.orderInfo,
        });
        return res.json({ ...data, paymentUrl: momoResult.payUrl, redirect: true });
      } catch (momoErr) {
        console.error("[MoMo] Error:", momoErr.message);
        return res.status(502).json({ message: "Khong the ket noi voi MoMo. Vui long thu lai." });
      }
    }

    // ── Bank transfer: return payment details ──
    const fullPayment = await getPaymentById(data.paymentId, req.user.sub, true);
    return res.json(fullPayment);
  } catch (err) {
    return res.status(400).json({ message: err.message || "Khong tao duoc payment" });
  }
});

router.post("/check-existing", requireAuth, async (req, res) => {
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

// Verify endpoint for frontend result page
router.get("/verify/:paymentId", requireAuth, async (req, res) => {
  const payment = await getPaymentById(req.params.paymentId, req.user.sub, ["admin", "staff", "sale"].includes(req.user.role));
  if (!payment) {
    return res.status(404).json({ message: "Khong tim thay payment" });
  }
  return res.json(payment);
});

// ── These dynamic routes MUST be last ──
router.get("/:paymentId", requireAuth, async (req, res) => {
  const payment = await getPaymentById(req.params.paymentId, req.user.sub, ["admin", "staff", "sale"].includes(req.user.role));
  if (!payment) {
    return res.status(404).json({ message: "Khong tim thay payment" });
  }
  return res.json(payment);
});

router.post("/:paymentId/confirm", requireAuth, async (req, res) => {
  try {
    const data = await confirmPayment(req.params.paymentId, req.user.role, req.user.sub);
    return res.json(data);
  } catch (err) {
    const status = /khong tim thay/i.test(err.message) ? 404 : 400;
    return res.status(status).json({ message: err.message || "Confirm that bai" });
  }
});

export default router;
