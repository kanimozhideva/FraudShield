import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import ConfirmModal from '../components/ConfirmModal';
import api from '../api/axios';

export default function InvestigationCenter() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionLoading, setActionLoading] = useState(false);

  // Enhanced Freeze Modal State
  const [freezeModal, setFreezeModal] = useState({
    isOpen: false,
    userId: null,
    userName: '',
    userEmail: '',
    isCurrentlyFrozen: false,
    reportId: null,
    transactionId: null,
    amount: null,
    fraudType: null
  });

  // Double Confirmation Modal State for CONFIRM FRAUD
  const [confirmFraudModal, setConfirmFraudModal] = useState({ isOpen: false, report: null });

  // Selected Report Timeline Modal State
  const [timelineModal, setTimelineModal] = useState({ isOpen: false, reportId: null, activities: [], loading: false });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports');
      setReports(res.data);
    } catch (err) {
      console.error('Error fetching admin reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async (reportId, newStatus) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/reports/${reportId}`, { status: newStatus });
      fetchReports();
    } catch (err) {
      console.error('Failed to update report status:', err);
    } finally {
      setActionLoading(false);
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
      fetchReports();
    } catch (err) {
      console.error('Failed to confirm fraud:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Freeze/Unfreeze Modal with report context
  const openFreezeModal = (userObj, reportObj = null) => {
    setFreezeModal({
      isOpen: true,
      userId: userObj._id,
      userName: userObj.name || 'User',
      userEmail: userObj.email || 'N/A',
      isCurrentlyFrozen: userObj.isFrozen || userObj.status === 'frozen',
      reportId: reportObj?._id || null,
      transactionId: reportObj?.transactionId?._id || reportObj?.transactionId || null,
      amount: reportObj?.transactionId?.amount || null,
      fraudType: reportObj?.fraudType || 'Confirmed Fraud Activity'
    });
  };

  // Execute Backend Freeze/Unfreeze API after explicit modal confirmation
  const handleConfirmFreezeToggle = async () => {
    if (!freezeModal.userId) return;
    setActionLoading(true);

    const endpoint = freezeModal.isCurrentlyFrozen
      ? `/admin/users/${freezeModal.userId}/unfreeze`
      : `/admin/users/${freezeModal.userId}/freeze`;

    try {
      await api.put(endpoint, {
        freezeReason: freezeModal.fraudType || 'Administrative freeze due to confirmed fraud activity',
        reportId: freezeModal.reportId,
        transactionId: freezeModal.transactionId
      });

      const targetReportId = freezeModal.reportId;
      setFreezeModal({
        isOpen: false,
        userId: null,
        userName: '',
        userEmail: '',
        isCurrentlyFrozen: false,
        reportId: null,
        transactionId: null,
        amount: null,
        fraudType: null
      });

      await fetchReports();

      // Refresh timeline modal if open
      if (timelineModal.isOpen && targetReportId) {
        openTimelineModal(targetReportId);
      }
    } catch (err) {
      console.error('Failed to update user freeze status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch Full Investigation Timeline for a specific report
  const openTimelineModal = async (reportId) => {
    setTimelineModal({ isOpen: true, reportId, activities: [], loading: true });
    try {
      const res = await api.get(`/admin/investigations/${reportId}/timeline`);
      setTimelineModal({ isOpen: true, reportId, activities: res.data, loading: false });
    } catch (err) {
      setTimelineModal({ isOpen: true, reportId, activities: [], loading: false });
    }
  };

  const filteredReports = statusFilter === 'All'
    ? reports
    : reports.filter(r => r.status === statusFilter);

  return (
    <Layout title="INVESTIGATION CENTER">
      {/* Header Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#00F0FF]/22 pb-4 font-mono">
        <div>
          <span className="text-[10px] bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
            SOC INVESTIGATION UNIT
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#F5F7FA] tracking-wide mt-1">ADMIN INVESTIGATION CENTER</h2>
          <p className="text-xs text-[#7D8996]">Review user-reported fraud cases, inspect evidence, and execute investigation containment.</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-4 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
        >
          <option value="All">ALL REPORT STATUSES</option>
          <option value="Pending">PENDING</option>
          <option value="Under Investigation">UNDER INVESTIGATION</option>
          <option value="Confirmed Fraud">CONFIRMED FRAUD</option>
          <option value="Resolved">RESOLVED</option>
        </select>
      </div>

      {/* Investigation Reports Grid (ONLY User-Reported Cases) */}
      <div className="space-y-6">
        {loading ? (
          <p className="text-xs text-[#7D8996]/50 py-12 text-center animate-pulse font-mono">Loading investigation cases...</p>
        ) : filteredReports.length === 0 ? (
          <div className="bg-[#0B1118] border border-[#00F0FF]/22 rounded-2xl p-12 text-center space-y-2 font-mono">
            <p className="text-sm font-semibold text-[#F5F7FA]">No user-reported fraud cases match the selected filter.</p>
            <p className="text-xs text-[#7D8996]">User-submitted fraud reports will appear here automatically when users report suspicious transactions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredReports.map((r) => {
              const rUser = r.userId || {};
              const isUserFrozen = rUser.isFrozen || rUser.status === 'frozen';
              const currentStatus = r.status || 'Pending';
              const tx = r.transactionId || {};
              const riskReasons = tx.fraudReasons || [];

              return (
                <div
                  key={r._id}
                  className="bg-[#0B1118] border border-[#00F0FF]/22 rounded-2xl p-6 space-y-4 shadow-xl hover:border-[#00F0FF]/60 transition font-mono"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] text-[#7D8996] block uppercase font-mono">REPORT ID</span>
                      <span className="font-mono text-sm text-[#00F0FF] font-bold">#{r._id.substring(0, 8)}</span>
                    </div>
                    <RiskBadge status={currentStatus} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#7D8996] block text-[10px] uppercase">User Name</span>
                      <span className="font-semibold text-[#F5F7FA]">{rUser.name || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-[#7D8996] block text-[10px] uppercase">User Email</span>
                      <span className="text-[#7D8996] truncate block">{rUser.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[#7D8996] block text-[10px] uppercase">Transaction Amount</span>
                      <span className="font-mono font-bold text-base text-[#F5F7FA]">
                        ₹{tx.amount?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#7D8996] block text-[10px] uppercase">AI Risk Score</span>
                      <span className="font-mono font-bold text-sm text-[#7C3AED]">
                        {tx.riskScore !== undefined ? `${tx.riskScore} / 100 (${tx.riskLevel || 'N/A'})` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Reported Reason */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-[#7D8996] uppercase">
                      <span>User Reported Reason ({r.fraudType})</span>
                      <span>{new Date(r.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-[#F5F7FA]/90 bg-[#06090D] p-3 rounded-xl border border-white/5 font-sans leading-relaxed">
                      {r.description}
                    </p>
                  </div>

                  {/* Flagged Risk Factors Summary */}
                  {riskReasons.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#FF3158] uppercase font-bold block">FLAGGED AI ANOMALIES</span>
                      <div className="bg-[#06090D] p-2.5 rounded-xl border border-[#FF3158]/30 text-[11px] text-[#F5F7FA]/80 space-y-1 font-mono">
                        {riskReasons.map((reason, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[#FF3158]">
                            <span>•</span> <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions & Containment Row */}
                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {currentStatus === 'Pending' && (
                        <button
                          onClick={() => handleUpdateStatus(r._id, 'Under Investigation')}
                          disabled={actionLoading}
                          className="bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF]/40 text-[10px] font-bold px-3 py-1.5 rounded-lg transition uppercase"
                        >
                          START INVESTIGATION
                        </button>
                      )}
                      {(currentStatus === 'Pending' || currentStatus === 'Under Investigation') && (
                        <button
                          onClick={() => openConfirmFraudModal(r)}
                          disabled={actionLoading}
                          className="bg-[#FF3158]/20 hover:bg-[#FF3158]/30 text-[#FF3158] border border-[#FF3158]/40 text-[10px] font-bold px-3 py-1.5 rounded-lg transition uppercase"
                        >
                          CONFIRM FRAUD
                        </button>
                      )}
                      {currentStatus !== 'Resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(r._id, 'Resolved')}
                          disabled={actionLoading}
                          className="bg-[#00FF88]/20 hover:bg-[#00FF88]/30 text-[#00FF88] border border-[#00FF88]/40 text-[10px] font-bold px-3 py-1.5 rounded-lg transition uppercase"
                        >
                          RESOLVE
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openTimelineModal(r._id)}
                        className="text-[10px] font-bold text-[#00F0FF] hover:underline font-mono"
                      >
                        TIMELINE →
                      </button>
                      {rUser._id && (
                        <button
                          onClick={() => openFreezeModal(rUser, r)}
                          disabled={actionLoading}
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FREEZE / UNFREEZE CONFIRMATION MODAL */}
      {freezeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030507]/90 backdrop-blur-md p-4 font-mono">
          <div className="bg-[#0B1118] border border-[#FF3158]/50 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif text-base text-[#FF3158] font-bold uppercase tracking-wider flex items-center gap-2">
                <span>{freezeModal.isCurrentlyFrozen ? '🔓' : '⚠️'}</span>
                <span>{freezeModal.isCurrentlyFrozen ? 'UNFREEZE ACCOUNT' : 'FREEZE ACCOUNT'}</span>
              </h3>
              <button
                onClick={() => setFreezeModal({ isOpen: false, userId: null, userName: '', userEmail: '', isCurrentlyFrozen: false, reportId: null, transactionId: null, amount: null, fraudType: null })}
                className="text-[#7D8996] hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#F5F7FA] leading-relaxed">
              {freezeModal.isCurrentlyFrozen
                ? `Are you sure you want to unfreeze this account? The user will regain access to protected transactions.`
                : `Are you sure you want to freeze this account? This will restrict protected account actions immediately.`}
            </p>

            <div className="bg-[#06090D] border border-white/10 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#7D8996]">User Name:</span>
                <span className="font-semibold text-[#F5F7FA]">{freezeModal.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7D8996]">User Email:</span>
                <span className="text-[#7D8996] truncate max-w-[180px]">{freezeModal.userEmail}</span>
              </div>
              {freezeModal.amount && (
                <div className="flex justify-between">
                  <span className="text-[#7D8996]">Related Transaction:</span>
                  <span className="font-mono font-bold text-[#00F0FF]">₹{freezeModal.amount?.toLocaleString()}</span>
                </div>
              )}
              {freezeModal.fraudType && (
                <div className="flex justify-between">
                  <span className="text-[#7D8996]">Reason / Trigger:</span>
                  <span className="text-[#FF3158] font-medium truncate max-w-[180px]">{freezeModal.fraudType}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFreezeModal({ isOpen: false, userId: null, userName: '', userEmail: '', isCurrentlyFrozen: false, reportId: null, transactionId: null, amount: null, fraudType: null })}
                className="w-1/2 bg-[#06090D] border border-white/10 text-xs font-bold py-3 rounded-xl text-[#7D8996] hover:text-white transition"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmFreezeToggle}
                disabled={actionLoading}
                className={`w-1/2 font-bold text-xs py-3 rounded-xl transition shadow-lg uppercase ${
                  freezeModal.isCurrentlyFrozen
                    ? 'bg-[#00FF88] text-[#030507] hover:bg-[#33ff9f] shadow-[#00FF88]/30'
                    : 'bg-[#FF3158] text-white hover:bg-[#ff1a44] shadow-[#FF3158]/30'
                }`}
              >
                {actionLoading ? 'PROCESSING…' : (freezeModal.isCurrentlyFrozen ? 'YES, UNFREEZE ACCOUNT' : 'YES, FREEZE ACCOUNT')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOUBLE CONFIRMATION MODAL FOR CONFIRM FRAUD */}
      {confirmFraudModal.isOpen && confirmFraudModal.report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030507]/90 backdrop-blur-md p-4">
          <div className="bg-[#0B1118] border border-[#FF3158]/50 rounded-2xl max-w-md w-full p-6 space-y-5 font-mono shadow-2xl">
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

      {/* FULL INVESTIGATION TIMELINE MODAL */}
      {timelineModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030507]/90 backdrop-blur-md p-4">
          <div className="bg-[#0B1118] border border-[#00F0FF]/30 rounded-2xl max-w-lg w-full p-6 space-y-4 font-mono shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif text-base text-[#00F0FF] font-bold uppercase tracking-wider">
                FULL INVESTIGATION TIMELINE
              </h3>
              <button
                onClick={() => setTimelineModal({ isOpen: false, reportId: null, activities: [], loading: false })}
                className="text-[#7D8996] hover:text-white"
              >
                ✕
              </button>
            </div>

            {timelineModal.loading ? (
              <p className="text-xs text-[#7D8996]/50 py-8 text-center animate-pulse">Loading timeline events...</p>
            ) : timelineModal.activities.length === 0 ? (
              <p className="text-xs text-[#7D8996] py-6 text-center">No timeline activity logged for this report yet.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {timelineModal.activities.map((act) => (
                  <div key={act._id} className="bg-[#06090D] border border-white/5 rounded-xl p-3.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold uppercase ${
                        act.action.includes('FROZEN') ? 'text-[#A855F7]' :
                        act.action.includes('UNFROZEN') ? 'text-[#00FF88]' :
                        act.action.includes('CONFIRMED') ? 'text-[#FF3158]' :
                        'text-[#00F0FF]'
                      }`}>
                        {act.action}
                      </span>
                      <span className="text-[10px] text-[#7D8996]">{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[#F5F7FA]/80 text-[11px] font-sans">{act.description}</p>
                    {act.adminId && (
                      <p className="text-[10px] text-[#7C3AED]">Actor: Admin ({act.adminId?.name || act.adminId?.email || 'Admin'})</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setTimelineModal({ isOpen: false, reportId: null, activities: [], loading: false })}
              className="w-full bg-[#06090D] border border-white/10 text-xs font-bold py-2.5 rounded-xl text-[#7D8996] hover:text-white"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
