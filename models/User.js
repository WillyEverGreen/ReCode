import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for OAuth users
  isVerified: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  // OAuth fields
  provider: { type: String, default: 'email' }, // 'email', 'google', 'github'
  providerId: { type: String }, // OAuth provider's user ID
  avatar: { type: String }, // Profile picture URL
});

export default mongoose.model("User", userSchema);
