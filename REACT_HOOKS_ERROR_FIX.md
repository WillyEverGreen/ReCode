# Complete Fix for React Hooks & WebSocket Errors

## Issues Fixed

### 1. ✅ React Hooks Error (CRITICAL)
```
Invalid hook call. Hooks can only be called inside of the body of a function component.
TypeError: Cannot read properties of null (reading 'useState')
```

### 2. ✅ WebSocket Connection Error
```
WebSocket connection to 'ws://localhost:3000/?token=...' failed
[vite] failed to connect to websocket
```

### 3. ⚠️ Service Worker Errors (Browser Extension - Not Your App)
```
sw.js:45 Failed to execute 'put' on 'Cache': Request scheme 'chrome-extension' is unsupported
```

---

## Root Causes Identified

### Problem 1: Duplicate React Instances
**Location:** `index.html` lines 65-79

The HTML file had an **import map** loading React from CDN:
```html
<script type="importmap">
  {
    "imports": {
      "react": "https://aistudiocdn.com/react@^19.2.0",
      "react-dom": "https://aistudiocdn.com/react-dom@^19.2.0",
      ...
    }
  }
</script>
```

This created **TWO React instances**:
1. CDN version from import map
2. Local version from node_modules

React hooks **MUST** use the same React instance, so this caused the error.

### Problem 2: Vercel Dev Port Mismatch
Vercel dev proxies Vite through different ports:
- Browser connects to: `localhost:3000`
- Vite server runs on: `localhost:64498`
- WebSocket tries to connect to wrong port

---

## Solutions Applied

### Fix 1: Removed Import Map ✅
**File:** `index.html`

**Removed:**
```html
<script type="importmap">
  { "imports": { ... } }
</script>
```

**Why:** Vite handles ALL module resolution. The import map was:
- Creating duplicate React instances
- Conflicting with Vite's bundler
- Unnecessary for a Vite project

### Fix 2: Updated Vite Config ✅
**File:** `vite.config.ts`

**Added:**
```typescript
export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: {
        clientPort: 3000,  // ← Fix WebSocket port
        port: 3000
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom']  // ← Pre-bundle React
    },
    resolve: {
      dedupe: ['react', 'react-dom']   // ← Single React instance
    }
  };
});
```

**Changes:**
1. **`hmr.clientPort`**: Forces WebSocket to use port 3000
2. **`optimizeDeps.include`**: Pre-bundles React before app starts
3. **`resolve.dedupe`**: Ensures only ONE React instance

### Fix 3: Cleared Vite Cache ✅
```bash
Remove-Item -Recurse -Force node_modules\.vite
```

Old cached bundles were using the CDN React version.

---

## Service Worker Errors (Not Your Fault)

The `sw.js` errors are from a **browser extension** (not your app):
```
sw.js:45 Failed to execute 'put' on 'Cache': Request scheme 'chrome-extension' is unsupported
```

**Why:** Browser extensions try to cache their own resources, but Chrome's Cache API doesn't support `chrome-extension://` URLs.

**Solution:** Ignore these errors OR disable the extension causing them.

---

## Complete Updated Files

### `index.html` (Simplified)
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/jpeg" href="/favicon.jpg" />
    <title>ReCode - DSA Solution Generator</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <!-- Tailwind config and styles -->
    <link rel="stylesheet" href="/index.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
```

### `vite.config.ts` (Complete)
```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: {
          clientPort: 3000,
          port: 3000
        }
      },
      plugins: [react()],
      optimizeDeps: {
        include: ['react', 'react-dom']
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.QUBRID_API_KEY),
        'process.env.QUBRID_API_KEY': JSON.stringify(env.QUBRID_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
        dedupe: ['react', 'react-dom']
      }
    };
});
```

---

## Verification Steps

### 1. Restart Dev Server
```bash
# Stop current server (Ctrl+C)
vercel dev
```

### 2. Hard Refresh Browser
- **Windows/Linux:** Ctrl + Shift + R
- **Mac:** Cmd + Shift + R

### 3. Check Console
You should see:
- ✅ No "Invalid hook call" errors
- ✅ No "Cannot read properties of null" errors
- ✅ No WebSocket connection failures
- ✅ App loads and works normally

### 4. Verify HMR Works
1. Make a small change to any component
2. Save the file
3. Browser should update WITHOUT full reload
4. No errors in console

---

## Why This Happened

### Import Maps in Vite Projects
Import maps are for **native ES modules** in browsers without a bundler. Vite is a bundler, so:
- ❌ Import maps are unnecessary
- ❌ They conflict with Vite's module resolution
- ❌ They create duplicate dependencies
- ✅ Vite handles everything automatically

### Correct Setup for Vite + React
```
Browser → Vite Dev Server → Bundles node_modules → Single React instance
```

### Wrong Setup (What You Had)
```
Browser → Import Map (CDN React) + Vite (Local React) → Two React instances → Error!
```

---

## Best Practices

### ✅ DO:
- Let Vite handle all module resolution
- Install dependencies via npm/yarn
- Use `vite.config.ts` for configuration
- Trust Vite's bundler

### ❌ DON'T:
- Use import maps in Vite projects
- Load React from CDN when using Vite
- Mix CDN and bundled dependencies
- Override Vite's module resolution

---

## Future Prevention

### If You Need to Add Dependencies:
```bash
npm install package-name
```

Then import normally:
```typescript
import Something from 'package-name';
```

Vite will automatically:
1. Bundle the package
2. Optimize it
3. Handle HMR
4. Deduplicate shared dependencies

### Never Add to HTML:
```html
<!-- ❌ DON'T DO THIS in Vite projects -->
<script type="importmap">...</script>
<script src="https://cdn.example.com/react.js"></script>
```

---

## Status

✅ **Import map removed**
✅ **Vite config updated**
✅ **Cache cleared**
✅ **HMR configured**
✅ **React deduplicated**

**Next Step:** Restart `vercel dev` and hard refresh your browser!

The app should now work perfectly with:
- ✅ No React hooks errors
- ✅ Working WebSocket/HMR
- ✅ Fast hot module replacement
- ✅ Single React instance
