import { v4 as uuidv4 } from "uuid";
import { query, withTransaction } from "../config/postgres.js";
import { env } from "../config/env.js";
import { GemModel } from "../models/Gem.js";
import { AiToolModel } from "../models/AiTool.js";
import { rewardReferralIfAny } from "./userService.js";

let orderContactColumnsReady = false;
let ensureOrderContactColumnsTask = null;

async function ensureOrderContactColumns() {
  if (orderContactColumnsReady) return;
  if (ensureOrderContactColumnsTask) {
    await ensureOrderContactColumnsTask;
    return;
  }

  ensureOrderContactColumnsTask = (async () => {
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150)`);
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(30)`);
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(190)`);
    orderContactColumnsReady = true;
  })().finally(() => {
    ensureOrderContactColumnsTask = null;
  });

  await ensureOrderContactColumnsTask;
}

async function loadProduct(type, slug) {
  if (type === "gem") {
    return GemModel.findOne({ slug }).lean();
  }
  if (type === "ai_tool") {
    return AiToolModel.findOne({ slug }).lean();
  }
  return null;
}

function normalizeContactValue(value) {
  return String(value ?? "").trim();
}

function validateCustomerContact({ customerName, customerPhone, customerEmail }) {
  const name = normalizeContactValue(customerName);
  const phone = normalizeContactValue(customerPhone);
  const email = normalizeContactValue(customerEmail);

  if (!name || !phone || !email) {
    throw new Error("Vui long nhap day du ho ten, so dien thoai co Zalo va email");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email khong hop le");
  }

  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 8) {
    throw new Error("So dien thoai khong hop le");
  }

  return {
    name,
    phone,
    email
  };
}

export async function createPayment({ userId, itemType, slug, quantity = 1, customerName = null, customerPhone = null, customerEmail = null, provider = "bank_transfer" }) {
  await ensureOrderContactColumns();
  const contact = validateCustomerContact({ customerName, customerPhone, customerEmail });

  const normalizedType = itemType === "ai" ? "ai_tool" : itemType;
  const product = await loadProduct(normalizedType, slug);
  if (!product) {
    throw new Error("San pham khong ton tai");
  }

  const unitPrice = normalizedType === "ai_tool" ? Number(product.accountPrice || 0) : Number(product.price || 0);
  if (unitPrice <= 0) {
    throw new Error("San pham khong ho tro thanh toan");
  }

  const validProviders = ["bank_transfer", "vnpay", "momo"];
  const selectedProvider = validProviders.includes(provider) ? provider : "bank_transfer";

  const qty = Math.max(1, Number(quantity || 1));
  const amount = unitPrice * qty;
  const orderId = uuidv4();
  const paymentId = uuidv4();
  const paymentCode = `TMV${paymentId.replace(/-/g, "").slice(0, 10).toUpperCase()}`;

  const instruction = selectedProvider === "bank_transfer"
    ? `Chuyen khoan ${env.payment.bankName} - STK ${env.payment.accountNumber} (${env.payment.accountName}), noi dung: ${paymentCode}`
    : "";

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO orders (id, user_id, item_type, item_slug, title, amount, status, customer_name, customer_phone, customer_email)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9)`,
      [orderId, userId, normalizedType, slug, product.title || product.name, amount, contact.name, contact.phone, contact.email]
    );

    await client.query(
      `INSERT INTO payments (id, order_id, user_id, provider, status, payment_code, payment_url, instruction)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)`,
      [paymentId, orderId, userId, selectedProvider, paymentCode, env.payment.qrImageUrl, instruction]
    );
  });

  return {
    paymentId,
    orderId,
    amount,
    provider: selectedProvider,
    paymentCode,
    title: product.title || product.name,
    orderInfo: `Thanh toan ${product.title || product.name}`,
  };
}

/**
 * Auto-confirm payment from gateway IPN callback (VNPay/MoMo).
 * This is the server-to-server flow — no user/admin action needed.
 */
export async function autoConfirmPayment(paymentId, transactionRef = "") {
  const result = await query(
    `SELECT p.id, p.user_id, p.order_id, p.status, o.amount, o.item_type, o.item_slug
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     WHERE p.id = $1`,
    [paymentId]
  );
  const row = result.rows[0];
  if (!row) {
    console.warn(`[autoConfirm] Payment not found: ${paymentId}`);
    return false;
  }

  if (row.status === "success") {
    return true; // Already confirmed
  }

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE payments SET status = 'success', payment_url = $2, updated_at = NOW() WHERE id = $1`,
      [paymentId, transactionRef]
    );
    await client.query(
      `UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1`,
      [row.order_id]
    );

    if (row.item_type === "ai_tool") {
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

  console.info(`[autoConfirm] Payment ${paymentId} confirmed via gateway (txn: ${transactionRef})`);
  return true;
}

export async function getPaymentById(paymentId, requesterUserId, allowStaff = false) {
  await ensureOrderContactColumns();

  const result = await query(
    `SELECT p.id, p.order_id, p.user_id, p.provider, p.status, p.payment_code, p.payment_url, p.instruction,
            p.created_at, o.amount, o.currency, o.item_type, o.item_slug, o.title, u.full_name,
            o.customer_name, o.customer_phone, o.customer_email
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
      title: row.title,
      customerName: row.full_name,
      contactName: row.customer_name,
      contactPhone: row.customer_phone,
      contactEmail: row.customer_email,
      createdAt: row.created_at
    }
  };
}

export async function listOrders() {
  await ensureOrderContactColumns();

  const result = await query(
    `SELECT o.id, o.user_id, o.item_type, o.item_slug, o.title, o.amount, o.currency, o.status, o.created_at, u.email,
            o.customer_name, o.customer_phone, o.customer_email
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
