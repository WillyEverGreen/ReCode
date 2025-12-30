import { connectDB } from "../_lib/mongodb.js";
import { handleCors, verifyUser } from "../_lib/auth.js";
import Question from "../../models/Question.js";

import User from "../../models/User.js";

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
      // Check user plan for retention policy
      const user = await User.findById(userId);
      const now = new Date();
      
      // Check trial status
      const isActiveTrial = user?.plan === 'trial' && user.trialEndDate && now < new Date(user.trialEndDate);
      
      // Check pro status (must start with 'pro' AND have valid end date or no end date (lifetime))
      const isActivePro = user?.plan === 'pro' && (!user.planEndDate || now < new Date(user.planEndDate));
      
      const hasFullAccess = isActivePro || isActiveTrial;
      
      const query = { userId };

      // Free tier (expired trial or non-pro): 24 hours retention
      if (!hasFullAccess) {
        // timestamp is Number (ms)
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        query.timestamp = { $gte: oneDayAgo };
      }

      const questions = await Question.find(query).sort({ timestamp: -1 });
      return res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
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
