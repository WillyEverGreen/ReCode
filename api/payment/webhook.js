import crypto from 'crypto';
import { connectDB } from '../_lib/mongodb.js';
import { handleCors } from '../_lib/auth.js';
import User from '../../models/User.js';

/**
 * POST /api/payment/webhook
 * Handles Razorpay webhook events (payment.captured, subscription.cancelled, etc.)
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Verify webhook signature
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[WEBHOOK] Webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.error('[WEBHOOK] Invalid signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Process webhook event
    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`[WEBHOOK] Received event: ${event}`);

    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;
      
      default:
        console.log(`[WEBHOOK] Unhandled event: ${event}`);
    }

    return res.json({ success: true });

  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    return res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error.message
    });
  }
}

async function handlePaymentCaptured(payload) {
  const payment = payload.payment.entity;
  const notes = payment.notes;

  if (notes && notes.userId) {
    console.log(`[WEBHOOK] Payment captured for user: ${notes.userId}`);
    
    // User should already be upgraded by verify-payment endpoint
    // This is a backup/confirmation
    const user = await User.findById(notes.userId);
    if (user && user.plan !== 'pro') {
      const now = new Date();
      const oneMonthLater = new Date(now);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

      user.plan = 'pro';
      user.planStartDate = now;
      user.planEndDate = oneMonthLater;
      await user.save();

      console.log(`[WEBHOOK] ✅ User ${user.username} upgraded to Pro via webhook`);
    }
  }
}

async function handlePaymentFailed(payload) {
  const payment = payload.payment.entity;
  const notes = payment.notes;

  if (notes && notes.userId) {
    console.log(`[WEBHOOK] ❌ Payment failed for user: ${notes.userId}`);
    // You could send an email notification here
  }
}

async function handleSubscriptionCancelled(payload) {
  const subscription = payload.subscription.entity;
  const notes = subscription.notes;

  if (notes && notes.userId) {
    console.log(`[WEBHOOK] Subscription cancelled for user: ${notes.userId}`);
    
    // Downgrade user to free
    const user = await User.findById(notes.userId);
    if (user) {
      user.plan = 'free';
      user.planEndDate = new Date(); // Set to now
      await user.save();

      console.log(`[WEBHOOK] User ${user.username} downgraded to Free`);
    }
  }
}
