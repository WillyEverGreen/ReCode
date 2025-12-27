import { connectDB } from "../../_lib/mongodb.js";
import { handleCors } from "../../_lib/auth.js";
import jwt from "jsonwebtoken";
import User from "../../../models/User.js";

/**
 * GitHub OAuth Callback Handler
 * Handles the code exchange and user creation/login
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  // GitHub redirects with GET, but we also support POST for flexibility
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    // GET: code from query params (GitHub redirect)
    // POST: code from body (front-end calling directly)
    const code = req.method === "GET" ? req.query.code : req.body?.code;
    const providedToken = req.body?.access_token;

    if (!code && !providedToken) {
      return res.status(400).json({ message: "Authorization code or access token is required" });
    }

    let access_token = providedToken;

    // If code provided, exchange for access token
    if (code && !access_token) {
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.VITE_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        console.error("[GITHUB AUTH] Token exchange failed:", tokenData);
        return res.status(401).json({ message: tokenData.error_description || "Failed to exchange code" });
      }

      access_token = tokenData.access_token;
    }

    if (!access_token) {
      return res.status(401).json({ message: "Failed to obtain access token" });
    }

    // Get GitHub user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      console.error("[GITHUB AUTH] Failed to fetch user info");
      return res.status(401).json({ message: "Failed to fetch GitHub user info" });
    }

    const githubUser = await userResponse.json();

    // Get user's primary email if not public
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find(e => e.primary) || emails[0];
        email = primaryEmail?.email;
      }
    }

    if (!email) {
      return res.status(400).json({ message: "Could not get email from GitHub. Please make your email public or use another login method." });
    }

    const { id: githubId, login: githubUsername, avatar_url } = githubUser;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - update provider info if needed
      if (user.provider === 'email' && !user.providerId) {
        user.provider = 'github';
        user.providerId = String(githubId);
        user.avatar = avatar_url;
        user.isVerified = true;
        await user.save();
      }
    } else {
      // Create new user
      const username = githubUsername + '_' + Math.random().toString(36).substring(2, 4);
      
      user = new User({
        username,
        email,
        provider: 'github',
        providerId: String(githubId),
        avatar: avatar_url,
        isVerified: true,
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    // If GET request (GitHub redirect), redirect back to the app with token
    if (req.method === "GET") {
      const redirectUrl = `${req.headers.origin || 'http://localhost:3000'}/?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify({
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
      }))}`;
      return res.redirect(302, redirectUrl);
    }

    // If POST request (front-end calling directly), return JSON
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
    console.error("[GITHUB AUTH ERROR]", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}
