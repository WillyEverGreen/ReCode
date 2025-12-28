import { connectDB } from "../_lib/mongodb.js";
import { handleCors } from "../_lib/auth.js";
import { getUserId } from "../_lib/userId.js";
import UserUsage from "../../models/UserUsage.js";
import User from "../../models/User.js";

/**
 * POST /api/usage/increment
 * Increment usage count for a specific action type
 * STRICT: Returns 429 if limit exceeded (except for Admin and Pro users)
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Validate input
    // ═══════════════════════════════════════════════════════════════
    const { type } = req.body;
    
    if (!type) {
      return res.status(400).json({ 
        error: "Missing required field: type",
        validTypes: ['getSolution', 'addSolution', 'variant']
      });
    }

    if (!['addSolution', 'getSolution', 'variant'].includes(type)) {
      return res.status(400).json({ 
        error: "Invalid usage type",
        provided: type,
        validTypes: ['getSolution', 'addSolution', 'variant']
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Get userId (logged in or anonymous)
    // ═══════════════════════════════════════════════════════════════
    const userId = await getUserId(req);
    console.log(`[USAGE INCREMENT] Type: ${type}, User: ${userId}`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2.5: Check if user is Admin (unlimited) or Pro (high limits)
    // ═══════════════════════════════════════════════════════════════
    let skipLimits = false;
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
          
          // Only Admin users get truly unlimited access
          if (user.role === 'admin') {
            skipLimits = true;
            isAdmin = true;
            console.log(`[USAGE INCREMENT] ✨ Unlimited access for ADMIN user: ${user.username}`);
          } else if (user.plan === 'trial') {
            // Check if trial expired
            if (new Date() > new Date(user.trialEndDate)) {
              trialExpired = true;
              console.log(`[USAGE INCREMENT] ⏰ Trial expired for user: ${user.username}`);
            } else {
              console.log(`[USAGE INCREMENT] 🎯 Trial user ${user.username} - Daily limits (1 Get, 2 Analyze per day)`);
            }
          } else if (user.plan === 'pro') {
            console.log(`[USAGE INCREMENT] 💎 Pro user ${user.username} - High limits (10/10/10)`);
          }
        }
      } catch (err) {
        console.warn(`[USAGE INCREMENT] Could not fetch user details: ${err.message}`);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2.9: Check if trial expired
    // ═══════════════════════════════════════════════════════════════
    if (trialExpired) {
      return res.status(403).json({
        error: 'Trial expired',
        message: 'Your 7-day trial has ended. Upgrade to Pro to continue using ReCode!',
        trialExpired: true,
        upgradeUrl: '/upgrade',
        upgradeMessage: 'Upgrade to Pro for only ₹249/month',
        proFeatures: [
          "10 Get Solution per day",
          "10 Analyze Solution per day",
          "10 Variants per day",
          "All features unlocked"
        ]
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: STRICT CHECK - Can user make this request?
    // Skip only for Admin or Development mode
    // Pro users have high limits but still enforced
    // ═══════════════════════════════════════════════════════════════
    const isDevEnv = process.env.NODE_ENV !== 'production' || process.env.IGNORE_USAGE_LIMITS === 'true';

    if (!isDevEnv && !skipLimits) {
      const canContinue = await UserUsage.canMakeRequest(userId, type, userPlan, userRole);
      
      if (!canContinue) {
        const usage = await UserUsage.getTodayUsage(userId, userPlan, userRole);
        const limitInfo = {
          getSolution: { used: usage.getSolutionUsed, limit: usage.getSolutionLimit },
          addSolution: { used: usage.addSolutionUsed, limit: usage.addSolutionLimit },
          variant: { used: usage.variantUsed, limit: usage.variantLimit }
        };

        console.warn(`[USAGE INCREMENT] ❌ Limit reached for ${type}: ${JSON.stringify(limitInfo[type])}`);
        
        // Different messages for trial vs pro users
        const upgradeMessage = userPlan === 'trial' 
          ? "Upgrade to Pro for 10x more requests daily! Only ₹249/month."
          : "Need more? Upgrade to Pro for 10 requests per day! Only ₹249/month.";
        
        const planMessage = userPlan === 'trial'
          ? `Trial limit: ${limitInfo[type].limit} ${type} per day. Upgrade to Pro for 10 per day!`
          : `You've used all ${limitInfo[type].limit} ${type} requests for today. Resets at midnight UTC.`;
        
        return res.status(429).json({ 
          error: "Daily limit reached",
          message: planMessage,
          currentUsage: limitInfo[type],
          resetsAt: usage.resetsAt,
          userPlan,
          upgradeMessage,
          upgradeUrl: "/upgrade",
          proFeatures: [
            "10 Get Solution per day",
            "10 Analyze Solution per day",
            "10 Variants per day",
            "All features unlocked"
          ]
        });
      }
    } else {
      console.log(`[USAGE INCREMENT] Skipping limit enforcement for ${type} in development mode`);
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Increment usage (atomic operation)
    // ═══════════════════════════════════════════════════════════════
    await UserUsage.incrementUsage(userId, type);
    console.log(`[USAGE INCREMENT] ✓ Incremented ${type} for user ${userId}`);
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Return updated usage
    // ═══════════════════════════════════════════════════════════════
    const usage = await UserUsage.getTodayUsage(userId, userPlan, userRole);

    return res.json({
      success: true,
      message: `${type} usage incremented`,
      unlimited: skipLimits, // True for Admin and Pro users
      userPlan,
      userRole,
      usage: {
        getSolution: {
          used: usage.getSolutionUsed,
          limit: usage.getSolutionLimit,
          left: isAdmin ? 'unlimited' : usage.getSolutionLeft
        },
        addSolution: {
          used: usage.addSolutionUsed,
          limit: usage.addSolutionLimit,
          left: isAdmin ? 'unlimited' : usage.addSolutionLeft
        },
        variant: {
          used: usage.variantUsed,
          limit: usage.variantLimit,
          left: isAdmin ? 'unlimited' : usage.variantLeft
        }
      },
      resetsAt: usage.resetsAt
    });
  } catch (error) {
    console.error("[USAGE INCREMENT] Error:", error);
    return res.status(500).json({ 
      error: "Failed to increment usage",
      message: error.message
    });
  }
}
