const mongoose = require("mongoose");

const MenuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: "text" },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "MenuCategory", index: true },
    stock: { type: Number, default: 999, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    spicyLevel: { type: Number, default: 0, min: 0, max: 3 },
    available: { type: Boolean, default: true, index: true },
    description: { type: String, default: "" },
    tags: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

MenuItemSchema.index({ available: 1, category: 1 });

module.exports = mongoose.models.MenuItem || mongoose.model("MenuItem", MenuItemSchema);
