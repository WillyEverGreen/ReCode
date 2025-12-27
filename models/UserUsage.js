import mongoose from "mongoose";

const UserUsageSchema = new mongoose.Schema({
  // Can be ObjectId for logged in users or string for anonymous (IP-based)
  userId: {
    type: String,
    required: true,
    index: true
  },
  // Format: YYYY-MM-DD in UTC
  date: {
    type: String,
    required: true,
    index: true
  },
  getSolutionCount: {
    type: Number,
    default: 0,
    min: 0
  },
  addSolutionCount: {
    type: Number,
    default: 0,
    min: 0
  },
  variantCount: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for fast lookups (userId + date must be unique)
UserUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

// Update timestamp on save
UserUsageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Free tier limits (strict enforcement)
const FREE_LIMITS = {
  getSolution: 2,    // 2 "Get Solution" per day (expensive AI call)
  addSolution: 3,    // 3 "Add Solution" (code analysis) per day
  variant: 1         // 1 variant per day (expensive)
};

/**
 * Get current UTC date in YYYY-MM-DD format
 * This ensures consistent date calculation regardless of server timezone
 */
function getTodayUTC() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Get today's usage for a specific user
 * Returns usage stats with remaining counts
 */
UserUsageSchema.statics.getTodayUsage = async function(userId) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const today = getTodayUTC();
  let usage = await this.findOne({ userId, date: today });
  
  // If no usage record exists for today, return zeros
  if (!usage) {
    return {
      getSolutionUsed: 0,
      addSolutionUsed: 0,
      variantUsed: 0,
      getSolutionLimit: FREE_LIMITS.getSolution,
      addSolutionLimit: FREE_LIMITS.addSolution,
      variantLimit: FREE_LIMITS.variant,
      getSolutionLeft: FREE_LIMITS.getSolution,
      addSolutionLeft: FREE_LIMITS.addSolution,
      variantLeft: FREE_LIMITS.variant,
      resetsAt: getNextMidnightUTC()
    };
  }
  
  return {
    getSolutionUsed: usage.getSolutionCount || 0,
    addSolutionUsed: usage.addSolutionCount || 0,
    variantUsed: usage.variantCount || 0,
    getSolutionLimit: FREE_LIMITS.getSolution,
    addSolutionLimit: FREE_LIMITS.addSolution,
    variantLimit: FREE_LIMITS.variant,
    getSolutionLeft: Math.max(0, FREE_LIMITS.getSolution - (usage.getSolutionCount || 0)),
    addSolutionLeft: Math.max(0, FREE_LIMITS.addSolution - (usage.addSolutionCount || 0)),
    variantLeft: Math.max(0, FREE_LIMITS.variant - (usage.variantCount || 0)),
    resetsAt: getNextMidnightUTC()
  };
};

/**
 * Check if user can make a specific type of request
 * Returns true if under limit, false if limit reached
 */
UserUsageSchema.statics.canMakeRequest = async function(userId, type) {
  if (!userId || !type) {
    throw new Error("userId and type are required");
  }

  const usage = await this.getTodayUsage(userId);
  
  switch(type) {
    case 'getSolution':
      return usage.getSolutionLeft > 0;
    case 'addSolution':
      return usage.addSolutionLeft > 0;
    case 'variant':
      return usage.variantLeft > 0;
    default:
      throw new Error(`Invalid usage type: ${type}`);
  }
};

/**
 * Increment usage count for a specific type
 * Creates record if it doesn't exist (atomic operation)
 */
UserUsageSchema.statics.incrementUsage = async function(userId, type) {
  if (!userId || !type) {
    throw new Error("userId and type are required");
  }

  const today = getTodayUTC();
  const fieldMap = {
    'getSolution': 'getSolutionCount',
    'addSolution': 'addSolutionCount',
    'variant': 'variantCount'
  };
  
  const field = fieldMap[type];
  if (!field) {
    throw new Error(`Invalid usage type: ${type}`);
  }
  
  // Atomic increment with upsert (creates if doesn't exist)
  const result = await this.findOneAndUpdate(
    { userId, date: today },
    { 
      $inc: { [field]: 1 },
      $setOnInsert: { createdAt: new Date() },
      $set: { updatedAt: new Date() }
    },
    { 
      upsert: true, 
      new: true,  // Return updated document
      runValidators: true  // Enforce min: 0 constraint
    }
  );

  console.log(`[USAGE] Incremented ${type} for user ${userId}: ${result[field]}/${FREE_LIMITS[type]}`);
  return result;
};

/**
 * Check if limit is exceeded for a specific type
 * Returns { exceeded: boolean, current: number, limit: number }
 */
UserUsageSchema.statics.checkLimit = async function(userId, type) {
  if (!userId || !type) {
    throw new Error("userId and type are required");
  }

  const today = getTodayUTC();
  const usage = await this.findOne({ userId, date: today });
  
  const fieldMap = {
    'getSolution': 'getSolutionCount',
    'addSolution': 'addSolutionCount',
    'variant': 'variantCount'
  };
  
  const field = fieldMap[type];
  if (!field) {
    throw new Error(`Invalid usage type: ${type}`);
  }

  const current = usage ? (usage[field] || 0) : 0;
  const limit = FREE_LIMITS[type];
  
  return {
    exceeded: current >= limit,
    current,
    limit,
    remaining: Math.max(0, limit - current)
  };
};

/**
 * Get next midnight UTC as ISO string
 */
function getNextMidnightUTC() {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return tomorrow.toISOString();
}

export default mongoose.model("UserUsage", UserUsageSchema);
