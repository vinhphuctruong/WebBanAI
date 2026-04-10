import crypto from "crypto";
import { env } from "../config/env.js";

/**
 * MoMo Sandbox Gateway
 * Docs: https://developers.momo.vn/v3/vi/docs/payment/api/wallet/onetime
 * Sandbox endpoint: https://test-payment.momo.vn
 *
 * Test credentials (public sandbox):
 *   partnerCode: MOMO
 *   accessKey:   F8BBA842ECF85
 *   secretKey:   K951B6PE1waDMi640xX08PD3vg6EkVlz
 */

/**
 * Create MoMo payment URL via API
 * @param {{ paymentId: string, orderId: string, amount: number, orderInfo: string }} opts
 * @returns {Promise<{ payUrl: string, deeplink: string, qrCodeUrl: string }>}
 */
export async function createMomoPaymentUrl({ paymentId, orderId, amount, orderInfo }) {
  const cfg = env.payment.momo;

  const requestId = paymentId;
  const momoOrderId = `MLV_${paymentId}`;
  const extraData = "";
  const requestType = "captureWallet";
  const autoCapture = true;
  const lang = "vi";

  // Build raw signature string (alphabetical order per MoMo spec)
  const rawSignature = [
    `accessKey=${cfg.accessKey}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `ipnUrl=${cfg.ipnUrl}`,
    `orderId=${momoOrderId}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${cfg.partnerCode}`,
    `redirectUrl=${cfg.redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`,
  ].join("&");

  const signature = crypto
    .createHmac("sha256", cfg.secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = {
    partnerCode: cfg.partnerCode,
    accessKey: cfg.accessKey,
    requestId,
    amount,
    orderId: momoOrderId,
    orderInfo,
    redirectUrl: cfg.redirectUrl,
    ipnUrl: cfg.ipnUrl,
    extraData,
    requestType,
    signature,
    lang,
    autoCapture,
  };

  const response = await fetch(`${cfg.apiEndpoint}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  if (data.resultCode !== 0) {
    console.error("[MoMo] Create payment failed:", data);
    throw new Error(data.message || "MoMo payment creation failed");
  }

  return {
    payUrl: data.payUrl || "",
    deeplink: data.deeplink || "",
    qrCodeUrl: data.qrCodeUrl || "",
  };
}

/**
 * Verify MoMo IPN/redirect signature
 * @param {Record<string, any>} params - body from MoMo callback
 * @returns {{ isValid: boolean, paymentId: string, resultCode: number, transId: string, amount: number }}
 */
export function verifyMomoSignature(params) {
  const cfg = env.payment.momo;

  const rawSignature = [
    `accessKey=${cfg.accessKey}`,
    `amount=${params.amount}`,
    `extraData=${params.extraData || ""}`,
    `message=${params.message || ""}`,
    `orderId=${params.orderId}`,
    `orderInfo=${params.orderInfo || ""}`,
    `orderType=${params.orderType || ""}`,
    `partnerCode=${params.partnerCode}`,
    `payType=${params.payType || ""}`,
    `requestId=${params.requestId}`,
    `responseTime=${params.responseTime || ""}`,
    `resultCode=${params.resultCode}`,
    `transId=${params.transId || ""}`,
  ].join("&");

  const checkSignature = crypto
    .createHmac("sha256", cfg.secretKey)
    .update(rawSignature)
    .digest("hex");

  const isValid = checkSignature === params.signature;

  // Extract original paymentId from MoMo orderId (we prefixed with "MLV_")
  const rawOrderId = String(params.orderId || "");
  const paymentId = rawOrderId.startsWith("MLV_") ? rawOrderId.slice(4) : params.requestId || rawOrderId;

  return {
    isValid,
    paymentId,
    resultCode: Number(params.resultCode),
    transId: String(params.transId || ""),
    amount: Number(params.amount || 0),
  };
}
