# User Roles and Plans System

## Overview

The ReCode application now supports user roles and subscription plans to differentiate between different types of users.

## User Schema Fields

### Role Field
- **Type**: String (enum)
- **Values**: `'user'` | `'admin'`
- **Default**: `'user'`
- **Purpose**: Determines user permissions and access levels

### Plan Field
- **Type**: String (enum)
- **Values**: `'free'` | `'pro'`
- **Default**: `'free'`
- **Purpose**: Determines feature access and usage limits

### Additional Fields
- **planStartDate**: Date when Pro plan started
- **planEndDate**: Date when Pro plan expires (for subscriptions)

## Current User Statistics

✅ **All existing users have been set to:**
- Role: `user`
- Plan: `free`

**Total Users**: 17
- **Admins**: 0
- **Regular Users**: 17
- **Pro Users**: 0
- **Free Users**: 17

## User Management

### View All Users
```bash
node scripts/manage-users.js list
```

### Make User an Admin
```bash
node scripts/manage-users.js make-admin user@example.com
```

### Remove Admin Privileges
```bash
node scripts/manage-users.js remove-admin user@example.com
```

### Upgrade User to Pro
```bash
node scripts/manage-users.js upgrade-pro user@example.com
```

### Downgrade User to Free
```bash
node scripts/manage-users.js downgrade-free user@example.com
```

## Feature Access by Plan

### Free Plan
- ✅ 5 AI analyses per day
- ✅ Basic code analysis
- ✅ Save up to 10 solutions
- ❌ Advanced insights
- ❌ Unlimited storage
- ❌ Export to PDF/Markdown
- ❌ Priority support

### Pro Plan (₹199/month)
- ✅ Unlimited AI analyses
- ✅ Advanced code insights
- ✅ Unlimited solution storage
- ✅ Export to PDF/Markdown
- ✅ Priority support
- ✅ All Free features

## Role Permissions

### Regular User
- Access to their own data
- Standard feature access based on plan
- Cannot access admin panel
- Cannot modify other users

### Admin
- Access to admin panel
- Can view all users
- Can manage user plans
- Can view system statistics
- Can clear caches
- Full system access

## Implementation Details

### Database Schema
```javascript
{
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  plan: { 
    type: String, 
    enum: ['free', 'pro'], 
    default: 'free' 
  },
  planStartDate: { type: Date },
  planEndDate: { type: Date }
}
```

### Checking User Plan in Code

#### Backend (Node.js)
```javascript
// In API routes
const user = await User.findById(userId);

if (user.plan === 'pro') {
  // Allow unlimited access
} else {
  // Check usage limits
  const usage = await UserUsage.getTodayUsage(userId);
  if (usage.getSolutionLeft === 0) {
    return res.status(429).json({ 
      error: 'Daily limit reached',
      upgradeMessage: 'Upgrade to Pro for unlimited access'
    });
  }
}
```

#### Frontend (React/TypeScript)
```typescript
// In components
interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro';
  planStartDate?: Date;
  planEndDate?: Date;
}

// Check if user is admin
if (user.role === 'admin') {
  // Show admin features
}

// Check if user is pro
if (user.plan === 'pro') {
  // Show pro features
}
```

## Usage Limits Enforcement

The usage limits are enforced in `api/usage/increment.js`:

```javascript
// Skip limit enforcement for Pro users
const user = await User.findById(userId);
if (user.plan === 'pro') {
  // Allow unlimited access
  await UserUsage.incrementUsage(userId, type);
  return res.json({ success: true });
}

// For Free users, check limits
const canContinue = await UserUsage.canMakeRequest(userId, type);
if (!canContinue) {
  return res.status(429).json({ 
    error: 'Daily limit reached',
    upgradeMessage: 'Upgrade to Pro for unlimited access!'
  });
}
```

## Migration History

### Initial Migration (2025-12-28)
- ✅ Added `role` field to User schema
- ✅ Added `plan` field to User schema
- ✅ Added `planStartDate` and `planEndDate` fields
- ✅ Set all existing users to `role: 'user'` and `plan: 'free'`
- ✅ Total users migrated: 17

## Next Steps

### To Implement Pro Plan Features:
1. **Payment Integration**: Add Razorpay/Stripe for subscriptions
2. **Plan Upgrade Flow**: Create UI for upgrading to Pro
3. **Usage Enforcement**: Update API endpoints to check user plan
4. **Admin Dashboard**: Add user management interface
5. **Plan Expiry**: Implement subscription renewal logic

### Recommended API Updates:
1. Update `/api/usage/increment` to skip limits for Pro users
2. Add `/api/user/upgrade` endpoint for plan upgrades
3. Add `/api/admin/users` endpoint for admin user management
4. Update authentication to include role and plan in JWT token

## Files Modified/Created

### Modified:
- `models/User.js` - Added role and plan fields

### Created:
- `scripts/migrate-user-plans.js` - Migration script
- `scripts/manage-users.js` - User management utility
- `USER_ROLES_AND_PLANS.md` - This documentation

## Testing

### Verify User Fields
```bash
# List all users with roles and plans
node scripts/manage-users.js list

# Make yourself an admin (for testing)
node scripts/manage-users.js make-admin your@email.com

# Upgrade yourself to Pro (for testing)
node scripts/manage-users.js upgrade-pro your@email.com
```

## Security Considerations

1. **Role Verification**: Always verify user role on the backend, never trust frontend
2. **Plan Checks**: Enforce plan limits on API endpoints, not just UI
3. **Admin Access**: Protect admin routes with role checks
4. **JWT Updates**: Consider including role/plan in JWT for faster checks

## Support

For questions or issues:
1. Check this documentation
2. Run `node scripts/manage-users.js` for usage help
3. Review the User model in `models/User.js`
