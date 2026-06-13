const { connectDB } = require("../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../lib/response");
const { getCurrentUser, requireStaff } = require("../../../lib/auth");
const { getOrCreateCart } = require("../../../lib/cart");
const { publishMany } = require("../../../lib/sse");
const { findTable, getAccessCode, hasValidAccess } = require("../../../lib/tables");
const Order = require("../../../models/Order");
const Cart = require("../../../models/Cart");

function makeOrderNo() {
  const time = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return `OD${time}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function getRangeFilter(range) {
  if (!range) return null;
  const end = new Date();
  const start = new Date(end);
  if (range === "day") start.setDate(end.getDate() - 1);
  else if (range === "week") start.setDate(end.getDate() - 7);
  else if (range === "month") start.setMonth(end.getMonth() - 1);
  else return null;
  return { start, end };
}

export default asyncHandler(async function orders(req, res) {
  await connectDB();

  if (req.method === "GET") {
    const current = await getCurrentUser(req);
    if (!current) return fail(res, "Login required", 401);
    const { status, table, date, range, page = 1, pageSize = 20 } = req.query;
    const filter = {};
    if (current.role !== "staff") filter.customer = current._id;
    if (status) filter.status = status;
    if (table) filter.table = table;
    if (date) {
      const start = new Date(date);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }
    const rangeFilter = getRangeFilter(range);
    if (rangeFilter) {
      filter.createdAt = { $gte: rangeFilter.start, $lte: rangeFilter.end };
    }
    const skip = (Number(page) - 1) * Number(pageSize);
    const [items, total, stats] = await Promise.all([
      Order.find(filter)
        .populate("table", "number status")
        .populate("customer", "name phone avatarUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: { ...filter, status: "completed" } },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalAmount" },
            completedCount: { $sum: 1 }
          }
        }
      ])
    ]);
    return ok(res, {
      items,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      stats: {
        revenue: stats[0]?.revenue || 0,
        completedCount: stats[0]?.completedCount || 0,
        orderCount: total,
        range: range || "",
        start: rangeFilter?.start,
        end: rangeFilter?.end
      }
    }, "Orders loaded");
  }

  if (req.method === "POST") {
    const { tableId, guestId, guestName, remark = "" } = req.body;
    const table = await findTable(tableId).select("+accessCode");
    if (!table) return fail(res, "Table not found", 404);
    if (!hasValidAccess(table, getAccessCode(req))) return fail(res, "Access code is required", 403);

    const user = await getCurrentUser(req);
    const guest = user ? null : { id: guestId || req.headers["x-guest-id"], name: guestName || "Guest" };
    if (!user && !guest.id) return fail(res, "Guest id is required");

    const cart = await getOrCreateCart({ table: table._id, user, guest });
    await cart.populate("items.menuItem", "name price");
    if (!cart.items.length) return fail(res, "Cart is empty");

    const items = cart.items.map((entry) => ({
      menuItem: entry.menuItem._id,
      name: entry.menuItem.name,
      quantity: entry.quantity,
      unitPrice: entry.unitPrice,
      remark: entry.remark
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const order = await Order.create({
      orderNo: makeOrderNo(),
      table: table._id,
      customer: user?._id,
      guest,
      items,
      totalAmount,
      remark,
      status: "pending"
    });

    await Cart.deleteOne({ _id: cart._id });
    table.status = "occupied";
    await table.save();

    const payload = { order, tableNumber: table.number, message: `New order from table ${table.number}` };
    publishMany([`table-${table._id}`, `table-${table.number}`, "staff"], "order:created", payload);
    return ok(res, { order }, "Order submitted", 201);
  }

  return methodNotAllowed(res);
});

