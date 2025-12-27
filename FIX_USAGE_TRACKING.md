# CRITICAL FIX: Usage Tracking Per User

## Problem
**Every user account was showing the same usage statistics** (Get Solution: 0/3, Add Solution: 1/2). This is because user identification was completely broken.

## Root Cause
There was a **critical mismatch between JWT token creation and JWT token reading**:

### What Was Happening:
1. **Auth API** (`api/auth/[...route].js` lines 102, 133):
   ```javascript
   const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
   //                        ^^^ Creates token with 'id' field
   ```

2. **Usage APIs** were trying to read:
   ```javascript
   userId = decoded.userId;  // ❌ WRONG - token doesn't have 'userId'
   //                ^^^^^^ Trying to read non-existent field
   ```

### Result:
- `decoded.userId` was **always undefined**
- All logged-in users were treated as anonymous
- All users got the same anonymous user ID based on IP + User-Agent
- Users behind the same proxy/network showed the exact same usage

## Files Fixed

### 1. `api/usage/index.js` (Line 24)
**Before:**
```javascript
userId = decoded.userId;
```

**After:**
```javascript
userId = decoded.id; // FIX: JWT contains 'id', not 'userId'
console.log("[USAGE API] Logged in user ID:", userId);
```

### 2. `api/usage/increment.js` (Line 30)
**Before:**
```javascript
userId = decoded.userId;
```

**After:**
```javascript
userId = decoded.id; // FIX: JWT contains 'id', not 'userId'
console.log("[USAGE INCREMENT] Logged in user ID:", userId);
```

### 3. `api/solution/index.js` (Line 627)
**Before:**
```javascript
userId = decoded.userId;
```

**After:**
```javascript
userId = decoded.id; // FIX: JWT contains 'id', not 'userId'
console.log("[SOLUTION API] Logged in user ID:", userId);
```

## What's Fixed

✅ Each user account now has its own separate usage tracking
✅ User A using 2/3 Get Solutions won't affect User B's limit
✅ Usage stats are properly isolated per account
✅ Console logs added to verify correct user identification

## Testing Instructions

### Test 1: Multiple Accounts Show Different Usage
1. Login with **Account A**
2. Use Get Solution (1/3)
3. Check usage display - should show **1/3**
4. Logout
5. Login with **Account B** (fresh account)
6. Check usage display - should show **0/3** (not 1/3)
7. Use Get Solution
8. Check usage display - should show **1/3**
9. Login back to **Account A**
10. Check usage display - should still show **1/3** (preserved)

### Test 2: Verify Console Logs
Open your dev server logs and you should now see:
```
[USAGE API] Logged in user ID: 507f1f77bcf86cd799439011
[SOLUTION API] Logged in user ID: 507f1f77bcf86cd799439011
```

The user ID should be a MongoDB ObjectId string (24 hex characters), **not** `anon_...`

### Test 3: Anonymous Users Still Work
1. Logout completely
2. Use Get Solution
3. Should see usage tracking still works (falls back to IP-based tracking)
4. Console should show: `anon_[base64string]`

## Database Migration (Optional)

Since all previous usage was tracked under wrong user IDs, you may want to clean the database:

### Option 1: Clear All Usage (Fresh Start)
```javascript
// In MongoDB or using script
db.userusages.deleteMany({})
```

### Option 2: Keep Anonymous Usage Only
```javascript
// Delete only bad logged-in user usage (keeps anon users)
db.userusages.deleteMany({ userId: { $not: /^anon_/ } })
```

### Option 3: Do Nothing
- Let usage auto-reset at midnight
- New usage will be tracked correctly going forward

## Additional Improvements

The fix also added **debug logging** to help identify issues:
- `[USAGE API]` - Shows when usage is fetched
- `[SOLUTION API]` - Shows when solutions are generated
- `[USAGE INCREMENT]` - Shows when usage is incremented

You can monitor these logs to ensure proper user identification.

## Deployment

### If Using Vercel:
The fix is already saved. Just deploy:
```bash
vercel --prod
```

### If Running Locally:
Your `vercel dev` server should auto-reload. Check the logs for the new debug messages.

## Why This Went Unnoticed

This bug is **subtle** because:
1. The app still "worked" - it just tracked everyone under the same anonymous ID
2. Users could still use the app within limits
3. No error messages appeared
4. Only multi-user testing would reveal the issue

## Prevention

To prevent similar issues in the future:
1. Keep JWT payload field names **consistent** across auth and usage
2. Add TypeScript types for JWT payload
3. Add integration tests for multi-user scenarios
4. Log user IDs when debugging auth issues

---

**Status**: ✅ **FIXED** - All three API files updated
**Impact**: 🔴 **HIGH** - Affects all user usage tracking
**Deploy**: 🚀 **Deploy immediately** to fix production issue
