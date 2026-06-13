const { connectDB } = require("../../../../lib/db");
const { ok, methodNotAllowed, asyncHandler } = require("../../../../lib/response");
const { requireStaff } = require("../../../../lib/auth");
const MenuItem = require("../../../../models/MenuItem");
require("../../../../models/MenuCategory");

function normalizeMenuPayload(payload) {
  const data = { ...payload };
  if (data.category === "") delete data.category;
  if (typeof data.tags === "string") {
    data.tags = data.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return data;
}

export default asyncHandler(async function menuItems(req, res) {
  await connectDB();

  if (req.method === "GET") {
    const { category, search, spicy } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (spicy !== undefined && spicy !== "") filter.spicyLevel = Number(spicy);
    if (search) filter.name = { $regex: search, $options: "i" };

    const items = await MenuItem.find(filter)
      .populate("category", "name sort")
      .sort({ available: -1, createdAt: -1 });
    return ok(res, { items }, "Menu items loaded");
  }

  if (req.method === "POST") {
    const staff = await requireStaff(req, res);
    if (!staff) return;
    const item = await MenuItem.create(normalizeMenuPayload(req.body));
    return ok(res, { item }, "Menu item created", 201);
  }

  return methodNotAllowed(res);
});

