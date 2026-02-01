import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 120, // The document will be automatically deleted after 120 seconds (2 minutes)
  },
});

export default mongoose.model('Otp', otpSchema);
