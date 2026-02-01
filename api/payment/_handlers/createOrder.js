import Razorpay from 'razorpay';
import { connectDB } from '../../_lib/mongodb.js';
import jwt from 'jsonwebtoken';
import User from '../../../models/User.js';

/**
 * POST /api/payment/create-order
 */
export async function createOrderHandler(req, res) {
  // CORS handled by parent

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    let userId;

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      );
      userId = decoded.id;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.plan === 'pro') {
      return res.status(400).json({
        error: 'Already a Pro user',
        message: 'You are already subscribed to the Pro plan',
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('[PAYMENT] Razorpay credentials not configured');
      return res.status(500).json({
        error: 'Payment system not configured',
        message: 'Please contact support',
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amount = 24900;
    const currency = 'INR';

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `rcpt_${userId.toString().slice(-8)}_${Date.now().toString().slice(-10)}`,
      notes: {
        userId: userId.toString(),
        email: user.email,
        username: user.username,
        plan: 'pro',
      },
    });

    console.log(
      `[PAYMENT] Order created for user ${user.username}: ${order.id}`
    );

    return res.json({
      success: true,
      orderId: order.id,
      amount,
      currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      user: {
        name: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[PAYMENT] Create order error:', error);
    return res.status(500).json({
      error: 'Failed to create order',
      message: error.message,
    });
  }
}
