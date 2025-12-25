import { connectDB } from "../_lib/mongodb.js";
import { handleCors, verifyAdmin } from "../_lib/auth.js";
import User from "../../models/User.js";
import Question from "../../models/Question.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify admin
  const auth = verifyAdmin(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    await connectDB();

    const users = await User.find({}, { password: 0 })
      .sort({ createdAt: -1 })
      .limit(100);

    // Get question counts for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const questionCount = await Question.countDocuments({ userId: user._id });
        return {
          id: user._id,
          email: user.email,
          username: user.username,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          questionCount
        };
      })
    );

    return res.json({ success: true, users: usersWithCounts });
  } catch (error) {
    console.error("Admin users error:", error);
    return res.status(500).json({ error: error.message });
  }
}
