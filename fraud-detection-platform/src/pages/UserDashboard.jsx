import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import KPICard from '../components/KPICard';
import RiskBadge from '../components/RiskBadge';
import NewTransactionModal from '../components/NewTransactionModal';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getGreeting } from '../utils/greeting';

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialModalTab, setInitialModalTab] = useState(null);

  const fetchData = async () => {
    try {
      const [txRes, rptRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/fraud/reports'),
      ]);
      setTransactions(txRes.data);
      setReports(rptRes.data);
    } catch (err) {
      console.error('Error fetching user dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAnalysisModal = (mode = null) => {
    setInitialModalTab(mode);
    setIsModalOpen(true);
  };

  const stats = {
    total: transactions.length,
    suspicious: transactions.filter(t => t.riskLevel === 'Suspicious').length,
    highRisk: transactions.filter(t => t.riskLevel === 'High Risk').length,
    reported: reports.length,
  };

  const greetingText = getGreeting();

  return (
    <Layout title="Dashboard">
      {/* Header Banner */}
      <div className="border-b border-[#00F0FF]/22 pb-4 space-y-1">
        <h2 className="font-serif text-2xl font-bold text-[#F5F7FA] tracking-wide">
          {greetingText}, {user?.name || 'Kani'}
        </h2>
        <p className="text-xs text-[#7D8996]">
          FraudShield Digital Payment Fraud Detection Console
        </p>
      </div>

      {/* Security Status Panel */}
      <div className="bg-[#0B1118] border border-[#00FF88]/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl shadow-[#00FF88]/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00FF88]/15 text-[#00FF88] flex items-center justify-center text-xl font-bold border border-[#00FF88]/40 shadow-[0_0_10px_rgba(0,255,136,0.3)]">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#00FF88] uppercase">SYSTEM STATUS</span>
              <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping" />
            </div>
            <h3 className="font-serif text-base font-bold text-[#00FF88] tracking-wider">● PROTECTED</h3>
            <p className="text-xs text-[#7D8996]">Real-time transaction monitoring active</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={() => openAnalysisModal('manual')}
            className="bg-[#06090D] hover:bg-[#00F0FF] hover:text-[#030507] text-[#00F0FF] border border-[#00F0FF]/40 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md uppercase"
          >
            + MANUAL TRANSACTION
          </button>
          <button
            onClick={() => openAnalysisModal('image')}
            className="bg-[#7C3AED] hover:bg-[#a855f7] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-[#7C3AED]/30 uppercase"
          >
            📷 UPLOAD TRANSACTION
          </button>
        </div>
      </div>

      {/* Transaction Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="TOTAL TRANSACTIONS" value={stats.total} icon="💳" subtext="System lifetime" />
        <KPICard title="SUSPICIOUS" value={stats.suspicious} icon="⚠️" color="text-[#FFD000]" subtext="Score 31-60" />
        <KPICard title="HIGH RISK" value={stats.highRisk} icon="🚨" color="text-[#FF3158]" subtext="Score 61-100" />
        <KPICard title="REPORTED" value={stats.reported} icon="📋" color="text-[#00F0FF]" subtext="User-filed cases" />
      </div>

      {/* Central Action Cards Section */}
      <div className="space-y-3">
        <h3 className="font-serif text-base font-bold tracking-wider text-[#00F0FF] uppercase font-mono">ANALYZE TRANSACTION</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option 1: MANUAL TRANSACTION */}
          <div
            onClick={() => openAnalysisModal('manual')}
            className="bg-[#0B1118] border border-[#00F0FF]/22 hover:border-[#00F0FF] rounded-2xl p-6 space-y-4 cursor-pointer transition shadow-xl group hover:shadow-[#00F0FF]/20"
          >
            <div className="w-12 h-12 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] flex items-center justify-center text-2xl group-hover:scale-105 transition">
              ✎
            </div>
            <div>
              <h4 className="font-serif text-lg font-bold text-[#F5F7FA] tracking-wide">MANUAL TRANSACTION</h4>
              <p className="text-xs text-[#7D8996] mt-1 leading-relaxed">
                Enter transaction details manually when you don't have a transaction screenshot.
              </p>
            </div>
            <button className="w-full bg-[#06090D] group-hover:bg-[#00F0FF] group-hover:text-[#030507] text-[#00F0FF] border border-[#00F0FF]/40 text-xs font-bold py-3 rounded-xl transition text-center shadow-md font-mono uppercase">
              MANUAL TRANSACTION →
            </button>
          </div>

          {/* Option 2: UPLOAD TRANSACTION */}
          <div
            onClick={() => openAnalysisModal('image')}
            className="bg-[#0B1118] border border-[#7C3AED]/30 hover:border-[#A855F7] rounded-2xl p-6 space-y-4 cursor-pointer transition shadow-xl group hover:shadow-[#7C3AED]/20"
          >
            <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/40 text-[#A855F7] flex items-center justify-center text-2xl group-hover:scale-105 transition">
              🖼
            </div>
            <div>
              <h4 className="font-serif text-lg font-bold text-[#F5F7FA] tracking-wide">UPLOAD TRANSACTION</h4>
              <p className="text-xs text-[#7D8996] mt-1 leading-relaxed">
                Upload a payment screenshot. Tesseract.js validates receipt structure & extracts transaction data.
              </p>
            </div>
            <button className="w-full bg-[#7C3AED] hover:bg-[#a855f7] text-white font-bold text-xs py-3 rounded-xl transition text-center shadow-lg shadow-[#7C3AED]/30 font-mono uppercase">
              UPLOAD TRANSACTION →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-[#0B1118] border border-[#00F0FF]/22 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="font-serif text-lg text-[#F5F7FA]">Recent Monitored Transactions</h2>
            <p className="text-xs text-[#7D8996]">Evaluated by unified FraudShield risk engine</p>
          </div>
          <Link to="/user/transactions" className="text-xs text-[#00F0FF] hover:underline font-semibold transition font-mono">
            View All →
          </Link>
        </div>

        {loading ? (
          <p className="text-xs text-[#7D8996]/50 animate-pulse py-8 text-center font-mono">Loading transaction history...</p>
        ) : transactions.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-xs text-[#7D8996]/60">No transactions recorded yet.</p>
            <button
              onClick={() => openAnalysisModal('image')}
              className="inline-block bg-[#7C3AED] hover:bg-[#a855f7] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-md font-mono uppercase"
            >
              + Upload First Transaction
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((t) => (
              <div key={t._id} className="flex items-center justify-between bg-[#06090D] border border-white/5 rounded-xl p-4 hover:border-[#00F0FF]/40 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-base text-[#F5F7FA]">
                      ₹{t.amount?.toLocaleString()}
                    </span>
                    <RiskBadge status={t.riskLevel || 'Normal'} score={t.riskScore} />

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B1118] text-[#00F0FF] border border-[#00F0FF]/20">
                      SOURCE: {t.source === 'image' ? 'IMAGE ANALYSIS' : 'MANUAL'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7D8996] font-mono">
                    {t.transactionIdCustom && (
                      <span className="text-[#00F0FF] font-bold">ID: {t.transactionIdCustom}</span>
                    )}
                    <span>💳 {t.paymentMethod}</span>
                    <span>📍 {t.location}</span>
                    <span>🕒 {new Date(t.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
                <Link
                  to={`/user/transactions/${t._id}`}
                  className="text-xs text-[#F5F7FA] hover:bg-[#00F0FF] hover:text-[#030507] border border-[#00F0FF]/40 px-3 py-1.5 rounded-lg transition font-mono"
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
        initialMode={initialModalTab}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchData()}
      />
    </Layout>
  );
}
