import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { findUserById, updateUserPhone } from "../services/userService.js";
import { query } from "../config/postgres.js";
import { GemModel } from "../models/Gem.js";

const router = Router();

router.use(requireAuth);

router.get("/me", async (req, res) => {
  const user = await findUserById(req.user.sub);
  if (!user) {
    return res.status(404).json({ message: "Khong tim thay user" });
  }

  const bookmarks = await query(
    "SELECT item_type, item_slug FROM user_bookmarks WHERE user_id = $1 ORDER BY created_at DESC",
    [user.id]
  );

  return res.json({
    ...user,
    bookmarks: bookmarks.rows
  });
});

router.get("/purchases", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, item_type, item_slug, title, amount, created_at 
       FROM orders 
       WHERE user_id = $1 AND status = 'paid'
       ORDER BY created_at DESC`,
      [req.user.sub]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: "Loi he thong khi lay truy xuat don hang" });
  }
});

router.put("/phone", async (req, res) => {
  const { phone } = req.body || {};
  const updated = await updateUserPhone(req.user.sub, phone ? String(phone).trim() : null);
  return res.json(updated);
});

router.post("/bookmarks/toggle", async (req, res) => {
  const { itemType, itemSlug } = req.body || {};
  if (!itemType || !itemSlug) {
    return res.status(400).json({ message: "Thieu thong tin bookmark" });
  }

  const existed = await query(
    `SELECT 1 FROM user_bookmarks WHERE user_id = $1 AND item_type = $2 AND item_slug = $3`,
    [req.user.sub, itemType, itemSlug]
  );

  if (existed.rows.length > 0) {
    await query(
      `DELETE FROM user_bookmarks WHERE user_id = $1 AND item_type = $2 AND item_slug = $3`,
      [req.user.sub, itemType, itemSlug]
    );
    return res.json({ bookmarked: false });
  }

  await query(
    `INSERT INTO user_bookmarks (user_id, item_type, item_slug) VALUES ($1, $2, $3)`,
    [req.user.sub, itemType, itemSlug]
  );

  return res.json({ bookmarked: true });
});

router.get("/purchases/gems/:slug", async (req, res) => {
  const user = await findUserById(req.user.sub);
  if (!user) {
    return res.status(404).json({ message: "Khong tim thay user" });
  }

  const gem = await GemModel.findOne({ slug: req.params.slug }).lean();
  if (!gem) {
    return res.status(404).json({ message: "Khong tim thay gem" });
  }

  if (["admin", "staff", "sale"].includes(user.role)) {
    return res.json({
      promptInstruction: gem.promptInstruction,
      promptContent: gem.promptContent
    });
  }

  const orderCheck = await query(
    `SELECT 1 FROM orders WHERE user_id = $1 AND item_slug = $2 AND status = 'paid' LIMIT 1`,
    [user.id, gem.slug]
  );

  if (orderCheck.rows.length === 0) {
    return res.status(403).json({ message: "Ban chua so huu san pham nay" });
  }

  return res.json({
    promptInstruction: gem.promptInstruction,
    promptContent: gem.promptContent
  });
});

export default router;
