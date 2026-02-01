import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

async function clearUsage() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get UserUsage collection
    const UserUsage = mongoose.connection.collection('userusages');

    // Show current usage count
    const count = await UserUsage.countDocuments();
    console.log(`📊 Found ${count} usage records in database\n`);

    if (count === 0) {
      console.log('✨ Database is already clean!');
      process.exit(0);
    }

    // Show some examples
    const examples = await UserUsage.find({}).limit(5).toArray();
    console.log('📋 Sample usage records:');
    examples.forEach((record, i) => {
      console.log(
        `   ${i + 1}. User: ${record.userId}, Date: ${record.date}, GetSolution: ${record.getSolutionCount}`
      );
    });

    console.log('\n❓ What would you like to do?');
    console.log('   1. Delete ALL usage records (complete reset)');
    console.log("   2. Delete only today's usage (keep history)");
    console.log("   3. Delete specific user's usage");
    console.log('   4. Exit without changes\n');

    // For now, let's provide the option to clear all
    console.log('🧹 To clear ALL usage records, run with --confirm flag:');
    console.log('   node scripts/clear-usage.js --confirm\n');

    if (process.argv.includes('--confirm')) {
      console.log('🗑️  Deleting all usage records...');
      const result = await UserUsage.deleteMany({});
      console.log(`✅ Deleted ${result.deletedCount} records`);
      console.log('✨ Usage database is now clean!\n');
    } else if (process.argv.includes('--today')) {
      const today = new Date().toISOString().split('T')[0];
      console.log(`🗑️  Deleting today's usage (${today})...`);
      const result = await UserUsage.deleteMany({ date: today });
      console.log(`✅ Deleted ${result.deletedCount} records`);
      console.log("✨ Today's usage cleared!\n");
    } else if (process.argv.includes('--user')) {
      const userId = process.argv[process.argv.indexOf('--user') + 1];
      if (!userId) {
        console.log('❌ Please provide user ID: --user <userId>');
        process.exit(1);
      }
      console.log(`🗑️  Deleting usage for user: ${userId}...`);
      const result = await UserUsage.deleteMany({ userId });
      console.log(`✅ Deleted ${result.deletedCount} records`);
      console.log('✨ User usage cleared!\n');
    } else {
      console.log('ℹ️  Running in dry-run mode (no changes made)');
      console.log('   Add --confirm to actually delete records\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

clearUsage();
