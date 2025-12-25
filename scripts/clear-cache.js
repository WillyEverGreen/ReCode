
import mongoose from 'mongoose';
import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const clearCache = async () => {
  console.log("🔥 Starting manual cache clear...");

  // 1. Clear Redis (Upstash)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      await redis.flushdb();
      console.log("✅ Redis (Upstash) cache cleared");
    } catch (err) {
      console.error("❌ Redis clear failed:", err.message);
    }
  } else {
    console.log("⚠️ Upstash Redis credentials not found, skipping.");
  }

  // 2. Clear MongoDB
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      
      const collections = await mongoose.connection.db.listCollections().toArray();
      const cacheCollection = collections.find(c => c.name === 'solutioncaches');
      
      if (cacheCollection) {
        await mongoose.connection.db.collection('solutioncaches').deleteMany({});
        console.log("✅ MongoDB 'solutioncaches' cleared");
      } else {
        console.log("⚠️ 'solutioncaches' collection not found in MongoDB.");
      }
      
      await mongoose.disconnect();
      console.log("✅ MongoDB disconnected");
    } catch (err) {
      console.error("❌ MongoDB clear failed:", err.message);
    }
  } else {
    console.log("⚠️ MONGO_URI not found, skipping MongoDB.");
  }

  console.log("✨ All done! Please restart your server now.");
};

// Execute and handle exit
clearCache()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
