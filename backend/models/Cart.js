const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    remark: { type: String, default: "" }
  },
  { _id: false }
);

const CartSchema = new mongoose.Schema(
  {
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    guest: {
      id: { type: String, default: "" },
      name: { type: String, default: "" }
    },
    items: [CartItemSchema]
  },
  { timestamps: true }
);

CartSchema.index({ table: 1, customer: 1 });
CartSchema.index({ table: 1, "guest.id": 1 });

module.exports = mongoose.models.Cart || mongoose.model("Cart", CartSchema);
