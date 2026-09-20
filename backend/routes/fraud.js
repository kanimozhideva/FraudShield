const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FraudAlert = require('../models/FraudAlert');
const FraudReport = require('../models/FraudReport');
const InvestigationActivity = require('../models/InvestigationActivity');
const Transaction = require('../models/Transaction');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// Get user or admin alerts
router.get('/alerts', async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const alerts = await FraudAlert.find(filter)
      .populate('transactionId')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit fraud report (Handler function supporting / and /report)
// STRICT ROLE SEPARATION: Normal USER creates fraud reports. ADMIN investigates reports.
const handleReportSubmit = async (req, res) => {
  try {
    // 1. Role Guard: Admins cannot file user fraud reports
    if (req.user.role === 'admin') {
      return res.status(403).json({
        error: 'Access denied. Administrators manage and investigate fraud reports; they cannot create user fraud reports.'
      });
    }

    const { transactionId, fraudType, description, evidence } = req.body;

    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ error: 'Invalid transaction ID format.' });
    }

    // 2. Verify target transaction exists
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Target transaction not found.' });
    }

    // 3. Verify user ownership (Normal user can ONLY report their own transaction)
    const ownerId = transaction.userId?._id ? transaction.userId._id.toString() : transaction.userId.toString();
    if (ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only report your own transactions.' });
    }

    // 4. Check duplicate report
    const existing = await FraudReport.findOne({
      transactionId,
      userId: req.user.id
    });

    if (existing) {
      return res.status(400).json({ error: 'This transaction has already been reported.' });
    }

    const reportData = {
      transactionId,
      userId: req.user.id,
      fraudType: fraudType || 'Unauthorized Transaction',
      description: description || 'User reported suspicious activity on transaction.',
      evidence: evidence || '',
      status: 'Pending'
    };

    const report = new FraudReport(reportData);
    await report.save();

    // 5. Record persistent activity log
    await InvestigationActivity.create({
      reportId: report._id,
      transactionId: report.transactionId,
      userId: req.user.id,
      action: 'REPORT_CREATED',
      previousStatus: 'None',
      newStatus: 'Pending',
      description: `User submitted fraud report for transaction ₹${transaction.amount?.toLocaleString()} (#${report._id.toString().substring(0, 8)})`
    });

    console.log(`[FRAUD REPORT FILED] Report ID: ${report._id} for Transaction: ${transactionId} by User: ${req.user.id}`);

    res.status(201).json({
      success: true,
      report
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'This transaction has already been reported.' });
    }
    res.status(500).json({ error: err.message });
  }
};

router.post('/', handleReportSubmit);
router.post('/report', handleReportSubmit);

// Get user or admin reports (supporting / and /reports)
const handleGetReports = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const reports = await FraudReport.find(filter)
      .populate('userId', 'name email status isFrozen')
      .populate('transactionId')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get('/', handleGetReports);
router.get('/reports', handleGetReports);

module.exports = router;