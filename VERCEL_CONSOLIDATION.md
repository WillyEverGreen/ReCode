# Vercel Serverless Function Consolidation

## Problem

Vercel Hobby plan limits deployments to **12 serverless functions maximum**. We had exactly 12 functions, which means any new endpoint would exceed the limit.

## Solution

Consolidated all API routes into a **single unified router** at `api/[...route].js`. This reduces the function count from 12 to just 1.

## What Changed

### Before (12 functions)

```
api/health.js                    → /api/health
api/admin/[...route].js          → /api/admin/*
api/auth/[...route].js           → /api/auth/*
api/auth/github/callback.js      → /api/auth/github/callback
api/auth/google/callback.js      → /api/auth/google/callback
api/ai/analyze.js                → /api/ai/analyze
api/payment/[...route].js        → /api/payment/*
api/payment/webhook.js           → /api/payment/webhook
api/questions/index.js           → /api/questions
api/questions/[id].js            → /api/questions/:id
api/solution/index.js            → /api/solution
api/usage/index.js               → /api/usage
```

### After (1 function)

```
api/[...route].js                → /api/* (all routes)
```

All routes work **exactly the same** from the frontend's perspective. The routing logic is now handled inside the unified router.

## Files Modified

1. **`api/[...route].js`** (NEW) - Unified router that imports and delegates to all handlers
2. **`vercel.json`** - Updated to route all `/api/*` paths to the unified router
3. **`.vercelignore`** - Prevents deploying old individual routes (keeps them locally for reference)

## Deployment

```bash
# Commit changes
git add .
git commit -m "fix: consolidate API routes for Vercel Hobby plan (12 function limit)"

# Deploy to Vercel
git push
```

or

```bash
vercel --prod
```

## Testing Locally

The app works the same locally:

```bash
npm run dev
```

All routes like `/api/questions`, `/api/ai/analyze`, etc. will continue working.

## Benefits

✅ **Under Vercel Hobby limit** - Only 1 serverless function deployed  
✅ **Room for growth** - Can add 11 more API endpoints if needed  
✅ **No frontend changes** - All URLs work the same  
✅ **Kept old files** - Original handlers preserved locally for reference  
✅ **Zero downtime** - Transparent migration

## Future Additions

To add a new API endpoint:

1. Create the handler file (e.g., `api/newfeature/index.js`)
2. Import it in `api/[...route].js`
3. Add routing logic to the switch statement
4. Deploy!

No need to worry about function limits anymore!
