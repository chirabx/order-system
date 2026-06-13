const mongoose = require("mongoose");

const MenuCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    sort: { type: Number, default: 0, index: true }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MenuCategory || mongoose.model("MenuCategory", MenuCategorySchema);
