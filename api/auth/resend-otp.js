import { connectDB } from "../_lib/mongodb.js";
import { handleCors } from "../_lib/auth.js";
import { sendVerificationEmail } from "../_lib/email.js";
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

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp });

    // Send verification email
    await sendVerificationEmail(email, otp);

    return res.json({ 
      message: "OTP resent successfully",
      ...(process.env.NODE_ENV !== "production" && { otp })
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
