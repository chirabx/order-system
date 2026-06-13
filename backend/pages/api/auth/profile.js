const bcrypt = require("bcryptjs");
const { connectDB } = require("../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../lib/response");
const { requireAuth, sanitizeUser } = require("../../../lib/auth");
const User = require("../../../models/User");

export default asyncHandler(async function profile(req, res) {
  await connectDB();
  const current = await requireAuth(req, res);
  if (!current) return;

  if (req.method === "GET") {
    return ok(res, { user: sanitizeUser(current) }, "Profile loaded");
  }

  if (req.method !== "PUT") return methodNotAllowed(res);

  const { name, avatarUrl, bio, oldPassword, newPassword } = req.body;
  const user = await User.findById(current._id).select("+passwordHash");
  if (!user) return fail(res, "User not found", 404);

  if (name !== undefined) user.name = name;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (bio !== undefined) user.bio = bio;

  if (newPassword) {
    if (!oldPassword) return fail(res, "Old password is required");
    const matched = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!matched) return fail(res, "Old password is incorrect", 401);
    if (newPassword.length < 6) return fail(res, "New password must be at least 6 characters");
    user.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  await user.save();
  return ok(res, { user: sanitizeUser(user) }, "Profile saved");
});

