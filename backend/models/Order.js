const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    remark: { type: String, default: "" }
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true, index: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    guest: {
      id: { type: String, default: "" },
      name: { type: String, default: "" }
    },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
      index: true
    },
    remark: { type: String, default: "" },
    operatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    version: { type: Number, default: 0 }
  },
  { timestamps: true }
);

OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ table: 1, createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model("Order", OrderSchema);
