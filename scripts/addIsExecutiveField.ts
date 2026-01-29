// scripts/addIsExecutiveField.ts
/**
 * Migration script to add isExecutive field to existing users
 * This ensures backward compatibility with the 145 existing users
 * 
 * Run this script using:
 * npm run migrate:isExecutive
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI || 'mongodb://localhost:27017/EmployeeCentralHub';

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is not set');
  console.log('Please add MONGODB_URI to your .env.local file');
  process.exit(1);
}

async function migrateIsExecutiveField() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    const formdatasCollection = db.collection('formdatas');

    // Count total users before migration
    const totalUsers = await formdatasCollection.countDocuments({});
    console.log(`\nTotal users in database: ${totalUsers}`);

    // Count users without isExecutive field
    const usersWithoutField = await formdatasCollection.countDocuments({
      isExecutive: { $exists: false }
    });
    console.log(`Users without isExecutive field: ${usersWithoutField}`);

    if (usersWithoutField === 0) {
      console.log('\n✓ All users already have the isExecutive field. No migration needed.');
      return;
    }

    // Update all users that don't have the isExecutive field
    // Set it to null (default value for non-executive users)
    const result = await formdatasCollection.updateMany(
      { isExecutive: { $exists: false } },
      { $set: { isExecutive: null } }
    );

    console.log(`\n✓ Migration completed successfully!`);
    console.log(`✓ Modified ${result.modifiedCount} user records`);

    // Verify the migration
    const usersStillWithoutField = await formdatasCollection.countDocuments({
      isExecutive: { $exists: false }
    });
    console.log(`\nUsers still without isExecutive field: ${usersStillWithoutField}`);

    // Show breakdown of isExecutive values
    const breakdown = await formdatasCollection.aggregate([
      {
        $group: {
          _id: '$isExecutive',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();

    console.log('\n📊 Breakdown of isExecutive values:');
    breakdown.forEach(item => {
      const value = item._id === null ? 'null (regular users)' : 
                   item._id === true ? 'true (executives)' : 
                   'false';
      console.log(`  • ${value}: ${item.count} users`);
    });

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n✓ MongoDB connection closed');
  }
}

// Run the migration
console.log('🚀 Starting migration to add isExecutive field...\n');
migrateIsExecutiveField()
  .then(() => {
    console.log('\n✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });