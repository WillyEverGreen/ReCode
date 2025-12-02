import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  problemUrl: String,
  language: String,
  tags: String,
  code: { type: String, required: true },

  // AI Analysis
  dsaCategory: String,
  pattern: String,
  timeComplexity: String,
  spaceComplexity: String,
  problemOverview: String,
  testCases: String,
  visualization: String,
  coreLogic: String,
  edgeCases: String,
  syntaxNotes: String,
  improvementMarkdown: String,
  revisionNotes: [String],

  timestamp: { type: Number, default: Date.now },
});

export default mongoose.model("Question", questionSchema);
