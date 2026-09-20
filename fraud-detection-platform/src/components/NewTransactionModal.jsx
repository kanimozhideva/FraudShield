import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import RiskBadge from './RiskBadge';

export default function NewTransactionModal({ isOpen, initialMode = null, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(initialMode); // null | 'manual' | 'image'

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    amount: '',
    location: 'Mumbai, India',
    device: 'Chrome on Windows 11',
    paymentMethod: 'Credit Card',
    activity: 'UPI Payment',
    isNewDevice: false,
    isNewLocation: false,
    isUnusualTime: false
  });

  // Image Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0); // 0: idle, 1: upload, 2: validate, 3: ocr, 4: review, 5: complete

  // Analysis / Review State
  const [validationData, setValidationData] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [behavioralData, setBehavioralData] = useState(null);
  const [savedTransaction, setSavedTransaction] = useState(null);
  const [showRawText, setShowRawText] = useState(false);

  // Editable Extracted Details State
  const [isEditing, setIsEditing] = useState(false);
  const [editableFields, setEditableFields] = useState({
    amount: '',
    transactionId: '',
    activity: '',
    paymentMethod: 'UPI',
    merchant: '',
    location: 'Mumbai, India',
    device: 'Chrome on Windows 11'
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [ocrFailedState, setOcrFailedState] = useState(false);

  // PREVENT STALE REACT STATE ON OPEN OR MODE CHANGE
  const resetAllState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsProcessing(false);
    setProcessingStep(0);
    setValidationData(null);
    setExtractedData(null);
    setRiskData(null);
    setBehavioralData(null);
    setSavedTransaction(null);
    setIsEditing(false);
    setShowRawText(false);
    setErrorMsg('');
    setOcrFailedState(false);
    setEditableFields({
      amount: '',
      transactionId: '',
      activity: '',
      paymentMethod: 'UPI',
      merchant: '',
      location: 'Mumbai, India',
      device: 'Chrome on Windows 11'
    });
  };

  useEffect(() => {
    resetAllState();
    setSelectedOption(initialMode);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleManualChange = (e) => {
    const { name, value, type, checked } = e.target;
    setManualForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds maximum limit of 5 MB.');
      return;
    }
    resetAllState();
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Image Processing Pipeline
  const handleAnalyzeImage = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select a payment receipt image first.');
      return;
    }

    setIsProcessing(true);
    setProcessingStep(1); // Uploading
    setErrorMsg('');
    setOcrFailedState(false);

    try {
      setProcessingStep(2); // Image Validation

      const formData = new FormData();
      formData.append('image', selectedFile);

      setProcessingStep(3); // OCR & Extraction

      const res = await api.post('/transactions/analyze-image', formData);
      const data = res.data;

      if (data.imageValid === false) {
        setValidationData({
          imageValid: false,
          status: data.status || 'INVALID_IMAGE',
          message: data.message || 'This image does not appear to contain a readable payment transaction.'
        });
        setIsProcessing(false);
        return;
      }

      setValidationData(data);
      setExtractedData(data.extracted || {});
      setRiskData(data.risk || null);
      setBehavioralData(data.behavioralAnalysis || null);

      setEditableFields({
        amount: data.extracted?.amount || '',
        transactionId: data.extracted?.transactionId || '',
        activity: data.extracted?.activity || 'UPI Payment',
        paymentMethod: data.extracted?.paymentMethod || 'UPI',
        merchant: data.extracted?.merchant || '',
        location: 'Mumbai, India',
        device: 'Chrome on Windows 11'
      });

      if (!data.ocrSuccessful || data.extracted?.amount === null) {
        setOcrFailedState(true);
      } else {
        setProcessingStep(4); // Review & Editable State
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData && errData.imageValid === false) {
        setValidationData({
          imageValid: false,
          status: errData.status || 'INVALID_IMAGE',
          message: errData.message || 'This image does not appear to contain a readable payment transaction.'
        });
      } else {
        setErrorMsg(errData?.message || 'Failed to process transaction image. Please upload a clearer screenshot.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Finalize Transaction Save to MongoDB
  const handleFinalizeTransaction = async (overrideData = null) => {
    setIsProcessing(true);
    setProcessingStep(4);
    setErrorMsg('');

    const isImage = selectedOption === 'image';
    const payload = overrideData || {
      amount: Number(editableFields.amount || manualForm.amount),
      location: isImage ? editableFields.location : manualForm.location,
      device: isImage ? editableFields.device : manualForm.device,
      paymentMethod: isImage ? editableFields.paymentMethod : manualForm.paymentMethod,
      activity: isImage ? editableFields.activity : manualForm.activity,
      source: isImage ? 'image' : 'manual',
      transactionIdCustom: isImage ? editableFields.transactionId : null,
      imageAnalysis: isImage ? {
        imageValidated: true,
        validationConfidence: validationData?.ocrConfidence ? (validationData.ocrConfidence / 100) : 0.95,
        ocrConfidence: validationData?.ocrConfidence || 87,
        extractedAt: new Date()
      } : null
    };

    try {
      setProcessingStep(5);
      const res = await api.post('/transactions', payload);
      const createdTxn = res.data.transaction || res.data;
      setSavedTransaction(createdTxn);
      setRiskData(res.data.risk || { score: createdTxn.riskScore, level: createdTxn.riskLevel, reasons: createdTxn.fraudReasons, riskFactors: res.data.risk?.riskFactors || [] });
      if (onSuccess) onSuccess(createdTxn);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Transaction could not be saved to database.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleFinalizeTransaction();
  };

  const handleResetModal = () => {
    resetAllState();
    setSelectedOption(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030507]/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0B1118] border border-[#00F0FF]/22 rounded-2xl max-w-3xl w-full p-6 shadow-2xl shadow-[#00F0FF]/10 space-y-6 my-8 text-[#F5F7FA]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#00F0FF]/20 pb-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#00F0FF] tracking-wider uppercase">
              {selectedOption === 'image' ? 'UPLOAD TRANSACTION' : 'MANUAL TRANSACTION'}
            </h3>
            <p className="text-xs text-[#7D8996] mt-0.5">
              FraudShield Digital Payment Fraud Detection Console
            </p>
          </div>
          <button onClick={handleResetModal} className="text-[#7D8996] hover:text-[#00F0FF] text-lg font-bold">
            ✕
          </button>
        </div>

        {/* Global Error Notice */}
        {errorMsg && (
          <div className="bg-[#FF3158]/15 border border-[#FF3158]/60 text-[#FF3158] text-xs p-3.5 rounded-xl font-medium shadow-md">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* MODE SELECTION CARDS */}
        {!selectedOption && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div
              onClick={() => setSelectedOption('manual')}
              className="bg-[#06090D] border border-[#00F0FF]/20 hover:border-[#00F0FF] rounded-2xl p-6 space-y-4 cursor-pointer transition shadow-lg group hover:shadow-[#00F0FF]/20"
            >
              <div className="w-12 h-12 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] flex items-center justify-center text-2xl group-hover:scale-105 transition shadow-sm">
                ✎
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#F5F7FA] tracking-wide">MANUAL TRANSACTION</h4>
                <p className="text-xs text-[#7D8996] mt-1 leading-relaxed">
                  Enter transaction details manually when you don't have a transaction screenshot.
                </p>
              </div>
              <button className="w-full bg-[#0B1118] group-hover:bg-[#00F0FF] group-hover:text-[#030507] text-[#00F0FF] border border-[#00F0FF]/40 text-xs font-bold py-2.5 rounded-xl transition text-center shadow-md font-mono uppercase">
                MANUAL TRANSACTION →
              </button>
            </div>

            <div
              onClick={() => setSelectedOption('image')}
              className="bg-[#06090D] border border-[#7C3AED]/30 hover:border-[#A855F7] rounded-2xl p-6 space-y-4 cursor-pointer transition shadow-lg group hover:shadow-[#7C3AED]/20"
            >
              <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/40 text-[#A855F7] flex items-center justify-center text-2xl group-hover:scale-105 transition shadow-sm">
                🖼
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#F5F7FA] tracking-wide">UPLOAD TRANSACTION</h4>
                <p className="text-xs text-[#7D8996] mt-1 leading-relaxed">
                  Upload a payment screenshot. Tesseract.js validates receipt structure & extracts transaction data.
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#7D8996] font-mono pt-1">
                <span>JPG • PNG • WEBP</span>
                <span>Max 5 MB</span>
              </div>
              <button className="w-full bg-[#7C3AED] hover:bg-[#a855f7] text-white font-bold text-xs py-2.5 rounded-xl transition text-center shadow-md shadow-[#7C3AED]/30 font-mono uppercase">
                UPLOAD TRANSACTION →
              </button>
            </div>
          </div>
        )}

        {/* Back Button */}
        {selectedOption && !savedTransaction && (
          <button
            onClick={() => { resetAllState(); setSelectedOption(null); }}
            className="text-xs text-[#00F0FF] hover:underline font-semibold flex items-center gap-1 font-mono"
          >
            ← CHANGE SELECTION
          </button>
        )}

        {/* MANUAL TRANSACTION FORM */}
        {selectedOption === 'manual' && !savedTransaction && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#7D8996] mb-1 uppercase font-mono tracking-wider">Amount (₹)</label>
              <input
                name="amount"
                type="number"
                value={manualForm.amount}
                onChange={handleManualChange}
                required
                placeholder="e.g. 25000"
                className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-4 py-2.5 text-xs text-[#F5F7FA] placeholder-[#7D8996]/40 focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#7D8996] mb-1 uppercase font-mono tracking-wider">Location</label>
                <input
                  name="location"
                  type="text"
                  value={manualForm.location}
                  onChange={handleManualChange}
                  required
                  className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7D8996] mb-1 uppercase font-mono tracking-wider">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={manualForm.paymentMethod}
                  onChange={handleManualChange}
                  className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
                >
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Wire Transfer">Wire Transfer</option>
                  <option value="Crypto Gateway">Crypto Gateway</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#7D8996] mb-1 uppercase font-mono tracking-wider">Device</label>
                <input
                  name="device"
                  type="text"
                  value={manualForm.device}
                  onChange={handleManualChange}
                  required
                  className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7D8996] mb-1 uppercase font-mono tracking-wider">Transaction Activity</label>
                <select
                  name="activity"
                  value={manualForm.activity}
                  onChange={handleManualChange}
                  className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
                >
                  <option value="UPI Payment">UPI Payment</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card Payment">Card Payment</option>
                  <option value="Money Sent">Money Sent</option>
                  <option value="Money Received">Money Received</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-[#00F0FF] hover:bg-[#33f3ff] text-[#030507] font-bold rounded-xl py-3 text-xs transition shadow-lg shadow-[#00F0FF]/30 disabled:opacity-50 uppercase tracking-wider font-mono"
            >
              {isProcessing ? 'Analyzing Transaction…' : 'ANALYZE TRANSACTION →'}
            </button>
          </form>
        )}

        {/* IMAGE UPLOAD & PREVIEW */}
        {selectedOption === 'image' && !validationData && !savedTransaction && (
          <div className="space-y-4">
            {!previewUrl ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-[#00F0FF]/40 hover:border-[#00F0FF] bg-[#06090D]/80 rounded-2xl p-8 text-center space-y-3 transition cursor-pointer shadow-inner"
              >
                <label className="block cursor-pointer space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] flex items-center justify-center mx-auto text-3xl shadow-[0_0_12px_rgba(0,240,255,0.25)]">
                    ↑
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#F5F7FA] font-mono tracking-wider uppercase">
                      DROP IMAGE HERE
                    </p>
                    <p className="text-[11px] text-[#00F0FF] font-mono uppercase">
                      OR SELECT FROM DEVICE
                    </p>
                    <p className="text-[10px] text-[#7D8996] font-mono pt-1">
                      JPG • PNG • WEBP • 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#06090D] border border-[#00F0FF]/30 rounded-2xl p-4 text-center">
                  <p className="text-[10px] uppercase font-mono tracking-widest text-[#7D8996] mb-3">TRANSACTION SCREENSHOT PREVIEW</p>
                  <img
                    src={previewUrl}
                    alt="Uploaded receipt preview"
                    className="max-h-64 mx-auto rounded-xl border border-white/10 object-contain shadow-xl"
                  />
                </div>

                <div className="flex items-center justify-between bg-[#06090D] border border-white/5 px-4 py-2.5 rounded-xl text-xs">
                  <div>
                    <span className="font-semibold text-[#F5F7FA]">{selectedFile?.name}</span>
                    <span className="text-[#7D8996] ml-2 font-mono">({(selectedFile?.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <button
                    onClick={() => { resetAllState(); }}
                    className="text-[#FF3158] hover:underline font-semibold text-xs font-mono"
                  >
                    [ REMOVE ]
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleAnalyzeImage}
                    disabled={isProcessing}
                    className="w-full bg-[#7C3AED] hover:bg-[#a855f7] text-white font-bold rounded-xl py-3 text-xs transition shadow-lg shadow-[#7C3AED]/30 disabled:opacity-50 uppercase font-mono tracking-wider"
                  >
                    RUN OCR EXTRACTION →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INVALID IMAGE REJECTION */}
        {validationData && validationData.imageValid === false && (
          <div className="bg-[#06090D] border border-[#FF3158]/50 rounded-2xl p-6 space-y-4 text-xs shadow-xl">
            <div className="flex items-center gap-3 text-[#FF3158] border-b border-white/5 pb-3">
              <span className="text-2xl">✕</span>
              <div>
                <h4 className="font-serif text-base font-bold text-[#F5F7FA]">INVALID TRANSACTION IMAGE</h4>
                <p className="text-[11px] text-[#FF3158] font-mono mt-0.5">
                  {validationData.message || 'This image does not appear to contain a readable payment transaction.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => { resetAllState(); }}
              className="w-full bg-[#0B1118] border border-white/10 hover:bg-[#7C3AED] text-xs font-semibold py-2.5 rounded-xl transition text-center font-mono uppercase"
            >
              UPLOAD ANOTHER IMAGE
            </button>
          </div>
        )}

        {/* EXTRACTED DETAILS & EDITABLE FORM */}
        {validationData && validationData.imageValid && !ocrFailedState && !savedTransaction && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT: Preview */}
              <div className="bg-[#06090D] border border-[#00F0FF]/30 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] uppercase font-mono tracking-widest text-[#7D8996]">TRANSACTION SCREENSHOT</p>
                <img
                  src={previewUrl}
                  alt="Uploaded receipt preview"
                  className="max-h-72 w-full mx-auto rounded-xl border border-white/10 object-contain shadow-xl"
                />
              </div>

              {/* RIGHT: Extracted Fields */}
              <div className="bg-[#06090D] border border-[#00F0FF]/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 className="font-serif text-base text-[#00F0FF] uppercase tracking-wider font-bold">EXTRACTED TRANSACTION DATA</h4>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs text-[#00F0FF] hover:underline font-semibold font-mono"
                  >
                    {isEditing ? '✓ SAVE EDITS' : '✏️ EDIT DATA'}
                  </button>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="bg-[#0B1118] p-2.5 rounded-xl space-y-1">
                    <span className="text-[#7D8996] text-[10px] uppercase block">Amount</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editableFields.amount}
                        onChange={(e) => setEditableFields({ ...editableFields, amount: e.target.value })}
                        className="w-full bg-[#06090D] border border-[#00F0FF]/40 rounded-lg px-2.5 py-1 text-xs text-[#F5F7FA] font-bold"
                      />
                    ) : (
                      <div className="font-mono font-bold text-base text-[#F5F7FA]">
                        {editableFields.amount ? `₹${Number(editableFields.amount).toLocaleString()}` : 'NOT DETECTED'}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#0B1118] p-2.5 rounded-xl space-y-1">
                    <span className="text-[#7D8996] text-[10px] uppercase block">Transaction ID</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editableFields.transactionId}
                        onChange={(e) => setEditableFields({ ...editableFields, transactionId: e.target.value })}
                        className="w-full bg-[#06090D] border border-[#00F0FF]/40 rounded-lg px-2.5 py-1 text-xs text-[#F5F7FA]"
                      />
                    ) : (
                      <div className="font-mono text-xs text-[#00F0FF]">
                        {editableFields.transactionId || 'NOT DETECTED'}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#0B1118] p-2.5 rounded-xl space-y-1">
                    <span className="text-[#7D8996] text-[10px] uppercase block">Activity</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editableFields.activity}
                        onChange={(e) => setEditableFields({ ...editableFields, activity: e.target.value })}
                        className="w-full bg-[#06090D] border border-[#00F0FF]/40 rounded-lg px-2.5 py-1 text-xs text-[#F5F7FA]"
                      />
                    ) : (
                      <div className="font-medium text-xs text-[#F5F7FA]">
                        {editableFields.activity || 'Unknown'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* STRUCTURED WHY IS THIS TRANSACTION RISKY? SECTION */}
            {riskData && (
              <div className="bg-[#06090D] border border-[#00F0FF]/30 rounded-2xl p-5 space-y-4 shadow-lg font-mono">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] text-[#7D8996] uppercase tracking-wider block">FRAUD EVALUATION</span>
                    <h4 className="font-serif text-lg font-bold text-[#F5F7FA]">WHY IS THIS TRANSACTION RISKY?</h4>
                  </div>
                  <RiskBadge status={riskData.level} score={riskData.score} />
                </div>

                <div className="space-y-2.5">
                  {riskData.riskFactors && riskData.riskFactors.length > 0 ? (
                    riskData.riskFactors.map((factor, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                          factor.severity === 'HIGH'
                            ? 'bg-[#FF3158]/10 border-[#FF3158]/40 text-[#FF3158]'
                            : factor.severity === 'MEDIUM'
                            ? 'bg-[#FFD000]/10 border-[#FFD000]/40 text-[#FFD000]'
                            : 'bg-[#00FF88]/10 border-[#00FF88]/40 text-[#00FF88]'
                        }`}
                      >
                        <div className="font-bold uppercase tracking-wider text-xs">{factor.title}</div>
                        <p className="text-[#F5F7FA]/90 text-[11px] leading-relaxed">{factor.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-[#00FF88]/10 border border-[#00FF88]/30 p-3.5 rounded-xl text-xs text-[#00FF88]">
                      ✓ Transaction pattern appears normal. Device and location verified.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BEHAVIORAL ANALYSIS & BASELINE SECTION */}
            {behavioralData && (
              <div className="bg-[#06090D] border border-[#00F0FF]/30 rounded-2xl p-5 space-y-3 shadow-lg font-mono">
                <h4 className="font-serif text-base text-[#00F0FF] uppercase font-bold">BEHAVIORAL ANALYSIS</h4>
                
                {behavioralData.hasSufficientHistory === false ? (
                  <div className="bg-[#0B1118] border border-white/10 rounded-xl p-4 text-xs text-[#7D8996] space-y-1">
                    <p className="font-bold text-[#F5F7FA] uppercase text-[11px]">Insufficient transaction history</p>
                    <p className="text-[11px]">More transactions are required to establish your normal behavior.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-[#0B1118] p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[#7D8996] block text-[10px] uppercase">Current Transaction</span>
                      <span className="font-mono font-bold text-[#F5F7FA]">₹{Number(editableFields.amount).toLocaleString()}</span>
                    </div>
                    <div className="bg-[#0B1118] p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[#7D8996] block text-[10px] uppercase">Historical Average</span>
                      <span className="font-mono text-[#F5F7FA]">₹{behavioralData.avgAmount?.toLocaleString()}</span>
                    </div>
                    <div className="bg-[#0B1118] p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[#7D8996] block text-[10px] uppercase">Typical Range</span>
                      <span className="font-mono text-[#F5F7FA]">₹{behavioralData.minAmount?.toLocaleString()} – ₹{behavioralData.maxAmount?.toLocaleString()}</span>
                    </div>
                    <div className="bg-[#0B1118] p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[#7D8996] block text-[10px] uppercase">Deviation</span>
                      <span className="font-mono text-[#FF3158] font-bold">
                        {behavioralData.deviationMultiple ? `${behavioralData.deviationMultiple}× baseline` : '1.0× baseline'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => handleFinalizeTransaction()}
              disabled={isProcessing}
              className="w-full bg-[#00F0FF] hover:bg-[#33f3ff] text-[#030507] font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-[#00F0FF]/30 disabled:opacity-50 uppercase font-mono"
            >
              {isProcessing ? 'SAVING TRANSACTION…' : 'CONFIRM & RUN FRAUD ENGINE →'}
            </button>
          </div>
        )}

        {/* FINAL TRANSACTION RESULT CARD */}
        {savedTransaction && (
          <div className="space-y-5">
            <div className="bg-[#06090D] border border-[#00F0FF]/40 rounded-2xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h4 className="font-serif text-lg uppercase tracking-wider text-[#00F0FF] font-bold">TRANSACTION ANALYZED</h4>
                  <p className="text-xs text-[#7D8996]">DATABASE STATUS: <span className="text-[#00FF88] font-semibold">✓ SAVED SUCCESSFULLY</span></p>
                </div>
                <RiskBadge status={savedTransaction.riskLevel} score={savedTransaction.riskScore} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[#7D8996] block text-[10px] uppercase">Amount</span>
                  <span className="font-mono font-bold text-xl text-[#F5F7FA]">
                    ₹{savedTransaction.amount?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[#7D8996] block text-[10px] uppercase">Risk Score</span>
                  <span className="font-mono font-bold text-xl text-[#7C3AED]">
                    {savedTransaction.riskScore} / 100
                  </span>
                </div>
                <div>
                  <span className="text-[#7D8996] block text-[10px] uppercase">Source</span>
                  <span className="font-semibold text-[#00F0FF]">
                    {savedTransaction.source === 'image' ? 'IMAGE ANALYSIS' : 'MANUAL'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  handleResetModal();
                  navigate(`/user/transactions/${savedTransaction._id}`);
                }}
                className="w-1/2 bg-[#0B1118] border border-white/10 hover:bg-[#00F0FF] hover:text-[#030507] text-xs font-bold py-3 rounded-xl transition text-center font-mono uppercase"
              >
                VIEW DETAILS
              </button>
              <button
                onClick={handleResetModal}
                className="w-1/2 bg-[#00F0FF] hover:bg-[#33f3ff] text-[#030507] font-bold text-xs py-3 rounded-xl transition text-center shadow-lg font-mono uppercase"
              >
                DONE
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
