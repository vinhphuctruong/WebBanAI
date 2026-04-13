import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { findUserById, updateUserPhone } from "../services/userService.js";
import { query } from "../config/postgres.js";
import { GemModel } from "../models/Gem.js";
import { AiToolModel } from "../models/AiTool.js";

const router = Router();

router.use(requireAuth);

const PROTECTED_ACCESS_WINDOW_MS = 60 * 1000;
const PROTECTED_ACCESS_MAX_HITS = 20;
const protectedAccessHits = new Map();

function pruneExpiredProtectedAccess(now = Date.now()) {
  const threshold = now - PROTECTED_ACCESS_WINDOW_MS;
  for (const [key, hits] of protectedAccessHits.entries()) {
    const recentHits = hits.filter((ts) => ts > threshold);
    if (recentHits.length === 0) {
      protectedAccessHits.delete(key);
    } else if (recentHits.length !== hits.length) {
      protectedAccessHits.set(key, recentHits);
    }
  }
}

function logProtectedAccess(event, req, detail = {}) {
  console.info(
    `[protected-access] ${JSON.stringify({
      event,
      userId: req.user?.sub || null,
      role: req.user?.role || null,
      route: req.originalUrl,
      ip: req.ip,
      time: new Date().toISOString(),
      ...detail
    })}`
  );
}

function rateLimitProtectedAccess(bucket) {
  return (req, res, next) => {
    const now = Date.now();
    const userId = req.user?.sub || "anonymous";
    const key = `${bucket}:${userId}`;

    const currentHits = protectedAccessHits.get(key) || [];
    const windowStart = now - PROTECTED_ACCESS_WINDOW_MS;
    const recentHits = currentHits.filter((ts) => ts > windowStart);

    if (recentHits.length >= PROTECTED_ACCESS_MAX_HITS) {
      logProtectedAccess("rate_limited", req, {
        bucket,
        limit: PROTECTED_ACCESS_MAX_HITS,
        windowMs: PROTECTED_ACCESS_WINDOW_MS
      });
      return res.status(429).json({
        message: "Ban thao tac qua nhanh. Vui long thu lai sau it phut."
      });
    }

    recentHits.push(now);
    protectedAccessHits.set(key, recentHits);

    if (Math.random() < 0.02) {
      pruneExpiredProtectedAccess(now);
    }

    return next();
  };
}

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

router.get("/purchases/gems/:slug", rateLimitProtectedAccess("gems"), async (req, res) => {
  const user = await findUserById(req.user.sub);
  if (!user) {
    logProtectedAccess("user_not_found", req, { slug: req.params.slug, itemType: "gem" });
    return res.status(404).json({ message: "Khong tim thay user" });
  }

  const gem = await GemModel.findOne({ slug: req.params.slug })
    .select("slug promptInstruction promptContent")
    .lean();
  if (!gem) {
    logProtectedAccess("item_not_found", req, { slug: req.params.slug, itemType: "gem" });
    return res.status(404).json({ message: "Khong tim thay gem" });
  }

  const hasAccess = ["admin", "staff", "sale"].includes(user.role) || (user.isPremium && (!user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date()));

  if (hasAccess) {
    logProtectedAccess("granted_staff_or_premium", req, { slug: gem.slug, itemType: "gem" });
    return res.json({
      promptInstruction: gem.promptInstruction,
      promptContent: gem.promptContent
    });
  }

  const orderCheck = await query(
    `SELECT 1 FROM orders 
     WHERE user_id = $1
       AND TRIM(item_slug) = TRIM($2)
       AND item_type IN ('gem', 'chatbotprompt', 'chatbot_prompt', 'prompt')
       AND status = 'paid' 
     LIMIT 1`,
    [req.user.sub, gem.slug]
  );

  if (orderCheck.rows.length === 0) {
    logProtectedAccess("denied_not_owned", req, { slug: gem.slug, itemType: "gem" });
    return res.status(403).json({ message: "Ban chua so huu san pham nay" });
  }

  logProtectedAccess("granted_owner", req, { slug: gem.slug, itemType: "gem" });
  return res.json({
    promptInstruction: gem.promptInstruction,
    promptContent: gem.promptContent
  });
});

router.get("/purchases/ai-tools/:slug", rateLimitProtectedAccess("ai-tools"), async (req, res) => {
  const user = await findUserById(req.user.sub);
  if (!user) {
    logProtectedAccess("user_not_found", req, { slug: req.params.slug, itemType: "ai_tool" });
    return res.status(404).json({ message: "Khong tim thay user" });
  }

  const tool = await AiToolModel.findOne({ slug: req.params.slug })
    .select("slug accountInfo")
    .lean();
  if (!tool) {
    logProtectedAccess("item_not_found", req, { slug: req.params.slug, itemType: "ai_tool" });
    return res.status(404).json({ message: "Khong tim thay tool" });
  }

  const hasAccess = ["admin", "staff", "sale"].includes(user.role) || (user.isPremium && (!user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date()));

  if (hasAccess) {
    logProtectedAccess("granted_staff_or_premium", req, { slug: tool.slug, itemType: "ai_tool" });
    return res.json({ accountInfo: tool.accountInfo });
  }

  const orderCheck = await query(
    `SELECT 1 FROM orders 
     WHERE user_id = $1 AND item_slug = $2 AND item_type IN ('ai', 'ai_tool') AND status = 'paid' 
     LIMIT 1`,
    [req.user.sub, tool.slug]
  );

  if (orderCheck.rows.length === 0) {
    logProtectedAccess("denied_not_owned", req, { slug: tool.slug, itemType: "ai_tool" });
    return res.status(403).json({ message: "Ban chua so huu san pham nay" });
  }

  logProtectedAccess("granted_owner", req, { slug: tool.slug, itemType: "ai_tool" });
  return res.json({ accountInfo: tool.accountInfo });
});

export default router;
