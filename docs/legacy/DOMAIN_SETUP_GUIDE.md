# 🌐 Domain Setup Guide - recode.sbs

## ✅ What You Need to Update

### 1. Environment Variables (.env file)

**Update these in your `.env` file:**

```bash
# Production Settings
NODE_ENV=production
FRONTEND_URL=https://recode.sbs

# API URL (if using Vercel, this will be the same)
VITE_API_URL=https://recode.sbs
```

**Important**: Make sure these are also set in **Vercel Dashboard**:
1. Go to https://vercel.com/your-project/settings/environment-variables
2. Add/Update:
   - `FRONTEND_URL` = `https://recode.sbs`
   - `VITE_API_URL` = `https://recode.sbs`
   - `NODE_ENV` = `production`

---

### 2. Update .env.example ✅

**File**: `.env.example`

```bash
# Production Settings
NODE_ENV=production
FRONTEND_URL=https://recode.sbs  # Updated from localhost:3000
```

---

### 3. OAuth Callback URLs

You need to update OAuth redirect URIs in:

#### **GitHub OAuth**:
1. Go to https://github.com/settings/developers
2. Find your OAuth App
3. Update **Authorization callback URL**:
   - Old: `http://localhost:3000/api/auth/github/callback`
   - New: `https://recode.sbs/api/auth/github/callback`

#### **Google OAuth** (if you're using it):
1. Go to https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Update **Authorized redirect URIs**:
   - Old: `http://localhost:3000/api/auth/google/callback`
   - New: `https://recode.sbs/api/auth/google/callback`

---

### 4. Razorpay Webhook URL

**Update webhook URL in Razorpay Dashboard:**

1. Go to https://dashboard.razorpay.com/app/webhooks
2. Update webhook URL:
   - Old: `http://localhost:3000/api/payment/webhook`
   - New: `https://recode.sbs/api/payment/webhook`

---

### 5. CORS Settings (if applicable)

Check if you have any CORS configuration that needs updating.

**File**: `api/_middleware.js` or similar

```javascript
// Update allowed origins
const allowedOrigins = [
  'https://recode.sbs',
  'https://www.recode.sbs',  // if you have www subdomain
  'http://localhost:3000'     // keep for local development
];
```

---

### 6. Vercel Configuration

**File**: `vercel.json` (if it exists)

Make sure it's configured correctly:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## 📋 Complete Checklist

### Environment Variables:
- [ ] Update `.env` file with production URLs
- [ ] Update Vercel environment variables
- [ ] Redeploy after updating env vars

### OAuth Providers:
- [ ] Update GitHub OAuth callback URL
- [ ] Update Google OAuth callback URL (if using)
- [ ] Test OAuth login on production

### Payment Gateway:
- [ ] Update Razorpay webhook URL
- [ ] Test payment flow on production
- [ ] Verify webhook receives events

### DNS & SSL:
- [ ] Verify DNS is pointing to Vercel
- [ ] Verify SSL certificate is active
- [ ] Test https://recode.sbs loads correctly

### Testing:
- [ ] Test signup/login
- [ ] Test OAuth (GitHub/Google)
- [ ] Test AI features
- [ ] Test payment flow
- [ ] Test trial system
- [ ] Test upgrade to Pro

---

## 🚀 Deployment Steps

### 1. Update Environment Variables in Vercel

```bash
# Go to Vercel Dashboard
https://vercel.com/your-project/settings/environment-variables

# Add/Update these:
FRONTEND_URL=https://recode.sbs
VITE_API_URL=https://recode.sbs
NODE_ENV=production

# Keep all other existing variables:
MONGO_URI=...
JWT_SECRET=...
QUBRID_API_KEY=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
GITHUB_CLIENT_SECRET=...
etc.
```

### 2. Redeploy

After updating environment variables:

```bash
# Option 1: Redeploy from Vercel Dashboard
# Go to Deployments → Click "Redeploy"

# Option 2: Push to Git
git add .
git commit -m "Update domain to recode.sbs"
git push

# Vercel will auto-deploy
```

