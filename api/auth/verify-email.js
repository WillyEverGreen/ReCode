import { connectDB } from "../_lib/mongodb.js";
import { handleCors } from "../_lib/auth.js";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import Otp from "../../models/Otp.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find OTP
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Find User
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Activate User
    user.isVerified = true;
    await user.save();

    // Delete used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    // Auto-login
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    return res.json({
      message: "Email verified successfully",
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
