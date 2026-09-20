const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema({
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  riskScore: Number,
  riskLevel: String,
  reasons: [String],
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);