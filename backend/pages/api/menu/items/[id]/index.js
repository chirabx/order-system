const { connectDB } = require("../../../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../../../lib/response");
const { requireStaff } = require("../../../../../lib/auth");
const MenuItem = require("../../../../../models/MenuItem");
require("../../../../../models/MenuCategory");

function normalizeMenuPayload(payload) {
  const data = { ...payload };
  if (data.category === "") data.category = null;
  if (typeof data.tags === "string") {
    data.tags = data.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return data;
}

export default asyncHandler(async function menuItem(req, res) {
  await connectDB();

  if (!["PUT", "DELETE"].includes(req.method)) return methodNotAllowed(res);
  const staff = await requireStaff(req, res);
  if (!staff) return;

  if (req.method === "DELETE") {
    const item = await MenuItem.findByIdAndDelete(req.query.id);
    if (!item) return fail(res, "Menu item not found", 404);
    return ok(res, { id: req.query.id }, "Menu item deleted");
  }

  const item = await MenuItem.findByIdAndUpdate(req.query.id, normalizeMenuPayload(req.body), {
    new: true,
    runValidators: true
  });
  if (!item) return fail(res, "Menu item not found", 404);
  return ok(res, { item }, "Menu item updated");
});

