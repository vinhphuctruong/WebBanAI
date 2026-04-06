import { verifyAccessToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : req.headers["x-auth-token"];

  if (!token) {
    return res.status(401).json({ message: "Chua dang nhap" });
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Token khong hop le" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Chua dang nhap" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Ban khong co quyen" });
    }
    return next();
  };
}
