import mongoose from 'mongoose';

// Cached connection for serverless environments
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!process.env.MONGO_URI) {
    throw new Error(
      'MONGO_URI environment variable is not set. Please add it in Vercel Project Settings → Environment Variables.'
    );
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000, // Fail fast instead of hanging (default is 30s)
      connectTimeoutMS: 8000,
    };

    cached.promise = mongoose
      .connect(process.env.MONGO_URI, opts)
      .then((mongoose) => {
        console.log('[MongoDB] Connected successfully');
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset so next call retries
    // Make the error message clearer
    if (e.message?.includes('ENOTFOUND') || e.message?.includes('querySrv')) {
      throw new Error(
        `MongoDB DNS resolution failed. Your MONGO_URI is likely wrong or your Atlas cluster hostname is incorrect. Original: ${e.message}`
      );
    }
    if (e.message?.includes('Authentication failed')) {
      throw new Error(
        `MongoDB authentication failed. Check your Atlas username/password in MONGO_URI. Original: ${e.message}`
      );
    }
    throw e;
  }

  return cached.conn;
}
