import { connectDB } from "../_lib/mongodb.js";
import { handleCors } from "../_lib/auth.js";
import { sendVerificationEmail } from "../_lib/email.js";
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

    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (!existingUser.isVerified) {
        await User.deleteOne({ _id: existingUser._id });
      } else {
        return res.status(400).json({ message: "User already exists" });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      isVerified: false,
    });

    await user.save();

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp });

    // Send verification email
    await sendVerificationEmail(email, otp);

    return res.status(201).json({
      message: "Signup successful. Please verify your email.",
      email: user.email,
      // In development, return OTP for testing
      ...(process.env.NODE_ENV !== "production" && { otp }),
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}
