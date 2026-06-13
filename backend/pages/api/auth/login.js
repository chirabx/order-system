const { connectDB } = require("../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../lib/response");
const { signToken, sanitizeUser } = require("../../../lib/auth");
const User = require("../../../models/User");

export default asyncHandler(async function login(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res);
  await connectDB();

  const { role, phone, account, credential, password } = req.body;
  if (!["customer", "staff"].includes(role)) return fail(res, "Invalid role");
  if (!password) return fail(res, "Password is required");
  const value = String(credential || phone || account || "").trim();
  if (!value) return fail(res, "Credential is required");

  const primaryQuery = role === "customer" ? { role, phone: value } : { role, account: value };
  const fallbackQuery = {
    role,
    $or: [{ phone: value }, { account: value }, { staffNo: value }]
  };
  const user = await User.findOne(primaryQuery).select("+passwordHash") ||
    await User.findOne(fallbackQuery).select("+passwordHash");
  if (!user) return fail(res, "Invalid credentials", 401);

  const matched = await user.comparePassword(password);
  if (!matched) return fail(res, "Invalid credentials", 401);

  return ok(res, { token: signToken(user), user: sanitizeUser(user) }, "Logged in");
});

