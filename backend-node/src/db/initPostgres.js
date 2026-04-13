import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/postgres.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function referralCode(prefix) {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}${suffix}`.slice(0, 12);
}

async function upsertUser({ email, fullName, password, role, phone }) {
  const existed = await query("SELECT id, referral_code FROM users WHERE email = $1", [email]);
  const passwordHash = await bcrypt.hash(password, 10);

  if (existed.rows.length > 0) {
    const user = existed.rows[0];
    await query(
      `UPDATE users
       SET full_name = $2, password_hash = $3, role = $4, phone = $5, updated_at = NOW()
       WHERE id = $1`,
      [user.id, fullName, passwordHash, role, phone]
    );
    return user.id;
  }

  const id = uuidv4();
  await query(
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, referral_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, email, passwordHash, fullName, phone, role, referralCode(role.slice(0, 2).toUpperCase())]
  );
  return id;
}

export async function initPostgres() {
  const schemaPath = path.resolve(__dirname, "schema.sql");
  const schema = await fs.readFile(schemaPath, "utf8");
  await query(schema);

  // Ensure new columns exist for manual contact flow
  await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150)`);
  await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(30)`);
  await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(190)`);

  // Ensure premium columns exist for existing users
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ`);

  await upsertUser({
    email: "admin@tmai.com",
    fullName: "Admin TMV",
    password: "TMV@123456789",
    role: "admin",
    phone: "0900000000"
  });

  await upsertUser({
    email: "staff@maulamvideo.com",
    fullName: "Staff MLV",
    password: "staff123",
    role: "staff",
    phone: "0911111111"
  });

  await upsertUser({
    email: "sale@maulamvideo.com",
    fullName: "Sale MLV",
    password: "sale123",
    role: "sale",
    phone: "0922222222"
  });

  await upsertUser({
    email: "demo@maulamvideo.com",
    fullName: "Demo User",
    password: "123456",
    role: "user",
    phone: "0933333333"
  });
}
