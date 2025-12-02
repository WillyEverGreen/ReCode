import express from "express";
import Question from "../models/Question.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get all questions for user
router.get("/", auth, async (req, res) => {
  try {
    const questions = await Question.find({ userId: req.user.id }).sort({
      timestamp: -1,
    });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add new question
router.post("/", auth, async (req, res) => {
  try {
    const newQuestion = new Question({
      ...req.body,
      userId: req.user.id,
    });
    const question = await newQuestion.save();
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete question
router.delete("/:id", auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    if (question.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await question.deleteOne();
    res.json({ message: "Question removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
