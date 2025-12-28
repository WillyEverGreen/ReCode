import crypto from 'crypto';
import { connectDB } from '../_lib/mongodb.js';
import { handleCors } from '../_lib/auth.js';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

/**
 * POST /api/payment/verify-payment
 * Verifies Razorpay payment signature and upgrades user to Pro
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

    // Get payment details from request
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        error: 'Missing payment details',
        required: ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature']
      });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('[PAYMENT] Invalid signature');
      return res.status(400).json({ 
        error: 'Payment verification failed',
        message: 'Invalid payment signature'
      });
    }

    // Signature is valid - upgrade user to Pro
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user plan
    const now = new Date();
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    user.plan = 'pro';
    user.planStartDate = now;
    user.planEndDate = oneMonthLater;
    await user.save();

    console.log(`[PAYMENT] ✅ User ${user.username} upgraded to Pro!`);
    console.log(`[PAYMENT] Payment ID: ${razorpay_payment_id}`);
    console.log(`[PAYMENT] Order ID: ${razorpay_order_id}`);

    return res.json({
      success: true,
      message: 'Payment verified successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        plan: user.plan,
        planStartDate: user.planStartDate,
        planEndDate: user.planEndDate
      },
      payment: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      }
    });

  } catch (error) {
    console.error('[PAYMENT] Verify payment error:', error);
    return res.status(500).json({ 
      error: 'Payment verification failed',
      message: error.message
    });
  }
}
