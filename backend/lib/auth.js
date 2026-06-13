const jwt = require("jsonwebtoken");
const { fail } = require("./response");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function getToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.token || null;
}

async function getCurrentUser(req) {
  const token = getToken(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return User.findById(payload.id).select("-passwordHash");
  } catch {
    return null;
  }
}

async function requireAuth(req, res) {
  const user = await getCurrentUser(req);
  if (!user) {
    fail(res, "请先登录", 401);
    return null;
  }
  return user;
}

async function requireStaff(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return null;
  if (user.role !== "staff") {
    fail(res, "仅员工可执行此操作", 403);
    return null;
  }
  return user;
}

function sanitizeUser(user) {
  if (!user) return null;
  const raw = typeof user.toObject === "function" ? user.toObject() : user;
  delete raw.passwordHash;
  return raw;
}

module.exports = {
  signToken,
  getCurrentUser,
  requireAuth,
  requireStaff,
  sanitizeUser
};
