/**
 * Migration Script: Add Role and Plan Fields to Existing Users
 *
 * This script updates all existing users in the database to have:
 * - role: 'user' (default)
 * - plan: 'free' (default)
 *
 * Run this once after deploying the updated User model.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function migrateUserPlans() {
  try {
    console.log('='.repeat(60));
    console.log('USER PLAN MIGRATION');
    console.log('='.repeat(60));

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found in environment variables');
      process.exit(1);
    }

    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const allUsers = await User.find({});
    console.log(`📊 Found ${allUsers.length} users in database\n`);

    if (allUsers.length === 0) {
      console.log('ℹ️  No users to migrate');
      await mongoose.disconnect();
      return;
    }

    // Count users that need migration
    const usersNeedingMigration = allUsers.filter(
      (user) => !user.role || !user.plan
    );
    console.log(
      `🔄 Users needing migration: ${usersNeedingMigration.length}\n`
    );

    if (usersNeedingMigration.length === 0) {
      console.log('✅ All users already have role and plan fields!');
      await mongoose.disconnect();
      return;
    }

    // Update all users without role/plan
    console.log('📝 Updating users...\n');

    const result = await User.updateMany(
      {
        $or: [{ role: { $exists: false } }, { plan: { $exists: false } }],
      },
      {
        $set: {
          role: 'user',
          plan: 'free',
        },
      }
    );

    console.log(`✅ Migration completed!`);
    console.log(`   - Matched: ${result.matchedCount} users`);
    console.log(`   - Modified: ${result.modifiedCount} users\n`);

    // Verify the migration
    console.log('🔍 Verifying migration...\n');
    const verifyUsers = await User.find({});

    const stats = {
      total: verifyUsers.length,
      admins: verifyUsers.filter((u) => u.role === 'admin').length,
      users: verifyUsers.filter((u) => u.role === 'user').length,
      pro: verifyUsers.filter((u) => u.plan === 'pro').length,
      free: verifyUsers.filter((u) => u.plan === 'free').length,
    };

    console.log('📊 User Statistics:');
    console.log(`   Total Users: ${stats.total}`);
    console.log(`\n   By Role:`);
    console.log(`   - Admins: ${stats.admins}`);
    console.log(`   - Regular Users: ${stats.users}`);
    console.log(`\n   By Plan:`);
    console.log(`   - Pro: ${stats.pro}`);
    console.log(`   - Free: ${stats.free}`);

    // Show sample users
    console.log('\n📋 Sample Users (first 5):');
    verifyUsers.slice(0, 5).forEach((user, index) => {
      console.log(`\n   ${index + 1}. ${user.username} (${user.email})`);
      console.log(`      Role: ${user.role}`);
      console.log(`      Plan: ${user.plan}`);
      console.log(`      Provider: ${user.provider}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION SUCCESSFUL');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Migration Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB\n');
  }
}

// Run migration
migrateUserPlans();
