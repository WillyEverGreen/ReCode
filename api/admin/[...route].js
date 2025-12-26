import { connectDB } from "../_lib/mongodb.js";
import { handleCors, verifyAdmin, generateAdminToken } from "../_lib/auth.js";
import SolutionCache from "../../models/SolutionCache.js";
import User from "../../models/User.js";
import Question from "../../models/Question.js";
import { Redis } from "@upstash/redis";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  // Get route from query or parse from URL
  let { route } = req.query;
  
  // Fallback: parse from URL path if route is not set
  if (!route || route.length === 0) {
    const urlPath = req.url.split('?')[0]; // Remove query string
    const pathParts = urlPath.split('/').filter(Boolean);
    // URL is like /api/admin/login, so we need the part after "admin"
    const adminIndex = pathParts.indexOf('admin');
    if (adminIndex !== -1 && adminIndex < pathParts.length - 1) {
      route = pathParts.slice(adminIndex + 1);
    }
  }
  
  const action = route?.[0];
  const subId = route?.[1]; // For routes like /admin/solutions/[id]

  try {
    // ==================== LOGIN ====================
    if (action === "login") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ error: "Password required" });
      }

      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
      if (password === ADMIN_PASSWORD) {
        const token = generateAdminToken();
        return res.json({ success: true, token });
      } else {
        return res.status(401).json({ error: "Invalid password" });
      }
    }

    // All other routes require admin authentication
    const auth = verifyAdmin(req);
    if (auth.error) {
      return res.status(auth.status).json({ error: auth.error });
    }

    await connectDB();

    // ==================== STATS ====================
    if (action === "stats") {
      if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

      const totalUsers = await User.countDocuments();
      const totalQuestions = await Question.countDocuments();
      const cachedSolutions = await SolutionCache.countDocuments();

      // Check Redis
      let redisStatus = { connected: false, keys: 0 };
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (redisUrl && redisToken) {
        try {
          const redis = new Redis({ url: redisUrl, token: redisToken });
          const keys = await redis.dbsize();
          redisStatus = { connected: true, keys };
        } catch (e) {
          redisStatus = { connected: false, error: e.message };
        }
      }

      return res.json({
        success: true,
        stats: {
          totalUsers,
          totalQuestions,
          cache: {
            memory: { size: 0 },
            mongo: { count: cachedSolutions },
            redis: redisStatus,
          },
          recentUsers: [],
        },
      });
    }

    // ==================== USERS ====================
    if (action === "users") {
      if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

      // Only show verified users
      const users = await User.find({ isVerified: true }, { password: 0 }).sort({ createdAt: -1 }).limit(100);
      const usersWithCounts = await Promise.all(
        users.map(async (user) => {
          const questionCount = await Question.countDocuments({ userId: user._id });
          return { ...user.toObject(), questionCount };
        })
      );

      return res.json({ success: true, users: usersWithCounts });
    }

    // ==================== CACHED-SOLUTIONS ====================
    if (action === "cached-solutions") {
      if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

      const solutions = await SolutionCache.find({}, {
        questionName: 1,
        originalName: 1,
        language: 1,
        hitCount: 1,
        createdAt: 1,
      }).sort({ hitCount: -1 }).limit(100);

      return res.json({ success: true, solutions });
    }

    // ==================== CACHED-SOLUTIONS/[ID] (Delete specific) ====================
    if (action === "cached-solutions" && subId) {
      if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

      const result = await SolutionCache.findByIdAndDelete(subId);
      if (!result) {
        return res.status(404).json({ error: "Cached solution not found" });
      }
      return res.json({ success: true, message: "Cached solution deleted" });
    }

    // ==================== CACHE (Clear all) ====================
    if (action === "cache") {
      if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

      const mongoResult = await SolutionCache.deleteMany({});

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
          redis: redisCleared ? "cleared" : "not configured",
        },
      });
    }

    // Unknown route
    return res.status(404).json({ error: "Admin route not found" });

  } catch (error) {
    console.error("Admin error:", error);
    return res.status(500).json({ error: error.message });
  }
}
