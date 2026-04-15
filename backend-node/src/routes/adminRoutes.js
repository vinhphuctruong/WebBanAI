import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { listUsers, findUserById, createUser, updateUserRole, deleteUser, adminUpdateUser } from "../services/userService.js";
import { dashboardSummary, listOrders, listPayments } from "../services/paymentService.js";
import { GemModel } from "../models/Gem.js";
import { AiToolModel } from "../models/AiTool.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

function toSlug(rawValue) {
  return String(rawValue || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

router.get("/dashboard", async (_req, res) => {
  const summary = await dashboardSummary();
  return res.json(summary);
});

router.get("/users", async (_req, res) => {
  const users = await listUsers();
  return res.json(users);
});

router.post("/users", async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Can co ten, email va mat khau" });
    }
    const user = await createUser({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: String(password),
      phone: phone ? String(phone).trim() : null
    });
    if (role && ["admin", "staff", "sale", "user"].includes(role)) {
      const updated = await updateUserRole(user.id, role);
      return res.status(201).json(updated);
    }
    return res.status(201).json(user);
  } catch (err) {
    const isDuplicate = err.message?.includes("duplicate") || err.message?.includes("da ton tai");
    return res.status(isDuplicate ? 409 : 400).json({ message: isDuplicate ? "Email da ton tai" : (err.message || "Tao user that bai") });
  }
});

router.put("/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Khong tim thay nguoi dung" });
    }

    const updates = {};
    if (req.body?.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body?.phone !== undefined) updates.phone = String(req.body.phone).trim();
    if (req.body?.role !== undefined) {
      const role = String(req.body.role).trim();
      if (!["admin", "staff", "sale", "user"].includes(role)) {
        return res.status(400).json({ message: "Role khong hop le" });
      }
      updates.role = role;
    }
    if (req.body?.password !== undefined) {
      const pw = String(req.body.password);
      if (pw.length < 6) {
        return res.status(400).json({ message: "Mat khau phai co it nhat 6 ky tu" });
      }
      updates.password = pw;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Khong co du lieu de cap nhat" });
    }

    const updated = await adminUpdateUser(userId, updates);
    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ message: err.message || "Cap nhat user that bai" });
  }
});

router.delete("/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Khong tim thay nguoi dung" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ message: "Khong the xoa tai khoan admin" });
    }
    await deleteUser(userId);
    return res.json({ message: "Da xoa nguoi dung thanh cong", id: userId });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Xoa user that bai" });
  }
});

router.get("/orders", async (_req, res) => {
  const orders = await listOrders();
  return res.json(orders);
});

router.get("/payments", async (_req, res) => {
  const payments = await listPayments();
  return res.json(payments);
});

router.get("/catalog/gems", async (_req, res) => {
  const gems = await GemModel.find().sort({ createdAt: -1 }).lean();
  return res.json(gems);
});

router.get("/catalog/ai-tools", async (_req, res) => {
  const tools = await AiToolModel.find().sort({ createdAt: -1 }).lean();
  return res.json(tools);
});

router.post("/catalog/gems", async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const slug = toSlug(req.body?.slug || title);
    const price = Number(req.body?.price || 0);
    const originalPrice = Number(req.body?.originalPrice || 0);
    const description = String(req.body?.description || "").trim();
    const thumbnail = String(req.body?.thumbnail || "").trim();
    const categoryId = String(req.body?.categoryId || "cat-general").trim() || "cat-general";
    const promptInstruction = String(req.body?.promptInstruction || "").trim();
    const promptContent = String(req.body?.promptContent || "").trim();

    if (!title || !slug) {
      return res.status(400).json({ message: "Can co tieu de va slug hop le" });
    }
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ message: "Gia ban khong duoc am" });
    }

    const existed = await GemModel.findOne({ slug }).lean();
    if (existed) {
      return res.status(409).json({ message: "Slug da ton tai, vui long dung slug khac" });
    }

    const gallery = Array.isArray(req.body?.gallery)
      ? req.body.gallery.filter(Boolean)
      : thumbnail ? [thumbnail] : [];

    const created = await GemModel.create({
      id: String(req.body?.id || `gem-${slug}`),
      slug,
      title,
      categoryId,
      price: Math.round(price),
      originalPrice: Number.isFinite(originalPrice) ? Math.max(0, Math.round(originalPrice)) : 0,
      description,
      thumbnail,
      gallery,
      productType: String(req.body?.productType || "chatbot_prompt"),
      chatbotLink: String(req.body?.chatbotLink || ""),
      workflowLink: String(req.body?.workflowLink || ""),
      videoUrl: String(req.body?.videoUrl || "").trim(),
      tutorialVideo: String(req.body?.tutorialVideo || "").trim(),
      tutorialSteps: Array.isArray(req.body?.tutorialSteps) ? req.body.tutorialSteps : [],
      linkedAiToolId: String(req.body?.linkedAiToolId || ""),
      promptInstruction,
      promptContent
    });

    return res.status(201).json(created.toObject());
  } catch (err) {
    const isDuplicate = err?.code === 11000;
    return res.status(isDuplicate ? 409 : 400).json({ message: isDuplicate ? "ID hoac slug da ton tai" : (err.message || "Tao gem that bai") });
  }
});

