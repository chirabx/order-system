const { connectDB } = require("../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../lib/response");
const { requireAuth } = require("../../../lib/auth");
const { publish } = require("../../../lib/sse");
const Table = require("../../../models/Table");
const { generateAccessCode } = require("../../../lib/tables");

function groupForPartySize(partySize) {
  if (partySize <= 2) return "A";
  if (partySize <= 6) return "B";
  return "C";
}

function compatibleGroups(group) {
  if (group === "A") return ["A", "B", "C"];
  if (group === "B") return ["B", "C"];
  return ["C"];
}

export default asyncHandler(async function assignTable(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res);
  await connectDB();

  const user = await requireAuth(req, res);
  if (!user) return;

  const partySize = Number(req.body.partySize);
  if (!Number.isInteger(partySize) || partySize < 1) return fail(res, "Valid party size is required");

  const requiredGroup = groupForPartySize(partySize);
  const accessCode = generateAccessCode();
  const groups = compatibleGroups(requiredGroup);
  const capacityFilter =
    requiredGroup === "A"
      ? { $or: [{ capacityGroup: { $in: groups } }, { capacityGroup: { $exists: false } }] }
      : { capacityGroup: { $in: groups } };
  const table = await Table.findOneAndUpdate(
    { status: "free", ...capacityFilter },
    { status: "occupied", accessCode },
    { new: true, sort: { capacityGroup: 1, number: 1 } }
  ).select("+accessCode");

  if (!table) {
    return ok(res, { table: null, requiredGroup, needsReservation: true }, "No free table available");
  }

  publish("staff", "table:occupied", {
    table,
    partySize,
    customer: user.name,
    message: `Table ${table.number} assigned`
  });

  return ok(res, { table, accessCode, requiredGroup, needsReservation: false }, "Table assigned");
});
