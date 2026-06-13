const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, sparse: true, index: true },
    account: { type: String, trim: true, sparse: true, index: true },
    staffNo: { type: String, trim: true, sparse: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "staff"], required: true, index: true },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "" }
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1, account: 1 }, { unique: true, sparse: true });

UserSchema.virtual("password").set(function setPassword(password) {
  this._password = password;
});

UserSchema.pre("validate", async function hashVirtualPassword(next) {
  if (!this._password) return next();
  this.passwordHash = await bcrypt.hash(this._password, 12);
  next();
});

UserSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