router.post("/catalog/ai-tools", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const slug = toSlug(req.body?.slug || name);
    const accountPrice = Number(req.body?.accountPrice || req.body?.price || 0);
    const originalPrice = Number(req.body?.originalPrice || 0);
    const availableCount = Number(req.body?.availableCount || 0);
    const description = String(req.body?.description || "").trim();
    const logo = String(req.body?.logo || "").trim();
    const category = String(req.body?.category || "General").trim() || "General";

    if (!name || !slug) {
      return res.status(400).json({ message: "Can co ten va slug hop le" });
    }
    if (!Number.isFinite(accountPrice) || accountPrice < 0) {
      return res.status(400).json({ message: "Gia tai khoan khong duoc am" });
    }

    const existed = await AiToolModel.findOne({ slug }).lean();
    if (existed) {
      return res.status(409).json({ message: "Slug da ton tai, vui long dung slug khac" });
    }

    const rawFeatures = Array.isArray(req.body?.features)
      ? req.body.features
      : String(req.body?.features || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    const linkedGemIds = Array.isArray(req.body?.linkedGemIds)
      ? req.body.linkedGemIds.filter(Boolean)
      : [];

    const created = await AiToolModel.create({
      id: String(req.body?.id || `tool-${slug}`),
      slug,
      name,
      category,
      description,
      features: rawFeatures,
      accountPrice: Math.round(accountPrice),
      originalPrice: Number.isFinite(originalPrice) ? Math.max(0, Math.round(originalPrice)) : 0,
      availableCount: Number.isFinite(availableCount) ? Math.max(0, Math.round(availableCount)) : 0,
      logo: String(req.body?.logo || "").trim(),
      tutorialUrl: String(req.body?.tutorialUrl || "").trim(),
      videoUrl: String(req.body?.videoUrl || "").trim(),
      accountInfo: String(req.body?.accountInfo || "").trim(),
      linkedGemIds: [String(req.body?.linkedGemIds || "")]
    });

    return res.status(201).json(created.toObject());
  } catch (err) {
    const isDuplicate = err?.code === 11000;
    return res.status(isDuplicate ? 409 : 400).json({ message: isDuplicate ? "ID hoac slug da ton tai" : (err.message || "Tao AI tool that bai") });
  }
});

