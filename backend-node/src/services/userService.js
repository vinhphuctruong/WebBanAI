import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { query, withTransaction } from "../config/postgres.js";

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.full_name,
    phone: row.phone,
    role: row.role,
    referralCode: row.referral_code,
    referredByCode: row.referred_by_code,
    availableBalance: row.available_balance,
    totalEarnings: row.total_earnings,
    isPremium: row.is_premium,
    premiumExpiresAt: row.premium_expires_at,
    createdAt: row.created_at
  };
}

function generateReferralCode(email) {
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "MLV";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`;
}

export async function listUsers() {
  const result = await query(
    `SELECT id, email, full_name, phone, role, referral_code, referred_by_code, available_balance, total_earnings, is_premium, premium_expires_at, created_at
     FROM users ORDER BY created_at DESC`
  );
  return result.rows.map(rowToUser);
}

export async function findUserById(userId) {
  const result = await query(
    `SELECT id, email, full_name, phone, role, referral_code, referred_by_code, available_balance, total_earnings, is_premium, premium_expires_at, created_at
     FROM users WHERE id = $1`,
    [userId]
  );
  return rowToUser(result.rows[0]);
}

export async function findUserRecordByEmail(email) {
  const result = await query(
    `SELECT id, email, password_hash, full_name, phone, role, referral_code, referred_by_code, available_balance, total_earnings, is_premium, premium_expires_at, created_at
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
}

export async function createUser({ name, email, password, phone = null, referredByCode = null }) {
  const userId = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);
  let referralCode = generateReferralCode(email);

  for (let i = 0; i < 5; i += 1) {
    const exists = await query("SELECT 1 FROM users WHERE referral_code = $1", [referralCode]);
    if (exists.rows.length === 0) break;
    referralCode = generateReferralCode(`${email}${i}`);
  }

  await query(
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, referral_code, referred_by_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [userId, email.toLowerCase(), passwordHash, name, phone, "user", referralCode, referredByCode]
  );

  return findUserById(userId);
}

export async function verifyUserPassword(userRecord, password) {
  return bcrypt.compare(password, userRecord.password_hash);
}

export async function updateUserPhone(userId, phone) {
  await query(
    `UPDATE users SET phone = $2, updated_at = NOW() WHERE id = $1`,
    [userId, phone]
  );
  return findUserById(userId);
}

export async function updateUserRole(userId, role) {
  await query(
    `UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1`,
    [userId, role]
  );
  return findUserById(userId);
}

export async function adminUpdateUser(userId, updates) {
  const sets = [];
  const params = [userId];
  let idx = 2;

  if (updates.name !== undefined) {
    sets.push(`full_name = $${idx++}`);
    params.push(updates.name);
  }
  if (updates.phone !== undefined) {
    sets.push(`phone = $${idx++}`);
    params.push(updates.phone);
  }
  if (updates.role !== undefined) {
    sets.push(`role = $${idx++}`);
    params.push(updates.role);
  }
  if (updates.password !== undefined) {
    const passwordHash = await bcrypt.hash(updates.password, 10);
    sets.push(`password_hash = $${idx++}`);
    params.push(passwordHash);
  }

  if (sets.length === 0) return findUserById(userId);

  sets.push("updated_at = NOW()");
  await query(`UPDATE users SET ${sets.join(", ")} WHERE id = $1`, params);
  return findUserById(userId);
}

export async function deleteUser(userId) {
  await query(`DELETE FROM users WHERE id = $1`, [userId]);
}

export async function getReferralSummary(userId) {
  const user = await findUserById(userId);
  if (!user) return null;

  const uses = await query(
    `SELECT ru.id, ru.commission_amount, ru.created_at, u.full_name AS referred_name
     FROM referral_uses ru
     JOIN users u ON ru.referred_user_id = u.id
     WHERE ru.referrer_user_id = $1
     ORDER BY ru.created_at DESC
     LIMIT 50`,
    [userId]
  );

  const withdrawals = await query(
    `SELECT id, amount, method, status, created_at
     FROM withdrawals
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );

  return {
    code: user.referralCode,
    totalEarnings: user.totalEarnings,
    availableBalance: user.availableBalance,
    referralCount: uses.rows.length,
    uses: uses.rows,
    withdrawals: withdrawals.rows
  };
}

export async function regenerateReferralCode(userId) {
  const user = await findUserById(userId);
  if (!user) return null;
  let nextCode = generateReferralCode(user.email + Date.now());

  for (let i = 0; i < 5; i += 1) {
    const exists = await query("SELECT 1 FROM users WHERE referral_code = $1", [nextCode]);
    if (exists.rows.length === 0) break;
    nextCode = generateReferralCode(`${user.email}${Date.now()}${i}`);
  }

  await query(
    `UPDATE users SET referral_code = $2, updated_at = NOW() WHERE id = $1`,
    [userId, nextCode]
  );

  return nextCode;
}

export async function createWithdrawal(userId, amount) {
  const user = await findUserById(userId);
  if (!user) throw new Error("User not found");
  if (amount <= 0) throw new Error("So tien rut khong hop le");
  if (amount > user.availableBalance) throw new Error("So du khong du");

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE users
       SET available_balance = available_balance - $2, updated_at = NOW()
       WHERE id = $1`,
      [userId, amount]
    );

    await client.query(
      `INSERT INTO withdrawals (id, user_id, amount, method, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), userId, amount, "bank_transfer", "processing"]
    );
  });

  return getReferralSummary(userId);
}

export async function rewardReferralIfAny({ buyerUserId, orderId, orderAmount, client = null }) {
  const runQuery = (text, params = []) => (client ? client.query(text, params) : query(text, params));
  const buyer = await findUserById(buyerUserId);
  if (!buyer || !buyer.referredByCode) return;

  const referrerResult = await runQuery(
    "SELECT id FROM users WHERE referral_code = $1 LIMIT 1",
    [buyer.referredByCode]
  );

  const referrer = referrerResult.rows[0];
  if (!referrer) return;

  const commission = Math.floor(orderAmount * 0.1);

  if (client) {
    await runQuery(
      `INSERT INTO referral_uses (id, referrer_user_id, referred_user_id, order_id, commission_amount)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), referrer.id, buyerUserId, orderId, commission]
    );
    await runQuery(
      `UPDATE users
       SET available_balance = available_balance + $2,
           total_earnings = total_earnings + $2,
           updated_at = NOW()
       WHERE id = $1`,
      [referrer.id, commission]
    );
    return;
  }

  await withTransaction(async (tx) => {
    await tx.query(
      `INSERT INTO referral_uses (id, referrer_user_id, referred_user_id, order_id, commission_amount)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), referrer.id, buyerUserId, orderId, commission]
    );
    await tx.query(
      `UPDATE users
       SET available_balance = available_balance + $2,
           total_earnings = total_earnings + $2,
           updated_at = NOW()
       WHERE id = $1`,
      [referrer.id, commission]
    );
  });
}
