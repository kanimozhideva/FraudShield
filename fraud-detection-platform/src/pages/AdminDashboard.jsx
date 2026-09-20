import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import KPICard from '../components/KPICard';
import RiskBadge from '../components/RiskBadge';
import RiskDonutChart from '../components/RiskDonutChart';
import FraudTrendChart from '../components/FraudTrendChart';
import InvestigationTimeline from '../components/InvestigationTimeline';
import ConfirmModal from '../components/ConfirmModal';
import api from '../api/axios';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [highRiskTx, setHighRiskTx] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Freeze Modal State
  const [freezeModal, setFreezeModal] = useState({ isOpen: false, userId: null, userName: '', isCurrentlyFrozen: false });
  // Confirm Fraud Double Confirmation Modal State (Section 10)
  const [confirmFraudModal, setConfirmFraudModal] = useState({ isOpen: false, report: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, reportsRes, txRes, actRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/reports'),
        api.get('/admin/transactions'),
        api.get('/admin/investigations/recent'),
      ]);
      setAnalytics(analyticsRes.data);
      setReports(reportsRes.data);
      setHighRiskTx(txRes.data.filter(t => t.riskLevel === 'High Risk' || t.riskLevel === 'Suspicious').slice(0, 5));
      setActivities(actRes.data);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update report status
  const handleUpdateReportStatus = async (reportId, newStatus) => {
    try {
      await api.put(`/admin/reports/${reportId}`, { status: newStatus });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to update report status:', err);
    }
  };

  // Open Confirm Fraud Double Confirmation Modal
  const openConfirmFraudModal = (report) => {
    setConfirmFraudModal({ isOpen: true, report });
  };

  // Execute Actual Confirm Fraud Backend API
  const handleExecuteConfirmFraud = async () => {
    if (!confirmFraudModal.report) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/reports/${confirmFraudModal.report._id}/confirm-fraud`);
      setConfirmFraudModal({ isOpen: false, report: null });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to confirm fraud:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Freeze/Unfreeze confirmation modal
  const openFreezeModal = (userObj) => {
    setFreezeModal({
      isOpen: true,
      userId: userObj._id,
      userName: userObj.name || userObj.email || 'User',
      isCurrentlyFrozen: userObj.isFrozen || userObj.status === 'frozen'
    });
  };

  // Confirm Freeze/Unfreeze Action
  const handleConfirmFreezeToggle = async () => {
    setActionLoading(true);
    const endpoint = freezeModal.isCurrentlyFrozen
      ? `/admin/users/${freezeModal.userId}/unfreeze`
      : `/admin/users/${freezeModal.userId}/freeze`;

    try {
      await api.put(endpoint, { freezeReason: 'Confirmed fraud activity investigated by admin.' });
      setFreezeModal({ isOpen: false, userId: null, userName: '', isCurrentlyFrozen: false });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to update freeze status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Layout title="SECURITY OPERATIONS CENTER">
      {/* Header Subtitle */}
      <div className="border-b border-[#00F0FF]/22 pb-4 space-y-1">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-[10px] bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/40 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
            SOC COMMAND LEVEL 1
          </span>
          <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping"></span>
        </div>
        <h2 className="font-serif text-[#F5F7FA] text-2xl font-bold tracking-wide">FRAUDSHIELD SECURITY OPERATIONS CENTER</h2>
        <p className="text-xs text-[#7D8996]">Central cybersecurity command for monitoring, triaging, and mitigating payment threats.</p>
      </div>

      {/* Top Admin KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard title="ALL TRANSACTIONS" value={analytics?.total || 0} icon="📊" subtext="System lifetime" />
        <KPICard title="SUSPICIOUS" value={analytics?.suspicious || 0} icon="⚠️" color="text-[#FFD000]" subtext="Score 31-60" />
        <KPICard title="HIGH RISK" value={analytics?.highRisk || 0} icon="🚨" color="text-[#FF3158]" subtext="Score 61-100" />
        <KPICard title="PENDING REPORTS" value={analytics?.pendingReports || 0} icon="📋" color="text-[#00F0FF]" subtext="Requires triage" />
        <KPICard title="FROZEN ACCOUNTS" value={analytics?.frozenUsers || 0} icon="🔒" color="text-[#A855F7]" subtext="Blocked users" />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fraud Trend Chart */}
        <div className="bg-[#0B1118] border border-[#00F0FF]/22 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="font-serif text-lg text-[#F5F7FA] uppercase tracking-wider font-bold">Transaction Risk Trend</h2>
            <span className="text-xs text-[#7D8996] font-mono">VOLUME METRICS</span>
          </div>
          <FraudTrendChart analytics={analytics} />
        </div>

        {/* Risk Distribution Donut Chart */}
        <div className="bg-[#0B1118] border border-[#00F0FF]/22 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="font-serif text-lg text-[#F5F7FA] uppercase tracking-wider font-bold">Risk Level Distribution</h2>
            <span className="text-xs text-[#7D8996] font-mono">PERCENTAGE PROFILES</span>
          </div>
          <RiskDonutChart data={analytics} />
        </div>
      </div>

      {/* Flagged Transactions & Recent Investigations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Flagged Transactions */}
        <div className="lg:col-span-2 bg-[#0B1118] border border-[#00F0FF]/22 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="font-serif text-lg text-[#F5F7FA] uppercase font-bold">High-Risk Flagged Transactions</h2>
              <p className="text-xs text-[#7D8996]">Real-time security engine monitoring output</p>
            </div>
            <Link to="/admin/transactions" className="text-xs text-[#00F0FF] hover:underline font-bold transition font-mono">
              VIEW ALL →
            </Link>
          </div>

          {highRiskTx.length === 0 ? (
            <p className="text-xs text-[#7D8996]/50 py-8 text-center font-mono">No high-risk transactions detected.</p>
          ) : (
            <div className="space-y-3 font-mono">
              {highRiskTx.map((t) => (
                <div key={t._id} className="flex items-center justify-between bg-[#06090D] border border-white/5 rounded-xl p-4 hover:border-[#00F0FF]/40 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-sm text-[#F5F7FA]">
                        ₹{t.amount?.toLocaleString()}
                      </span>
                      <RiskBadge status={t.riskLevel} score={t.riskScore} />

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B1118] text-[#00F0FF] border border-[#00F0FF]/20">
                        {t.source === 'image' ? '📷 IMAGE ANALYSIS' : '✍️ MANUAL ENTRY'}
                      </span>
                    </div>
                    <p className="text-xs text-[#7D8996]">
                      USER: {t.userId?.name || 'Unknown'} ({t.userId?.email || 'N/A'}) • {t.location}
                    </p>
                  </div>
                  <Link
                    to={t._id ? `/user/transactions/${t._id}` : '/admin/transactions'}
                    className="text-xs text-[#F5F7FA] hover:bg-[#00F0FF] hover:text-[#030507] border border-[#00F0FF]/40 px-3 py-1.5 rounded-lg transition"
                  >
                    INSPECT
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Investigation Timeline (Section 16) */}
        <div className="bg-[#0B1118] border border-[#00F0FF]/22 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-white/10 pb-4">
            <h2 className="font-serif text-lg text-[#F5F7FA] uppercase font-bold">RECENT INVESTIGATIONS</h2>
            <p className="text-xs text-[#7D8996]">MongoDB InvestigationActivity audit log</p>
          </div>
          <InvestigationTimeline activities={activities} />
        </div>
      </div>

      {/* Submitted Fraud Reports Section */}
      <div className="bg-[#0B1118] border border-[#00F0FF]/22 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-white/10 pb-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg text-[#F5F7FA] uppercase font-bold">Submitted Fraud Reports</h2>
            <p className="text-xs text-[#7D8996]">User-submitted fraud reports requiring investigation</p>
          </div>
          <Link to="/admin/investigations" className="text-xs text-[#00F0FF] hover:underline font-bold transition font-mono">
            INVESTIGATION CENTER →
          </Link>
        </div>

        {reports.length === 0 ? (
          <p className="text-xs text-[#7D8996]/50 py-8 text-center font-mono">No fraud reports submitted by users.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((r) => {
              const rUser = r.userId || {};
              const isUserFrozen = rUser.isFrozen || rUser.status === 'frozen';
              const currentStatus = r.status || 'Pending';

              return (
                <div
                  key={r._id}
                  className="bg-[#06090D] border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg hover:border-[#00F0FF]/40 transition font-mono"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="font-mono text-xs text-[#00F0FF] font-bold">
                      REPORT #{r._id.substring(0, 8)}
                    </span>
                    <RiskBadge status={currentStatus} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#7D8996] block text-[10px] uppercase">User Name</span>
                      <span className="font-semibold text-[#F5F7FA]">{rUser.name || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-[#7D8996] block text-[10px] uppercase">Transaction ID</span>
                      <span className="font-mono text-[#F5F7FA]">#{r.transactionId?._id?.substring(0, 8) || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[#7D8996] block text-[10px] uppercase">Amount</span>
                      <span className="font-mono font-bold text-[#F5F7FA]">
                        ₹{r.transactionId?.amount?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#7D8996] block text-[10px] uppercase">Fraud Type</span>
                      <span className="font-medium text-[#7C3AED]">{r.fraudType}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#F5F7FA]/80 bg-[#0B1118] p-3 rounded-xl border border-white/5 font-sans leading-relaxed">
                    {r.description}
                  </p>

                  {/* Workflow Actions Row */}
                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {currentStatus === 'Pending' && (
                        <button
                          onClick={() => handleUpdateReportStatus(r._id, 'Under Investigation')}
                          className="bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF]/40 text-[10px] font-bold px-3 py-1.5 rounded-lg transition uppercase"
                        >
                          UNDER INVESTIGATION
                        </button>
                      )}
                      {(currentStatus === 'Pending' || currentStatus === 'Under Investigation') && (
                        <button
                          onClick={() => openConfirmFraudModal(r)}
                          className="bg-[#FF3158]/20 hover:bg-[#FF3158]/30 text-[#FF3158] border border-[#FF3158]/40 text-[10px] font-bold px-3 py-1.5 rounded-lg transition uppercase"
                        >
                          CONFIRM FRAUD
                        </button>
                      )}
                      {currentStatus !== 'Resolved' && (
                        <button
                          onClick={() => handleUpdateReportStatus(r._id, 'Resolved')}
                          className="bg-[#00FF88]/20 hover:bg-[#00FF88]/30 text-[#00FF88] border border-[#00FF88]/40 text-[10px] font-bold px-3 py-1.5 rounded-lg transition uppercase"
                        >
                          RESOLVE
                        </button>
                      )}
                    </div>

                    {/* Account Freeze Action */}
                    {rUser._id && (
                      <button
                        onClick={() => openFreezeModal(rUser)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition uppercase ${
                          isUserFrozen
                            ? 'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/30 hover:bg-[#00FF88]/20'
                            : 'bg-[#7C3AED]/20 text-[#A855F7] border-[#7C3AED] hover:bg-[#7C3AED]/30'
                        }`}
                      >
                        {isUserFrozen ? 'UNFREEZE ACCOUNT' : 'FREEZE ACCOUNT'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DOUBLE CONFIRMATION MODAL FOR CONFIRM FRAUD (Section 10 & 12) */}
      {confirmFraudModal.isOpen && confirmFraudModal.report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030507]/90 backdrop-blur-md p-4 font-mono">
          <div className="bg-[#0B1118] border border-[#FF3158]/50 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif text-base text-[#FF3158] font-bold uppercase tracking-wider flex items-center gap-2">
                <span>⚠️</span> <span>CONFIRM FRAUD DECISION</span>
              </h3>
              <button
                onClick={() => setConfirmFraudModal({ isOpen: false, report: null })}
                className="text-[#7D8996] hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#F5F7FA] leading-relaxed">
              Are you sure you want to confirm this transaction as fraudulent? This action will permanently update the report status and persist the finding in MongoDB.
            </p>

            {/* REAL DATA SUMMARY (Section 12) */}
            <div className="bg-[#06090D] border border-white/10 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#7D8996]">Transaction Amount:</span>
                <span className="font-bold text-[#F5F7FA]">₹{confirmFraudModal.report.transactionId?.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7D8996]">Reported User:</span>
                <span className="font-semibold text-[#00F0FF]">{confirmFraudModal.report.userId?.name || 'User'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7D8996]">Risk Evaluation:</span>
                <span className="font-bold text-[#FF3158]">
                  {confirmFraudModal.report.transactionId?.riskScore !== undefined ? `${confirmFraudModal.report.transactionId.riskScore}/100 (${confirmFraudModal.report.transactionId.riskLevel})` : 'HIGH RISK'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7D8996]">Report Reason:</span>
                <span className="text-[#F5F7FA] font-medium truncate max-w-[180px]">{confirmFraudModal.report.fraudType}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmFraudModal({ isOpen: false, report: null })}
                className="w-1/2 bg-[#06090D] border border-white/10 text-xs font-bold py-3 rounded-xl text-[#7D8996] hover:text-white transition"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmFraud}
                disabled={actionLoading}
                className="w-1/2 bg-[#FF3158] hover:bg-[#ff1a44] text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-[#FF3158]/30 uppercase"
              >
                {actionLoading ? 'CONFIRMING…' : 'YES, CONFIRM FRAUD'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Freeze Account Confirmation Modal */}
      <ConfirmModal
        isOpen={freezeModal.isOpen}
        title={freezeModal.isCurrentlyFrozen ? `Unfreeze account for ${freezeModal.userName}?` : `Freeze account for ${freezeModal.userName}?`}
        message={
          freezeModal.isCurrentlyFrozen
            ? `Restoring access will allow ${freezeModal.userName} to log in and perform protected transactions.`
            : `Freezing this account will immediately block ${freezeModal.userName} from logging in or initiating transactions.`
        }
        confirmText={freezeModal.isCurrentlyFrozen ? 'CONFIRM UNFREEZE' : 'CONFIRM FREEZE'}
        confirmStyle={freezeModal.isCurrentlyFrozen ? 'bg-[#00FF88] text-[#030507]' : 'bg-[#FF3158] text-white'}
        loading={actionLoading}
        onConfirm={handleConfirmFreezeToggle}
        onCancel={() => setFreezeModal({ isOpen: false, userId: null, userName: '', isCurrentlyFrozen: false })}
      />
    </Layout>
  );
}