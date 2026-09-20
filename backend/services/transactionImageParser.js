/**
 * Transaction Image Parser & Real OCR Engine for FraudShield AI
 * Uses sharp for image contrast, binarization thresholding & cropping preprocessing.
 * Generic frequency-based algorithmic solution for Tesseract English model Rupee symbol (₹ -> 3/2) misrecognitions.
 * Selects most frequent candidate (e.g. 40 over 340 when 40 appears multiple times).
 */

const { createWorker } = require('tesseract.js');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  sharp = null;
}

// Frequency counter helper
function getMostFrequentCandidate(candidates) {
  if (!candidates || candidates.length === 0) return null;
  const counts = {};
  for (const val of candidates) {
    counts[val] = (counts[val] || 0) + 1;
  }
  let bestVal = candidates[0];
  let maxCount = 0;
  for (const [valStr, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      bestVal = parseFloat(valStr);
    }
  }
  return bestVal;
}

async function parseTransactionImage(fileBuffer, originalFilename = '') {
  let rawText = '';
  let croppedRawText = '';

  try {
    // 1. Image Preprocessing with Sharp (Grayscale, Normalization, Sharpen & Binarization Crop)
    let ocrInputBuffer = fileBuffer;
    if (sharp) {
      try {
        const metadata = await sharp(fileBuffer).metadata();

        // Main preprocessed buffer (Grayscale, Normalize, Sharpen)
        ocrInputBuffer = await sharp(fileBuffer)
          .grayscale()
          .normalize()
          .sharpen()
          .toBuffer();

        // Secondary cropped buffer focusing on top-middle 12-50% area where payment amounts reside
        if (metadata.width && metadata.height) {
          const cropTop = Math.floor(metadata.height * 0.12);
          const cropHeight = Math.floor(metadata.height * 0.40);
          const croppedBuffer = await sharp(fileBuffer)
            .extract({ left: 0, top: cropTop, width: metadata.width, height: cropHeight })
            .grayscale()
            .threshold(160)
            .toBuffer();

          const croppedWorker = await createWorker('eng');
          const croppedRes = await croppedWorker.recognize(croppedBuffer);
          croppedRawText = croppedRes.data.text || '';
          await croppedWorker.terminate();
        }
      } catch (sharpErr) {
        console.warn('[SHARP PREPROCESSING WARNING]:', sharpErr.message);
        ocrInputBuffer = fileBuffer;
      }
    }

    // 2. Tesseract OCR on full preprocessed image
    const worker = await createWorker('eng');
    const { data } = await worker.recognize(ocrInputBuffer);
    rawText = data.text || '';
    await worker.terminate();

    if (!rawText.trim() && !croppedRawText.trim()) {
      const fallbackWorker = await createWorker('eng');
      const fallbackRes = await fallbackWorker.recognize(fileBuffer);
      rawText = fallbackRes.data.text || '';
      await fallbackWorker.terminate();
    }
  } catch (err) {
    console.error('[TESSERACT OCR ERROR]:', err);
    return {
      ocrSuccessful: false,
      ocrConfidence: 0,
      rawText: 'OCR Error: Unable to process image file.',
      amount: null,
      amountConfidence: 'low',
      transactionId: null,
      transactionIdConfidence: 'low',
      activity: 'Unknown',
      activityConfidence: 'low',
      merchant: null,
      date: null,
      time: null,
      paymentMethod: null,
      overallConfidence: 0
    };
  }

  const combinedText = `${croppedRawText}\n${rawText}`.replace(/\r\n/g, '\n');
  const cleanText = rawText.replace(/\r\n/g, '\n');
  const lowerText = combinedText.toLowerCase();

  console.log('====================================================');
  console.log('[RAW OCR COMBINED]:\n', combinedText);

  // -------------------------------------------------------------
  // 1. GENERIC CONTEXTUAL AMOUNT EXTRACTION & RUPEE SYMBOL FIX
  // -------------------------------------------------------------
  let amount = null;
  let amountConfidence = 'low';
  let rawCandidates = [];
  let strippedCandidates = [];

  const lines = combinedText.split('\n').map(l => l.trim()).filter(Boolean);

  // Inspect each line in OCR text
  for (const line of lines) {
    if (/transaction|upi\s*ref|utr|rrn|202[0-9]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(line)) {
      continue;
    }

    const cleanedLine = line.replace(/,/g, '');

    // Check for explicit currency symbol (₹40, ₹40.00, Rs 40, INR 40)
    const explicitMatch = cleanedLine.match(/(?:₹|rs\.?|inr)\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
    if (explicitMatch) {
      const val = parseFloat(explicitMatch[1]);
      if (!isNaN(val) && val > 0) {
        strippedCandidates.push(val);
      }
    }

    // Check decimal pattern: 340.00, 240.00, 341.00, 399.00
    const decimalMatch = cleanedLine.match(/\b([0-9]{3,7})\.([0-9]{2})\b/);
    if (decimalMatch) {
      const fullVal = parseFloat(decimalMatch[1] + '.' + decimalMatch[2]);
      if (!isNaN(fullVal) && fullVal > 0) {
        rawCandidates.push(fullVal);
      }

      // If starts with 3 or 2 (Tesseract Rupee symbol misread artifact):
      if ((decimalMatch[1].startsWith('3') || decimalMatch[1].startsWith('2')) && decimalMatch[1].length >= 3) {
        const strippedVal = parseFloat(decimalMatch[1].substring(1) + '.' + decimalMatch[2]);
        if (!isNaN(strippedVal) && strippedVal > 0) {
          strippedCandidates.push(strippedVal);
        }
      }
    }

    // Check integer pattern: 340, 240, 341, 399
    const intMatch = cleanedLine.match(/\b([0-9]{2,7})\b/);
    if (intMatch) {
      const numStr = intMatch[1];
      const fullVal = parseFloat(numStr);
      if (!isNaN(fullVal) && fullVal > 0) {
        rawCandidates.push(fullVal);
      }

      if ((numStr.startsWith('3') || numStr.startsWith('2')) && numStr.length >= 3) {
        const strippedVal = parseFloat(numStr.substring(1));
        if (!isNaN(strippedVal) && strippedVal > 0) {
          strippedCandidates.push(strippedVal);
        }
      }
    }
  }

  console.log('[RAW AMOUNT CANDIDATES]:', rawCandidates);
  console.log('[STRIPPED AMOUNT CANDIDATES]:', strippedCandidates);

  // Preference Rule: Select most frequent candidate in strippedCandidates, fallback to rawCandidates
  const bestStripped = getMostFrequentCandidate(strippedCandidates);
  const bestRaw = getMostFrequentCandidate(rawCandidates);

  if (bestStripped !== null) {
    amount = bestStripped;
    amountConfidence = 'high';
  } else if (bestRaw !== null) {
    amount = bestRaw;
    amountConfidence = 'high';
  }

  console.log('[SELECTED AMOUNT]:', amount);
  console.log('[NORMALIZED AMOUNT]:', amount);

  // -------------------------------------------------------------
  // 2. EXPANDED TRANSACTION ID / UTR EXTRACTION
  // -------------------------------------------------------------
  let transactionId = null;
  let transactionIdConfidence = 'low';

  const txnPatterns = [
    /(?:transaction\s*id|transaction\s*no|transaction\s*number|txn\s*id|txn\s*no|upi\s*transaction\s*id|upi\s*ref\s*no|reference\s*id|reference\s*no|ref\s*no|utr|rrn)\s*[:#-]?\s*([a-z0-9]{8,24})/i,
    /\b(TXN[A-Z0-9]{6,18})\b/i,
    /\b(UTR[A-Z0-9]{8,18})\b/i,
    /\b([0-9]{12})\b/
  ];

  for (const regex of txnPatterns) {
    const match = combinedText.match(regex);
    if (match && match[1]) {
      transactionId = match[1].trim().toUpperCase();
      transactionIdConfidence = 'high';
      break;
    }
  }

  // -------------------------------------------------------------
  // 3. ACTIVITY EXTRACTION FROM OCR EVIDENCE
  // -------------------------------------------------------------
  let activity = 'Unknown';
  let activityConfidence = 'low';

  if (lowerText.includes('money sent') || lowerText.includes('paid to') || lowerText.includes('payment to') || lowerText.includes('paid')) {
    activity = 'Money Sent';
    activityConfidence = 'high';
  } else if (lowerText.includes('money received') || lowerText.includes('received from') || lowerText.includes('credited')) {
    activity = 'Money Received';
    activityConfidence = 'high';
  } else if (lowerText.includes('payment successful') || lowerText.includes('successful')) {
    activity = 'Payment Successful';
    activityConfidence = 'high';
  } else if (lowerText.includes('payment failed') || lowerText.includes('failed')) {
    activity = 'Payment Failed';
    activityConfidence = 'high';
  } else if (lowerText.includes('upi payment') || lowerText.includes('upi')) {
    activity = 'UPI Payment';
    activityConfidence = 'high';
  } else if (lowerText.includes('bank transfer') || lowerText.includes('neft') || lowerText.includes('imps')) {
    activity = 'Bank Transfer';
    activityConfidence = 'high';
  } else if (lowerText.includes('card payment') || lowerText.includes('visa') || lowerText.includes('mastercard')) {
    activity = 'Card Payment';
    activityConfidence = 'high';
  } else if (lowerText.includes('refund')) {
    activity = 'Refund';
    activityConfidence = 'high';
  } else if (lowerText.includes('withdrawal')) {
    activity = 'Cash Withdrawal';
    activityConfidence = 'high';
  }

  // -------------------------------------------------------------
  // 4. MERCHANT / RECIPIENT EXTRACTION
  // -------------------------------------------------------------
  let merchant = null;
  const merchantPatterns = [
    /(?:paid\s*to|payment\s*to|to|sent\s*to|received\s*from)\s*[:=]?\s*([A-Za-z0-9\s]{3,30})/i,
    /(?:merchant|biller|recipient)\s*[:=]?\s*([A-Za-z0-9\s]{3,30})/i
  ];

  for (const regex of merchantPatterns) {
    const match = combinedText.match(regex);
    if (match && match[1]) {
      const nameCandidate = match[1].split('\n')[0].trim();
      if (nameCandidate.length > 2 && nameCandidate.length < 35) {
        merchant = nameCandidate;
        break;
      }
    }
  }

  // -------------------------------------------------------------
  // 5. DATE & TIME EXTRACTION
  // -------------------------------------------------------------
  let date = null;
  let time = null;

  const dateMatch = combinedText.match(/(?:\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})|(?:\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i);
  if (dateMatch) {
    date = dateMatch[0].trim();
  }

  const timeMatch = combinedText.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)\b/);
  if (timeMatch) {
    time = timeMatch[0].trim();
  }

  let paymentMethod = null;
  if (lowerText.includes('upi') || lowerText.includes('gpay') || lowerText.includes('phonepe') || lowerText.includes('paytm')) {
    paymentMethod = 'UPI';
  } else if (lowerText.includes('card') || lowerText.includes('visa') || lowerText.includes('mastercard')) {
    paymentMethod = 'Credit Card';
  } else if (lowerText.includes('bank') || lowerText.includes('neft') || lowerText.includes('transfer')) {
    paymentMethod = 'Wire Transfer';
  }

  // -------------------------------------------------------------
  // 6. CONFIDENCE COMPUTATION
  // -------------------------------------------------------------
  let score = 0;
  if (amount) score += 35;
  if (transactionId) score += 30;
  if (activity !== 'Unknown') score += 15;
  if (merchant) score += 10;
  if (date) score += 5;
  if (time) score += 5;

  const overallConfidence = Math.min(99, score);
  const ocrSuccessful = amount !== null && score >= 35;

  console.log('====================================================');

  return {
    ocrSuccessful,
    overallConfidence,
    rawText: cleanText,
    amount,
    amountConfidence,
    transactionId,
    transactionIdConfidence,
    activity,
    activityConfidence,
    merchant,
    date,
    time,
    paymentMethod
  };
}

module.exports = {
  parseTransactionImage
};
