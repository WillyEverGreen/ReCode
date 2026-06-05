import { connectDB } from '../../_lib/mongodb.js';
import { handleCors } from '../../_lib/auth.js';
import jwt from 'jsonwebtoken';
import User from '../../../models/User.js';

/**
 * GitHub OAuth Callback Handler
 * Handles the code exchange and user creation/login
 * Called as GET (GitHub redirect) or POST (frontend calling directly)
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const isGet = req.method === 'GET';

  // Helper: redirect with error on GET, return JSON error on POST
  const sendError = (statusCode, message, step) => {
    console.error(`[GITHUB AUTH ERROR] Step: ${step} | ${message}`);
    if (isGet) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host =
        req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;
      // Use auth_error param so App.tsx can handle it distinctly
      const errorUrl = `${baseUrl}/?auth_error=${encodeURIComponent(message)}&provider=github`;
      res.writeHead(302, { Location: errorUrl });
      res.end();
    } else {
      res.status(statusCode).json({ message, step, provider: 'github' });
    }
  };

  try {
    // ── Step 1: Check required env vars ──────────────────────────────────────
    console.log('[GITHUB AUTH] Step 1: Checking environment variables...');

    if (!process.env.MONGO_URI) {
      return sendError(
        500,
        'Server misconfiguration: MONGO_URI is not set. Please configure it in Vercel Project Settings → Environment Variables.',
        'env-check'
      );
    }
    if (!process.env.JWT_SECRET) {
      return sendError(
        500,
        'Server misconfiguration: JWT_SECRET is not set in environment variables.',
        'env-check'
      );
    }

    const client_id =
      process.env.VITE_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
    const client_secret = process.env.GITHUB_CLIENT_SECRET;

    if (!client_id) {
      return sendError(
        500,
        'Server misconfiguration: GitHub Client ID (VITE_GITHUB_CLIENT_ID) is not set in Vercel environment variables.',
        'env-check'
      );
    }
    if (!client_secret) {
      return sendError(
        500,
        'Server misconfiguration: GITHUB_CLIENT_SECRET is not set in Vercel environment variables.',
        'env-check'
      );
    }

    console.log('[GITHUB AUTH] Step 1: ENV vars OK');

    // ── Step 2: Connect to MongoDB ────────────────────────────────────────────
    console.log('[GITHUB AUTH] Step 2: Connecting to MongoDB...');
    await connectDB();
    console.log('[GITHUB AUTH] Step 2: MongoDB connected');

    // ── Step 3: Get code or token ─────────────────────────────────────────────
    const code = isGet ? req.query.code : req.body?.code;
    const providedToken = req.body?.access_token;

    console.log(
      `[GITHUB AUTH] Step 3: code=${code ? 'present' : 'MISSING'}, providedToken=${providedToken ? 'present' : 'none'}`
    );

    if (!code && !providedToken) {
      return sendError(
        400,
        'GitHub authorization code is missing. This happens if the OAuth callback URL in your GitHub App settings does not match, or you navigated here directly.',
        'code-check'
      );
    }

    // ── Step 4: Exchange code for access token ────────────────────────────────
    let access_token = providedToken;

    if (code && !access_token) {
      console.log('[GITHUB AUTH] Step 4: Exchanging code for access token...');
      const tokenResponse = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ client_id, client_secret, code }),
        }
      );

      if (!tokenResponse.ok) {
        return sendError(
          502,
          `GitHub token exchange failed with HTTP ${tokenResponse.status} ${tokenResponse.statusText}`,
          'token-exchange'
        );
      }

      const tokenData = await tokenResponse.json();
      console.log(
        '[GITHUB AUTH] Step 4: GitHub response:',
        JSON.stringify({
          error: tokenData.error,
          error_description: tokenData.error_description,
          has_token: !!tokenData.access_token,
        })
      );

      if (tokenData.error) {
        const msg =
          tokenData.error === 'bad_verification_code'
            ? 'GitHub authorization code has expired or was already used. Please click "Sign in with GitHub" again to get a fresh code.'
            : tokenData.error_description ||
              `GitHub OAuth error: ${tokenData.error}`;
        return sendError(400, msg, 'token-exchange');
      }

      access_token = tokenData.access_token;
      console.log('[GITHUB AUTH] Step 4: Got access token');
    }

    if (!access_token) {
      return sendError(
        500,
        'No access token received from GitHub (token field was empty).',
        'token-check'
      );
    }

    // ── Step 5: Fetch GitHub user profile ─────────────────────────────────────
    console.log('[GITHUB AUTH] Step 5: Fetching GitHub user...');
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'ReCode-App',
      },
    });

    if (!userResponse.ok) {
      return sendError(
        502,
        `Failed to fetch GitHub user profile (HTTP ${userResponse.status}). The access token may be invalid.`,
        'fetch-user'
      );
    }

    const githubUser = await userResponse.json();
    console.log(`[GITHUB AUTH] Step 5: Got GitHub user: ${githubUser.login}`);

    // ── Step 6: Fetch email if not public ─────────────────────────────────────
    let email = githubUser.email;
    if (!email) {
      console.log(
        '[GITHUB AUTH] Step 6: Email not public, fetching from /user/emails...'
      );
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'ReCode-App',
        },
      });

      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        if (Array.isArray(emails)) {
          // Prefer primary verified, then primary, then first
          const primaryEmail =
            emails.find((e) => e.primary && e.verified) ||
            emails.find((e) => e.primary) ||
            emails[0];
          email = primaryEmail?.email;
        }
      }
    }

    if (!email) {
      return sendError(
        400,
        'Could not retrieve your email from GitHub. Please go to GitHub Settings → Emails and make your primary email public, or add a verified email.',
        'email-check'
      );
    }

    console.log(`[GITHUB AUTH] Step 6: Email: ${email}`);

    // ── Step 7: Upsert user in database ───────────────────────────────────────
    const { id: githubId, login: githubUsername, avatar_url } = githubUser;
    console.log('[GITHUB AUTH] Step 7: Upserting user...');

    let user = await User.findOne({ email });

    if (user) {
      // Link GitHub to existing account if needed
      if (!user.providerId || user.provider !== 'github') {
        user.provider = 'github';
        user.providerId = String(githubId);
        user.avatar = avatar_url;
        user.isVerified = true;
        await user.save();
      }
      console.log('[GITHUB AUTH] Step 7: Existing user found');
    } else {
      const username =
        githubUsername + '_' + Math.random().toString(36).substring(2, 4);
      user = new User({
        username,
        email,
        provider: 'github',
        providerId: String(githubId),
        avatar: avatar_url,
        isVerified: true,
      });
      await user.save();
      console.log(`[GITHUB AUTH] Step 7: New user created: ${username}`);
    }

    // ── Step 8: Issue JWT ──────────────────────────────────────────────────────
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    const userPayload = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider,
    };

    console.log('[GITHUB AUTH] Step 8: JWT issued, success!');

    // ── Step 9: Respond ────────────────────────────────────────────────────────
    if (isGet) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host =
        req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;
      const redirectUrl = `${baseUrl}/?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(userPayload))}`;
      res.writeHead(302, { Location: redirectUrl });
      res.end();
      return;
    }

    return res.json({ token, user: userPayload });
  } catch (error) {
    console.error('[GITHUB AUTH] Unhandled exception:', error.message);
    console.error(error.stack);
    const msg = `GitHub authentication failed: ${error.message}`;
    if (isGet) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host =
        req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
      const errorUrl = `${protocol}://${host}/?auth_error=${encodeURIComponent(msg)}&provider=github`;
      res.writeHead(302, { Location: errorUrl });
      res.end();
    } else {
      res.status(500).json({ message: msg, provider: 'github' });
    }
  }
}
