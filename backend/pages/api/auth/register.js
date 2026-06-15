const { connectDB } = require("../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../lib/response");
const { signToken, sanitizeUser } = require("../../../lib/auth");
const User = require("../../../models/User");

export default asyncHandler(async function register(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res);
  await connectDB();

  const { role, name, phone, account, password, staffNo } = req.body;
  if (!["customer", "staff"].includes(role)) return fail(res, "Invalid role");
  if (!name || !password) return fail(res, "Name and password are required");
  if (password.length < 6) return fail(res, "Password must be at least 6 characters");
  if (role === "customer" && !phone) return fail(res, "Phone is required for customer");
  if (role === "staff" && !account) return fail(res, "Account is required for staff");

  const exists = await User.findOne(role === "customer" ? { role, phone } : { role, account });
  if (exists) return fail(res, "Account already exists", 409);

  let user;
  try {
    user = new User({
      role,
      name,
      phone: role === "customer" ? phone : undefined,
      account: role === "staff" ? account : undefined,
      staffNo,
      password
    });
    await user.save();
  } catch (error) {
    if (error.code === 11000) return fail(res, "Account already exists", 409);
    throw error;
  }

  const token = signToken(user);
  return ok(res, { token, user: sanitizeUser(user) }, "Registered", 201);
});

