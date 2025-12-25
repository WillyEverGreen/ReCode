import { connectDB } from "../_lib/mongodb.js";
import { handleCors, verifyUser } from "../_lib/auth.js";
import Question from "../../models/Question.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  await connectDB();

  // Verify user for all routes
  const auth = verifyUser(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const userId = auth.userId;

  // Handle different methods
  if (req.method === "GET") {
    try {
      const questions = await Question.find({ userId }).sort({ timestamp: -1 });
      return res.json(questions);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method === "POST") {
    try {
      const newQuestion = new Question({
        ...req.body,
        userId,
      });
      const question = await newQuestion.save();
      return res.json(question);
    } catch (error) {
      console.error("Error saving question:", error);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
