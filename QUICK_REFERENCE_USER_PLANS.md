# Quick Reference: User Roles & Plans

## ✅ What Was Done

1. **Updated User Model** (`models/User.js`)
   - Added `role` field: `'user'` | `'admin'` (default: `'user'`)
   - Added `plan` field: `'free'` | `'pro'` (default: `'free'`)
   - Added `planStartDate` and `planEndDate` fields

2. **Updated TypeScript Types** (`types.ts`)
   - Added `UserRole` type
   - Added `UserPlan` type
   - Added `User` interface

3. **All Existing Users Updated**
   - ✅ 17 users set to `role: 'user'` and `plan: 'free'`

## 🚀 Quick Commands

### View All Users
```bash
node scripts/manage-users.js list
```

### Make Admin
```bash
node scripts/manage-users.js make-admin user@example.com
```

### Upgrade to Pro
```bash
node scripts/manage-users.js upgrade-pro user@example.com
```

### Downgrade to Free
```bash
node scripts/manage-users.js downgrade-free user@example.com
```

## 📊 Current Status

**Total Users**: 17
- **Admins**: 0
- **Regular Users**: 17
- **Pro**: 0
- **Free**: 17

## 🔧 Usage in Code

### Backend (Check Plan)
```javascript
import User from './models/User.js';

const user = await User.findById(userId);

if (user.plan === 'pro') {
  // Unlimited access
} else {
  // Check free tier limits
}
```

### Frontend (Check Role)
```typescript
import { User } from './types';

if (user.role === 'admin') {
  // Show admin panel
}

if (user.plan === 'pro') {
  // Show pro badge
}
```

## 📁 Files Modified/Created

### Modified:
- ✅ `models/User.js`
- ✅ `types.ts`

### Created:
- ✅ `scripts/migrate-user-plans.js`
- ✅ `scripts/manage-users.js`
- ✅ `USER_ROLES_AND_PLANS.md`
- ✅ `QUICK_REFERENCE_USER_PLANS.md` (this file)

## 🎯 Next Steps

To fully implement the plan system:

1. **Update Usage Limits** - Modify `api/usage/increment.js`:
   ```javascript
   const user = await User.findById(userId);
   if (user.plan === 'pro') {
     // Skip limit checks
   }
   ```

2. **Add Plan Badge** - Show user's plan in UI
3. **Payment Integration** - Add Razorpay/Stripe
4. **Admin Panel** - Create user management interface
5. **Upgrade Flow** - Build plan upgrade UI

## 💡 Example: Enforce Limits by Plan

```javascript
// In api/usage/increment.js
import User from '../../models/User.js';

export default async function handler(req, res) {
  const userId = await getUserId(req);
  const { type } = req.body;
  
  // Get user to check plan
  const user = await User.findById(userId);
  
  // Pro users get unlimited access
  if (user.plan === 'pro') {
    await UserUsage.incrementUsage(userId, type);
    return res.json({ success: true, unlimited: true });
  }
  
  // Free users have limits
  const canContinue = await UserUsage.canMakeRequest(userId, type);
  if (!canContinue) {
    return res.status(429).json({
      error: 'Daily limit reached',
      upgradeMessage: 'Upgrade to Pro for unlimited access!',
      currentPlan: 'free'
    });
  }
  
  await UserUsage.incrementUsage(userId, type);
  return res.json({ success: true });
}
```

## 🔐 Security Notes

- ✅ Always verify role/plan on backend
- ✅ Never trust frontend checks alone
- ✅ Include role/plan in JWT for faster checks
- ✅ Protect admin routes with middleware

## 📞 Support

For help:
- Read `USER_ROLES_AND_PLANS.md` for full documentation
- Run `node scripts/manage-users.js` for command help
- Check `models/User.js` for schema details
