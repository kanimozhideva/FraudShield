require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fraud_detection';

async function cleanupDuplicates() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for duplicate report cleanup...');

    const FraudReport = require('../models/FraudReport');

    // Aggregate to find duplicate (transactionId, userId) pairs
    const duplicates = await FraudReport.aggregate([
      {
        $group: {
          _id: { transactionId: '$transactionId', userId: '$userId' },
          ids: { $push: '$_id' },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log(`Found ${duplicates.length} duplicate report groups.`);

    let totalDeleted = 0;
    for (const group of duplicates) {
      // Keep the first report, remove the rest
      const [keepId, ...deleteIds] = group.ids;
      console.log(`Keeping report ${keepId}, removing ${deleteIds.length} duplicate(s)...`);
      const res = await FraudReport.deleteMany({ _id: { $in: deleteIds } });
      totalDeleted += res.deletedCount;
    }

    console.log(`Cleanup complete. Total duplicate reports removed: ${totalDeleted}`);

    // Create unique compound index to prevent future duplicate reports
    await FraudReport.collection.createIndex({ transactionId: 1, userId: 1 }, { unique: true });
    console.log('Unique compound index created on FraudReport (transactionId, userId).');

    process.exit(0);
  } catch (err) {
    console.error('Error cleaning up duplicate reports:', err);
    process.exit(1);
  }
}

cleanupDuplicates();
