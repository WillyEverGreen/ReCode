# ReCode - Local LLM Setup Guide (Ollama)

## Prerequisites

1. **Ollama installed** with these models:
   - `qwen2.5-coder:7b` (for code generation)
   - `qwen2.5:7b` (for explanations)
   - `deepseek-r1:7b` (for reasoning)

2. **MongoDB Atlas** connection string in `.env`

3. **Node.js** installed

## Environment Configuration (.env file)

Add these lines to your `.env` file:

```env
# AI Provider Configuration
AI_PROVIDER=ollama

# API Configuration for Development
VITE_API_URL=http://localhost:5000

# MongoDB Connection (update with your actual connection string)
MONGO_URI=your_mongodb_connection_string_here

# JWT Secret
JWT_SECRET=your_jwt_secret_key_change_this_in_production
```

## Important Files for Local LLM

### 1. api/\_lib/aiConfig.js

This file dynamically selects the AI provider and model based on the task.

### 2. api/solution/index.js

Update to use `getAIConfig()` instead of hardcoded `AI_MODEL` and `AI_API_KEY`.

### 3. api/health.js

Enhanced health check that verifies Ollama connectivity.

### 4. services/aiService.ts

Frontend service that handles AI API calls.

## Running the App

### Method 1: Use the Express Server (RECOMMENDED for Local Development)

**Terminal 1 - Start Backend:**

```bash
npm run server
```

This starts the API server on http://localhost:5000

**Terminal 2 - Start Frontend:**

```bash
npm run dev
```

This starts Vite on http://localhost:5173 (or 3002)

**Access the app at**: http://localhost:5173

### Method 2: Use Vercel Dev (NOT RECOMMENDED with current setup)

```bash
npm run dev:vercel
```

Note: Vercel dev has issues with ES modules and serverless functions in development.

## Testing the Setup

1. **Check Health Endpoint:**

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
```

Should return:

```json
{
  "status": "ok",
  "services": {
    "mongodb": { "status": "ok" },
    "ai": {
      "status": "ok",
      "provider": "ollama",
      "model": "qwen2.5:7b"
    }
  }
}
```

2. **Test Solution Generation:**

- Login to the app
- Enter a DSA problem like "Two Sum"
- Select language (e.g., Python)
- Click "Get Solution"
- Should receive AI-generated solution from Ollama

## Troubleshooting

### Error: "Failed to fetch questions" with "import { c"... is not valid JSON

- **Cause**: Vercel dev is serving source code instead of running API functions
- **Solution**: Use the Express server method instead (`npm run server` + `npm run dev`)

### Error: "ERR_CONNECTION_REFUSED" on port 5000

- **Cause**: Backend server not running
- **Solution**: Run `npm run server` in a separate terminal

### Error: "Failed to fetch" or CORS errors

- **Cause**: Frontend trying to reach wrong API URL
- **Solution**: Ensure `.env` has `VITE_API_URL=http://localhost:5000`
- Restart the frontend server after changing `.env`

### Ollama Connection Issues

- **Check Ollama is running**: `ollama list`
- **Test model availability**: `ollama run qwen2.5:7b "test"`
- **Verify health endpoint**: Health API should show Ollama status

## Key Code Changes for Local LLM

### Before (using hardcoded constants):

```javascript
const response = await fetch(`${AI_API_KEY}/api/generate`, {
  method: "POST",
  body: JSON.stringify({
    model: AI_MODEL,
    // ...
  }),
});
```

### After (using dynamic config):

```javascript
const aiConfig = getAIConfig("coding");
const response = await fetch(`${aiConfig.apiUrl}/api/generate`, {
  method: "POST",
  body: JSON.stringify({
    model: aiConfig.model,
    // ...
  }),
});
```

## Production Deployment Note

When deploying to Vercel:

- The serverless functions in `/api` directory will work correctly
- Set `AI_PROVIDER=ollama` is NOT suitable for production (Ollama must be self-hosted)
- Consider using `AI_PROVIDER=openai` or `AI_PROVIDER=fireworks` for production
- Update environment variables in Vercel dashboard

## Summary

**For local development with Ollama:**

1. Set `AI_PROVIDER=ollama` in `.env`
2. Set `VITE_API_URL=http://localhost:5000` in `.env`
3. Run backend: `npm run server` (Terminal 1)
4. Run frontend: `npm run dev` (Terminal 2)
5. Access: http://localhost:5173

This setup keeps frontend and backend separate, avoiding Vercel dev's ES module issues while allowing full Ollama integration.
