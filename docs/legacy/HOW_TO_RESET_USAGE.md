# How to Reset Your Usage After the Fix

## Problem
After fixing the usage tracking bug, your new account is showing "Daily limit reached" because of old corrupted usage data in the database.

## Quick Solution (2 Steps)

### Step 1: Open Browser Console
1. Open your app at http://localhost:3000
2. Make sure you're **logged in** with the account that's having issues
3. Press `F12` or `Ctrl+Shift+I` to open Developer Tools
4. Click on the **Console** tab

### Step 2: Run Reset Script
Copy and paste this entire code into the console and press Enter:

```javascript
async function resetMyUsage() {
  console.log("🧹 Resetting your usage...\n");
  
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ No token found. Please login first.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/usage/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ action: "clear-my-usage" })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log("✅ ", data.message);
      console.log("🔄 Refreshing usage display...");
      window.dispatchEvent(new Event("usage-updated"));
      console.log("\n✨ Your usage has been reset!");
      console.log("📊 You should now see: Get Solution: 0/3, Add Solution: 0/2");
    } else {
      console.error("❌ Failed:", data.error);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run the reset
resetMyUsage();
```

### What You Should See:
```
🧹 Resetting your usage...
✅ Cleared X usage records
🔄 Refreshing usage display...
✨ Your usage has been reset!
📊 You should now see: Get Solution: 0/3, Add Solution: 0/2
```

## Verify the Fix
1. Refresh the page
2. The usage display should now show: **Get Solution: 0/3**
3. Try generating a solution - it should work now!
4. Watch the usage counter increment correctly

## For All Your Test Accounts
If you have multiple test accounts affected, repeat the process:
1. Login to the account
2. Run the reset script in console
3. Logout
4. Repeat for next account

## Alternative: Manual Database Clear (Advanced)

If you want to clear ALL usage data for ALL users:

1. Connect to your MongoDB database
2. Run this query:
   ```javascript
   db.userusages.deleteMany({})
   ```

This will give everyone a fresh start, but you'll lose all usage history.

## Why This Happened
- Before the fix, all users were tracked under the same anonymous ID
- That anonymous user accumulated usage
- After the fix, some users inherited that old usage data
- This reset clears the corrupted data

## Post-Reset
After resetting:
- ✅ Each account will have independent usage tracking
- ✅ Daily limits will work correctly per user
- ✅ Usage resets at midnight for each user
- ✅ No more shared limits!

## Files Created
- `api/usage/reset.js` - API endpoint for resetting usage
- `reset-usage-console.js` - Full script with instructions

**The fix is working perfectly - you just need to clear the old data!** 🎉
