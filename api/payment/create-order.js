import Razorpay from 'razorpay';
import { connectDB } from '../_lib/mongodb.js';
import { handleCors } from '../_lib/auth.js';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

/**
 * POST /api/payment/create-order
 * Creates a Razorpay order for Pro plan subscription
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Verify user is logged in
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    let userId;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      userId = decoded.id;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already Pro
    if (user.plan === 'pro') {
      return res.status(400).json({ 
        error: 'Already a Pro user',
        message: 'You are already subscribed to the Pro plan'
      });
    }

    // Check Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('[PAYMENT] Razorpay credentials not configured');
      return res.status(500).json({ 
        error: 'Payment system not configured',
        message: 'Please contact support'
      });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Create order
    const amount = 24900; // ₹249 in paise
    const currency = 'INR';
    
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        email: user.email,
        username: user.username,
        plan: 'pro'
      }
    });

    console.log(`[PAYMENT] Order created for user ${user.username}: ${order.id}`);

    return res.json({
      success: true,
      orderId: order.id,
      amount,
      currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      user: {
        name: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('[PAYMENT] Create order error:', error);
    return res.status(500).json({ 
      error: 'Failed to create order',
      message: error.message
    });
  }
}
