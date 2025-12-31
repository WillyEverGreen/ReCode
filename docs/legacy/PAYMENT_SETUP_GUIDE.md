# Payment Integration Setup Guide

## ✅ What's Been Implemented

### Backend (API Endpoints)
- ✅ `/api/payment/create-order.js` - Creates Razorpay order
- ✅ `/api/payment/verify-payment.js` - Verifies payment and upgrades user
- ✅ `/api/payment/webhook.js` - Handles Razorpay webhooks

### Frontend (Components)
- ✅ `components/UpgradeModal.tsx` - Payment modal with Razorpay integration
- ✅ `components/UsageDisplay.tsx` - Updated with upgrade button

### Dependencies
- ✅ `razorpay` package installed

### Configuration
- ✅ `.env.example` updated with Razorpay variables

---

## 🔧 Setup Instructions

### Step 1: Create Razorpay Account

1. Go to https://razorpay.com
2. Sign up for an account
3. Complete KYC verification (required for live mode)
4. Navigate to **Settings → API Keys**

### Step 2: Get API Keys

#### Test Mode (for development):
1. Go to **Settings → API Keys**
2. Click **Generate Test Key**
3. Copy:
   - **Key ID**: `rzp_test_xxxxxxxxxxxxx`
   - **Key Secret**: Click "Show" and copy

#### Live Mode (for production):
1. Complete KYC verification
2. Go to **Settings → API Keys**
3. Click **Generate Live Key**
4. Copy:
   - **Key ID**: `rzp_live_xxxxxxxxxxxxx`
   - **Key Secret**: Click "Show" and copy

### Step 3: Configure Webhook

1. Go to **Settings → Webhooks**
2. Click **+ Add New Webhook**
3. Enter webhook URL:
   - **Development**: `https://your-vercel-url.vercel.app/api/payment/webhook`
   - **Production**: `https://your-domain.com/api/payment/webhook`
4. Select events to listen to:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
   - ✅ `subscription.cancelled`
5. Copy the **Webhook Secret**

### Step 4: Add Environment Variables

Add these to your `.env` file:

```bash
# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Important**: 
- Use **test keys** for development
- Use **live keys** only in production
- Never commit `.env` file to Git

### Step 5: Deploy to Vercel

1. Push your code to GitHub
2. Deploy to Vercel
3. Add environment variables in Vercel:
   - Go to **Settings → Environment Variables**
   - Add all three Razorpay variables
   - Redeploy

### Step 6: Test Payment Flow

#### Test in Development:
1. Run `vercel dev`
2. Login to your app
3. Click "Upgrade to Pro" button
4. Use Razorpay test cards:
   - **Success**: `4111 1111 1111 1111`
   - **Failure**: `4000 0000 0000 0002`
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date

#### Verify:
1. Check console logs for payment success
2. Verify user plan updated to "pro"
3. Check usage shows "unlimited"
4. Verify no usage limits applied

---

## 💳 Test Cards

### Successful Payment
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
```

### Failed Payment
```
Card Number: 4000 0000 0000 0002
CVV: 123
Expiry: 12/25
```

### More Test Cards
- https://razorpay.com/docs/payments/payments/test-card-details/

---

## 🔍 Testing Checklist

### Before Going Live:
- [ ] Test successful payment
- [ ] Test failed payment
- [ ] Verify user upgraded to Pro
- [ ] Check unlimited access works
- [ ] Test webhook events
- [ ] Verify payment logs
- [ ] Test on mobile devices
- [ ] Check email notifications (if implemented)

### Production Checklist:
- [ ] KYC verification complete
- [ ] Live API keys configured
- [ ] Webhook URL updated
- [ ] SSL certificate active
- [ ] Test with real ₹1 payment
- [ ] Monitor first few transactions
- [ ] Set up payment alerts

---

## 📊 Payment Flow

### User Journey:
1. User clicks "Upgrade to Pro"
2. UpgradeModal opens
3. User clicks "Upgrade to Pro Now"
4. Frontend calls `/api/payment/create-order`
5. Razorpay modal opens
6. User enters payment details
7. Payment processed by Razorpay
8. Frontend receives payment response
9. Frontend calls `/api/payment/verify-payment`
10. Backend verifies signature
11. User upgraded to Pro
12. Page refreshes with Pro access

### Webhook Flow:
1. Payment captured by Razorpay
2. Razorpay sends webhook to `/api/payment/webhook`
3. Backend verifies webhook signature
4. Backend processes event (backup upgrade)
5. Logs payment details

---

## 🐛 Troubleshooting

### "Payment system not configured"
- **Cause**: Razorpay keys not in `.env`
- **Fix**: Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

### "Invalid signature"
- **Cause**: Wrong webhook secret or key secret
- **Fix**: Verify keys match Razorpay dashboard

### "Already a Pro user"
- **Cause**: User already has Pro plan
- **Fix**: Expected behavior, no action needed

### Payment succeeds but user not upgraded
- **Cause**: Verification failed or network error
- **Fix**: Check backend logs, webhook will retry

### Razorpay modal doesn't open
- **Cause**: Razorpay script not loaded
- **Fix**: Check browser console, ensure script loads

---

## 💰 Pricing & Fees

### Your Pricing:
- **Pro Plan**: ₹199/month

### Razorpay Fees:
- **Domestic Cards**: 2% + GST
- **UPI**: 2% + GST
- **Wallets**: 2% + GST
- **Net Banking**: 2% + GST

### Example Calculation:
```
Sale Price: ₹199
Razorpay Fee: ₹3.98 (2%)
GST on Fee: ₹0.72 (18% of fee)
Total Fee: ₹4.70
Net Revenue: ₹194.30
```

---

## 📝 Next Steps

### Immediate:
1. ✅ Set up Razorpay account
2. ✅ Add API keys to `.env`
3. ✅ Test payment flow
4. ✅ Deploy to Vercel

### Short Term:
5. Add email notifications on upgrade
6. Create subscription management page
7. Add invoice generation
8. Implement auto-renewal

### Long Term:
9. Add annual plan (₹1999/year - save 16%)
10. Add team plans
11. Add promo codes/coupons
12. Implement referral system

---

## 🔐 Security Best Practices

1. **Never expose secrets**:
   - Keep `.env` in `.gitignore`
   - Use environment variables in Vercel
   - Never log secrets

2. **Always verify signatures**:
   - Verify payment signature on backend
   - Verify webhook signature
   - Don't trust frontend data

3. **Use HTTPS**:
   - Razorpay requires HTTPS in production
   - Vercel provides SSL automatically

4. **Monitor transactions**:
   - Check Razorpay dashboard daily
   - Set up payment alerts
   - Monitor failed payments

---

## 📞 Support

### Razorpay Support:
- **Email**: support@razorpay.com
- **Docs**: https://razorpay.com/docs
- **Dashboard**: https://dashboard.razorpay.com

### Testing:
- **Test Mode**: Use test keys, no real money
- **Live Mode**: Real transactions, requires KYC

---

## ✅ Status

**Payment Integration**: COMPLETE ✅

All code is ready. You just need to:
1. Create Razorpay account
2. Get API keys
3. Add to `.env`
4. Test!

**Estimated Setup Time**: 30 minutes
