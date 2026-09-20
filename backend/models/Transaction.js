const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  location: String,
  device: String,
  paymentMethod: String,
  timestamp: { type: Date, default: Date.now },
  riskScore: Number,
  riskLevel: String,
  fraudReasons: [String],
  source: { type: String, enum: ['manual', 'image'], default: 'manual' },
  transactionIdCustom: { type: String, default: null },
  activity: { type: String, default: null },
  imageAnalysis: {
    imageValidated: { type: Boolean, default: false },
    validationConfidence: { type: Number, default: 0 },
    ocrConfidence: { type: Number, default: 0 },
    extractedAt: Date
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);