router.put("/catalog/gems/:slug", async (req, res) => {
  try {
    const currentSlug = String(req.params.slug || "");
    const updates = {};

    if (req.body?.slug !== undefined) {
      const nextSlug = toSlug(req.body.slug);
      if (!nextSlug) {
        return res.status(400).json({ message: "Slug khong hop le" });
      }
      if (nextSlug !== currentSlug) {
        const existed = await GemModel.findOne({ slug: nextSlug }).lean();
        if (existed) {
          return res.status(409).json({ message: "Slug da ton tai, vui long dung slug khac" });
        }
      }
      updates.slug = nextSlug;
    }

    if (req.body?.title !== undefined) {
      const title = String(req.body.title || "").trim();
      if (!title) {
        return res.status(400).json({ message: "Tieu de khong duoc de trong" });
      }
      updates.title = title;
    }

    if (req.body?.categoryId !== undefined) {
      updates.categoryId = String(req.body.categoryId || "").trim() || "cat-general";
    }

    if (req.body?.price !== undefined) {
      const price = Number(req.body.price);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ message: "Gia ban khong duoc am" });
      }
      updates.price = Math.round(price);
    }

    if (req.body?.originalPrice !== undefined) {
      const originalPrice = Number(req.body.originalPrice);
      if (!Number.isFinite(originalPrice) || originalPrice < 0) {
        return res.status(400).json({ message: "Gia goc khong hop le" });
      }
      updates.originalPrice = Math.round(originalPrice);
    }

    if (req.body?.description !== undefined) {
      updates.description = String(req.body.description || "").trim();
    }

    if (req.body?.thumbnail !== undefined) {
      const thumbnail = String(req.body.thumbnail || "").trim();
      updates.thumbnail = thumbnail;
      if (req.body?.gallery === undefined && thumbnail) {
        updates.gallery = [thumbnail];
      }
    }

    if (req.body?.gallery !== undefined) {
      updates.gallery = Array.isArray(req.body.gallery)
        ? req.body.gallery.map((item) => String(item || "").trim()).filter(Boolean)
        : [];
    }

    if (req.body?.productType !== undefined) {
      updates.productType = String(req.body.productType || "").trim();
    }

    if (req.body?.videoUrl !== undefined) {
      updates.videoUrl = String(req.body.videoUrl || "").trim();
    }

    if (req.body?.tutorialVideo !== undefined) {
      updates.tutorialVideo = String(req.body.tutorialVideo || "").trim();
    }

    if (req.body?.promptInstruction !== undefined) {
      updates.promptInstruction = String(req.body.promptInstruction || "").trim();
    }

    if (req.body?.promptContent !== undefined) {
      updates.promptContent = String(req.body.promptContent || "").trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Khong co du lieu de cap nhat" });
    }

    const gem = await GemModel.findOneAndUpdate(
      { slug: currentSlug },
      updates,
      { new: true }
    ).lean();

    if (!gem) {
      return res.status(404).json({ message: "Khong tim thay gem" });
    }

    return res.json(gem);
  } catch (err) {
    const isDuplicate = err?.code === 11000;
    return res.status(isDuplicate ? 409 : 400).json({ message: isDuplicate ? "ID hoac slug da ton tai" : (err.message || "Cap nhat gem that bai") });
  }
});

