import mongoose from 'mongoose';

const SolutionCacheSchema = new mongoose.Schema({
  // Cache key components
  questionName: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  language: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },

  // Is this a variant (description-specific) solution?
  isVariant: {
    type: Boolean,
    default: false,
  },

  // Original question name as entered by user
  originalName: {
    type: String,
  },

  // The cached solution data
  solution: {
    type: Object,
    required: true,
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
  },
  hitCount: {
    type: Number,
    default: 0,
  },
});

// Compound index for fast lookups (questionName + language + isVariant)
SolutionCacheSchema.index(
  { questionName: 1, language: 1, isVariant: 1 },
  { unique: true }
);

export default mongoose.model('SolutionCache', SolutionCacheSchema);
