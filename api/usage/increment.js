import { connectDB } from "../_lib/mongodb.js";
import { handleCors } from "../_lib/auth.js";
import { getUserId } from "../_lib/userId.js";
import UserUsage from "../../models/UserUsage.js";

/**
 * POST /api/usage/increment
 * Increment usage count for a specific action type
 * STRICT: Returns 429 if limit exceeded
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
    // STEP 3: STRICT CHECK - Can user make this request?
    // ═══════════════════════════════════════════════════════════════
    const canContinue = await UserUsage.canMakeRequest(userId, type);
    
    if (!canContinue) {
      const usage = await UserUsage.getTodayUsage(userId);
      const limitInfo = {
        getSolution: { used: usage.getSolutionUsed, limit: usage.getSolutionLimit },
        addSolution: { used: usage.addSolutionUsed, limit: usage.addSolutionLimit },
        variant: { used: usage.variantUsed, limit: usage.variantLimit }
      };

      console.warn(`[USAGE INCREMENT] ❌ Limit reached for ${type}: ${JSON.stringify(limitInfo[type])}`);
      
      return res.status(429).json({ 
        error: "Daily limit reached",
        message: `You've used all ${limitInfo[type].limit} ${type} requests for today. Limit resets at midnight UTC.`,
        currentUsage: limitInfo[type],
        resetsAt: usage.resetsAt,
        upgradeMessage: "Upgrade to Pro for unlimited access!"
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Increment usage (atomic operation)
    // ═══════════════════════════════════════════════════════════════
    await UserUsage.incrementUsage(userId, type);
    console.log(`[USAGE INCREMENT] ✓ Incremented ${type} for user ${userId}`);
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Return updated usage
    // ═══════════════════════════════════════════════════════════════
    const usage = await UserUsage.getTodayUsage(userId);

    return res.json({
      success: true,
      message: `${type} usage incremented`,
      usage: {
        getSolution: {
          used: usage.getSolutionUsed,
          limit: usage.getSolutionLimit,
          left: usage.getSolutionLeft
        },
        addSolution: {
          used: usage.addSolutionUsed,
          limit: usage.addSolutionLimit,
          left: usage.addSolutionLeft
        },
        variant: {
          used: usage.variantUsed,
          limit: usage.variantLimit,
          left: usage.variantLeft
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
