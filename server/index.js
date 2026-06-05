import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(rootDir, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Dynamic Import Helper
const importHandler = async (filePath) => {
  const fullPath = path.join(rootDir, filePath);
  // Manual file URL construction to ensure consistency on Windows
  // Replace backslashes with forward slashes and ensure encoded spaces
  const normalizedPath = fullPath.split(path.sep).join('/');
  const fileUrl = `file:///${normalizedPath}`;

  const module = await import(fileUrl);
  return module.default;
};

// Route Wrapper
const handle = (filePath) => async (req, res) => {
  try {
    const handler = await importHandler(filePath);
    await handler(req, res);
  } catch (err) {
    console.error(`Error in ${filePath}:`, err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: 'Internal Server Error', details: err.message });
    }
  }
};

// --- API ROUTES MAPPING ---

// Auth
app.use('/api/auth', async (req, res) => {
  // Use req.path instead of regex capturing group
  // req.path in middleware is relative to mount point
  const pathParts = req.path.split('/').filter(Boolean);
  req.query.route = pathParts;
  console.log('[SERVER] Auth route:', req.path, '-> Parsed:', pathParts);
  await handle('api/_auth/[...route].js')(req, res);
});

// Admin
app.use('/api/admin', async (req, res) => {
  const pathParts = req.path.split('/').filter(Boolean);
  req.query.route = pathParts;
  console.log('[SERVER] Admin route:', req.path, '-> Parsed:', pathParts);
  await handle('api/_admin/[...route].js')(req, res);
});

// AI & Solutions (The focus of current task)
app.post('/api/solution', handle('api/_solution/index.js'));
app.post('/api/ai/analyze', handle('api/_ai/analyze.js'));

// Questions
app.get('/api/questions', handle('api/_questions/index.js'));
app.post('/api/questions', handle('api/_questions/index.js'));
app.get('/api/questions/:id', async (req, res) => {
  req.query.id = req.params.id;
  await handle('api/_questions/[id].js')(req, res);
});

// Usage
// Usage
app.use('/api/usage', async (req, res) => {
  // req.path is relative to /api/usage
  // e.g. / -> index.js
  // e.g. /increment -> [...route].js with route=['increment']

  if (req.path === '/' || req.path === '') {
    await handle('api/_usage/index.js')(req, res);
  } else {
    // Remove leading slash
    const pathStr = req.path.startsWith('/') ? req.path.slice(1) : req.path;
    req.query.route = pathStr.split('/').filter(Boolean);
    await handle('api/_usage/[...route].js')(req, res);
  }
});

// Health
app.get('/api/health', handle('api/_health.js'));

// Payment (Razorpay)
app.post('/api/payment/create-order', handle('api/_payment/create-order.js'));
app.post('/api/payment/verify', handle('api/_payment/verify.js'));
app.post('/api/payment/webhook', handle('api/_payment/webhook.js'));

// Start Server
app.listen(PORT, () => {
  console.log(`
🚀 Local Backend Server running on http://localhost:${PORT}
👉 API Routes mapped from /api directory
  `);
});
