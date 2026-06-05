import { connectDB } from '../../_lib/mongodb.js';
import { handleCors } from '../../_lib/auth.js';
import jwt from 'jsonwebtoken';
import User from '../../../models/User.js';

/**
 * Google OAuth Callback Handler
 * Handles the token exchange and user creation/login
 * Called as POST from the frontend after Google GSI returns an access token
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ── Step 1: Check required env vars ──────────────────────────────────────
    console.log('[GOOGLE AUTH] Step 1: Checking environment variables...');

    if (!process.env.MONGO_URI) {
      console.error('[GOOGLE AUTH] MONGO_URI is not set!');
      return res.status(500).json({
        message:
          'Server misconfiguration: MONGO_URI is not set. Please configure it in Vercel Project Settings → Environment Variables.',
        step: 'env-check',
        provider: 'google',
      });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message:
          'Server misconfiguration: JWT_SECRET is not set in environment variables.',
        step: 'env-check',
        provider: 'google',
      });
    }

    console.log('[GOOGLE AUTH] Step 1: ENV vars OK');

    // ── Step 2: Connect to MongoDB ────────────────────────────────────────────
    console.log('[GOOGLE AUTH] Step 2: Connecting to MongoDB...');
    await connectDB();
    console.log('[GOOGLE AUTH] Step 2: MongoDB connected');

    // ── Step 3: Get token from request body ───────────────────────────────────
    const { access_token, id_token } = req.body;

    console.log(
      `[GOOGLE AUTH] Step 3: access_token=${access_token ? 'present' : 'missing'}, id_token=${id_token ? 'present' : 'missing'}`
    );

    if (!access_token && !id_token) {
      return res.status(400).json({
        message: 'Google token is missing. Please try signing in again.',
        step: 'token-check',
        provider: 'google',
      });
    }

    // ── Step 4: Verify token with Google ─────────────────────────────────────
    console.log('[GOOGLE AUTH] Step 4: Verifying token with Google...');
    let googleUser;

    if (id_token) {
      // Use tokeninfo endpoint for ID tokens
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`
      );
      const data = await response.json();

      if (!response.ok || data.error) {
        console.error('[GOOGLE AUTH] Step 4: ID token invalid:', data);
        return res.status(401).json({
          message: `Invalid Google ID token: ${data.error_description || data.error || 'verification failed'}`,
          step: 'token-verify',
          provider: 'google',
        });
      }
      googleUser = data;
    } else {
      // Use userinfo endpoint for access tokens
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );
      const data = await response.json();

      if (!response.ok || data.error) {
        console.error('[GOOGLE AUTH] Step 4: Access token invalid:', data);
        return res.status(401).json({
          message: `Invalid Google access token: ${data.error?.message || data.error || 'verification failed'}. Please try signing in again.`,
          step: 'token-verify',
          provider: 'google',
        });
      }
      googleUser = data;
    }

    console.log(
      `[GOOGLE AUTH] Step 4: Google user verified: ${googleUser.email}`
    );

    // ── Step 5: Check email ───────────────────────────────────────────────────
    const { email, name, picture, sub: googleId } = googleUser;

    if (!email) {
      return res.status(400).json({
        message:
          'Google did not provide an email address. Please ensure your Google account has an email and try again.',
        step: 'email-check',
        provider: 'google',
      });
    }

    // ── Step 6: Upsert user in database ───────────────────────────────────────
    console.log('[GOOGLE AUTH] Step 6: Upserting user...');
    let user = await User.findOne({ email });

    if (user) {
      // Link Google to existing account if needed
      if (!user.providerId || user.provider !== 'google') {
        user.provider = 'google';
        user.providerId = googleId;
        user.avatar = picture;
        user.isVerified = true;
        await user.save();
      }
      console.log('[GOOGLE AUTH] Step 6: Existing user found');
    } else {
      const username =
        email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 6);
      user = new User({
        username,
        email,
        provider: 'google',
        providerId: googleId,
        avatar: picture,
        isVerified: true,
      });
      await user.save();
      console.log(`[GOOGLE AUTH] Step 6: New user created: ${username}`);
    }

    // ── Step 7: Issue JWT ──────────────────────────────────────────────────────
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    console.log('[GOOGLE AUTH] Step 7: JWT issued, success!');

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
    console.error('[GOOGLE AUTH] Unhandled exception:', error.message);
    console.error(error.stack);
    return res.status(500).json({
      message: `Google authentication failed: ${error.message}`,
      step: 'unknown',
      provider: 'google',
    });
  }
}
