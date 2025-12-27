import { connectDB } from "../_lib/mongodb.js";
import { handleCors } from "../_lib/auth.js";
import { getUserId } from "../_lib/userId.js";
import UserUsage from "../../models/UserUsage.js";

/**
 * GET /api/usage
 * Returns current usage stats for authenticated or anonymous user
 * Properly linked to user accounts with strict tracking
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Get userId (logged in or anonymous)
    // ═══════════════════════════════════════════════════════════════
    const userId = await getUserId(req);
    console.log("[USAGE API] Fetching usage for user:", userId);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Get today's usage from database
    // ═══════════════════════════════════════════════════════════════
    const usage = await UserUsage.getTodayUsage(userId);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Return formatted response
    // ═══════════════════════════════════════════════════════════════
    return res.json({
      success: true,
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
      plan: "free",
      resetsAt: usage.resetsAt,
      userId: userId.startsWith("anon_") ? "anonymous" : userId  // Don't leak full anon ID
    });
  } catch (error) {
    console.error("[USAGE API] Error:", error);
    return res.status(500).json({ 
      error: "Failed to get usage",
      message: error.message
    });
  }
}
