import { connectDB } from '../../_lib/mongodb.js';
import UserUsage from '../../../models/UserUsage.js';
import jwt from 'jsonwebtoken';

export async function resetUsageHandler(req, res) {
  // CORS handled by parent

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'fallback-secret'
        );
        userId = decoded.id;
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } else {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { action } = req.body;

    if (action === 'clear-my-usage') {
      const result = await UserUsage.deleteMany({ userId });
      console.log(
        `[USAGE RESET] User ${userId} cleared ${result.deletedCount} records`
      );

      return res.json({
        success: true,
        message: `Cleared ${result.deletedCount} usage records`,
        deletedCount: result.deletedCount,
      });
    }

    if (action === 'clear-today') {
      const today = new Date().toISOString().split('T')[0];
      const result = await UserUsage.deleteMany({ userId, date: today });
      console.log(
        `[USAGE RESET] User ${userId} cleared today's usage (${result.deletedCount} records)`
      );

      return res.json({
        success: true,
        message: `Cleared today's usage (${result.deletedCount} records)`,
        deletedCount: result.deletedCount,
      });
    }

    return res.status(400).json({
      error: "Invalid action. Use 'clear-my-usage' or 'clear-today'",
    });
  } catch (error) {
    console.error('Usage Reset Error:', error);
    return res.status(500).json({ error: 'Failed to reset usage' });
  }
}