router.put("/catalog/ai-tools/:slug", async (req, res) => {
  try {
    const currentSlug = String(req.params.slug || "");
    const updates = {};

    if (req.body?.slug !== undefined) {
      const nextSlug = toSlug(req.body.slug);
      if (!nextSlug) {
        return res.status(400).json({ message: "Slug khong hop le" });
      }
      if (nextSlug !== currentSlug) {
        const existed = await AiToolModel.findOne({ slug: nextSlug }).lean();
        if (existed) {
          return res.status(409).json({ message: "Slug da ton tai, vui long dung slug khac" });
        }
      }
      updates.slug = nextSlug;
    }

    if (req.body?.name !== undefined) {
      const name = String(req.body.name || "").trim();
      if (!name) {
        return res.status(400).json({ message: "Ten AI tool khong duoc de trong" });
      }
      updates.name = name;
    }

    if (req.body?.category !== undefined) {
      updates.category = String(req.body.category || "").trim() || "General";
    }

    if (req.body?.accountPrice !== undefined || req.body?.price !== undefined) {
      const accountPrice = Number(req.body.accountPrice ?? req.body.price);
      if (!Number.isFinite(accountPrice) || accountPrice < 0) {
        return res.status(400).json({ message: "Gia tai khoan khong duoc am" });
      }
      updates.accountPrice = Math.round(accountPrice);
    }

    if (req.body?.originalPrice !== undefined) {
      const originalPrice = Number(req.body.originalPrice);
      if (!Number.isFinite(originalPrice) || originalPrice < 0) {
        return res.status(400).json({ message: "Gia goc khong hop le" });
      }
      updates.originalPrice = Math.round(originalPrice);
    }

    if (req.body?.availableCount !== undefined || req.body?.inventory !== undefined) {
      const availableCount = Number(req.body.availableCount ?? req.body.inventory);
      if (!Number.isFinite(availableCount) || availableCount < 0) {
        return res.status(400).json({ message: "Ton kho khong hop le" });
      }
      updates.availableCount = Math.round(availableCount);
    }

    if (req.body?.description !== undefined) {
      updates.description = String(req.body.description || "").trim();
    }

    if (req.body?.logo !== undefined) {
      updates.logo = String(req.body.logo || "").trim();
    }

    if (req.body?.features !== undefined) {
      updates.features = Array.isArray(req.body.features)
        ? req.body.features.map((item) => String(item || "").trim()).filter(Boolean)
        : String(req.body.features || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
    }

    if (req.body?.websiteUrl !== undefined) {
      updates.websiteUrl = String(req.body.websiteUrl || "").trim();
    }

    if (req.body?.tutorialUrl !== undefined) {
      updates.tutorialUrl = String(req.body.tutorialUrl || "").trim();
    }

    if (req.body?.videoUrl !== undefined) {
      updates.videoUrl = String(req.body.videoUrl || "").trim();
    }

    if (req.body?.accountInfo !== undefined) {
      updates.accountInfo = String(req.body.accountInfo || "").trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Khong co du lieu de cap nhat" });
    }

    const tool = await AiToolModel.findOneAndUpdate(
      { slug: currentSlug },
      updates,
      { new: true }
    ).lean();

    if (!tool) {
      return res.status(404).json({ message: "Khong tim thay ai tool" });
    }

    return res.json(tool);
  } catch (err) {
    const isDuplicate = err?.code === 11000;
    return res.status(isDuplicate ? 409 : 400).json({ message: isDuplicate ? "ID hoac slug da ton tai" : (err.message || "Cap nhat AI tool that bai") });
  }
});

router.put("/catalog/gems/:slug/price", async (req, res) => {
  const price = Number(req.body?.price || 0);
  const originalPrice = Number(req.body?.originalPrice || 0);

  if ((req.body?.price !== undefined && (!Number.isFinite(price) || price < 0)) ||
      (req.body?.originalPrice !== undefined && (!Number.isFinite(originalPrice) || originalPrice < 0))) {
    return res.status(400).json({ message: "Gia khong hop le (khong duoc am)" });
  }

  const gem = await GemModel.findOneAndUpdate(
    { slug: req.params.slug },
    {
      ...(Number.isFinite(price) ? { price } : {}),
      ...(Number.isFinite(originalPrice) ? { originalPrice } : {})
    },
    { new: true }
  ).lean();

  if (!gem) {
    return res.status(404).json({ message: "Khong tim thay gem" });
  }

  return res.json(gem);
});

router.put("/catalog/ai-tools/:slug/price", async (req, res) => {
  const accountPrice = Number(req.body?.accountPrice || req.body?.price || 0);
  const originalPrice = Number(req.body?.originalPrice || 0);

  if (((req.body?.accountPrice !== undefined || req.body?.price !== undefined) && (!Number.isFinite(accountPrice) || accountPrice < 0)) ||
      (req.body?.originalPrice !== undefined && (!Number.isFinite(originalPrice) || originalPrice < 0))) {
    return res.status(400).json({ message: "Gia khong hop le (khong duoc am)" });
  }

  const tool = await AiToolModel.findOneAndUpdate(
    { slug: req.params.slug },
    {
      ...(Number.isFinite(accountPrice) ? { accountPrice } : {}),
      ...(Number.isFinite(originalPrice) ? { originalPrice } : {})
    },
    { new: true }
  ).lean();

  if (!tool) {
    return res.status(404).json({ message: "Khong tim thay ai tool" });
  }

  return res.json(tool);
});

router.put("/inventory/ai-tools/:toolId", async (req, res) => {
  const availableCount = Number(req.body?.availableCount ?? req.body?.inventory ?? 0);

  const tool = await AiToolModel.findOneAndUpdate(
    { id: req.params.toolId },
    { availableCount: Math.max(0, availableCount) },
    { new: true }
  ).lean();

  if (!tool) {
    return res.status(404).json({ message: "Khong tim thay ai tool" });
  }

  return res.json(tool);
});

router.delete("/catalog/gems/:slug", async (req, res) => {
  try {
    const gem = await GemModel.findOneAndDelete({ slug: req.params.slug }).lean();
    if (!gem) {
      return res.status(404).json({ message: "Khong tim thay gem" });
    }
    return res.json({ message: "Da xoa gem thanh cong", slug: gem.slug });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Xoa gem that bai" });
  }
});

router.delete("/catalog/ai-tools/:slug", async (req, res) => {
  try {
    const tool = await AiToolModel.findOneAndDelete({ slug: req.params.slug }).lean();
    if (!tool) {
      return res.status(404).json({ message: "Khong tim thay ai tool" });
    }
    return res.json({ message: "Da xoa ai tool thanh cong", slug: tool.slug });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Xoa ai tool that bai" });
  }
});

export default router;
