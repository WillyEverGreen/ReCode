import { connectDB } from "../../_lib/mongodb.js";
import { getUserId } from "../../_lib/userId.js";
import UserUsage from "../../../models/UserUsage.js";
import User from "../../../models/User.js";

/**
 * GET /api/usage
 */
export async function getUsageHandler(req, res) {
  // CORS handled by parent

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    const userId = await getUserId(req);
    console.log("[USAGE API] Fetching usage for user:", userId);

    let isUnlimited = false;
    let userPlan = 'trial';
    let userRole = 'user';
    let isAdmin = false;
    let trialExpired = false;

    if (!userId.startsWith('anon_')) {
      try {
        const user = await User.findById(userId);
        if (user) {
          userRole = user.role;
          userPlan = user.plan;
          
          if (user.role === 'admin') {
            isAdmin = true;
            isUnlimited = true;
            console.log(`[USAGE API] ✨ Unlimited access for ADMIN user: ${user.username}`);
          } else if (user.plan === 'trial') {
            if (new Date() > new Date(user.trialEndDate)) {
              trialExpired = true;
              console.log(`[USAGE API] ⏰ Trial expired for user: ${user.username}`);
            } else {
              console.log(`[USAGE API] 🎯 Trial user ${user.username} - Daily limits (1 Get, 2 Analyze per day)`);
            }
          } else if (user.plan === 'pro') {
            console.log(`[USAGE API] 💎 Pro user ${user.username} - High limits (10/10/10)`);
          }
        }
      } catch (err) {
        console.warn(`[USAGE API] Could not fetch user details: ${err.message}`);
      }
    }
    
    if (trialExpired) {
      return res.status(403).json({
        error: 'Trial expired',
        message: 'Your 7-day trial has ended. Upgrade to Pro to continue!',
        trialExpired: true,
        upgradeUrl: '/upgrade'
      });
    }

    const usage = await UserUsage.getTodayUsage(userId, userPlan, userRole);

    return res.json({
      success: true,
      unlimited: isUnlimited,
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
      plan: userPlan,
      role: userRole,
      resetsAt: usage.resetsAt,
      userId: userId.startsWith("anon_") ? "anonymous" : userId
    });
  } catch (error) {
    console.error("[USAGE API] Error:", error);
    return res.status(500).json({ 
      error: "Failed to get usage",
      message: error.message
    });
  }
}
