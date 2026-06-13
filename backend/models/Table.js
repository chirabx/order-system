const mongoose = require("mongoose");

const TableSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, trim: true },
    token: { type: String, required: true, unique: true, index: true },
    accessCode: { type: String, default: "", select: false },
    capacityGroup: { type: String, enum: ["A", "B", "C"], default: "A", index: true },
    status: { type: String, enum: ["free", "occupied"], default: "free", index: true }
  },
  { timestamps: true }
);

TableSchema.index({ status: 1, capacityGroup: 1 });

module.exports = mongoose.models.Table || mongoose.model("Table", TableSchema);
