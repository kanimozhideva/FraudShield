const mongoose = require('mongoose');

const investigationActivitySchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'FraudReport' },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  previousStatus: String,
  newStatus: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InvestigationActivity', investigationActivitySchema);
