const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const FraudReport = require('../models/FraudReport');
const { verifyToken } = require('../middleware/auth');

// Register - Always forces role = 'user'
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      status: 'active',
      isFrozen: false
    });
    await user.save();
    console.log(`[REGISTER] New user registered: ${email} with role: 'user'`);
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please enter email and password.' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, error: 'Invalid email or password' });

    if (user.isFrozen || user.status === 'frozen') {
      console.log(`[LOGIN BLOCKED] Frozen user attempted login: ${email}`);
      return res.status(403).json({ success: false, error: 'Your account is currently frozen. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Invalid email or password' });

    const normalizedRole = (user.role || 'user').toLowerCase();
    const secret = process.env.JWT_SECRET || 'fraud_detection_jwt_secret_key_2026';
    const token = jwt.sign({ id: user._id, role: normalizedRole }, secret, { expiresIn: '1d' });

    console.log(`[LOGIN SUCCESS] User: ${email} | ID: ${user._id} | Role: '${normalizedRole}'`);

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: normalizedRole,
        isFrozen: user.isFrozen || user.status === 'frozen',
        status: user.status
      }
    });
  } catch (err) {
    console.error('Error during login execution:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get User Profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const txCount = await Transaction.countDocuments({ userId: req.user.id });
    const reportCount = await FraudReport.countDocuments({ userId: req.user.id });

    res.json({
      success: true,
      ...user.toObject(),
      role: (user.role || 'user').toLowerCase(),
      transactionCount: txCount,
      reportCount
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;