import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { findUserById, updateUserPhone } from "../services/userService.js";
import { query } from "../config/postgres.js";

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

export default router;
