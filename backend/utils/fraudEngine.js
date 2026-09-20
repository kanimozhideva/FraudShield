/**
 * FraudShield Risk Evaluation Engine
 * Calculates risk score (0-100), risk level, human-readable reasons,
 * and structured riskFactors based strictly on real transaction data & user history.
 */

function calculateRisk(transaction, userHistory = []) {
  let score = 0;
  const reasons = [];
  const riskFactors = [];

  const validHistory = Array.isArray(userHistory) ? userHistory : [];
  const historyCount = validHistory.length;

  const avgAmount = historyCount > 0
    ? validHistory.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) / historyCount
    : 0;

  // 1. AMOUNT ANOMALY EVALUATION
  if (avgAmount > 0 && transaction.amount > avgAmount * 3) {
    const deviation = Number((transaction.amount / avgAmount).toFixed(1));
    const addedScore = Math.min(45, Math.floor(deviation * 6));
    score += addedScore;
    reasons.push('Unusually high transaction amount');

    riskFactors.push({
      type: 'AMOUNT_ANOMALY',
      severity: 'HIGH',
      title: '🔴 HIGH AMOUNT DEVIATION',
      description: `Current transaction (₹${transaction.amount.toLocaleString()}) is ${deviation}× higher than the user's historical average (₹${Math.round(avgAmount).toLocaleString()}).`,
      value: transaction.amount,
      baseline: Math.round(avgAmount),
      deviation
    });
  } else if (avgAmount > 0) {
    riskFactors.push({
      type: 'NORMAL_AMOUNT',
      severity: 'POSITIVE',
      title: '✓ Amount within normal range',
      description: `Current transaction (₹${transaction.amount.toLocaleString()}) is within expected baseline pattern (avg ₹${Math.round(avgAmount).toLocaleString()}).`
    });
  }

  // 2. DEVICE ANOMALY EVALUATION
  if (historyCount > 0) {
    const knownDevices = validHistory.map(t => t.device).filter(Boolean);
    if (!knownDevices.includes(transaction.device)) {
      score += 25;
      reasons.push('New device detected');

      riskFactors.push({
        type: 'NEW_DEVICE',
        severity: 'HIGH',
        title: '🔴 NEW DEVICE DETECTED',
        description: `This transaction originated from an unrecognized device (${transaction.device || 'Unknown Device'}).`
      });
    } else {
      riskFactors.push({
        type: 'KNOWN_DEVICE',
        severity: 'POSITIVE',
        title: '✓ Recognized device',
        description: `Device (${transaction.device}) matches previous user device history.`
      });
    }
  }

  // 3. LOCATION ANOMALY EVALUATION
  if (historyCount > 0) {
    const knownLocations = validHistory.map(t => t.location).filter(Boolean);
    if (!knownLocations.includes(transaction.location)) {
      score += 20;
      reasons.push('Unusual location detected');

      riskFactors.push({
        type: 'GEO_ANOMALY',
        severity: 'MEDIUM',
        title: '🟠 UNUSUAL LOCATION',
        description: `Current location (${transaction.location}) differs from typical user transaction locations.`
      });
    } else {
      riskFactors.push({
        type: 'KNOWN_LOCATION',
        severity: 'POSITIVE',
        title: '✓ Recognized location',
        description: `Location (${transaction.location}) matches user geographical history.`
      });
    }
  }

  // 4. TRANSACTION TIME ANOMALY EVALUATION
  const txDate = transaction.timestamp ? new Date(transaction.timestamp) : new Date();
  const hour = txDate.getHours();
  if (hour < 6 || hour > 23) {
    score += 15;
    reasons.push('Unusual transaction time');

    const formattedTime = txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    riskFactors.push({
      type: 'UNUSUAL_TIME',
      severity: 'MEDIUM',
      title: '🟠 UNUSUAL TRANSACTION TIME',
      description: `Transaction occurred at ${formattedTime}, outside standard user active hours (06:00 AM – 11:00 PM).`
    });
  } else {
    riskFactors.push({
      type: 'NORMAL_TIME',
      severity: 'POSITIVE',
      title: '✓ Usual transaction time',
      description: `Transaction time falls within regular active hours.`
    });
  }

  // 5. RAPID TRANSACTION FREQUENCY EVALUATION
  if (historyCount > 0) {
    const fiveMinutesAgo = new Date(txDate.getTime() - 5 * 60 * 1000);
    const recentTxns = validHistory.filter(t => {
      const tTime = t.timestamp ? new Date(t.timestamp) : null;
      return tTime && tTime >= fiveMinutesAgo && tTime <= txDate;
    });

    if (recentTxns.length >= 3) {
      score += 20;
      reasons.push('Rapid transaction activity');
      riskFactors.push({
        type: 'RAPID_TRANSACTIONS',
        severity: 'HIGH',
        title: '⚡ RAPID TRANSACTION FREQUENCY',
        description: `Multiple transactions (${recentTxns.length + 1}) detected within a 5-minute window.`
      });
    }
  }

  // Cap risk score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, score));

  let riskLevel = 'Normal';
  if (finalScore > 60) riskLevel = 'High Risk';
  else if (finalScore > 30) riskLevel = 'Suspicious';

  return {
    score: finalScore,
    riskLevel,
    reasons,
    riskFactors
  };
}

module.exports = calculateRisk;