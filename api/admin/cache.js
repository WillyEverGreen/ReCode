import { connectDB } from "../_lib/mongodb.js";
import { handleCors, verifyAdmin } from "../_lib/auth.js";
import SolutionCache from "../../models/SolutionCache.js";
import { Redis } from "@upstash/redis";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify admin
  const auth = verifyAdmin(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    await connectDB();

    // Clear MongoDB cache
    const mongoResult = await SolutionCache.deleteMany({});

    // Clear Redis cache if configured
    let redisCleared = false;
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (redisUrl && redisToken) {
      try {
        const redis = new Redis({ url: redisUrl, token: redisToken });
        await redis.flushdb();
        redisCleared = true;
      } catch (e) {
        console.error("Redis clear error:", e);
      }
    }

    return res.json({
      success: true,
      message: "All caches cleared",
      details: {
        mongodb: mongoResult.deletedCount,
        redis: redisCleared ? "cleared" : "not configured"
      }
    });
  } catch (error) {
    console.error("Clear cache error:", error);
    return res.status(500).json({ error: error.message });
  }
}
