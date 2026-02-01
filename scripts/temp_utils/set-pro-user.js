/**
 * Set User to Pro Plan
 * This script sets a specific user to Pro plan with 1 year validity
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function setUserToPro(email) {
  try {
    console.log('='.repeat(60));
    console.log('SET USER TO PRO');
    console.log('='.repeat(60));

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found in environment variables');
      process.exit(1);
    }

    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    console.log(`\n🔍 Searching for user: ${email}`);
    const user = await User.findOne({ email: email });

    if (!user) {
      console.log(`\n❌ User with email ${email} not found!`);
      console.log('\n📋 Available users:');
      const users = await User.find({}, 'email username plan planEndDate');
      users.forEach((u) => {
        const planInfo =
          u.plan === 'pro' && u.planEndDate
            ? `${u.plan} (expires: ${u.planEndDate.toISOString().split('T')[0]})`
            : u.plan;
        console.log(`  - ${u.email} (${u.username}) - ${planInfo}`);
      });
      process.exit(1);
    }

    console.log(`\n📧 Found user:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Current plan: ${user.plan}`);

    if (user.planEndDate) {
      console.log(`   Plan end date: ${user.planEndDate}`);
    }

    if (
      user.plan === 'pro' &&
      user.planEndDate &&
      user.planEndDate > new Date()
    ) {
      console.log(
        `\n✅ User is already a Pro user (expires: ${user.planEndDate})`
      );
      console.log(
        `   Days remaining: ${Math.ceil((user.planEndDate - new Date()) / (1000 * 60 * 60 * 24))}`
      );
    } else {
      // Set to Pro with 1 year validity
      const now = new Date();
      const oneYearLater = new Date(now);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      user.plan = 'pro';
      user.planStartDate = now;
      user.planEndDate = oneYearLater;
      await user.save();

      console.log(`\n✅ Successfully upgraded user to Pro!`);
      console.log(
        `   Start Date: ${user.planStartDate.toISOString().split('T')[0]}`
      );
      console.log(
        `  End Date: ${user.planEndDate.toISOString().split('T')[0]}`
      );
      console.log(`   Valid for: 1 year (365 days)\n`);
    }

    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
const emailToUpgrade = 'shadowblex2@gmail.com';
console.log(`\n🚀 Setting user ${emailToUpgrade} to Pro...\n`);
setUserToPro(emailToUpgrade);
