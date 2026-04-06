import { Router } from "express";
import { signAccessToken } from "../utils/jwt.js";
import {
  createUser,
  findUserRecordByEmail,
  verifyUserPassword,
  findUserById
} from "../services/userService.js";

const router = Router();

function authPayload(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    referralCode: user.referralCode,
    createdAt: user.createdAt
  };
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, referralCode } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Thieu thong tin dang ky" });
    }

    const existed = await findUserRecordByEmail(email);
    if (existed) {
      return res.status(409).json({ message: "Email da ton tai" });
    }

    const created = await createUser({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: String(password),
      phone: phone ? String(phone).trim() : null,
      referredByCode: referralCode ? String(referralCode).trim() : null
    });

    const token = signAccessToken({
      sub: created.id,
      email: created.email,
      role: created.role,
      name: created.name
    });

    return res.json({ token, user: authPayload(created) });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Register failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Thieu email hoac mat khau" });
    }

    const userRecord = await findUserRecordByEmail(String(email).trim().toLowerCase());
    if (!userRecord) {
      return res.status(401).json({ message: "Sai thong tin dang nhap" });
    }

    const ok = await verifyUserPassword(userRecord, String(password));
    if (!ok) {
      return res.status(401).json({ message: "Sai thong tin dang nhap" });
    }

    const user = await findUserById(userRecord.id);
    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    return res.json({ token, user: authPayload(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Login failed" });
  }
});

export default router;
