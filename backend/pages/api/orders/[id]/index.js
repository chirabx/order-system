const { connectDB } = require("../../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../../lib/response");
const Order = require("../../../../models/Order");

export default asyncHandler(async function orderDetail(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res);
  await connectDB();

  const order = await Order.findById(req.query.id)
    .populate("table", "number status")
    .populate("customer", "name phone avatarUrl")
    .populate("operatedBy", "name");
  if (!order) return fail(res, "Order not found", 404);
  return ok(res, { order }, "Order loaded");
});

