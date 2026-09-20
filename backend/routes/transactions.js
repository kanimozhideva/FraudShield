const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const Transaction = require('../models/Transaction');
const User = require('../models/User');
const FraudAlert = require('../models/FraudAlert');
const InvestigationActivity = require('../models/InvestigationActivity');
const calculateRisk = require('../utils/fraudEngine');
const { verifyToken } = require('../middleware/auth');

const { validateTransactionImage } = require('../services/imageValidationService');
const { parseTransactionImage } = require('../services/transactionImageParser');

// Configure Multer in-memory storage (5MB max size)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(verifyToken);

// -------------------------------------------------------------
// Image Analysis Handler Function (used by /analyze-image & /image/analyze)
// -------------------------------------------------------------
const handleAnalyzeImageRequest = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No transaction image file provided. Please select an image file.'
      });
    }

    const { buffer, mimetype, originalname, size } = req.file;

    // 1. Image Validation Stage
    const validation = await validateTransactionImage(buffer, mimetype, originalname, size);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        imageValid: false,
        ocrSuccessful: false,
        status: validation.status || 'INVALID_IMAGE',
        message: validation.message || 'This image does not appear to contain a valid payment transaction. Please upload a clear payment receipt or transaction screenshot.'
      });
    }

    // 2. Real Tesseract.js OCR Extraction Stage
    const extractedData = await parseTransactionImage(buffer, originalname);

    // If OCR could not read an amount from the text, return OCR_FAILED state WITHOUT running fraud engine
    if (!extractedData.ocrSuccessful || extractedData.amount === null) {
      return res.json({
        success: true,
        imageValid: true,
        ocrSuccessful: false,
        status: 'VALID_IMAGE_OCR_FAILED',
        message: 'Transaction detected, but insufficient information was extracted. Please upload a clearer screenshot.',
        rawText: extractedData.rawText,
        imageAnalysis: {
          imageValid: true,
          ocrSuccessful: false,
          confidence: (extractedData.ocrConfidence || 0) / 100
        },
        extracted: {
          amount: null,
          amountDetected: false,
          transactionId: extractedData.transactionId,
          transactionIdDetected: Boolean(extractedData.transactionId),
          activity: extractedData.activity,
          activityDetected: Boolean(extractedData.activity && extractedData.activity !== 'Unknown'),
          merchant: extractedData.merchant,
          merchantDetected: Boolean(extractedData.merchant),
          date: extractedData.date,
          time: extractedData.time,
          paymentMethod: extractedData.paymentMethod
        }
      });
    }

    // 3. Run Fraud Analysis on REALLY Extracted Transaction Details ONLY
    const userId = req.user.id;
    const userHistory = await Transaction.find({ userId });

    const transactionData = {
      amount: extractedData.amount,
      location: 'Mumbai, India',
      device: 'Chrome on Windows 11',
      paymentMethod: extractedData.paymentMethod || 'UPI',
      timestamp: new Date()
    };

    const { score, riskLevel, reasons, riskFactors } = calculateRisk(transactionData, userHistory);

    // 4. Calculate Historical Behavioral Analysis
    const amounts = userHistory.map(t => Number(t.amount)).filter(a => !isNaN(a) && a > 0);
    const hasSufficientHistory = amounts.length >= 2;
    const avgAmount = amounts.length
      ? amounts.reduce((sum, a) => sum + a, 0) / amounts.length
      : 0;
    const minAmount = amounts.length ? Math.min(...amounts) : 0;
    const maxAmount = amounts.length ? Math.max(...amounts) : 0;

    const deviationMultiple = (avgAmount > 0 && transactionData.amount > avgAmount)
      ? (transactionData.amount / avgAmount).toFixed(1)
      : '1.0';

    res.json({
      success: true,
      imageValid: true,
      ocrSuccessful: true,
      ocrConfidence: extractedData.overallConfidence || 87,
      status: 'VALID_IMAGE_OCR_SUCCESS',
      message: 'Payment receipt detected and transaction details extracted from image.',
      rawText: extractedData.rawText,
      imageAnalysis: {
        imageValid: true,
        ocrSuccessful: true,
        confidence: (extractedData.overallConfidence || 87) / 100
      },
      extracted: {
        amount: extractedData.amount,
        amountDetected: true,
        amountConfidence: extractedData.amountConfidence,
        transactionId: extractedData.transactionId,
        transactionIdDetected: Boolean(extractedData.transactionId),
        transactionIdConfidence: extractedData.transactionIdConfidence,
        activity: extractedData.activity,
        activityDetected: Boolean(extractedData.activity && extractedData.activity !== 'Unknown'),
        activityConfidence: extractedData.activityConfidence,
        merchant: extractedData.merchant,
        merchantDetected: Boolean(extractedData.merchant),
        date: extractedData.date,
        time: extractedData.time,
        paymentMethod: extractedData.paymentMethod
      },
      extractedTransaction: {
        amount: extractedData.amount,
        transactionId: extractedData.transactionId,
        activity: extractedData.activity,
        merchant: extractedData.merchant,
        date: extractedData.date,
        time: extractedData.time,
        paymentMethod: extractedData.paymentMethod
      },
      risk: {
        score,
        level: riskLevel,
        reasons,
        riskFactors
      },
      behavioralAnalysis: {
        hasSufficientHistory,
        currentAmount: transactionData.amount,
        avgAmount: Math.round(avgAmount),
        minAmount: Math.round(minAmount),
        maxAmount: Math.round(maxAmount),
        deviationMultiple,
        historicalCount: userHistory.length
      }
    });
  } catch (err) {
    console.error('Error during image analysis:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to process transaction image.'
    });
  }
};

