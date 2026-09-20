const mongoose = require('mongoose');

const fraudReportSchema = new mongoose.Schema(
  {
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fraudType: { type: String, required: true },
    description: { type: String, required: true },
    evidence: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Under Investigation', 'Confirmed Fraud', 'Resolved'],
      default: 'Pending'
    }
  },
  { timestamps: true }
);

// Prevent a user from submitting duplicate reports for the same transaction
fraudReportSchema.index({ transactionId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('FraudReport', fraudReportSchema);