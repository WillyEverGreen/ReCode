# 🔧 Google OAuth Fix - redirect_uri_mismatch Error

## 🚨 Problem
You're getting this error on your production site (https://recode.sbs):
```
Access blocked: This app's request is invalid
Error 400: redirect_uri_mismatch
```

## 🎯 Root Cause
Your Google OAuth 2.0 Client is not configured to accept requests from `https://recode.sbs`. It only has `http://localhost:3000` configured.

---

## ✅ Solution

### Step 1: Access Google Cloud Console

1. Go to: **https://console.cloud.google.com/apis/credentials**
2. Sign in with the Google account that owns the OAuth app
3. Select your project (the one containing your OAuth credentials)

### Step 2: Find Your OAuth 2.0 Client ID

1. Look for **"OAuth 2.0 Client IDs"** section
2. Find the client that matches your `VITE_GOOGLE_CLIENT_ID` environment variable
3. Click on the **client name** (not the edit icon) to open the details

### Step 3: Edit OAuth Client Configuration

Click the **"EDIT"** button (pencil icon) at the top

### Step 4: Add Authorized JavaScript Origins

In the **"Authorized JavaScript origins"** section, add:

```
https://recode.sbs
```

**Keep your existing localhost origin:**
```
http://localhost:3000
```

**Final list should look like:**
```
Authorized JavaScript origins:
1. http://localhost:3000
2. https://recode.sbs
```

### Step 5: Add Authorized Redirect URIs

In the **"Authorized redirect URIs"** section, add:

```
https://recode.sbs/api/auth/google/callback
```

**Keep your existing localhost redirect:**
```
http://localhost:3000/api/auth/google/callback
```

**Final list should look like:**
```
Authorized redirect URIs:
1. http://localhost:3000/api/auth/google/callback
2. https://recode.sbs/api/auth/google/callback
```

### Step 6: Save Changes

1. Click **"SAVE"** at the bottom
2. Wait for the confirmation message

---

## ⏱️ Propagation Time

**Important:** Google OAuth changes take time to propagate:
- **Minimum:** 5-10 minutes
- **Average:** 15-30 minutes
- **Maximum:** Up to 1 hour (rare)

**Don't test immediately!** Wait at least 10 minutes before testing.

---

## 🧪 Testing

### After Waiting 10+ Minutes:

1. **Clear your browser cache** (or use Incognito/Private mode)
2. Go to: **https://recode.sbs**
3. Click **"Get Started"**
4. Click **"Google"** button
5. You should see the Google sign-in popup/redirect
6. Sign in with your Google account
7. You should be redirected back to your app and logged in

### If It Still Doesn't Work:

1. **Wait longer** (up to 1 hour)
2. **Clear browser cache completely**
3. **Try a different browser**
4. **Check the exact error message** - it might have changed

---

## 🔍 Verification Checklist

Before testing, verify these settings in Google Cloud Console:

- [ ] Authorized JavaScript origins includes `https://recode.sbs`
- [ ] Authorized redirect URIs includes `https://recode.sbs/api/auth/google/callback`
- [ ] No typos in the URLs (check for trailing slashes, http vs https)
- [ ] OAuth client is **enabled** (not disabled)
- [ ] You clicked **"SAVE"** after making changes
- [ ] You waited at least 10 minutes

---

## 📸 Visual Guide

### What Your Google OAuth Settings Should Look Like:

```
OAuth 2.0 Client ID: [Your Client ID]
Application type: Web application
Name: [Your App Name]

Authorized JavaScript origins
┌─────────────────────────────────────┐
│ http://localhost:3000               │
│ https://recode.sbs                  │
└─────────────────────────────────────┘

Authorized redirect URIs
┌──────────────────────────────────────────────────────┐
│ http://localhost:3000/api/auth/google/callback       │
│ https://recode.sbs/api/auth/google/callback          │
└──────────────────────────────────────────────────────┘
```

---

## 🐛 Common Mistakes

### ❌ Wrong:
```
https://recode.sbs/           ← Trailing slash
http://recode.sbs             ← Wrong protocol (http instead of https)
https://www.recode.sbs        ← Wrong subdomain (unless you use www)
```

### ✅ Correct:
```
https://recode.sbs
```

---

## 🔧 Alternative: Create New OAuth Client

If the above doesn't work, you can create a **new** OAuth 2.0 Client specifically for production:

### Steps:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"OAuth client ID"**
4. Choose **"Web application"**
5. Name it: `ReCode Production`
6. Add **Authorized JavaScript origins:**
   - `https://recode.sbs`
7. Add **Authorized redirect URIs:**
   - `https://recode.sbs/api/auth/google/callback`
8. Click **"CREATE"**
9. Copy the **Client ID**
10. Update your Vercel environment variable:
    - `VITE_GOOGLE_CLIENT_ID` = [new client ID]
11. Redeploy your app

---

## 🚀 GitHub OAuth (For Reference)

Your GitHub OAuth should also be configured. Verify in:
- https://github.com/settings/developers

**Authorization callback URL should be:**
```
https://recode.sbs/api/auth/github/callback
```

---

## 📝 Summary

### What You Need to Do:

1. ✅ Go to Google Cloud Console
2. ✅ Edit your OAuth 2.0 Client
3. ✅ Add `https://recode.sbs` to Authorized JavaScript origins
4. ✅ Add `https://recode.sbs/api/auth/google/callback` to Authorized redirect URIs
5. ✅ Save changes
6. ✅ Wait 10-30 minutes
7. ✅ Test Google login on production

### Expected Result:

- Google login works on `https://recode.sbs`
- No more `redirect_uri_mismatch` error
- Users can sign in with Google successfully

---

## 🆘 Still Having Issues?

### Check Vercel Environment Variables:

Make sure these are set in Vercel:
```
VITE_GOOGLE_CLIENT_ID=[your-client-id]
FRONTEND_URL=https://recode.sbs
VITE_API_URL=https://recode.sbs
```

### Check Browser Console:

1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors related to Google OAuth
4. Share the error message if you need help

### Check Network Tab:

1. Open DevTools (F12)
2. Go to Network tab
3. Click Google login button
4. Look for failed requests
5. Check the request URL and response

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Clicking Google button opens Google sign-in
2. ✅ You can select your Google account
3. ✅ You're redirected back to your app
4. ✅ You're logged in automatically
5. ✅ No error messages appear

---

## 📞 Need Help?

If you're still stuck after following this guide:

1. Take a screenshot of your Google OAuth settings
2. Share the exact error message
3. Check Vercel deployment logs
4. Verify all environment variables are set correctly

Good luck! 🚀