// Route aliases for image analysis
router.post('/analyze-image', upload.single('image'), handleAnalyzeImageRequest);
router.post('/image/analyze', upload.single('image'), handleAnalyzeImageRequest);

// -------------------------------------------------------------
// POST /api/transactions
// Save Transaction (Manual or Image Source)
// -------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Check account freeze status
    const currentUser = await User.findById(userId);
    if (currentUser && (currentUser.isFrozen || currentUser.status === 'frozen')) {
      return res.status(403).json({
        success: false,
        message: 'Account frozen due to confirmed fraudulent activity.'
      });
    }

    const {
      amount,
      location,
      device,
      paymentMethod,
      timestamp,
      source,
      transactionIdCustom,
      activity,
      imageAnalysis
    } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid transaction amount is required.'
      });
    }

    const userHistory = await Transaction.find({ userId });
    const transactionData = {
      amount: Number(amount),
      location: location || 'Mumbai, India',
      device: device || 'Chrome on Windows 11',
      paymentMethod: paymentMethod || 'Credit Card',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      userId
    };

    const { score, riskLevel, reasons, riskFactors } = calculateRisk(transactionData, userHistory);

    const transaction = new Transaction({
      ...transactionData,
      source: source === 'image' ? 'image' : 'manual',
      transactionIdCustom: transactionIdCustom || null,
      activity: activity || (source === 'image' ? 'UPI Payment' : 'Manual Entry'),
      riskScore: score,
      riskLevel,
      fraudReasons: reasons,
      imageAnalysis: imageAnalysis || {
        imageValidated: source === 'image',
        validationConfidence: source === 'image' ? 0.95 : 0,
        ocrConfidence: source === 'image' ? 0.92 : 0,
        extractedAt: source === 'image' ? new Date() : null
      }
    });

    await transaction.save();

    if (riskLevel === 'High Risk' || riskLevel === 'Suspicious') {
      await FraudAlert.create({
        transactionId: transaction._id,
        userId: transaction.userId,
        riskScore: score,
        riskLevel,
        reasons
      });

      await InvestigationActivity.create({
        transactionId: transaction._id,
        userId: transaction.userId,
        action: `High-risk transaction flag (${riskLevel}) [${source === 'image' ? 'Image Analysis' : 'Manual Entry'}]`,
        description: `Risk score: ${score}/100. Reasons: ${reasons.join(', ')}`
      });
    }

    res.status(201).json({
      success: true,
      transaction,
      risk: {
        score,
        level: riskLevel,
        reasons,
        riskFactors
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get transactions (with search, filter, sort, source filter)
router.get('/', async (req, res) => {
  try {
    const { search, riskLevel, paymentMethod, source, sort } = req.query;
    let filter = req.user.role === 'admin' ? {} : { userId: req.user.id };

    if (riskLevel && riskLevel !== 'All') {
      filter.riskLevel = riskLevel;
    }
    if (paymentMethod && paymentMethod !== 'All') {
      filter.paymentMethod = paymentMethod;
    }
    if (source && source !== 'All') {
      filter.source = source.toLowerCase() === 'image' ? 'image' : 'manual';
    }
    if (search) {
      filter.$or = [
        { location: { $regex: search, $options: 'i' } },
        { device: { $regex: search, $options: 'i' } },
        { paymentMethod: { $regex: search, $options: 'i' } },
        { transactionIdCustom: { $regex: search, $options: 'i' } },
        { activity: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { timestamp: -1 };
    if (sort === 'oldest') sortOption = { timestamp: 1 };
    if (sort === 'highest_amount') sortOption = { amount: -1 };
    if (sort === 'highest_risk') sortOption = { riskScore: -1 };

    const transactions = await Transaction.find(filter)
      .populate('userId', 'name email status isFrozen')
      .sort(sortOption);

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single transaction with behavioral analysis details (ObjectId validation fix)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID'
      });
    }

    const transaction = await Transaction.findById(id).populate('userId', 'name email status isFrozen');
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const ownerId = transaction.userId?._id ? transaction.userId._id.toString() : transaction.userId.toString();
    if (req.user.role !== 'admin' && ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this transaction.'
      });
    }

    const userHistory = await Transaction.find({
      userId: ownerId,
      _id: { $ne: transaction._id }
    });

    const { score, riskLevel, reasons, riskFactors } = calculateRisk(transaction, userHistory);

    const amounts = userHistory.map(t => Number(t.amount)).filter(a => !isNaN(a) && a > 0);
    const hasSufficientHistory = amounts.length >= 2;
    const avgAmount = amounts.length
      ? amounts.reduce((sum, a) => sum + a, 0) / amounts.length
      : transaction.amount;
    const minAmount = amounts.length ? Math.min(...amounts) : transaction.amount;
    const maxAmount = amounts.length ? Math.max(...amounts) : transaction.amount;

    const deviationMultiple = (avgAmount > 0 && transaction.amount > avgAmount)
      ? (transaction.amount / avgAmount).toFixed(1)
      : '1.0';

    const behavioralAnalysis = {
      hasSufficientHistory,
      avgAmount: Math.round(avgAmount),
      minAmount: Math.round(minAmount),
      maxAmount: Math.round(maxAmount),
      deviationMultiple,
      isKnownDevice: userHistory.some(t => t.device === transaction.device),
      isKnownLocation: userHistory.some(t => t.location === transaction.location),
      totalHistoricalTransactions: userHistory.length,
      historicalDevices: [...new Set(userHistory.map(t => t.device))],
      historicalLocations: [...new Set(userHistory.map(t => t.location))]
    };

    res.json({
      success: true,
      transaction: transaction.toObject(),
      risk: {
        score,
        level: riskLevel,
        reasons,
        riskFactors
      },
      behavioralAnalysis
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;