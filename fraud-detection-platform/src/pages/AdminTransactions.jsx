import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import api from '../api/axios';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/transactions', {
        params: {
          search: search || undefined,
          riskLevel: riskFilter !== 'All' ? riskFilter : undefined,
          paymentMethod: paymentFilter !== 'All' ? paymentFilter : undefined,
          sort: sortBy
        }
      });
      setTransactions(res.data);
    } catch (err) {
      console.error('Error fetching admin transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [riskFilter, paymentFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  return (
    <Layout title="System-Wide Transactions Audit">
      <div className="bg-[#16263B] border border-white/5 rounded-2xl p-5 shadow-xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search location, device, method..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0F1B2B] border border-white/10 rounded-xl px-4 py-2 text-xs text-[#F4EFE6] focus:outline-none focus:ring-2 focus:ring-[#D9A441]/50"
          />

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-[#0F1B2B] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-none focus:ring-2 focus:ring-[#D9A441]/50"
          >
            <option value="All">All Risk Levels</option>
            <option value="Normal">Normal</option>
            <option value="Suspicious">Suspicious</option>
            <option value="High Risk">High Risk</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-[#0F1B2B] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-none focus:ring-2 focus:ring-[#D9A441]/50"
          >
            <option value="All">All Payment Methods</option>
            <option value="Credit Card">Credit Card</option>
            <option value="UPI">UPI</option>
            <option value="Wire Transfer">Wire Transfer</option>
            <option value="Crypto Gateway">Crypto Gateway</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0F1B2B] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F4EFE6] focus:outline-none focus:ring-2 focus:ring-[#D9A441]/50"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="highest_amount">Sort: Highest Amount</option>
            <option value="highest_risk">Sort: Highest Risk</option>
          </select>
        </form>
      </div>

      <div className="bg-[#16263B] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="font-serif text-lg text-[#F4EFE6]">
            System Transactions <span className="text-xs text-[#F4EFE6]/40 font-mono font-normal">({transactions.length})</span>
          </h2>
        </div>

        {loading ? (
          <p className="text-xs text-[#F4EFE6]/40 py-12 text-center animate-pulse">Loading transaction records...</p>
        ) : transactions.length === 0 ? (
          <p className="text-xs text-[#F4EFE6]/40 py-12 text-center">No matching system transactions found.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => (
              <div
                key={t._id}
                className="bg-[#0F1B2B] border border-white/5 hover:border-[#D9A441]/30 rounded-xl p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-semibold text-[#F4EFE6]">
                      ₹{t.amount?.toLocaleString()}
                    </span>
                    <RiskBadge status={t.riskLevel || 'Normal'} score={t.riskScore} />

                    {/* Detection Source Badge */}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#D9A441] border border-white/10">
                      {t.source === 'image' ? '📷 Image Analysis' : '✍️ Manual Entry'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#F4EFE6]/60">
                    <span>User: {t.userId?.name || 'Unknown'} ({t.userId?.email || 'N/A'})</span>
                    <span>📍 {t.location}</span>
                    <span>💻 {t.device}</span>
                    <span>💳 {t.paymentMethod}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={t._id ? `/user/transactions/${t._id}` : '/admin/transactions'}
                    className="bg-[#16263B] hover:bg-[#D9A441] hover:text-[#0F1B2B] border border-white/10 text-xs font-semibold px-4 py-2 rounded-xl transition text-center"
                  >
                    Inspect →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
