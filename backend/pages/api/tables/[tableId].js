const { connectDB } = require("../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../lib/response");
const { getCurrentUser } = require("../../../lib/auth");
const { publish } = require("../../../lib/sse");
const { findTable, getAccessCode, hasValidAccess } = require("../../../lib/tables");

export default asyncHandler(async function tableDetail(req, res) {
  await connectDB();

  if (req.method === "GET") {
    const table = await findTable(req.query.tableId).select("+accessCode");
    if (!table) return fail(res, "Table not found", 404);
    if (table.status === "occupied" && table.accessCode && !hasValidAccess(table, getAccessCode(req))) {
      return ok(res, {
        table: {
          _id: table._id,
          number: table.number,
          status: table.status,
          capacityGroup: table.capacityGroup
        },
        requiresAccessCode: true
      }, "Access code required");
    }
    const raw = table.toObject();
    delete raw.accessCode;
    return ok(res, { table: raw, requiresAccessCode: false }, "Table loaded");
  }

  if (req.method === "PATCH") {
    const { status } = req.body;
    if (!["free", "occupied"].includes(status)) return fail(res, "Invalid table status");

    const table = await findTable(req.query.tableId).select("+accessCode");
    if (!table) return fail(res, "Table not found", 404);
    const current = await getCurrentUser(req);
    const isStaff = current?.role === "staff";
    if (status === "free") {
      if (!isStaff && !hasValidAccess(table, getAccessCode(req))) {
        return fail(res, "Access code is required", 403);
      }
    } else {
      if (!isStaff) return fail(res, "Staff only", 403);
    }
    table.status = status;
    if (status === "free") table.accessCode = "";
    await table.save();

    publish("staff", "table:status", {
      table,
      message: `Table ${table.number} is ${status}`
    });
    return ok(res, { table }, "Table status updated");
  }

  return methodNotAllowed(res);
});
