/**
 * User Management Utility
 * 
 * This script provides utilities to:
 * - View all users with their roles and plans
 * - Upgrade a user to Pro
 * - Make a user an Admin
 * - Downgrade a user to Free
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function manageUsers(action, email) {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);

    if (action === 'list') {
      // List all users
      console.log('\n' + '='.repeat(70));
      console.log('ALL USERS - ROLES & PLANS');
      console.log('='.repeat(70) + '\n');

      const users = await User.find({}).sort({ createdAt: -1 });
      
      if (users.length === 0) {
        console.log('No users found.');
      } else {
        console.log(`Total Users: ${users.length}\n`);
        
        users.forEach((user, index) => {
          const roleIcon = user.role === 'admin' ? '👑' : '👤';
          const planIcon = user.plan === 'pro' ? '⭐' : '🆓';
          
          console.log(`${index + 1}. ${roleIcon} ${planIcon} ${user.username}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   Role: ${user.role.toUpperCase()}`);
          console.log(`   Plan: ${user.plan.toUpperCase()}`);
          console.log(`   Provider: ${user.provider}`);
          console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
          if (user.planStartDate) {
            console.log(`   Pro Since: ${user.planStartDate.toLocaleDateString()}`);
          }
          console.log('');
        });

        // Statistics
        const stats = {
          admins: users.filter(u => u.role === 'admin').length,
          regularUsers: users.filter(u => u.role === 'user').length,
          pro: users.filter(u => u.plan === 'pro').length,
          free: users.filter(u => u.plan === 'free').length,
        };

        console.log('='.repeat(70));
        console.log('STATISTICS');
        console.log('='.repeat(70));
        console.log(`Admins: ${stats.admins} | Regular Users: ${stats.regularUsers}`);
        console.log(`Pro: ${stats.pro} | Free: ${stats.free}`);
        console.log('='.repeat(70) + '\n');
      }
    } else if (action === 'make-admin' && email) {
      // Make user an admin
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`❌ User with email "${email}" not found.`);
      } else {
        user.role = 'admin';
        await user.save();
        console.log(`✅ ${user.username} is now an ADMIN!`);
      }
    } else if (action === 'upgrade-pro' && email) {
      // Upgrade to Pro
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`❌ User with email "${email}" not found.`);
      } else {
        user.plan = 'pro';
        user.planStartDate = new Date();
        await user.save();
        console.log(`✅ ${user.username} upgraded to PRO!`);
      }
    } else if (action === 'downgrade-free' && email) {
      // Downgrade to Free
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`❌ User with email "${email}" not found.`);
      } else {
        user.plan = 'free';
        user.planStartDate = null;
        user.planEndDate = null;
        await user.save();
        console.log(`✅ ${user.username} downgraded to FREE.`);
      }
    } else if (action === 'remove-admin' && email) {
      // Remove admin privileges
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`❌ User with email "${email}" not found.`);
      } else {
        user.role = 'user';
        await user.save();
        console.log(`✅ ${user.username} is now a regular USER.`);
      }
    } else {
      console.log('\n📖 User Management Utility\n');
      console.log('Usage:');
      console.log('  node scripts/manage-users.js list');
      console.log('  node scripts/manage-users.js make-admin <email>');
      console.log('  node scripts/manage-users.js remove-admin <email>');
      console.log('  node scripts/manage-users.js upgrade-pro <email>');
      console.log('  node scripts/manage-users.js downgrade-free <email>');
      console.log('\nExamples:');
      console.log('  node scripts/manage-users.js list');
      console.log('  node scripts/manage-users.js make-admin user@example.com');
      console.log('  node scripts/manage-users.js upgrade-pro user@example.com\n');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get command line arguments
const action = process.argv[2];
const email = process.argv[3];

manageUsers(action, email);
