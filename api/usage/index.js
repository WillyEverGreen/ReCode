import { connectDB } from "../_lib/mongodb.js";
import { handleCors } from "../_lib/auth.js";
import UserUsage from "../../models/UserUsage.js";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    // Get user from token (optional - for logged in users)
    let userId = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
        userId = decoded.userId;
      } catch (e) {
        // Invalid token - treat as anonymous
      }
    }

    // For anonymous users, use IP + User-Agent for better uniqueness (matches solution API)
    if (!userId) {
      const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anonymous';
      const userAgent = req.headers['user-agent'] || '';
      const uniqueStr = clientIp + userAgent;
      userId = `anon_${Buffer.from(uniqueStr).toString('base64').slice(0, 30)}`;
    }

    const usage = await UserUsage.getTodayUsage(userId);

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
      resetsAt: getNextMidnight()
    });
  } catch (error) {
    console.error("Usage API Error:", error);
    return res.status(500).json({ error: "Failed to get usage" });
  }
}

function getNextMidnight() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}
