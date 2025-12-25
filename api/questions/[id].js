import { connectDB } from "../_lib/mongodb.js";
import { handleCors, verifyUser } from "../_lib/auth.js";
import Question from "../../models/Question.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  await connectDB();

  // Verify user
  const auth = verifyUser(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const userId = auth.userId;
  
  // Extract ID from URL - Vercel passes query params
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Question ID required" });
  }

  if (req.method === "DELETE") {
    try {
      const question = await Question.findById(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      if (question.userId.toString() !== userId) {
        return res.status(401).json({ message: "Not authorized" });
      }

      await question.deleteOne();
      return res.json({ message: "Question removed" });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method === "GET") {
    try {
      const question = await Question.findById(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      if (question.userId.toString() !== userId) {
        return res.status(401).json({ message: "Not authorized" });
      }
      return res.json(question);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
