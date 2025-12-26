import { connectDB } from "../_lib/mongodb.js";
import { handleCors } from "../_lib/auth.js";
import UserUsage from "../../models/UserUsage.js";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    const { type } = req.body;
    
    if (!type || !['addSolution', 'getSolution', 'variant'].includes(type)) {
      return res.status(400).json({ error: "Invalid usage type" });
    }

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

    // For anonymous users, use IP + User-Agent (matches solution API)
    if (!userId) {
      const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anonymous';
      const userAgent = req.headers['user-agent'] || '';
      const uniqueStr = clientIp + userAgent;
      userId = `anon_${Buffer.from(uniqueStr).toString('base64').slice(0, 30)}`;
    }

    // Check if user can make this request
    const canContinue = await UserUsage.canMakeRequest(userId, type);
    if (!canContinue) {
      const usage = await UserUsage.getTodayUsage(userId);
      return res.status(429).json({ 
        error: "Daily limit reached",
        usage
      });
    }

    // Increment usage
    await UserUsage.incrementUsage(userId, type);
    
    // Get updated usage
    const usage = await UserUsage.getTodayUsage(userId);

    return res.json({
      success: true,
      usage
    });
  } catch (error) {
    console.error("Usage Increment Error:", error);
    return res.status(500).json({ error: "Failed to increment usage" });
  }
}
