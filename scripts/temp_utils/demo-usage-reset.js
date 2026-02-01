/**
 * Live Usage Reset Demonstration
 * This script shows how usage resets work in real-time
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserUsage from './models/UserUsage.js';

dotenv.config();

// Helper to get today's UTC date
function getTodayUTC() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Helper to get tomorrow's UTC date
function getTomorrowUTC() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

async function demonstrateReset() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🔄 LIVE USAGE RESET DEMONSTRATION');
    console.log('='.repeat(70));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('\n✅ Connected to MongoDB');

    const testUserId = 'demo_user_12345';
    const today = getTodayUTC();
    const tomorrow = getTomorrowUTC();

    console.log(`\n📅 Today (UTC): ${today}`);
    console.log(`📅 Tomorrow (UTC): ${tomorrow}`);

    // Step 1: Check current usage for today
    console.log('\n' + '-'.repeat(70));
    console.log('STEP 1: Check usage for TODAY');
    console.log('-'.repeat(70));

    const todayUsage = await UserUsage.getTodayUsage(testUserId);
    console.log(`\n📊 Usage for ${today}:`);
    console.log(
      `   Get Solution: ${todayUsage.getSolutionUsed}/${todayUsage.getSolutionLimit} (${todayUsage.getSolutionLeft} left)`
    );
    console.log(
      `   Add Solution: ${todayUsage.addSolutionUsed}/${todayUsage.addSolutionLimit} (${todayUsage.addSolutionLeft} left)`
    );

    // Step 2: Simulate using up today's limits
    console.log('\n' + '-'.repeat(70));
    console.log("STEP 2: Simulate using up TODAY's limits");
    console.log('-'.repeat(70));

    // Create/update today's record to show limits reached
    await UserUsage.findOneAndUpdate(
      { userId: testUserId, date: today },
      {
        $set: {
          getSolutionCount: 2,
          addSolutionCount: 3,
          variantCount: 1,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true }
    );

    const usedUpUsage = await UserUsage.getTodayUsage(testUserId);
    console.log(`\n📊 After using up limits for ${today}:`);
    console.log(
      `   Get Solution: ${usedUpUsage.getSolutionUsed}/${usedUpUsage.getSolutionLimit} (${usedUpUsage.getSolutionLeft} left) ❌`
    );
    console.log(
      `   Add Solution: ${usedUpUsage.addSolutionUsed}/${usedUpUsage.addSolutionLimit} (${usedUpUsage.addSolutionLeft} left) ❌`
    );
    console.log(
      `   Variant: ${usedUpUsage.variantUsed}/${usedUpUsage.variantLimit} (${usedUpUsage.variantLeft} left) ❌`
    );
    console.log(
      `\n   ⚠️  All limits reached! User cannot make more requests today.`
    );

    // Step 3: Simulate checking tomorrow's usage
    console.log('\n' + '-'.repeat(70));
    console.log("STEP 3: Simulate checking TOMORROW's usage (after reset)");
    console.log('-'.repeat(70));

    // Manually query for tomorrow's date to simulate what happens after midnight
    const tomorrowRecord = await UserUsage.findOne({
      userId: testUserId,
      date: tomorrow,
    });

    console.log(`\n🔍 Looking for record with date: ${tomorrow}`);
    console.log(
      `   Result: ${tomorrowRecord ? 'Found' : 'Not found (expected)'}`
    );

    if (!tomorrowRecord) {
      console.log(`\n✅ No record exists for ${tomorrow} yet!`);
      console.log(`   This means when the user makes a request tomorrow:`);
      console.log(`   - getTodayUsage() will return FRESH limits`);
      console.log(`   - Get Solution: 0/2 (2 left) ✅`);
      console.log(`   - Add Solution: 0/3 (3 left) ✅`);
      console.log(`   - Variant: 0/1 (1 left) ✅`);
    }

    // Step 4: Demonstrate the actual reset behavior
    console.log('\n' + '-'.repeat(70));
    console.log(
      'STEP 4: Show what getTodayUsage() returns for different dates'
    );
    console.log('-'.repeat(70));

    // Create a mock function that simulates getTodayUsage for any date
    async function getUsageForDate(userId, targetDate) {
      const record = await UserUsage.findOne({ userId, date: targetDate });

      if (!record) {
        return {
          date: targetDate,
          getSolutionUsed: 0,
          addSolutionUsed: 0,
          variantUsed: 0,
          getSolutionLimit: 2,
          addSolutionLimit: 3,
          variantLimit: 1,
          getSolutionLeft: 2,
          addSolutionLeft: 3,
          variantLeft: 1,
          status: 'FRESH_LIMITS',
        };
      }

      return {
        date: targetDate,
        getSolutionUsed: record.getSolutionCount || 0,
        addSolutionUsed: record.addSolutionCount || 0,
        variantUsed: record.variantCount || 0,
        getSolutionLimit: 2,
        addSolutionLimit: 3,
        variantLimit: 1,
        getSolutionLeft: Math.max(0, 2 - (record.getSolutionCount || 0)),
        addSolutionLeft: Math.max(0, 3 - (record.addSolutionCount || 0)),
        variantLeft: Math.max(0, 1 - (record.variantCount || 0)),
        status: 'EXISTING_RECORD',
      };
    }

    const todayData = await getUsageForDate(testUserId, today);
    const tomorrowData = await getUsageForDate(testUserId, tomorrow);

    console.log(`\n📊 For ${today} (TODAY):`);
    console.log(`   Status: ${todayData.status}`);
    console.log(
      `   Get Solution: ${todayData.getSolutionUsed}/${todayData.getSolutionLimit} (${todayData.getSolutionLeft} left) ${todayData.getSolutionLeft === 0 ? '❌' : '✅'}`
    );
    console.log(
      `   Add Solution: ${todayData.addSolutionUsed}/${todayData.addSolutionLimit} (${todayData.addSolutionLeft} left) ${todayData.addSolutionLeft === 0 ? '❌' : '✅'}`
    );

    console.log(`\n📊 For ${tomorrow} (TOMORROW):`);
    console.log(`   Status: ${tomorrowData.status} ✨`);
    console.log(
      `   Get Solution: ${tomorrowData.getSolutionUsed}/${tomorrowData.getSolutionLimit} (${tomorrowData.getSolutionLeft} left) ✅`
    );
    console.log(
      `   Add Solution: ${tomorrowData.addSolutionUsed}/${tomorrowData.addSolutionLimit} (${tomorrowData.addSolutionLeft} left) ✅`
    );

    // Final explanation
    console.log('\n' + '='.repeat(70));
    console.log('🎯 HOW THE RESET WORKS');
    console.log('='.repeat(70));
    console.log(`
The reset is AUTOMATIC and DATE-BASED:

1. ⏰ At midnight UTC, the date changes from ${today} to ${tomorrow}

2. 🔍 When user makes a request, getTodayUTC() returns: "${tomorrow}"

3. 🔎 System queries database: { userId: "${testUserId}", date: "${tomorrow}" }

4. ❌ No record found for ${tomorrow}

5. ✅ getTodayUsage() returns FRESH LIMITS:
   - Get Solution: 0/2 (2 left)
   - Add Solution: 0/3 (3 left)
   - Variant: 0/1 (1 left)

6. 🎉 User can make requests again!

📝 Key Points:
   • No cron jobs needed
   • No manual reset required
   • Old records (${today}) remain in database for analytics
   • Each day gets its own record
   • Reset happens automatically when date changes
    `);

    console.log('='.repeat(70));
    console.log('✅ DEMONSTRATION COMPLETE');
    console.log('='.repeat(70));

    // Cleanup: Remove demo user's record
    console.log(`\n🧹 Cleaning up demo user's record...`);
    const deleted = await UserUsage.deleteMany({ userId: testUserId });
    console.log(`   Deleted ${deleted.deletedCount} demo record(s)`);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB\n');
  }
}

demonstrateReset();
