import { connectDB } from "../_lib/mongodb.js";
import { handleCors, verifyAdmin } from "../_lib/auth.js";
import User from "../../models/User.js";
import Question from "../../models/Question.js";
import SolutionCache from "../../models/SolutionCache.js";
import { Redis } from "@upstash/redis";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify admin
  const auth = verifyAdmin(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    await connectDB();

    const [userCount, questionCount, cacheCount] = await Promise.all([
      User.countDocuments(),
      Question.countDocuments(),
      SolutionCache.countDocuments(),
    ]);

    // Get recent users
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentUsers = await User.find(
      { createdAt: { $gte: new Date(sevenDaysAgo) } },
      { email: 1, createdAt: 1, _id: 0 }
    ).sort({ createdAt: -1 }).limit(10);

    // Check Redis connection
    let redisConnected = false;
    let redisKeyCount = 0;
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (redisUrl && redisToken) {
      try {
        const redis = new Redis({ url: redisUrl, token: redisToken });
        // Test connection with a ping
        await redis.ping();
        redisConnected = true;
        // Get approximate key count
        const keys = await redis.keys("solution:*");
        redisKeyCount = keys.length;
      } catch (e) {
        console.error("Redis connection test failed:", e.message);
      }
    }

    // Return stats in format expected by AdminPanel
    return res.json({
      success: true,
      stats: {
        totalUsers: userCount,
        totalQuestions: questionCount,
        cache: {
          memory: { size: 0 },
          mongo: { count: cacheCount },
          redis: { connected: redisConnected, keys: redisKeyCount }
        },
        recentUsers,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ error: error.message });
  }
}
