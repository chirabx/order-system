const { connectDB } = require("../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../lib/response");
const { getCurrentUser } = require("../../../lib/auth");
const { getCartAggregate, getOrCreateCart } = require("../../../lib/cart");
const { publishMany } = require("../../../lib/sse");
const { findTable, getAccessCode, hasValidAccess } = require("../../../lib/tables");

export default asyncHandler(async function removeCart(req, res) {
  if (req.method !== "DELETE") return methodNotAllowed(res);
  await connectDB();

  const { tableId, menuItemId, guestId, guestName } = req.body;
  const table = await findTable(tableId).select("+accessCode");
  if (!table) return fail(res, "Table not found", 404);
  if (!hasValidAccess(table, getAccessCode(req))) return fail(res, "Access code is required", 403);

  const user = await getCurrentUser(req);
  const guest = user ? null : { id: guestId || req.headers["x-guest-id"], name: guestName || "Guest" };
  if (!user && !guest.id) return fail(res, "Guest id is required");

  const cart = await getOrCreateCart({ table: table._id, user, guest });
  cart.items = cart.items.filter((item) => item.menuItem.toString() !== menuItemId);
  await cart.save();

  const aggregate = await getCartAggregate(table._id);
  publishMany([`table-${table._id}`, `table-${table.number}`, "staff"], "cart:updated", {
    tableId: table._id,
    tableNumber: table.number,
    actor: user?.name || guest.name,
    cart: aggregate
  });
  return ok(res, aggregate, "Cart item removed");
});