### 3. Update OAuth Providers

**GitHub**:
```
1. https://github.com/settings/developers
2. Your OAuth App → Edit
3. Authorization callback URL: https://recode.sbs/api/auth/github/callback
4. Save
```

**Google** (if using):
```
1. https://console.cloud.google.com/apis/credentials
2. Your OAuth 2.0 Client → Edit
3. Authorized redirect URIs: https://recode.sbs/api/auth/google/callback
4. Save
```

### 4. Update Razorpay Webhook

```
1. https://dashboard.razorpay.com/app/webhooks
2. Edit webhook
3. URL: https://recode.sbs/api/payment/webhook
4. Save
```

---

## 🧪 Testing Checklist

### After Deployment:

1. **Basic Functionality**:
   ```
   ✓ Visit https://recode.sbs
   ✓ Landing page loads
   ✓ Navigation works
   ✓ Signup form appears
   ```

2. **Authentication**:
   ```
   ✓ Email signup works
   ✓ GitHub OAuth works
   ✓ Google OAuth works (if enabled)
   ✓ Login works
   ✓ JWT token is set
   ```

3. **Trial System**:
   ```
   ✓ New user gets 7-day trial
   ✓ Trial limits work (1 Get, 2 Analyze per day)
   ✓ Daily reset works
   ✓ Trial expiry works after 7 days
   ```

4. **Payment**:
   ```
   ✓ Upgrade button appears
   ✓ Razorpay modal opens
   ✓ Test payment works
   ✓ User upgraded to Pro
   ✓ Webhook receives events
   ```

5. **AI Features**:
   ```
   ✓ Get Solution works
   ✓ Analyze Solution works
   ✓ Variant works (Pro only)
   ✓ TC/SC explanations work
   ```

---

## 🔧 Troubleshooting

### Issue: OAuth not working
**Solution**: 
- Check callback URLs in GitHub/Google
- Verify they match exactly: `https://recode.sbs/api/auth/github/callback`
- No trailing slashes
- Use https, not http

### Issue: Payment webhook not receiving events
**Solution**:
- Check Razorpay webhook URL
- Verify it's `https://recode.sbs/api/payment/webhook`
- Check webhook secret matches `.env`
- Test with Razorpay test mode first

### Issue: Environment variables not working
**Solution**:
- Redeploy after changing env vars
- Check spelling and capitalization
- No spaces around `=` sign
- Use quotes for values with spaces

### Issue: CORS errors
**Solution**:
- Add `https://recode.sbs` to allowed origins
- Check API middleware
- Verify Vercel configuration

---

## 📝 Summary

### Files to Update:
1. ✅ `.env.example` - Update FRONTEND_URL
2. ⚠️ Vercel Dashboard - Update environment variables
3. ⚠️ GitHub OAuth - Update callback URL
4. ⚠️ Google OAuth - Update callback URL (if using)
5. ⚠️ Razorpay - Update webhook URL

### After Updates:
1. Redeploy from Vercel
2. Test all features
3. Monitor for errors
4. Check webhook logs

---

## ✅ Quick Start

```bash
# 1. Update Vercel Environment Variables
FRONTEND_URL=https://recode.sbs
VITE_API_URL=https://recode.sbs
NODE_ENV=production

# 2. Redeploy
git push  # or redeploy from Vercel dashboard

# 3. Update OAuth Callbacks
GitHub: https://recode.sbs/api/auth/github/callback
Google: https://recode.sbs/api/auth/google/callback

# 4. Update Razorpay Webhook
https://recode.sbs/api/payment/webhook

# 5. Test Everything!
```

---

## 🎉 You're Done!

Your app should now be live at **https://recode.sbs**!

Test thoroughly and monitor the first few users to ensure everything works correctly.

**Need help?** Check Vercel logs for any errors:
```
https://vercel.com/your-project/deployments
```
