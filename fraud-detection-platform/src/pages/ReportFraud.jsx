import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';

const fraudTypes = [
  'Unauthorized Transaction',
  'Account Takeover',
  'UPI Fraud',
  'Card Fraud',
  'Phishing',
  'Fake Payment',
  'Suspicious Transfer',
  'Other'
];

export default function ReportFraud() {
  const location = useLocation();
  const navigate = useNavigate();
  const preselectedTxId = location.state?.transactionId || '';

  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    transactionId: preselectedTxId,
    fraudType: 'Unauthorized Transaction',
    description: '',
    evidence: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get('/transactions');
        setTransactions(res.data);
        if (!preselectedTxId && res.data.length > 0) {
          setForm((prev) => ({ ...prev, transactionId: res.data[0]._id }));
        }
      } catch (err) {
        console.error('Error fetching transactions for reporting:', err);
      }
    };
    fetchTransactions();
  }, [preselectedTxId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/fraud/report', form);
      setSuccessMsg('Fraud report filed successfully! Status is now Pending investigation.');
      setTimeout(() => navigate('/user/reports'), 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Report Fraudulent Activity">
      <div className="max-w-2xl mx-auto bg-[#151116] border border-[#5A1020]/20 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="border-b border-[#5A1020]/20 pb-4">
          <h2 className="font-serif text-xl font-bold text-[#F5F1F2]">Submit Fraud Investigation Request</h2>
          <p className="text-xs text-[#A8A0A3] mt-1">
            Reports are immediately transmitted to the Security Operations team for investigation.
          </p>
        </div>

        {successMsg && (
          <div className="bg-[#2E9B63]/20 border border-[#2E9B63]/50 text-[#2E9B63] text-xs px-4 py-3 rounded-xl font-semibold">
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="bg-[#D94A5A]/20 border border-[#D94A5A]/50 text-[#D94A5A] text-xs px-4 py-3 rounded-xl font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Transaction Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#A8A0A3] mb-1.5">Target Transaction</label>
            <select
              name="transactionId"
              value={form.transactionId}
              onChange={handleChange}
              required
              className="w-full bg-[#0D0D0F] border border-[#5A1020]/30 rounded-xl px-4 py-2.5 text-xs text-[#F5F1F2] focus:outline-none focus:ring-2 focus:ring-[#7A1F35]"
            >
              {transactions.length === 0 ? (
                <option value="">No transactions available</option>
              ) : (
                transactions.map((t) => (
                  <option key={t._id} value={t._id}>
                    ₹{t.amount?.toLocaleString()} — {t.location} ({t.paymentMethod}) — #{t._id.substring(0, 8)}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Fraud Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#A8A0A3] mb-1.5">Fraud Type Category</label>
            <select
              name="fraudType"
              value={form.fraudType}
              onChange={handleChange}
              required
              className="w-full bg-[#0D0D0F] border border-[#5A1020]/30 rounded-xl px-4 py-2.5 text-xs text-[#F5F1F2] focus:outline-none focus:ring-2 focus:ring-[#7A1F35]"
            >
              {fraudTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Incident Description */}
          <div>
            <label className="block text-xs font-semibold text-[#A8A0A3] mb-1.5">Detailed Description</label>
            <textarea
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              required
              placeholder="Explain why this transaction is suspicious (e.g. unrecognized device, incorrect location, unauthorized charge)..."
              className="w-full bg-[#0D0D0F] border border-[#5A1020]/30 rounded-xl p-4 text-xs text-[#F5F1F2] placeholder-[#A8A0A3]/30 focus:outline-none focus:ring-2 focus:ring-[#7A1F35]"
            />
          </div>

          {/* Supporting Evidence */}
          <div>
            <label className="block text-xs font-semibold text-[#A8A0A3] mb-1.5">Supporting Evidence (Optional)</label>
            <input
              name="evidence"
              type="text"
              value={form.evidence}
              onChange={handleChange}
              placeholder="Reference logs, notification IDs, email alerts..."
              className="w-full bg-[#0D0D0F] border border-[#5A1020]/30 rounded-xl px-4 py-2.5 text-xs text-[#F5F1F2] placeholder-[#A8A0A3]/30 focus:outline-none focus:ring-2 focus:ring-[#7A1F35]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#5A1020] hover:bg-[#7A1F35] text-[#F5F1F2] font-semibold rounded-xl py-3 text-xs transition shadow-lg shadow-[#5A1020]/30 disabled:opacity-60"
          >
            {submitting ? 'Transmitting Report…' : 'Transmit Fraud Report'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
