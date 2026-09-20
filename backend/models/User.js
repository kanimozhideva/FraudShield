const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  status: { type: String, enum: ['active', 'frozen'], default: 'active' },
  isFrozen: { type: Boolean, default: false },
  frozenAt: Date,
  frozenBy: String,
  freezeReason: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);