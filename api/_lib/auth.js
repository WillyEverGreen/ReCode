import jwt from "jsonwebtoken";

// Verify admin token for protected routes
export function verifyAdmin(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Unauthorized - No token provided", status: 401 };
  }

  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.admin) {
      return { valid: true, decoded };
    } else {
      return { error: "Forbidden - Not an admin token", status: 403 };
    }
  } catch (error) {
    return { error: "Unauthorized - Invalid token", status: 401 };
  }
}

// Generate admin token
export function generateAdminToken() {
  return jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: "24h" });
}

// Verify user token
export function verifyUser(req) {
  // Support both Authorization header and x-auth-token
  let token = null;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.headers["x-auth-token"]) {
    token = req.headers["x-auth-token"];
  }
  
  if (!token) {
    return { error: "Unauthorized", status: 401 };
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, userId: decoded.id };
  } catch (error) {
    return { error: "Invalid token", status: 401 };
  }
}

// CORS headers for API responses
export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-auth-token",
  };
}

// Handle OPTIONS preflight
export function handleCors(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-auth-token");
    res.status(200).end();
    return true;
  }
  
  // Set CORS headers for actual request
  res.setHeader("Access-Control-Allow-Origin", "*");
  return false;
}
