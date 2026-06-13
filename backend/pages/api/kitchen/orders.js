const { connectDB } = require("../../../lib/db");
const { ok, methodNotAllowed, asyncHandler } = require("../../../lib/response");
const { requireStaff } = require("../../../lib/auth");
const Order = require("../../../models/Order");

export default asyncHandler(async function kitchenOrders(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res);
  await connectDB();
  const staff = await requireStaff(req, res);
  if (!staff) return;

  const orders = await Order.find({ status: { $in: ["pending", "confirmed", "preparing", "ready"] } })
    .populate("table", "number")
    .populate("customer", "name")
    .sort({ createdAt: 1 });
  return ok(res, { orders }, "Kitchen orders loaded");
});

