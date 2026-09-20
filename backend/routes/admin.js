const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const FraudReport = require('../models/FraudReport');
const FraudAlert = require('../models/FraudAlert');
const InvestigationActivity = require('../models/InvestigationActivity');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const calculateRisk = require('../utils/fraudEngine');

// Protect all admin endpoints strictly with verifyToken & requireAdmin
router.use(verifyToken, requireAdmin);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Freeze User Account (Prevent duplicate ACCOUNT_FROZEN entries)
router.put('/users/:userId/freeze', async (req, res) => {
  try {
    const { freezeReason, reportId, transactionId } = req.body;
    const targetUserId = req.params.userId;

    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID provided.' });
    }

    const existingUser = await User.findById(targetUserId);
    if (!existingUser) return res.status(404).json({ error: 'User not found' });

    // Prevent duplicate freeze if user is already frozen
    if (existingUser.isFrozen || existingUser.status === 'frozen') {
      return res.json({
        success: true,
        message: 'Account is already frozen.',
        user: existingUser
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      {
        isFrozen: true,
        status: 'frozen',
        frozenAt: new Date(),
        frozenBy: req.user.id,
        freezeReason: freezeReason || 'Administrative freeze due to confirmed fraud activity'
      },
      { new: true }
    ).select('-password');

    // Create persistent InvestigationActivity in MongoDB
    await InvestigationActivity.create({
      action: 'ACCOUNT_FROZEN',
      userId: updatedUser._id,
      reportId: (reportId && mongoose.Types.ObjectId.isValid(reportId)) ? reportId : null,
      transactionId: (transactionId && mongoose.Types.ObjectId.isValid(transactionId)) ? transactionId : null,
      adminId: req.user.id,
      description: `Account for ${updatedUser.name} (${updatedUser.email}) was frozen by Administrator. Reason: ${freezeReason || 'Administrative decision'}`
    });

    console.log(`[USER FROZEN] User ${updatedUser.email} (${updatedUser._id}) frozen by Admin ${req.user.id}`);

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unfreeze User Account (Prevent duplicate ACCOUNT_UNFROZEN entries, preserve history)
router.put('/users/:userId/unfreeze', async (req, res) => {
  try {
    const { reportId, transactionId } = req.body;
    const targetUserId = req.params.userId;

    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID provided.' });
    }

    const existingUser = await User.findById(targetUserId);
    if (!existingUser) return res.status(404).json({ error: 'User not found' });

    // Prevent duplicate unfreeze if user is already active
    if (!existingUser.isFrozen && existingUser.status !== 'frozen') {
      return res.json({
        success: true,
        message: 'Account is already active.',
        user: existingUser
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      {
        isFrozen: false,
        status: 'active',
        frozenAt: null,
        frozenBy: null,
        freezeReason: null
      },
      { new: true }
    ).select('-password');

    // Create persistent InvestigationActivity in MongoDB (ACCOUNT_UNFROZEN)
    await InvestigationActivity.create({
      action: 'ACCOUNT_UNFROZEN',
      userId: updatedUser._id,
      reportId: (reportId && mongoose.Types.ObjectId.isValid(reportId)) ? reportId : null,
      transactionId: (transactionId && mongoose.Types.ObjectId.isValid(transactionId)) ? transactionId : null,
      adminId: req.user.id,
      description: `Account for ${updatedUser.name} (${updatedUser.email}) was unfrozen by Administrator.`
    });

    console.log(`[USER UNFROZEN] User ${updatedUser.email} (${updatedUser._id}) unfrozen by Admin ${req.user.id}`);

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user status generic endpoint
router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const isFrozen = status === 'frozen';
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        status,
        isFrozen,
        frozenAt: isFrozen ? new Date() : null,
        frozenBy: isFrozen ? req.user.id : null
      },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found' });

    await InvestigationActivity.create({
      userId: user._id,
      adminId: req.user.id,
      action: isFrozen ? 'ACCOUNT_FROZEN' : 'ACCOUNT_UNFROZEN',
      description: `User ${user.name} status updated to ${status}`
    });

    res.json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all transactions
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId', 'name email status isFrozen')
      .sort({ timestamp: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all fraud reports
router.get('/reports', async (req, res) => {
  try {
    const reports = await FraudReport.find()
      .populate('userId', 'name email status isFrozen')
      .populate('transactionId')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Explicit Fraud Confirmation Handler (with double confirmation backing & Activity log)
const handleConfirmFraud = async (req, res) => {
  try {
    const reportId = req.params.id;
    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ error: 'Invalid report reference.' });
    }

    const currentReport = await FraudReport.findById(reportId);
    if (!currentReport) return res.status(404).json({ error: 'Report not found' });

    const previousStatus = currentReport.status || 'Pending';

    currentReport.status = 'Confirmed Fraud';
    currentReport.updatedAt = new Date();
    await currentReport.save();

    const updatedReport = await FraudReport.findById(currentReport._id)
      .populate('userId', 'name email status isFrozen')
      .populate('transactionId');

    await InvestigationActivity.create({
      reportId: updatedReport._id,
      transactionId: updatedReport.transactionId?._id || updatedReport.transactionId,
      userId: updatedReport.userId?._id || updatedReport.userId,
      adminId: req.user.id,
      action: 'FRAUD_CONFIRMED',
      previousStatus,
      newStatus: 'Confirmed Fraud',
      description: `Administrator confirmed fraudulent transaction for Report #${updatedReport._id.toString().substring(0, 8)}`
    });

    console.log(`[FRAUD CONFIRMED] Report ID: ${updatedReport._id} confirmed by Admin ${req.user.id}`);

    res.json({
      success: true,
      report: updatedReport
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.post('/reports/:id/confirm-fraud', handleConfirmFraud);
router.put('/reports/:id/confirm-fraud', handleConfirmFraud);

// Update fraud report status
router.put('/reports/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Under Investigation', 'Confirmed Fraud', 'Resolved'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid report status. Allowed: ${validStatuses.join(', ')}` });
    }

    const currentReport = await FraudReport.findById(req.params.id);
    if (!currentReport) return res.status(404).json({ error: 'Report not found' });

    const previousStatus = currentReport.status || 'Pending';

    currentReport.status = status;
    currentReport.updatedAt = new Date();
    await currentReport.save();

    const updatedReport = await FraudReport.findById(currentReport._id)
      .populate('userId', 'name email status isFrozen')
      .populate('transactionId');

    let actionName = 'STATUS_CHANGED';
    if (status === 'Confirmed Fraud') actionName = 'FRAUD_CONFIRMED';
    if (status === 'Resolved') actionName = 'REPORT_RESOLVED';
    if (status === 'Under Investigation') actionName = 'INVESTIGATION_STARTED';

    await InvestigationActivity.create({
      reportId: updatedReport._id,
      transactionId: updatedReport.transactionId?._id || updatedReport.transactionId,
      userId: updatedReport.userId?._id || updatedReport.userId,
      adminId: req.user.id,
      action: actionName,
      previousStatus,
      newStatus: status,
      description: `Report #${updatedReport._id.toString().substring(0, 8)} status changed from ${previousStatus} to ${status}`
    });

    console.log(`[REPORT STATUS UPDATED] Report ID: ${updatedReport._id} | ${previousStatus} -> ${status} | By Admin: ${req.user.id}`);

    res.json({
      success: true,
      report: updatedReport
    });
  } catch (err) {
    console.error('Error updating report status:', err);
    res.status(500).json({ error: err.message });
  }
});

// Specific Report Investigation Timeline (Sorted DESC - timestamp DESC, newest first)
router.get('/investigations/:reportId/timeline', async (req, res) => {
  try {
    const { reportId } = req.params;
    let filter = {};

    if (mongoose.Types.ObjectId.isValid(reportId)) {
      const reportObj = await FraudReport.findById(reportId);
      if (reportObj) {
        filter = {
          $or: [
            { reportId: reportObj._id },
            { userId: reportObj.userId }
          ]
        };
      } else {
        filter = { reportId };
      }
    }

    const activities = await InvestigationActivity.find(filter)
      .populate('userId', 'name email')
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 });

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recent Investigation Timeline Activities (for Admin Dashboard, sorted DESC)
router.get('/investigations/recent', async (req, res) => {
  try {
    const activities = await InvestigationActivity.find()
      .populate('userId', 'name email')
      .populate('adminId', 'name email')
      .populate('reportId', 'fraudType status')
      .populate('transactionId', 'amount riskLevel')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Analytics
router.get('/analytics', async (req, res) => {
  try {
    const total = await Transaction.countDocuments();
    const normal = await Transaction.countDocuments({ riskLevel: 'Normal' });
    const suspicious = await Transaction.countDocuments({ riskLevel: 'Suspicious' });
    const highRisk = await Transaction.countDocuments({ riskLevel: 'High Risk' });
    const reportsCount = await FraudReport.countDocuments();
    const pendingReportsCount = await FraudReport.countDocuments({ status: 'Pending' });
    const frozenUsers = await User.countDocuments({ $or: [{ status: 'frozen' }, { isFrozen: true }] });
    const totalUsers = await User.countDocuments({ role: 'user' });

    res.json({
      total,
      normal,
      suspicious,
      highRisk,
      reports: reportsCount,
      pendingReports: pendingReportsCount,
      frozenUsers,
      totalUsers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fraud Attack Simulator Endpoint
router.post('/simulate', async (req, res) => {
  try {
    const { attackType, amount, location, device, paymentMethod, customTargetEmail } = req.body;

    let targetEmail = customTargetEmail || 'simulator@test.com';
    let simUser = await User.findOne({ email: targetEmail });
    if (!simUser) {
      const hashedPassword = await bcrypt.hash('simulated123', 10);
      simUser = await User.create({
        name: 'Simulated Target User',
        email: targetEmail,
        password: hashedPassword,
        role: 'user',
        status: 'active'
      });
    }

    const userId = simUser._id;
    const createdTransactions = [];
    const createdAlerts = [];

    if (attackType === 'normal' || attackType === 'large' || attackType === 'device' || attackType === 'location' || attackType === 'account_takeover' || attackType === 'custom') {
      let userHistory = await Transaction.find({ userId });
      if (userHistory.length === 0 && attackType !== 'normal') {
        const baseTx = await Transaction.create({
          userId,
          amount: 500,
          location: 'New York, USA',
          device: 'Chrome on MacOS',
          paymentMethod: 'Credit Card',
          riskScore: 0,
          riskLevel: 'Normal',
          fraudReasons: []
        });
        userHistory = [baseTx];
      }

      let txData = {
        userId,
        amount: amount || (attackType === 'large' ? 250000 : 150),
        location: location || (attackType === 'location' ? 'Reykjavík, Iceland' : 'New York, USA'),
        device: device || (attackType === 'device' ? 'Unknown Botnet Device v4.2' : 'Chrome on MacOS'),
        paymentMethod: paymentMethod || 'Credit Card',
        timestamp: new Date()
      };

      if (attackType === 'account_takeover') {
        txData = {
          userId,
          amount: 95000,
          location: 'Lagos, Nigeria',
          device: 'Tor Browser 12.5 (Linux)',
          paymentMethod: 'Wire Transfer',
          timestamp: new Date()
        };
      }

      const { score, riskLevel, reasons } = calculateRisk(txData, userHistory);
      const tx = await Transaction.create({ ...txData, riskScore: score, riskLevel, fraudReasons: reasons });
      createdTransactions.push(tx);

      if (riskLevel === 'High Risk' || riskLevel === 'Suspicious') {
        const alert = await FraudAlert.create({
          transactionId: tx._id,
          userId: tx.userId,
          riskScore: score,
          riskLevel,
          reasons
        });
        createdAlerts.push(alert);

        await InvestigationActivity.create({
          transactionId: tx._id,
          userId: tx.userId,
          action: `Simulated Fraud Alert (${riskLevel})`,
          description: `Attack scenario '${attackType}' evaluated score ${score}/100. Reasons: ${reasons.join(', ')}`
        });
      }
    } else if (attackType === 'burst' || attackType === 'rapid') {
      const baseHistory = [
        { amount: 100, device: 'Known Phone', location: 'Home City' }
      ];

      const steps = [
        { name: 'Baseline Normal Transaction', amount: 100, location: 'Home City', device: 'Known Phone', timestamp: new Date('2026-08-31T12:00:00Z') },
        { name: 'Step 1: New Device Anomaly', amount: 120, location: 'Home City', device: 'Unrecognized Tablet XYZ', timestamp: new Date('2026-08-31T14:00:00Z') },
        { name: 'Step 2: Midnight Hour + Geo Anomaly', amount: 250, location: 'Foreign Proxy Server', device: 'Unrecognized Tablet XYZ', timestamp: new Date('2026-08-31T03:00:00Z') },
        { name: 'Step 3: Escalating Large Amount', amount: 2500, location: 'Unknown Offshore Hub', device: 'Hacked Workstation', timestamp: new Date('2026-08-31T04:00:00Z') },
        { name: 'Step 4: Critical Multi-Vector Anomaly', amount: 75000, location: 'Suspicious IP Relay', device: 'Exploit Runner v1', timestamp: new Date('2026-08-31T02:00:00Z') }
      ];

      let runningHistory = [...baseHistory];

      for (const step of steps) {
        const txData = {
          userId,
          amount: step.amount,
          location: step.location,
          device: step.device,
          paymentMethod: 'Crypto Gateway',
          timestamp: step.timestamp
        };

        const { score, riskLevel, reasons } = calculateRisk(txData, runningHistory);
        const tx = await Transaction.create({
          ...txData,
          riskScore: score,
          riskLevel,
          fraudReasons: reasons
        });

        runningHistory.push(tx);
        createdTransactions.push(tx);

        if (riskLevel === 'High Risk' || riskLevel === 'Suspicious') {
          const alert = await FraudAlert.create({
            transactionId: tx._id,
            userId: tx.userId,
            riskScore: score,
            riskLevel,
            reasons
          });
          createdAlerts.push(alert);
        }
      }

      await InvestigationActivity.create({
        userId,
        adminId: req.user.id,
        action: 'Transaction Burst Attack Simulated',
        description: `Executed 5-step rapid burst scenario with escalating risk levels.`
      });
    }

    res.status(201).json({
      message: `Simulated attack '${attackType}' executed successfully`,
      transactions: createdTransactions,
      alerts: createdAlerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;