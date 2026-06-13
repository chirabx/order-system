const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true, trim: true, maxlength: 500 },
    tags: [{ type: String, trim: true }],
    hidden: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

CommentSchema.index({ hidden: 1, createdAt: -1 });

module.exports = mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
