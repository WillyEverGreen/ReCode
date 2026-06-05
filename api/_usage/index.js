import { connectDB } from '../_lib/mongodb.js';
import { handleCors } from '../_lib/auth.js';
import { getUserId } from '../_lib/userId.js';
import UserUsage from '../../models/UserUsage.js';
import User from '../../models/User.js';

/**
 * GET /api/usage
 * Returns current usage stats for authenticated or anonymous user
 * Properly linked to user accounts with strict tracking
 * Admin and Pro users get unlimited access
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Get userId (logged in or anonymous)
    // ═══════════════════════════════════════════════════════════════
    const userId = await getUserId(req);
    console.log('[USAGE API] Fetching usage for user:', userId);

    // ═══════════════════════════════════════════════════════════════
    // STEP 1.5: Check if user is Admin, Pro, or Trial
    // ═══════════════════════════════════════════════════════════════
    let isUnlimited = false;
    let userPlan = 'trial';
    let userRole = 'user';
    let isAdmin = false;
    let trialExpired = false;

    // Only check for logged-in users (not anonymous)
    if (!userId.startsWith('anon_')) {
      try {
        const user = await User.findById(userId);
        if (user) {
          userRole = user.role;
          userPlan = user.plan;

          // Check if admin
          if (user.role === 'admin') {
            isAdmin = true;
            isUnlimited = true;
            console.log(
              `[USAGE API] ✨ Unlimited access for ADMIN user: ${user.username}`
            );
          } else if (user.plan === 'trial') {
            // Check if trial expired
            if (new Date() > new Date(user.trialEndDate)) {
              trialExpired = true;
              console.log(
                `[USAGE API] ⏰ Trial expired for user: ${user.username}`
              );
            } else {
              console.log(
                `[USAGE API] 🎯 Trial user ${user.username} - Daily limits (1 Get, 2 Analyze per day)`
              );
            }
          } else if (user.plan === 'pro') {
            console.log(
              `[USAGE API] 💎 Pro user ${user.username} - High limits (10/10/10)`
            );
          }
        }
      } catch (err) {
        console.warn(
          `[USAGE API] Could not fetch user details: ${err.message}`
        );
      }
    }

    // If trial expired, return error
    if (trialExpired) {
      return res.status(403).json({
        error: 'Trial expired',
        message: 'Your 7-day trial has ended. Upgrade to Pro to continue!',
        trialExpired: true,
        upgradeUrl: '/upgrade',
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Get today's usage from database
    // ═══════════════════════════════════════════════════════════════
    const usage = await UserUsage.getTodayUsage(userId, userPlan, userRole);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Return formatted response
    // ═══════════════════════════════════════════════════════════════
    return res.json({
      success: true,
      unlimited: isUnlimited,
      usage: {
        getSolution: {
          used: usage.getSolutionUsed,
          limit: usage.getSolutionLimit,
          left: isAdmin ? 'unlimited' : usage.getSolutionLeft,
        },
        addSolution: {
          used: usage.addSolutionUsed,
          limit: usage.addSolutionLimit,
          left: isAdmin ? 'unlimited' : usage.addSolutionLeft,
        },
        variant: {
          used: usage.variantUsed,
          limit: usage.variantLimit,
          left: isAdmin ? 'unlimited' : usage.variantLeft,
        },
      },
      plan: userPlan,
      role: userRole,
      resetsAt: usage.resetsAt,
      userId: userId.startsWith('anon_') ? 'anonymous' : userId, // Don't leak full anon ID
    });
  } catch (error) {
    console.error('[USAGE API] Error:', error);
    return res.status(500).json({
      error: 'Failed to get usage',
      message: error.message,
    });
  }
}
