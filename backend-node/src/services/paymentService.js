import { v4 as uuidv4 } from "uuid";
import { query, withTransaction } from "../config/postgres.js";
import { env } from "../config/env.js";
import { GemModel } from "../models/Gem.js";
import { AiToolModel } from "../models/AiTool.js";
import { rewardReferralIfAny } from "./userService.js";

async function loadProduct(type, slug) {
  if (type === "gem") {
    return GemModel.findOne({ slug }).lean();
  }
  if (type === "ai_tool") {
    return AiToolModel.findOne({ slug }).lean();
  }
  return null;
}

export async function createPayment({ userId, itemType, slug, quantity = 1 }) {
  const normalizedType = itemType === "ai" ? "ai_tool" : itemType;
  const product = await loadProduct(normalizedType, slug);
  if (!product) {
    throw new Error("San pham khong ton tai");
  }

  const unitPrice = normalizedType === "ai_tool" ? Number(product.accountPrice || 0) : Number(product.price || 0);
  if (unitPrice <= 0) {
    throw new Error("San pham khong ho tro thanh toan");
  }

  const qty = Math.max(1, Number(quantity || 1));
  const amount = unitPrice * qty;
  const orderId = uuidv4();
  const paymentId = uuidv4();
  const paymentCode = `MLV${paymentId.replace(/-/g, "").slice(0, 10).toUpperCase()}`;

  const instruction = `Chuyen khoan ${env.payment.bankName} - STK ${env.payment.accountNumber} (${env.payment.accountName}), noi dung: ${paymentCode}`;

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO orders (id, user_id, item_type, item_slug, title, amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [orderId, userId, normalizedType, slug, product.title || product.name, amount]
    );

    await client.query(
      `INSERT INTO payments (id, order_id, user_id, provider, status, payment_code, payment_url, instruction)
       VALUES ($1, $2, $3, 'bank_transfer', 'pending', $4, $5, $6)`,
      [paymentId, orderId, userId, paymentCode, env.payment.qrImageUrl, instruction]
    );
  });

  return getPaymentById(paymentId, userId, true);
}

export async function getPaymentById(paymentId, requesterUserId, allowStaff = false) {
  const result = await query(
    `SELECT p.id, p.order_id, p.user_id, p.provider, p.status, p.payment_code, p.payment_url, p.instruction,
            p.created_at, o.amount, o.currency, o.item_type, o.item_slug, o.title, u.full_name
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     JOIN users u ON u.id = p.user_id
     WHERE p.id = $1`,
    [paymentId]
  );

  const row = result.rows[0];
  if (!row) return null;

  if (!allowStaff && row.user_id !== requesterUserId) {
    return null;
  }

  return {
    payment: {
      paymentId: row.id,
      orderId: row.order_id,
      provider: row.provider,
      status: row.status,
      amount: row.amount,
      currency: row.currency,
      paymentCode: row.payment_code,
      paymentUrl: row.payment_url,
      instruction: row.instruction,
      zaloLink: env.payment.zaloLink,
      telegramLink: env.payment.telegramLink,
      salesPhone: env.payment.salesPhone,
      itemType: row.item_type,
      itemSlug: row.item_slug,
      title: row.title,
      customerName: row.full_name,
      createdAt: row.created_at
    }
  };
}

export async function listOrders() {
  const result = await query(
    `SELECT o.id, o.user_id, o.item_type, o.item_slug, o.title, o.amount, o.currency, o.status, o.created_at, u.email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
  );
  return result.rows;
}

export async function listPayments() {
  const result = await query(
    `SELECT p.id, p.order_id, p.user_id, p.provider, p.status, p.payment_code, p.created_at,
            o.amount, o.currency, o.title, u.email
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     JOIN users u ON u.id = p.user_id
     ORDER BY p.created_at DESC`
  );
  return result.rows;
}

export async function confirmPayment(paymentId, requesterRole, requesterUserId) {
  const result = await query(
    `SELECT p.id, p.user_id, p.order_id, p.status, o.amount, o.item_type, o.item_slug
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     WHERE p.id = $1`,
    [paymentId]
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Khong tim thay payment");
  }

  const isStaffRole = ["admin", "staff", "sale"].includes(requesterRole);
  const isOwner = row.user_id === requesterUserId;
  const canConfirm = isStaffRole || isOwner;
  if (!canConfirm) {
    throw new Error("Ban khong co quyen confirm payment nay");
  }

  if (row.status === "success") {
    return getPaymentById(paymentId, requesterUserId, true);
  }

  if (!isStaffRole) {
    if (row.status === "pending") {
      await query(
        `UPDATE payments SET status = 'submitted', updated_at = NOW() WHERE id = $1`,
        [paymentId]
      );
    }

    return getPaymentById(paymentId, requesterUserId, false);
  }

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE payments SET status = 'success', updated_at = NOW() WHERE id = $1`,
      [paymentId]
    );
    await client.query(
      `UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1`,
      [row.order_id]
    );

    if (row.item_type === 'ai_tool') {
      await AiToolModel.updateOne(
        { slug: row.item_slug },
        { $inc: { availableCount: -1 } }
      );
    }

    await rewardReferralIfAny({
      buyerUserId: row.user_id,
      orderId: row.order_id,
      orderAmount: row.amount,
      client
    });
  });

  return getPaymentById(paymentId, requesterUserId, true);
}

export async function dashboardSummary() {
  const [users, orders, payments, revenue] = await Promise.all([
    query("SELECT COUNT(*)::int AS count FROM users"),
    query("SELECT COUNT(*)::int AS count FROM orders"),
    query("SELECT COUNT(*)::int AS count FROM payments"),
    query("SELECT COALESCE(SUM(amount), 0)::int AS revenue FROM orders WHERE status = 'paid'")
  ]);

  return {
    totalUsers: users.rows[0].count,
    totalOrders: orders.rows[0].count,
    totalPayments: payments.rows[0].count,
    revenue: revenue.rows[0].revenue
  };
}
