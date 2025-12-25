import { connectDB } from "../_lib/mongodb.js";
import { handleCors, verifyAdmin } from "../_lib/auth.js";
import SolutionCache from "../../models/SolutionCache.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  // Verify admin
  const auth = verifyAdmin(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  await connectDB();

  // GET - List all cached solutions
  if (req.method === "GET") {
    try {
      const solutions = await SolutionCache.find({}, {
        questionName: 1,
        originalName: 1,
        language: 1,
        hitCount: 1,
        createdAt: 1
      }).sort({ hitCount: -1 }).limit(100);

      return res.json({ success: true, solutions });
    } catch (error) {
      console.error("Cached solutions error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
