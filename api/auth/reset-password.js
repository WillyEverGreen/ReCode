import { connectDB } from "../_lib/mongodb.js";
import { handleCors } from "../_lib/auth.js";
import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import Otp from "../../models/Otp.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.isVerified = true;

    await user.save();
    await Otp.deleteOne({ _id: otpRecord._id });

    return res.json({ message: "Password reset successfully. You can now login." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
