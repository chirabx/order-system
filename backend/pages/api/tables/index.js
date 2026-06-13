const crypto = require("crypto");
const { connectDB } = require("../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../lib/response");
const { requireStaff } = require("../../../lib/auth");
const Table = require("../../../models/Table");
const { publish } = require("../../../lib/sse");

function inferCapacityGroup(prefix) {
  const value = String(prefix || "A").trim().slice(0, 1).toUpperCase();
  return ["A", "B", "C"].includes(value) ? value : "A";
}

export default asyncHandler(async function tables(req, res) {
  await connectDB();

  if (req.method === "GET") {
    const staff = await requireStaff(req, res);
    if (!staff) return;
    const tables = await Table.find().sort({ number: 1 });
    return ok(res, { tables }, "Tables loaded");
  }

  if (req.method === "POST") {
    const staff = await requireStaff(req, res);
    if (!staff) return;
    const { start = 1, count = 1, prefix = "A" } = req.body;
    const capacityGroup = inferCapacityGroup(prefix);
    if (count < 1 || count > 100) return fail(res, "Can create 1 to 100 tables at a time");

    const docs = Array.from({ length: Number(count) }, (_, index) => {
      const number = `${prefix}${Number(start) + index}`;
      return {
        number,
        token: crypto.randomBytes(12).toString("hex"),
        capacityGroup,
        status: "free"
      };
    });
    const tables = await Table.insertMany(docs, { ordered: false });
    publish("staff", "tables:created", { tables });
    return ok(res, { tables }, "Tables created", 201);
  }

  if (req.method === "DELETE") {
    const staff = await requireStaff(req, res);
    if (!staff) return;

    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return fail(res, "Table ids are required");

    const occupiedCount = await Table.countDocuments({ _id: { $in: ids }, status: "occupied" });
    if (occupiedCount) return fail(res, "Occupied tables cannot be deleted", 409);

    const result = await Table.deleteMany({ _id: { $in: ids } });
    publish("staff", "tables:deleted", { ids, deletedCount: result.deletedCount });
    return ok(res, { deletedCount: result.deletedCount }, "Tables deleted");
  }

  return methodNotAllowed(res);
});

