# 🚀 Quick Start Guide - ReCode with Local LLMs

## ✅ Status

All errors have been fixed! The application is now fully compatible with local LLMs (Ollama).

## 🔧 What Was Fixed

1. **Undefined AI Configuration Variables** - Fixed in `api/solution/index.js`
2. **Poor Error Handling** - Enhanced in `api/solution/index.js` and `api/usage/index.js`
3. **Health Check Endpoint** - Completely rewritten in `api/health.js`
4. **Local LLM Compatibility** - Verified all models are accessible

## 📋 Prerequisites

✅ Ollama is running on port 11434
✅ Models installed:

- qwen2.5-coder:7b
- qwen2.5:7b
- deepseek-r1:7b
- nomic-embed-text:latest

## 🎯 How to Start

### Option 1: Using Vercel Dev (Recommended)

```powershell
npm run dev:vercel
```

### Option 2: Using Vite Only (Frontend Only)

```powershell
npm run dev
```

**Note:** The API endpoints require Vercel dev server to work properly.

## 🧪 Testing

Once the server is running, open your browser to:

```
http://localhost:3000
```

Then:

1. Click "Get Solution"
2. Enter a problem name (e.g., "Two Sum")
3. Select language (e.g., "Python")
4. Click "Generate Solution"

### Expected Behavior:

- Solution should generate within 10-30 seconds
- Browser console should show: `[LLM] 🟢 Config: Task=coding Provider=Ollama Model=qwen2.5-coder:7b`
- No 500 errors should appear

## 🐛 Troubleshooting

### "AI service unavailable" error:

```powershell
# Check if Ollama is running
curl http://127.0.0.1:11434/api/tags

# If not running, start it:
ollama serve
```

### "Database connection failed" error:

- Check your `.env` file has correct `MONGO_URI`
- Verify internet connection (if using MongoDB Atlas)
- Check MongoDB Atlas IP whitelist includes your IP

### WebSocket errors in console:

- These are harmless HMR (Hot Module Reload) messages
- They don't affect API functionality
- Can be safely ignored

## 📊 Monitoring

### Check Health Status:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/health" | ConvertTo-Json -Depth 10
```

### Check Usage Limits:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/usage" | ConvertTo-Json
```

## 📝 Configuration

Current `.env` settings for local LLM:

```
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
OLLAMA_MODEL_REASONING=deepseek-r1:7b
OLLAMA_MODEL_CODING=qwen2.5-coder:7b
OLLAMA_MODEL_EXPLANATION=qwen2.5:7b
```

## 🎓 Model Usage

- **Reasoning (DSA Logic):** deepseek-r1:7b - Used for complex algorithmic thinking
- **Coding (Generation):** qwen2.5-coder:7b - Used for generating code solutions
- **Explanation (Simple Text):** qwen2.5:7b - Used for explanations and summaries

## ✨ Key Improvements

1. **Better Error Messages:**
   - Instead of: "Failed to generate solution"
   - Now: "AI service unavailable. Please ensure Ollama is running if using local models."

2. **Detailed Health Checks:**
   - MongoDB connection status
   - Ollama accessibility and model availability
   - Redis status (optional)

3. **Improved Logging:**
   - All API calls now log provider, model, and task type
   - Stack traces for debugging
   - Development mode shows detailed errors

## 📖 Documentation

- **Full Fix Details:** See `FIXES_SUMMARY.md`
- **API Endpoints:** Check `api/` folder
- **Model Configuration:** See `api/_lib/aiConfig.js`

## 🤝 Support

If you encounter any issues:

1. Check browser console (F12)
2. Check terminal where `vercel dev` is running
3. Run health check: `http://localhost:3000/api/health`
4. Verify Ollama is running: `ollama list`

---

**You're all set! Start the server and enjoy using local LLMs! 🎉**
