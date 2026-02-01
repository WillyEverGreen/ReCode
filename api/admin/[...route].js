import { connectDB } from '../_lib/mongodb.js';
import { handleCors, verifyAdmin, generateAdminToken } from '../_lib/auth.js';
import SolutionCache from '../../models/SolutionCache.js';
import User from '../../models/User.js';
import Question from '../../models/Question.js';
import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  // Get route from query (set by server.js middleware)
  let { route } = req.query;

  // Fallback: parse from URL path if route is not set
  if (!route || (Array.isArray(route) && route.length === 0)) {
    const urlPath = req.url.split('?')[0]; // Remove query string
    const pathParts = urlPath.split('/').filter(Boolean);
    // URL is like /api/admin/login, so we need the part after "admin"
    const adminIndex = pathParts.indexOf('admin');
    if (adminIndex !== -1 && adminIndex < pathParts.length - 1) {
      route = pathParts.slice(adminIndex + 1);
    } else {
      route = pathParts;
    }
  }

  const action = Array.isArray(route) ? route[0] : route;
  const subId = Array.isArray(route) ? route[1] : undefined;
  console.log(
    '[ADMIN DEBUG] URL:',
    req.url,
    '| Route:',
    JSON.stringify(route),
    '| Action:',
    action
  );

  try {
    // ==================== LOGIN ====================
    if (action === 'login') {
      if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });

      const { password } = req.body;
      console.log('[ADMIN LOGIN] Password received:', password ? 'YES' : 'NO');

      if (!password) {
        return res.status(400).json({ error: 'Password required' });
      }

      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
      console.log('[ADMIN LOGIN] Comparing with env password:', ADMIN_PASSWORD);

      if (password === ADMIN_PASSWORD) {
        const token = generateAdminToken();
        console.log('[ADMIN LOGIN] ✓ Access granted');
        return res.json({ success: true, token });
      } else {
        console.log('[ADMIN LOGIN] ✗ Password mismatch');
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // All other routes require admin authentication
    const auth = verifyAdmin(req);
    if (auth.error) {
      return res.status(auth.status).json({ error: auth.error });
    }

    await connectDB();

    // ==================== STATS ====================
    if (action === 'stats') {
      if (req.method !== 'GET')
        return res.status(405).json({ error: 'Method not allowed' });

      const totalUsers = await User.countDocuments();
      const totalQuestions = await Question.countDocuments();
      const cachedSolutions = await SolutionCache.countDocuments();

      // Check Redis with breakdown
      let redisStatus = { connected: false, keys: 0, breakdown: {} };
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (redisUrl && redisToken) {
        try {
          const redis = new Redis({ url: redisUrl, token: redisToken });

          // Get breakdown of key types
          const allKeys = await redis.keys('*');
          const breakdown = {
            baseSolutions: 0, // problem:xxx:lang
            variants: 0, // variant:xxx:lang:hash
            legacy: 0, // solution:hash (old format)
          };

          for (const key of allKeys) {
            if (key.startsWith('problem:') && !key.includes('canonical')) {
              breakdown.baseSolutions++;
            } else if (key.startsWith('variant:')) {
              breakdown.variants++;
            } else if (key.startsWith('solution:')) {
              breakdown.legacy++;
            }
            // Ignore "other" keys like problem:canonical-ids (internal use)
          }

          // Only count actual solutions (base + variants), not internal helpers
          const solutionCount = breakdown.baseSolutions + breakdown.variants;
          redisStatus = { connected: true, keys: solutionCount, breakdown };
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
            mongo: { count: cachedSolutions },
            redis: redisStatus,
          },
          recentUsers: [],
        },
      });
    }

    // ==================== USERS ====================
    if (action === 'users') {
      if (req.method !== 'GET')
        return res.status(405).json({ error: 'Method not allowed' });

      // Only show verified users
      const users = await User.find({ isVerified: true }, { password: 0 })
        .sort({ createdAt: -1 })
        .limit(100);
      const usersWithCounts = await Promise.all(
        users.map(async (user) => {
          const questionCount = await Question.countDocuments({
            userId: user._id,
          });
          return { ...user.toObject(), questionCount };
        })
      );

      return res.json({ success: true, users: usersWithCounts });
    }

    // ==================== CACHED-SOLUTIONS/[ID] (Delete specific) ====================
    // This must come BEFORE the GET route to avoid 405 error
    if (action === 'cached-solutions' && subId && req.method === 'DELETE') {
      const result = await SolutionCache.findByIdAndDelete(subId);
      if (!result) {
        return res.status(404).json({ error: 'Cached solution not found' });
      }

      // Also delete from Redis
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (redisUrl && redisToken && result.questionName && result.language) {
        try {
          const redis = new Redis({ url: redisUrl, token: redisToken });
          const redisKey = `problem:${result.questionName}:${result.language}`;
          await redis.del(redisKey);
          console.log('[DELETE] Also deleted from Redis:', redisKey);
        } catch (e) {
          console.error('[DELETE] Redis delete error:', e.message);
        }
      }

      return res.json({ success: true, message: 'Cached solution deleted' });
    }

    // ==================== CACHED-SOLUTIONS (GET list) ====================
    if (action === 'cached-solutions' && req.method === 'GET') {
      const solutions = await SolutionCache.find(
        {},
        {
          questionName: 1,
          originalName: 1,
          language: 1,
          hitCount: 1,
          createdAt: 1,
        }
      )
        .sort({ hitCount: -1 })
        .limit(100);

      return res.json({ success: true, solutions });
    }

    // ==================== CACHE (Clear all) ====================
    if (action === 'cache') {
      if (req.method !== 'DELETE')
        return res.status(405).json({ error: 'Method not allowed' });

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
          console.error('Redis clear error:', e);
        }
      }

      return res.json({
        success: true,
        message: 'All caches cleared',
        details: {
          mongodb: mongoResult.deletedCount,
          redis: redisCleared ? 'cleared' : 'not configured',
        },
      });
    }

    // ==================== SYNC-CACHE (Migrate MongoDB → Redis) ====================
    if (action === 'sync-cache') {
      if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });

      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!redisUrl || !redisToken) {
        return res.status(500).json({ error: 'Redis not configured' });
      }

      const redis = new Redis({ url: redisUrl, token: redisToken });
      const results = { deleted: 0, synced: 0 };

      // Step 1: Delete all legacy keys (solution:xxx format)
      const allKeys = await redis.keys('*');
      for (const key of allKeys) {
        if (key.startsWith('solution:')) {
          await redis.del(key);
          results.deleted++;
        }
      }

      // Step 2: Sync MongoDB to Redis with new format
      const solutions = await SolutionCache.find({});
      const canonicalIds = new Set();

      for (const sol of solutions) {
        const baseKey = `problem:${sol.questionName}:${sol.language}`;
        try {
          await redis.set(baseKey, JSON.stringify(sol.solution), {
            ex: 7 * 24 * 60 * 60,
          });
          canonicalIds.add(sol.questionName);
          results.synced++;
        } catch (e) {
          console.error(`Sync error for ${baseKey}:`, e.message);
        }
      }

      // Step 3: Update canonical IDs
      if (canonicalIds.size > 0) {
        await redis.del('problem:canonical-ids');
        await redis.sadd('problem:canonical-ids', ...canonicalIds);
      }

      return res.json({
        success: true,
        message: `Synced ${results.synced} solutions, deleted ${results.deleted} legacy keys`,
        results,
      });
    }

    // Unknown route
    return res.status(404).json({ error: 'Admin route not found' });
  } catch (error) {
    console.error('Admin error:', error);
    return res.status(500).json({ error: error.message });
  }
}
