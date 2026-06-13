const { connectDB } = require("../../../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../../../lib/response");
const { requireStaff } = require("../../../../../lib/auth");
const MenuItem = require("../../../../../models/MenuItem");

export default asyncHandler(async function available(req, res) {
  if (req.method !== "PATCH") return methodNotAllowed(res);
  await connectDB();
  const staff = await requireStaff(req, res);
  if (!staff) return;

  const item = await MenuItem.findByIdAndUpdate(
    req.query.id,
    { available: req.body.available },
    { new: true }
  );
  if (!item) return fail(res, "Menu item not found", 404);
  return ok(res, { item }, item.available ? "Menu item available" : "Menu item unavailable");
});

