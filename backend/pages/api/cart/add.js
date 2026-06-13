const { connectDB } = require("../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../lib/response");
const { getCurrentUser } = require("../../../lib/auth");
const { publishMany } = require("../../../lib/sse");
const { addItemToCart, getCartAggregate } = require("../../../lib/cart");
const { findTable, getAccessCode, hasValidAccess } = require("../../../lib/tables");

export default asyncHandler(async function addCart(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res);
  await connectDB();

  const { tableId, menuItemId, quantity = 1, remark = "", guestName, guestId } = req.body;
  if (!tableId || !menuItemId) return fail(res, "Table and menu item are required");

  const table = await findTable(tableId).select("+accessCode");
  if (!table) return fail(res, "Table not found", 404);
  if (!hasValidAccess(table, getAccessCode(req))) return fail(res, "Access code is required", 403);

  const user = await getCurrentUser(req);
  const guest = user
    ? null
    : {
        id: guestId || req.headers["x-guest-id"] || `guest-${Date.now()}`,
        name: guestName || req.headers["x-guest-name"] || "Guest"
      };

  const { item } = await addItemToCart({
    table: table._id,
    user,
    guest,
    menuItemId,
    quantity,
    remark
  });

  const aggregate = await getCartAggregate(table._id);
  const actor = user?.name || guest.name;
  const eventPayload = {
    tableId: table._id,
    tableNumber: table.number,
    actor,
    item: { id: item._id, name: item.name, price: item.price },
    quantity: Number(quantity),
    message: `${actor} added ${item.name}`,
    cart: aggregate
  };

  publishMany([`table-${table._id}`, `table-${table.number}`, "staff"], "cart:updated", eventPayload);
  return ok(res, { table, ...aggregate, guest }, "Added to cart");
});

