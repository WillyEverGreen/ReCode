import { connectDB } from "../../_lib/mongodb.js";
import { handleCors } from "../../_lib/auth.js";
import jwt from "jsonwebtoken";
import User from "../../../models/User.js";

/**
 * Google OAuth Callback Handler
 * Handles the token exchange and user creation/login
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    const { access_token, id_token } = req.body;

    if (!access_token && !id_token) {
      return res.status(400).json({ message: "Access token or ID token is required" });
    }

    // Verify the token with Google
    let googleUser;
    try {
      // Try to use id_token first (from Google Sign-In)
      if (id_token) {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
        if (!response.ok) throw new Error("Invalid ID token");
        googleUser = await response.json();
      } else {
        // Fall back to access_token (from OAuth flow)
        const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`);
        if (!response.ok) throw new Error("Invalid access token");
        googleUser = await response.json();
      }
    } catch (err) {
      console.error("[GOOGLE AUTH] Token verification failed:", err);
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const { email, name, picture, sub: googleId } = googleUser;

    if (!email) {
      return res.status(400).json({ message: "Email not provided by Google" });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - update provider info if needed
      if (user.provider === 'email' && !user.providerId) {
        user.provider = 'google';
        user.providerId = googleId;
        user.avatar = picture;
        user.isVerified = true;
        await user.save();
      }
    } else {
      // Create new user
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 6);
      
      user = new User({
        username,
        email,
        provider: 'google',
        providerId: googleId,
        avatar: picture,
        isVerified: true,
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error("[GOOGLE AUTH ERROR]", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}
