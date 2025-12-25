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
  timeComplexityReason: String,
  spaceComplexity: String,
  spaceComplexityReason: String,
  problemOverview: String,
  testCases: mongoose.Schema.Types.Mixed, // Can be string or array
  coreLogic: mongoose.Schema.Types.Mixed, // Can be string or object
  edgeCases: mongoose.Schema.Types.Mixed, // Can be string or array
  syntaxNotes: mongoose.Schema.Types.Mixed, // Can be string or array
  improvementMarkdown: String,
  revisionNotes: [String],

  timestamp: { type: Number, default: Date.now },
});

export default mongoose.model("Question", questionSchema);
