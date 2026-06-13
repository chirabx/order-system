const { connectDB } = require("../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../lib/response");
const { requireStaff } = require("../../../lib/auth");
const MenuCategory = require("../../../models/MenuCategory");
const MenuItem = require("../../../models/MenuItem");

export default asyncHandler(async function categories(req, res) {
  await connectDB();

  if (req.method === "GET") {
    const categories = await MenuCategory.find().sort({ sort: 1, createdAt: 1 });
    return ok(res, { categories }, "Categories loaded");
  }

  if (req.method === "POST") {
    const staff = await requireStaff(req, res);
    if (!staff) return;
    const { name, sort = 0 } = req.body;
    if (!name) return fail(res, "Category name is required");
    const category = await MenuCategory.create({ name, sort });
    return ok(res, { category }, "Category created", 201);
  }

  if (req.method === "DELETE") {
    const staff = await requireStaff(req, res);
    if (!staff) return;

    const { id } = req.body || {};
    if (!id) return fail(res, "Category id is required");

    const category = await MenuCategory.findByIdAndDelete(id);
    if (!category) return fail(res, "Category not found", 404);
    await MenuItem.updateMany({ category: id }, { $unset: { category: "" } });

    return ok(res, { id }, "Category deleted");
  }

  return methodNotAllowed(res);
});

