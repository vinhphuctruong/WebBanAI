import dotenv from "dotenv";

dotenv.config();

function required(key, fallback = "") {
  const value = process.env[key] ?? fallback;
  if (value === "") {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT || 8080),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: required("JWT_SECRET", "change_this_secret_at_least_32_chars"),
  jwtExpires: process.env.JWT_EXPIRES || "7d",
  postgres: {
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT || 5432),
    database: process.env.POSTGRES_DB || "mlv_node",
    user: process.env.POSTGRES_USER || "mlv",
    password: process.env.POSTGRES_PASSWORD || "mlv123"
  },
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/mlv_content",
  payment: {
    bankName: process.env.BANK_NAME || "Vietcombank",
    accountName: process.env.BANK_ACCOUNT_NAME || "CONG TY MAU LAM VIDEO",
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || "1900000000000",
    bankBranch: process.env.BANK_BRANCH || "TP.HCM",
    qrImageUrl: process.env.BANK_QR_IMAGE_URL || "",
    zaloLink: process.env.SALES_ZALO_LINK || "",
    telegramLink: process.env.SALES_TELEGRAM_LINK || "",
    salesPhone: process.env.SALES_PHONE || "",
    vnpay: {
      tmnCode: process.env.VNPAY_TMN_CODE || "CGXZLS0Z",
      hashSecret: process.env.VNPAY_HASH_SECRET || "RAOEXHYVSDDILENYWSLDIIZTANXUXZFJ",
      paymentUrl: process.env.VNPAY_PAYMENT_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
      returnUrl: process.env.VNPAY_RETURN_URL || `${process.env.API_BASE_URL || "http://localhost:8080"}/api/payments/vnpay/return`,
    },
    momo: {
      partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO",
      accessKey: process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85",
      secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz",
      apiEndpoint: process.env.MOMO_API_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api",
      redirectUrl: process.env.MOMO_REDIRECT_URL || `${process.env.APP_BASE_URL || "http://localhost:5173"}/pay/result`,
      ipnUrl: process.env.MOMO_IPN_URL || `${process.env.API_BASE_URL || "http://localhost:8080"}/api/payments/momo/ipn`,
    },
  },
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:5173",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:8080"
};
