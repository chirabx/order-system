const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    partySize: { type: Number, required: true, min: 1 },
    capacityGroup: { type: String, enum: ["A", "B", "C"], required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "seated", "cancelled"],
      default: "pending",
      index: true
    },
    remark: { type: String, default: "" }
  },
  { timestamps: true }
);

ReservationSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.models.Reservation || mongoose.model("Reservation", ReservationSchema);
