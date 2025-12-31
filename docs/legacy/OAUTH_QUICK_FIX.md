# 🚀 Quick OAuth Fix Reference

## 🔴 Current Issue
**Error:** `redirect_uri_mismatch` on https://recode.sbs
**Cause:** Google OAuth not configured for production domain

---

## ⚡ Quick Fix (5 Steps)

### 1️⃣ Open Google Cloud Console
👉 https://console.cloud.google.com/apis/credentials

### 2️⃣ Edit Your OAuth Client
- Find your OAuth 2.0 Client ID
- Click the pencil icon to edit

### 3️⃣ Add Production URLs

**Authorized JavaScript origins:**
```
https://recode.sbs
```

**Authorized redirect URIs:**
```
https://recode.sbs/api/auth/google/callback
```

### 4️⃣ Save & Wait
- Click **SAVE**
- Wait **10-30 minutes** for propagation

### 5️⃣ Test
- Clear browser cache
- Try Google login on https://recode.sbs

---

## 📋 Full Configuration

### Google OAuth Settings Should Include:

```
Authorized JavaScript origins:
├── http://localhost:3000          (for local dev)
└── https://recode.sbs             (for production)

Authorized redirect URIs:
├── http://localhost:3000/api/auth/google/callback    (for local dev)
└── https://recode.sbs/api/auth/google/callback       (for production)
```

---

## ✅ Verification

Before testing, confirm:
- [ ] Added `https://recode.sbs` to JavaScript origins
- [ ] Added `https://recode.sbs/api/auth/google/callback` to redirect URIs
- [ ] No typos (check https, no trailing slash)
- [ ] Clicked SAVE
- [ ] Waited at least 10 minutes

---

## 🔍 GitHub OAuth (Should Already Be Set)

Verify at: https://github.com/settings/developers

**Authorization callback URL:**
```
https://recode.sbs/api/auth/github/callback
```

---

## 📝 Notes

- **Localhost works** ✅ (you tested this successfully)
- **Production fails** ❌ (needs the fix above)
- **Propagation time:** 10-30 minutes
- **Don't test immediately** after saving

---

## 🆘 If Still Broken

1. Wait longer (up to 1 hour)
2. Check for typos in URLs
3. Try incognito/private mode
4. Check Vercel env vars:
   - `VITE_GOOGLE_CLIENT_ID`
   - `FRONTEND_URL=https://recode.sbs`
   - `VITE_API_URL=https://recode.sbs`

---

## 📖 Full Guide

See `GOOGLE_OAUTH_FIX.md` for detailed instructions with screenshots and troubleshooting.
