import { connectDB } from "../_lib/mongodb.js";
import { handleCors } from "../_lib/auth.js";
import { sendPasswordResetEmail } from "../_lib/email.js";
import User from "../../models/User.js";
import Otp from "../../models/Otp.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp });

    // Send password reset email
    await sendPasswordResetEmail(email, otp);

    return res.json({ 
      message: "Password reset OTP sent to your email",
      ...(process.env.NODE_ENV !== "production" && { otp })
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
