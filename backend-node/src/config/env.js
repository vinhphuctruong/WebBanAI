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
    salesPhone: process.env.SALES_PHONE || ""
  }
};
