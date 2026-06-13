const { connectDB } = require("../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../lib/response");
const { getCurrentUser } = require("../../../lib/auth");
const { getCartAggregate, getOrCreateCart } = require("../../../lib/cart");
const { publishMany } = require("../../../lib/sse");
const { findTable, getAccessCode, hasValidAccess } = require("../../../lib/tables");

export default asyncHandler(async function updateCart(req, res) {
  if (req.method !== "PUT") return methodNotAllowed(res);
  await connectDB();

  const { tableId, menuItemId, quantity, remark = "", guestId, guestName } = req.body;
  const table = await findTable(tableId).select("+accessCode");
  if (!table) return fail(res, "Table not found", 404);
  if (!hasValidAccess(table, getAccessCode(req))) return fail(res, "Access code is required", 403);

  const user = await getCurrentUser(req);
  const guest = user ? null : { id: guestId || req.headers["x-guest-id"], name: guestName || "Guest" };
  if (!user && !guest.id) return fail(res, "Guest id is required");

  const cart = await getOrCreateCart({ table: table._id, user, guest });
  const entry = cart.items.find((item) => item.menuItem.toString() === menuItemId);
  if (!entry) return fail(res, "Menu item is not in cart", 404);
  entry.quantity = Math.max(1, Number(quantity || entry.quantity));
  entry.remark = remark;
  await cart.save();

  const aggregate = await getCartAggregate(table._id);
  publishMany([`table-${table._id}`, `table-${table.number}`, "staff"], "cart:updated", {
    tableId: table._id,
    tableNumber: table.number,
    actor: user?.name || guest.name,
    cart: aggregate
  });
  return ok(res, aggregate, "Cart updated");
});

