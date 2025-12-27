import jwt from "jsonwebtoken";

/**
 * Extract userId from JWT token or generate consistent anonymous ID
 * This MUST be used by ALL APIs that track usage to ensure consistency
 * 
 * @param {Request} req - HTTP request object
 * @returns {Promise<string>} userId (ObjectId string for logged-in, anon_... for anonymous)
 */
export async function getUserId(req) {
  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Try to get logged-in user from JWT token
  // ═══════════════════════════════════════════════════════════════
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
      
      if (decoded.id) {
        const userId = String(decoded.id);  // Ensure string type
        console.log(`[USER ID] ✓ Logged in user: ${userId}`);
        return userId;
      }
    } catch (e) {
      console.warn(`[USER ID] ⚠️  Invalid JWT token: ${e.message}`);
      // Fall through to anonymous
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Generate stable anonymous ID from IP + User-Agent
  // ═══════════════════════════════════════════════════════════════
  // This creates a consistent ID for the same user across sessions
  // while preventing tracking across different networks/browsers
  
  const clientIp = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.socket?.remoteAddress || 
                   'unknown';
                   
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Combine IP and User-Agent for uniqueness
  // This prevents sharing limits across different users behind same proxy
  const uniqueStr = `${clientIp}:${userAgent}`;
  
  // Create base64 hash (stable and URL-safe)
  const anonId = `anon_${Buffer.from(uniqueStr).toString('base64').slice(0, 30)}`;
  
  console.log(`[USER ID] ℹ️  Anonymous user: ${anonId.slice(0, 15)}...`);
  
  return anonId;
}

/**
 * Check if user is authenticated (has valid JWT)
 * @param {Request} req - HTTP request object
 * @returns {boolean} true if authenticated, false otherwise
 */
export function isAuthenticated(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
    return decoded && decoded.id;
  } catch (e) {
    return false;
  }
}
