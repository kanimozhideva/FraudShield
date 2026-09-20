import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const riskStyles = {
  Normal: 'bg-[#4A9D6F]/15 text-[#4A9D6F] border-[#4A9D6F]/30',
  Suspicious: 'bg-[#D9A441]/15 text-[#D9A441] border-[#D9A441]/30',
  'High Risk': 'bg-[#C0433F]/15 text-[#C0433F] border-[#C0433F]/30',
};

const statusStyles = {
  Pending: 'bg-[#D9A441]/15 text-[#D9A441]',
  'Under Investigation': 'bg-blue-400/15 text-blue-300',
  'Confirmed Fraud': 'bg-[#C0433F]/15 text-[#C0433F]',
  Resolved: 'bg-[#4A9D6F]/15 text-[#4A9D6F]',
};

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({ amount: '', location: '', device: '', paymentMethod: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchAll = () => {
    axios.get('http://localhost:5000/api/transactions', getAuthHeaders())
      .then(res => setTransactions(res.data))
      .catch(err => {
        if (err.response?.status === 401) logout();
      });

    axios.get('http://localhost:5000/api/fraud/reports', getAuthHeaders())
      .then(res => setReports(res.data))
      .catch(err => {
        if (err.response?.status === 401) logout();
      });
  };

  useEffect(() => { fetchAll(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    try {
      await axios.post('http://localhost:5000/api/transactions', {
        ...form, amount: Number(form.amount)
      }, getAuthHeaders());
      setForm({ amount: '', location: '', device: '', paymentMethod: '' });
      fetchAll();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (transactionId) => {
    try {
      await axios.post('http://localhost:5000/api/fraud/report', {
        transactionId,
        fraudType: 'Unauthorized transaction',
        description: 'Reported by user from dashboard'
      }, getAuthHeaders());
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to report transaction');
    }
  };

  const logout = () => { localStorage.clear(); navigate('/'); };

  const stats = {
    total: transactions.length,
    normal: transactions.filter(t => t.riskLevel === 'Normal').length,
    flagged: transactions.filter(t => t.riskLevel !== 'Normal').length,
  };

  return (
    <div className="min-h-screen bg-[#0F1B2B] text-[#F4EFE6]">
      <nav className="border-b border-white/5 px-6 md:px-10 py-4 flex items-center justify-between">
        <h1 className="font-serif text-xl">FraudGuard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#F4EFE6]/60">Hi, {user?.name}</span>
          <button onClick={logout} className="text-sm text-[#F4EFE6]/60 hover:text-[#D9A441] transition">Logout</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-8">
        {errorMessage && (
          <div className="bg-[#C0433F]/20 border border-[#C0433F]/50 text-[#C0433F] px-4 py-3 rounded-xl text-sm">
            {errorMessage}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#16263B] border border-white/5 rounded-xl p-5">
            <p className="text-xs text-[#F4EFE6]/50 mb-1">Total transactions</p>
            <p className="font-serif text-2xl">{stats.total}</p>
          </div>
          <div className="bg-[#16263B] border border-white/5 rounded-xl p-5">
            <p className="text-xs text-[#F4EFE6]/50 mb-1">Normal</p>
            <p className="font-serif text-2xl text-[#4A9D6F]">{stats.normal}</p>
          </div>
          <div className="bg-[#16263B] border border-white/5 rounded-xl p-5">
            <p className="text-xs text-[#F4EFE6]/50 mb-1">Flagged</p>
            <p className="font-serif text-2xl text-[#D9A441]">{stats.flagged}</p>
          </div>
        </div>

        {/* Add transaction */}
        <div className="bg-[#16263B] border border-white/5 rounded-xl p-6">
          <h2 className="font-serif text-lg mb-4">Add transaction</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input name="amount" type="number" placeholder="Amount" value={form.amount} onChange={handleChange} required
              className="bg-[#0F1B2B] border border-white/10 rounded-lg px-3 py-2 text-sm placeholder-[#F4EFE6]/30 focus:outline-none focus:ring-2 focus:ring-[#D9A441]/50" />
            <input name="location" placeholder="Location" value={form.location} onChange={handleChange} required
              className="bg-[#0F1B2B] border border-white/10 rounded-lg px-3 py-2 text-sm placeholder-[#F4EFE6]/30 focus:outline-none focus:ring-2 focus:ring-[#D9A441]/50" />
            <input name="device" placeholder="Device" value={form.device} onChange={handleChange} required
              className="bg-[#0F1B2B] border border-white/10 rounded-lg px-3 py-2 text-sm placeholder-[#F4EFE6]/30 focus:outline-none focus:ring-2 focus:ring-[#D9A441]/50" />
            <input name="paymentMethod" placeholder="Payment method" value={form.paymentMethod} onChange={handleChange} required
              className="bg-[#0F1B2B] border border-white/10 rounded-lg px-3 py-2 text-sm placeholder-[#F4EFE6]/30 focus:outline-none focus:ring-2 focus:ring-[#D9A441]/50" />
            <button type="submit" disabled={submitting}
              className="col-span-2 md:col-span-4 bg-[#D9A441] hover:bg-[#c99530] text-[#0F1B2B] font-semibold rounded-lg py-2 text-sm transition disabled:opacity-60">
              {submitting ? 'Submitting…' : 'Submit transaction'}
            </button>
          </form>
        </div>

        {/* Transactions */}
        <div className="bg-[#16263B] border border-white/5 rounded-xl p-6">
          <h2 className="font-serif text-lg mb-4">Your transactions</h2>
          <div className="space-y-2">
            {transactions.length === 0 && <p className="text-sm text-[#F4EFE6]/40">No transactions yet.</p>}
            {transactions.map(t => (
              <div key={t._id} className="flex items-center justify-between bg-[#0F1B2B] border border-white/5 rounded-lg px-4 py-3">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm">₹{t.amount.toLocaleString()}</span>
                  <span className="text-sm text-[#F4EFE6]/50">{t.location}</span>
                  <span className={`text-xs px-2 py-1 rounded-full border ${riskStyles[t.riskLevel] || riskStyles.Normal}`}>
                    {t.riskLevel || 'Normal'}
                  </span>
                </div>
                {t.riskLevel !== 'Normal' && (
                  <button onClick={() => handleReport(t._id)}
                    className="text-xs text-[#C0433F] border border-[#C0433F]/30 hover:bg-[#C0433F]/10 rounded-lg px-3 py-1.5 transition">
                    Report
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* My Reports */}
        <div className="bg-[#16263B] border border-white/5 rounded-xl p-6">
          <h2 className="font-serif text-lg mb-4">Your reports</h2>
          <div className="space-y-2">
            {reports.length === 0 && <p className="text-sm text-[#F4EFE6]/40">No reports filed yet.</p>}
            {reports.map(r => (
              <div key={r._id} className="flex items-center justify-between bg-[#0F1B2B] border border-white/5 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm">{r.fraudType}</p>
                  <p className="text-xs text-[#F4EFE6]/40">{r.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[r.status] || statusStyles.Pending}`}>
                  {r.status || 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;