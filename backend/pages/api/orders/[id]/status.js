const { connectDB } = require("../../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../../lib/response");
const { getCurrentUser, requireStaff } = require("../../../../lib/auth");
const { publishMany } = require("../../../../lib/sse");
const Order = require("../../../../models/Order");
const Table = require("../../../../models/Table");

const transitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready"],
  ready: ["completed"],
  completed: [],
  cancelled: []
};

export default asyncHandler(async function orderStatus(req, res) {
  if (req.method !== "PATCH") return methodNotAllowed(res);
  await connectDB();

  const { status, version } = req.body;
  const current = await getCurrentUser(req);
  if (!current) return fail(res, "Login required", 401);

  const order = await Order.findById(req.query.id).populate("table", "number");
  if (!order) return fail(res, "Order not found", 404);

  if (status === "cancelled") {
    const owner =
      current.role === "staff" ||
      (order.customer && order.customer.toString() === current._id.toString());
    if (!owner || order.status !== "pending") return fail(res, "Order cannot be cancelled", 403);
  } else {
    const staff = await requireStaff(req, res);
    if (!staff) return;
  }

  if (!transitions[order.status].includes(status)) {
    return fail(res, `Cannot change order from ${order.status} to ${status}`, 409);
  }
  if (version !== undefined && Number(version) !== order.version) {
    return fail(res, "Order was updated by another user", 409);
  }

  order.status = status;
  order.version += 1;
  if (current.role === "staff") order.operatedBy = current._id;
  await order.save();

  if (["completed", "cancelled"].includes(status)) {
    await Table.findByIdAndUpdate(order.table._id, { status: "free", accessCode: "" });
  }

  const payload = {
    order,
    tableNumber: order.table.number,
    message: `Order ${order.orderNo} is now ${status}`
  };
  publishMany([`table-${order.table._id}`, `table-${order.table.number}`, "staff"], "order:status", payload);
  if (["completed", "cancelled"].includes(status)) {
    publishMany(["staff"], "table:freed", {
      tableId: order.table._id,
      tableNumber: order.table.number,
      message: `Table ${order.table.number} is free`
    });
  }
  return ok(res, { order }, "Order status updated");
});

