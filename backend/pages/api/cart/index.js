const { connectDB } = require("../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../lib/response");
const { getCartAggregate } = require("../../../lib/cart");
const { findTable, getAccessCode, hasValidAccess } = require("../../../lib/tables");

export default asyncHandler(async function cart(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res);
  await connectDB();

  const table = await findTable(req.query.tableId).select("+accessCode");
  if (!table) return fail(res, "Table not found", 404);
  if (!hasValidAccess(table, getAccessCode(req))) return fail(res, "Access code is required", 403);

  const aggregate = await getCartAggregate(table._id);
  return ok(res, { table, ...aggregate }, "Cart loaded");
});

