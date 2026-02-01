// Unified API Router - Consolidates all routes into one serverless function
// This solves Vercel Hobby plan's 12 function limit

import healthHandler from './health.js';
import analyzeHandler from './ai/analyze.js';
import questionsHandler from './questions/index.js';
import questionByIdHandler from './questions/[id].js';
import solutionHandler from './solution/index.js';
import usageHandler from './usage/index.js';
import adminHandler from './admin/[...route].js';
import authHandler from './auth/[...route].js';
import paymentHandler from './payment/[...route].js';
import paymentWebhookHandler from './payment/webhook.js';
import githubCallbackHandler from './auth/github/callback.js';
import googleCallbackHandler from './auth/google/callback.js';

export default async function handler(req, res) {
  // Parse the route from the request URL
  const path = req.url.split('?')[0]; // Remove query params
  const segments = path.split('/').filter(Boolean);

  // Remove 'api' prefix if present (Vercel adds it)
  if (segments[0] === 'api') segments.shift();

  // Route matching
  try {
    // Health check
    if (segments.length === 0 || segments[0] === 'health') {
      return await healthHandler(req, res);
    }

    // AI routes
    if (segments[0] === 'ai' && segments[1] === 'analyze') {
      return await analyzeHandler(req, res);
    }

    // Questions routes
    if (segments[0] === 'questions') {
      if (segments.length === 1) {
        return await questionsHandler(req, res);
      }
      if (segments.length === 2 && segments[1]) {
        // Extract ID and pass it in query for compatibility
        req.query = req.query || {};
        req.query.id = segments[1];
        return await questionByIdHandler(req, res);
      }
    }

    // Solution route
    if (segments[0] === 'solution') {
      return await solutionHandler(req, res);
    }

    // Usage route
    if (segments[0] === 'usage') {
      return await usageHandler(req, res);
    }

    // Admin routes (catch-all)
    if (segments[0] === 'admin') {
      req.query = req.query || {};
      req.query.route = segments.slice(1);
      return await adminHandler(req, res);
    }

    // Auth routes
    if (segments[0] === 'auth') {
      // Special case: OAuth callbacks
      if (segments[1] === 'github' && segments[2] === 'callback') {
        return await githubCallbackHandler(req, res);
      }
      if (segments[1] === 'google' && segments[2] === 'callback') {
        return await googleCallbackHandler(req, res);
      }
      // Generic auth routes (catch-all)
      req.query = req.query || {};
      req.query.route = segments.slice(1);
      return await authHandler(req, res);
    }

    // Payment routes
    if (segments[0] === 'payment') {
      // Special case: webhook
      if (segments[1] === 'webhook') {
        return await paymentWebhookHandler(req, res);
      }
      // Generic payment routes (catch-all)
      req.query = req.query || {};
      req.query.route = segments.slice(1);
      return await paymentHandler(req, res);
    }

    // 404 - Route not found
    return res.status(404).json({
      error: 'Route not found',
      path: path,
      availableRoutes: [
        '/health',
        '/ai/analyze',
        '/questions',
        '/questions/:id',
        '/solution',
        '/usage',
        '/admin/*',
        '/auth/*',
        '/payment/*',
      ],
    });
  } catch (error) {
    console.error('[API Router Error]', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
