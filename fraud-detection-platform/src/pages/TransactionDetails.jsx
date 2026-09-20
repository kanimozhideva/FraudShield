import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function TransactionDetails() {
  const { user } = useAuth();
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [riskInfo, setRiskInfo] = useState(null);
  const [bAnalysis, setBAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [fraudType, setFraudType] = useState('Unauthorized Transaction');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportMessage, setReportMessage] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id || id === ':id') {
        setError('Invalid transaction reference.');
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/transactions/${id}`);
        setTransaction(res.data.transaction || res.data);
        setRiskInfo(res.data.risk || null);
        setBAnalysis(res.data.behavioralAnalysis || null);
      } catch (err) {
        setError(err.response?.data?.message || err.response?.data?.error || 'Unable to load transaction details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();

    if (isAdmin) {
      setReportMessage('⚠️ Administrators manage and investigate fraud reports; they cannot create user fraud reports.');
      return;
    }

    setReportSubmitting(true);
    setReportMessage('');

    try {
      await api.post('/reports', {
        transactionId: transaction._id,
        fraudType,
        description: reportDescription || 'User reported unauthorized transaction activity.'
      });
      setReportMessage('✓ Fraud report submitted successfully! Admin SOC has been notified.');
      setTimeout(() => {
        setReportModalOpen(false);
      }, 2000);
    } catch (err) {
      setReportMessage(`⚠️ ${err.response?.data?.error || 'Failed to submit report. It may already be reported.'}`);
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Transaction Detail">
        <div className="bg-[#0B1118] border border-[#00F0FF]/22 rounded-2xl p-12 text-center text-xs text-[#7D8996]/50 animate-pulse font-mono">
          Analyzing transaction metadata...
        </div>
      </Layout>
    );
  }

  if (error || !transaction) {
    return (
      <Layout title="Transaction Detail">
        <div className="bg-[#0B1118] border border-[#FF3158]/30 rounded-2xl p-8 text-center space-y-4">
          <p className="text-sm text-[#FF3158] font-semibold">{error || 'Invalid transaction reference.'}</p>
          <Link
            to={isAdmin ? '/admin/transactions' : '/user/transactions'}
            className="inline-block bg-[#06090D] border border-white/10 text-xs px-4 py-2 rounded-xl text-[#F5F7FA] font-mono"
          >
            ← Back to Transactions
          </Link>
        </div>
      </Layout>
    );
  }

  const factors = riskInfo?.riskFactors || [];

  return (
    <Layout title={`TXN-#${(transaction._id || '').substring(0, 8)}`}>
      <div className="flex items-center justify-between font-mono">
        <Link
          to={isAdmin ? '/admin/transactions' : '/user/transactions'}
          className="text-xs text-[#7D8996] hover:text-[#F5F7FA] transition"
        >
          ← Back to Transactions List
        </Link>
        <RiskBadge status={transaction.riskLevel || 'Normal'} score={transaction.riskScore} />
      </div>

      {/* Transaction Overview Card */}
      <div className="bg-[#0B1118] border border-[#00F0FF]/22 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-bold text-[#F5F7FA]">
              ₹{transaction.amount?.toLocaleString()}
            </h2>
            <p className="text-xs text-[#00F0FF] font-mono font-bold mt-1">
              Transaction ID: {transaction.transactionIdCustom || transaction._id}
            </p>
          </div>

          {/* ROLE SEPARATION: Render Report Fraud ONLY for normal users */}
          {!isAdmin ? (
            <button
              onClick={() => setReportModalOpen(true)}
              className="bg-[#FF3158] hover:bg-[#ff1a44] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg text-center font-mono uppercase tracking-wider"
            >
              ⚠️ REPORT FRAUD
            </button>
          ) : (
            <Link
              to="/admin/investigations"
              className="bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF]/40 text-xs font-bold px-4 py-2.5 rounded-xl transition text-center font-mono uppercase tracking-wider"
            >
              GO TO INVESTIGATION CENTER →
            </Link>
          )}
        </div>

        {/* Core Properties Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-[#06090D] border border-white/5 rounded-xl p-4 space-y-1">
            <span className="text-[#7D8996] uppercase tracking-wider text-[10px]">Payment Method</span>
            <p className="font-semibold text-[#F5F7FA]">{transaction.paymentMethod}</p>
          </div>
          <div className="bg-[#06090D] border border-white/5 rounded-xl p-4 space-y-1">
            <span className="text-[#7D8996] uppercase tracking-wider text-[10px]">Detection Source</span>
            <p className="font-semibold text-[#00F0FF]">
              {transaction.source === 'image' ? '📷 IMAGE ANALYSIS' : '✍️ MANUAL'}
            </p>
          </div>
          <div className="bg-[#06090D] border border-white/5 rounded-xl p-4 space-y-1">
            <span className="text-[#7D8996] uppercase tracking-wider text-[10px]">Activity</span>
            <p className="font-semibold text-[#F5F7FA]">{transaction.activity || 'UPI Payment'}</p>
          </div>
          <div className="bg-[#06090D] border border-white/5 rounded-xl p-4 space-y-1">
            <span className="text-[#7D8996] uppercase tracking-wider text-[10px]">Timestamp</span>
            <p className="font-semibold text-[#F5F7FA]">{new Date(transaction.timestamp).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* WHY IS THIS TRANSACTION RISKY? SECTION */}
      <div className="bg-[#0B1118] border border-[#00F0FF]/22 rounded-2xl p-6 shadow-xl space-y-4 font-mono">
        <div className="border-b border-white/10 pb-3">
          <span className="text-[10px] text-[#7D8996] uppercase tracking-wider block">AI RISK ANALYSIS</span>
          <h3 className="font-serif text-lg text-[#F5F7FA] uppercase font-bold">WHY IS THIS TRANSACTION RISKY?</h3>
        </div>

        <div className="space-y-3">
          {factors && factors.length > 0 ? (
            factors.map((factor, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border space-y-1 ${
                  factor.severity === 'HIGH'
                    ? 'bg-[#FF3158]/10 border-[#FF3158]/40 text-[#FF3158]'
                    : factor.severity === 'MEDIUM'
                    ? 'bg-[#FFD000]/10 border-[#FFD000]/40 text-[#FFD000]'
                    : 'bg-[#00FF88]/10 border-[#00FF88]/40 text-[#00FF88]'
                }`}
              >
                <div className="font-bold uppercase tracking-wider text-xs">{factor.title}</div>
                <p className="text-[#F5F7FA]/90 text-xs leading-relaxed">{factor.description}</p>
              </div>
            ))
          ) : (
            <div className="bg-[#00FF88]/10 border border-[#00FF88]/30 p-4 rounded-xl text-xs text-[#00FF88]">
              ✓ Transaction pattern appears normal. Device and location verified.
            </div>
          )}
        </div>
      </div>

      {/* BEHAVIORAL ANALYSIS & BASELINE SECTION */}
      <div className="bg-[#0B1118] border border-[#00F0FF]/22 rounded-2xl p-6 shadow-xl space-y-4 font-mono">
        <h3 className="font-serif text-lg text-[#00F0FF] font-bold uppercase">BEHAVIORAL ANALYSIS</h3>

        {bAnalysis && bAnalysis.hasSufficientHistory === false ? (
          <div className="bg-[#06090D] border border-white/10 rounded-xl p-4 text-xs text-[#7D8996] space-y-1">
            <p className="font-bold text-[#F5F7FA] uppercase text-xs">Insufficient transaction history</p>
            <p className="text-xs">More transactions are required to establish your normal behavior.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-[#06090D] border border-white/5 rounded-xl p-4 space-y-1">
              <span className="text-[#7D8996] uppercase text-[10px]">Current Transaction</span>
              <p className="font-serif text-lg font-bold text-[#F5F7FA]">₹{transaction.amount?.toLocaleString()}</p>
            </div>
            <div className="bg-[#06090D] border border-white/5 rounded-xl p-4 space-y-1">
              <span className="text-[#7D8996] uppercase text-[10px]">Historical Average</span>
              <p className="font-serif text-lg font-bold text-[#F5F7FA]">₹{(bAnalysis?.avgAmount || 0).toLocaleString()}</p>
            </div>
            <div className="bg-[#06090D] border border-white/5 rounded-xl p-4 space-y-1">
              <span className="text-[#7D8996] uppercase text-[10px]">Typical Range</span>
              <p className="font-serif text-lg font-bold text-[#F5F7FA]">
                ₹{(bAnalysis?.minAmount || 0).toLocaleString()} – ₹{(bAnalysis?.maxAmount || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-[#06090D] border border-white/5 rounded-xl p-4 space-y-1">
              <span className="text-[#7D8996] uppercase text-[10px]">Deviation</span>
              <p className="font-serif text-lg font-bold text-[#FF3158]">
                {bAnalysis?.deviationMultiple || '1.0'}× baseline
              </p>
            </div>
          </div>
        )}
      </div>

      {/* REPORT FRAUD CONFIRMATION MODAL (USER ONLY) */}
      {!isAdmin && reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030507]/90 backdrop-blur-md p-4">
          <div className="bg-[#0B1118] border border-[#FF3158]/40 rounded-2xl max-w-md w-full p-6 space-y-4 font-mono shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-serif text-lg text-[#FF3158] font-bold uppercase">REPORT FRAUDULENT TRANSACTION</h3>
              <button onClick={() => setReportModalOpen(false)} className="text-[#7D8996] hover:text-white">✕</button>
            </div>

            <p className="text-xs text-[#F5F7FA] leading-relaxed">
              Did you not authorize this transaction of <span className="font-bold text-[#00F0FF]">₹{transaction.amount?.toLocaleString()}</span>?
            </p>

            {reportMessage && (
              <div className="text-xs p-3 rounded-xl bg-[#06090D] border border-[#00F0FF]/30 text-[#F5F7FA]">
                {reportMessage}
              </div>
            )}

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] text-[#7D8996] uppercase mb-1">Fraud Type Category</label>
                <select
                  value={fraudType}
                  onChange={(e) => setFraudType(e.target.value)}
                  className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-3 py-2 text-xs text-[#F5F7FA]"
                >
                  <option value="Unauthorized Transaction">Unauthorized Transaction</option>
                  <option value="Phishing Scam">Phishing Scam</option>
                  <option value="Stolen Card Credentials">Stolen Card Credentials</option>
                  <option value="Account Takeover">Account Takeover</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#7D8996] uppercase mb-1">Optional Reason / Description</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide additional details about why this transaction is suspicious..."
                  className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl p-3 text-xs text-[#F5F7FA] h-20"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="w-1/2 bg-[#06090D] border border-white/10 text-xs font-bold py-2.5 rounded-xl text-[#7D8996]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="w-1/2 bg-[#FF3158] hover:bg-[#ff1a44] text-white font-bold text-xs py-2.5 rounded-xl transition shadow-lg"
                >
                  {reportSubmitting ? 'SUBMITTING…' : 'CONFIRM REPORT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
