import crypto from "crypto";
import { env } from "../config/env.js";

/**
 * VNPay Sandbox Gateway
 * Docs: https://sandbox.vnpayment.vn/apis/
 * Test cards: https://sandbox.vnpayment.vn/apis/vnpay-demo/
 */

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

/**
 * Build VNPay payment URL
 * @param {{ paymentId: string, orderId: string, amount: number, orderInfo: string, ipAddr: string }} opts
 * @returns {string} Full VNPay redirect URL
 */
export function createVnpayPaymentUrl({ paymentId, orderId, amount, orderInfo, ipAddr }) {
  const cfg = env.payment.vnpay;
  const now = new Date();

  const pad = (n) => String(n).padStart(2, "0");
  const createDate =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const expireDate = new Date(now.getTime() + 15 * 60 * 1000);
  const expireDateStr =
    `${expireDate.getFullYear()}${pad(expireDate.getMonth() + 1)}${pad(expireDate.getDate())}` +
    `${pad(expireDate.getHours())}${pad(expireDate.getMinutes())}${pad(expireDate.getSeconds())}`;

  let vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: cfg.tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: paymentId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: amount * 100, // VNPay requires amount * 100
    vnp_ReturnUrl: cfg.returnUrl,
    vnp_IpAddr: ipAddr || "127.0.0.1",
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDateStr,
  };

  vnpParams = sortObject(vnpParams);

  const signData = new URLSearchParams(vnpParams).toString();
  const hmac = crypto.createHmac("sha512", cfg.hashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  vnpParams.vnp_SecureHash = signed;

  const paymentUrl = `${cfg.paymentUrl}?${new URLSearchParams(vnpParams).toString()}`;
  return paymentUrl;
}

/**
 * Verify VNPay return/IPN params
 * @param {Record<string, string>} vnpParams - query params from VNPay
 * @returns {{ isValid: boolean, paymentId: string, responseCode: string, transactionNo: string, amount: number }}
 */
export function verifyVnpaySignature(vnpParams) {
  const cfg = env.payment.vnpay;
  const secureHash = vnpParams.vnp_SecureHash;

  // Remove hash fields before verification
  const params = { ...vnpParams };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sorted = sortObject(params);
  const signData = new URLSearchParams(sorted).toString();
  const hmac = crypto.createHmac("sha512", cfg.hashSecret);
  const checkSum = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  const isValid = secureHash === checkSum;

  return {
    isValid,
    paymentId: vnpParams.vnp_TxnRef || "",
    responseCode: vnpParams.vnp_ResponseCode || "",
    transactionNo: vnpParams.vnp_TransactionNo || "",
    amount: Math.floor(Number(vnpParams.vnp_Amount || 0) / 100),
  };
}
