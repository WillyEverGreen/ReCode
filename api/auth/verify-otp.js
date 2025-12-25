import { connectDB } from "../_lib/mongodb.js";
import { handleCors } from "../_lib/auth.js";
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

    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    return res.json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
