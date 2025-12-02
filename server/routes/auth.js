import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { sendEmail } from "../utils/emailService.js";

const router = express.Router();

// --- Authentication Routes ---

// 1. Signup (Step 1: Create Unverified User & Send OTP)
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      // If user exists but is not verified, we could resend OTP.
      // But for simplicity, if they exist, we say "User already exists".
      // If they are unverified, they should probably use a "Resend Verification" endpoint or we handle it here.
      if (!existingUser.isVerified) {
        // Optional: Resend OTP logic here if you want to support re-trying signup
        // For now, let's just delete the old unverified user and start fresh, OR just update them.
        // Let's go with: Delete old unverified user to allow fresh signup
        await User.deleteOne({ _id: existingUser._id });
      } else {
        return res.status(400).json({ message: "User already exists" });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (Unverified)
    const user = new User({
      username,
      email,
      password: hashedPassword,
      isVerified: false, // Explicitly false
    });

    await user.save();

    // Generate & Send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp });

    await sendEmail(
      email,
      "Verify Your Account - Revision Architect",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0;">Revision Architect</h2>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #555;">Thank you for signing up! Please use the verification code below to complete your registration:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #059669; background-color: #ecfdf5; padding: 10px 20px; border-radius: 5px; border: 1px solid #a7f3d0;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #777;">This code will expire in <strong>2 minutes</strong>.</p>
          <p style="font-size: 14px; color: #777;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
          &copy; ${new Date().getFullYear()} Revision Architect. All rights reserved.
        </div>
      </div>
      `
    );

    res.status(201).json({
      message: "Signup successful. Please verify your email.",
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 2. Verify Email (Step 2: Verify OTP & Activate Account)
router.post("/verify-email", async (req, res) => {
  try {
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

    // Auto-login: Generate Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      message: "Email verified successfully",
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// 3. Login (Standard Email/Pass, but checks verification)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check verification status
    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email first" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 4. Resend OTP (Helper)
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ message: "User already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp });

    await sendEmail(
      email,
      "Verify Your Account - Revision Architect",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0;">Revision Architect</h2>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #555;">Here is your new verification code:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #059669; background-color: #ecfdf5; padding: 10px 20px; border-radius: 5px; border: 1px solid #a7f3d0;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #777;">This code will expire in <strong>2 minutes</strong>.</p>
          <p style="font-size: 14px; color: #777;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
          &copy; ${new Date().getFullYear()} Revision Architect. All rights reserved.
        </div>
      </div>
      `
    );

    res.json({ message: "OTP resent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// 5. Forgot Password - Send OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp });

    // Send Email with OTP
    await sendEmail(
      email,
      "Password Reset - Revision Architect",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0;">Revision Architect</h2>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #555;">You requested a password reset. Please use the verification code below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #059669; background-color: #ecfdf5; padding: 10px 20px; border-radius: 5px; border: 1px solid #a7f3d0;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #777;">This code will expire in <strong>2 minutes</strong>.</p>
          <p style="font-size: 14px; color: #777;">If you didn't request this, please ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
          &copy; ${new Date().getFullYear()} Revision Architect. All rights reserved.
        </div>
      </div>
      `
    );

    res.json({ message: "Password reset OTP sent to your email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// 5b. Verify OTP (for forgot password flow)
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Verify OTP exists
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // OTP is valid - don't delete it yet, it will be used for password reset
    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// 6. Reset Password with OTP
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, OTP, and new password are required" });
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

    await user.save();

    // Delete used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
