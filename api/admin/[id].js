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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Solution ID required" });
  }

  // DELETE - Delete a specific cached solution
  if (req.method === "DELETE") {
    try {
      const result = await SolutionCache.findByIdAndDelete(id);
      if (!result) {
        return res.status(404).json({ error: "Cached solution not found" });
      }
      return res.json({ success: true, message: "Cached solution deleted" });
    } catch (error) {
      console.error("Delete cached solution error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
