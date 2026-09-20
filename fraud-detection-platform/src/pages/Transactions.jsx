import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import NewTransactionModal from '../components/NewTransactionModal';
import api from '../api/axios';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions', {
        params: {
          search: search || undefined,
          riskLevel: riskFilter !== 'All' ? riskFilter : undefined,
          paymentMethod: paymentFilter !== 'All' ? paymentFilter : undefined,
          source: sourceFilter !== 'All' ? sourceFilter : undefined,
          sort: sortBy
        }
      });
      setTransactions(res.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [riskFilter, paymentFilter, sourceFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  return (
    <Layout title="Transaction Monitoring">
      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#E0F7FC]">Transaction Monitoring</h2>
          <p className="text-xs text-[#7088A8]">Review your digital payment activity.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#FF007F] hover:bg-[#ff1a8c] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-[#FF007F]/30 flex items-center justify-center gap-2"
        >
          <span>➕</span>
          <span>Analyze Transaction</span>
        </button>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-[#141C33] border border-[#00F0FF]/20 rounded-2xl p-5 shadow-xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Search location, device, method..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0E1322] border border-[#00F0FF]/30 rounded-xl px-4 py-2 text-xs text-[#E0F7FC] placeholder-[#7088A8]/40 focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
          />

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-[#0E1322] border border-[#00F0FF]/30 rounded-xl px-3 py-2 text-xs text-[#E0F7FC] focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
          >
            <option value="All">All Risk Levels</option>
            <option value="Normal">Normal</option>
            <option value="Suspicious">Suspicious</option>
            <option value="High Risk">High Risk</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-[#0E1322] border border-[#00F0FF]/30 rounded-xl px-3 py-2 text-xs text-[#E0F7FC] focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
          >
            <option value="All">All Payment Methods</option>
            <option value="UPI">UPI</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Wire Transfer">Wire Transfer</option>
            <option value="Crypto Gateway">Crypto Gateway</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-[#0E1322] border border-[#00F0FF]/30 rounded-xl px-3 py-2 text-xs text-[#E0F7FC] focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
          >
            <option value="All">All Sources</option>
            <option value="manual">Manual</option>
            <option value="image">Image Analysis</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0E1322] border border-[#00F0FF]/30 rounded-xl px-3 py-2 text-xs text-[#E0F7FC] focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="highest_amount">Sort: Highest Amount</option>
            <option value="highest_risk">Sort: Highest Risk</option>
          </select>
        </form>
      </div>

      {/* Transactions List */}
      <div className="bg-[#141C33] border border-[#00F0FF]/20 rounded-2xl p-6 shadow-xl space-y-4">
        {loading ? (
          <p className="text-xs text-[#7088A8]/50 py-12 text-center animate-pulse">Loading transaction history...</p>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-xs text-[#7088A8]/60">No matching transactions found.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-block bg-[#FF007F] hover:bg-[#ff1a8c] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-md"
            >
              + Analyze First Transaction
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => (
              <div
                key={t._id}
                className="bg-[#0E1322] border border-white/5 hover:border-[#00F0FF]/40 rounded-xl p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-semibold text-[#E0F7FC]">
                      ₹{t.amount?.toLocaleString()}
                    </span>
                    <RiskBadge status={t.riskLevel || 'Normal'} score={t.riskScore} />

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141C33] text-[#00F0FF] border border-[#00F0FF]/20">
                      Source: {t.source === 'image' ? 'Image Analysis' : 'Manual'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7088A8] font-mono">
                    {t.transactionIdCustom && (
                      <span className="text-[#00F0FF] font-bold">ID: {t.transactionIdCustom}</span>
                    )}
                    <span>📍 {t.location}</span>
                    <span>💳 {t.paymentMethod}</span>
                    <span>⚡ {t.activity || 'UPI Payment'}</span>
                    <span>🕒 {new Date(t.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <Link
                  to={`/user/transactions/${t._id}`}
                  className="bg-[#141C33] hover:bg-[#00F0FF] hover:text-[#050811] border border-[#00F0FF]/40 text-xs font-semibold px-4 py-2 rounded-xl transition text-center"
                >
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Transaction Modal Component */}
      <NewTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchTransactions()}
      />
    </Layout>
  );
}
