const { connectDB } = require("../../../lib/db");
const { ok, fail, methodNotAllowed, asyncHandler } = require("../../../lib/response");
const { getCurrentUser, requireStaff } = require("../../../lib/auth");
const { publish } = require("../../../lib/sse");
const Reservation = require("../../../models/Reservation");

function groupForPartySize(partySize) {
  if (partySize <= 2) return "A";
  if (partySize <= 6) return "B";
  return "C";
}

export default asyncHandler(async function reservations(req, res) {
  await connectDB();

  if (req.method === "GET") {
    const staff = await requireStaff(req, res);
    if (!staff) return;
    const reservations = await Reservation.find({ status: "pending" })
      .populate("customer", "name phone")
      .sort({ createdAt: 1 });
    return ok(res, { reservations }, "Reservations loaded");
  }

  if (req.method === "POST") {
    const user = await getCurrentUser(req);
    const { name, phone, partySize, remark = "" } = req.body;
    const size = Number(partySize);
    if (!name || !phone) return fail(res, "Name and phone are required");
    if (!Number.isInteger(size) || size < 1) return fail(res, "Valid party size is required");

    const reservation = await Reservation.create({
      customer: user?._id,
      name,
      phone,
      partySize: size,
      capacityGroup: groupForPartySize(size),
      remark
    });

    publish("staff", "reservation:created", {
      reservation,
      message: `New reservation for ${size} guests`
    });

    return ok(res, { reservation }, "Reservation created", 201);
  }

  return methodNotAllowed(res);
});
