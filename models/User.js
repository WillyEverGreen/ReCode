import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for OAuth users
  isVerified: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  // OAuth fields
  provider: { type: String, default: 'email' }, // 'email', 'google', 'github'
  providerId: { type: String }, // OAuth provider's user ID
  avatar: { type: String }, // Profile picture URL
  // User role and plan
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  plan: { 
    type: String, 
    enum: ['trial', 'pro'], 
    default: 'trial'  // New users start with 7-day trial
  },
  
  // Trial system (7-day trial with daily limits)
  trialStartDate: { 
    type: Date, 
    default: Date.now 
  },
  trialEndDate: { 
    type: Date, 
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  trialUsed: { 
    type: Boolean, 
    default: false 
  },
  
  // Pro plan subscription dates
  planStartDate: { type: Date }, // When pro plan started
  planEndDate: { type: Date }, // When pro plan expires (for subscriptions)
});

export default mongoose.model("User", userSchema);
