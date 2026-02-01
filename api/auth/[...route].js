import { connectDB } from '../_lib/mongodb.js';
import { handleCors } from '../_lib/auth.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../_lib/email.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import Otp from '../../models/Otp.js';

// Generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  // Get route from query (set by server.js middleware)
  let { route } = req.query;

  // Fallback: parse from URL path if route is not set
  if (!route || (Array.isArray(route) && route.length === 0)) {
    const urlPath = req.url.split('?')[0]; // Remove query string
    const pathParts = urlPath.split('/').filter(Boolean);
    // URL is like /api/auth/login, so we need the part after "auth"
    const authIndex = pathParts.indexOf('auth');
    if (authIndex !== -1 && authIndex < pathParts.length - 1) {
      route = pathParts.slice(authIndex + 1);
    } else {
      // If still no route found, just use all path parts
      route = pathParts;
    }
  }

  const action = Array.isArray(route) ? route[0] : route;
  console.log(
    '[AUTH DEBUG] URL:',
    req.url,
    '| Route:',
    JSON.stringify(route),
    '| Action:',
    action
  );

  try {
    await connectDB();

    // ==================== SIGNUP ====================
    if (action === 'signup') {
      if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });

      const { username, email, password } = req.body;

      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check existing
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password & create user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({
        username,
        email,
        password: hashedPassword,
        isVerified: false,
      });
      await user.save();

      // Generate and save OTP
      const otp = generateOTP();
      await Otp.create({ email, otp });

      // Send verification email
      try {
        await sendVerificationEmail(email, otp);
        console.log('[EMAIL] Verification email sent to:', email);
      } catch (emailErr) {
        console.error('[EMAIL ERROR]', emailErr);
      }

      return res.status(201).json({
        message: 'Signup successful. Please verify your email.',
        email: user.email,
      });
    }

    // ==================== LOGIN ====================
    if (action === 'login') {
      if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });

      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      if (!user.isVerified) {
        return res
          .status(403)
          .json({ message: 'Please verify your email first' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
      });

      return res.json({
        token,
        user: { id: user._id, username: user.username, email: user.email },
      });
    }

    // ==================== VERIFY-EMAIL ====================
    if (action === 'verify-email') {
      if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });

      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
      }

      const otpRecord = await Otp.findOne({ email, otp });
      if (!otpRecord) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      user.isVerified = true;
      await user.save();
      await Otp.deleteOne({ _id: otpRecord._id });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
      });

      return res.json({
        message: 'Email verified successfully',
        token,
        user: { id: user._id, username: user.username, email: user.email },
      });
    }

    // ==================== FORGOT-PASSWORD ====================
    if (action === 'forgot-password') {
      if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });

      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const otp = generateOTP();
      await Otp.create({ email, otp });

      try {
        await sendPasswordResetEmail(email, otp);
        console.log('[EMAIL] Password reset email sent to:', email);
      } catch (emailErr) {
        console.error('[EMAIL ERROR]', emailErr);
      }

      return res.json({ message: 'OTP sent to your email' });
    }

    // ==================== VERIFY-OTP ====================
    if (action === 'verify-otp') {
      if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });

      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
      }

      const otpRecord = await Otp.findOne({ email, otp });
      if (!otpRecord) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }

      return res.json({ message: 'OTP verified' });
    }

    // ==================== RESET-PASSWORD ====================
    if (action === 'reset-password') {
      if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });

      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        return res
          .status(400)
          .json({ message: 'Email, OTP, and new password are required' });
      }

      const otpRecord = await Otp.findOne({ email, otp });
      if (!otpRecord) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.isVerified = true;
      await user.save();
      await Otp.deleteOne({ _id: otpRecord._id });

      return res.json({
        message: 'Password reset successfully. You can now login.',
      });
    }

    // ==================== RESEND-OTP ====================
    if (action === 'resend-otp') {
      if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });

      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await Otp.deleteMany({ email });
      const otp = generateOTP();
      await Otp.create({ email, otp });

      try {
        await sendVerificationEmail(email, otp);
        console.log('[EMAIL] OTP resent to:', email);
      } catch (emailErr) {
        console.error('[EMAIL ERROR]', emailErr);
      }

      return res.json({ message: 'OTP resent successfully' });
    }

    // Unknown route
    return res.status(404).json({ error: 'Auth route not found' });
  } catch (error) {
    console.error('Auth error:', error);
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
}
