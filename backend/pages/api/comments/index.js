const { connectDB } = require("../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../lib/response");
const { getCurrentUser, requireAuth, requireStaff } = require("../../../lib/auth");
const Comment = require("../../../models/Comment");
require("../../../models/User");

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 6);
  if (typeof tags === "string") {
    return tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 6);
  }
  return [];
}

export default asyncHandler(async function comments(req, res) {
  await connectDB();

  if (req.method === "GET") {
    const current = await getCurrentUser(req);
    const filter = current?.role === "staff" ? {} : { hidden: false };
    const comments = await Comment.find(filter)
      .populate("user", "name avatarUrl role")
      .sort({ createdAt: -1 })
      .limit(100);
    const visible = comments.filter((comment) => !comment.hidden);
    const averageRating = visible.length
      ? visible.reduce((sum, comment) => sum + comment.rating, 0) / visible.length
      : 0;
    return ok(res, { comments, averageRating, total: visible.length }, "Comments loaded");
  }

  if (req.method === "POST") {
    const user = await requireAuth(req, res);
    if (!user) return;
    const rating = Number(req.body.rating);
    const content = String(req.body.content || "").trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail(res, "Rating must be 1 to 5");
    if (!content) return fail(res, "Comment content is required");
    const comment = await Comment.create({
      user: user._id,
      rating,
      content,
      tags: normalizeTags(req.body.tags)
    });
    await comment.populate("user", "name avatarUrl role");
    return ok(res, { comment }, "Comment created", 201);
  }

  if (req.method === "DELETE") {
    const staff = await requireStaff(req, res);
    if (!staff) return;
    const { id } = req.body || {};
    if (!id) return fail(res, "Comment id is required");
    const comment = await Comment.findByIdAndDelete(id);
    if (!comment) return fail(res, "Comment not found", 404);
    return ok(res, { id }, "Comment deleted");
  }

  return methodNotAllowed(res);
});
