import mongoose from "mongoose";

const UserUsageSchema = new mongoose.Schema({
  // Can be ObjectId for logged in users or string for anonymous (IP-based)
  userId: {
    type: String,
    required: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  getSolutionCount: {
    type: Number,
    default: 0
  },
  addSolutionCount: {
    type: Number,
    default: 0
  },
  variantCount: {
    type: Number,
    default: 0
  }
});

// Compound index for fast lookups
UserUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

// Free tier limits
const FREE_LIMITS = {
  getSolution: 3,
  addSolution: 2,
  variant: 1  // Variants are expensive, limit strictly
};

// Static method to get today's usage
UserUsageSchema.statics.getTodayUsage = async function(userId) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  let usage = await this.findOne({ userId, date: today });
  
  if (!usage) {
    usage = { getSolutionCount: 0, addSolutionCount: 0, variantCount: 0 };
  }
  
  return {
    getSolutionUsed: usage.getSolutionCount,
    addSolutionUsed: usage.addSolutionCount,
    variantUsed: usage.variantCount || 0,
    getSolutionLimit: FREE_LIMITS.getSolution,
    addSolutionLimit: FREE_LIMITS.addSolution,
    variantLimit: FREE_LIMITS.variant,
    getSolutionLeft: Math.max(0, FREE_LIMITS.getSolution - usage.getSolutionCount),
    addSolutionLeft: Math.max(0, FREE_LIMITS.addSolution - usage.addSolutionCount),
    variantLeft: Math.max(0, FREE_LIMITS.variant - (usage.variantCount || 0))
  };
};

// Static method to increment usage
UserUsageSchema.statics.incrementUsage = async function(userId, type) {
  const today = new Date().toISOString().split('T')[0];
  const fieldMap = {
    'getSolution': 'getSolutionCount',
    'addSolution': 'addSolutionCount',
    'variant': 'variantCount'
  };
  const field = fieldMap[type] || 'getSolutionCount';
  
  await this.findOneAndUpdate(
    { userId, date: today },
    { $inc: { [field]: 1 } },
    { upsert: true }
  );
};

// Static method to check if user can make request
UserUsageSchema.statics.canMakeRequest = async function(userId, type) {
  const usage = await this.getTodayUsage(userId);
  
  if (type === 'getSolution') {
    return usage.getSolutionLeft > 0;
  } else if (type === 'variant') {
    return usage.variantLeft > 0;
  } else {
    return usage.addSolutionLeft > 0;
  }
};

export default mongoose.model("UserUsage", UserUsageSchema);
