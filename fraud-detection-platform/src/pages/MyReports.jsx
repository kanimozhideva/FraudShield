import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import api from '../api/axios';

const workflowSteps = ['Pending', 'Under Investigation', 'Confirmed Fraud', 'Resolved'];

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/fraud/reports');
        setReports(res.data);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <Layout title="Report Status Tracking">
      <div className="bg-[#151116] border border-[#5A1020]/20 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-[#5A1020]/20 pb-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#F5F1F2]">Submitted Investigation Reports</h2>
            <p className="text-xs text-[#A8A0A3]">Status updates persist directly from Security Operations</p>
          </div>
          <span className="text-xs font-mono bg-[#5A1020]/30 text-[#F5F1F2] px-3 py-1 rounded-full border border-[#7A1F35] font-bold">
            {reports.length} Reports Filed
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-[#A8A0A3]/50 py-12 text-center animate-pulse">Loading report statuses...</p>
        ) : reports.length === 0 ? (
          <p className="text-xs text-[#A8A0A3]/60 py-12 text-center">No fraud reports submitted yet.</p>
        ) : (
          <div className="space-y-6">
            {reports.map((r) => {
              const currentStepIdx = workflowSteps.indexOf(r.status || 'Pending');
              const tx = r.transactionId || {};

              return (
                <div
                  key={r._id}
                  className="bg-[#0D0D0F] border border-white/5 hover:border-[#5A1020]/40 rounded-xl p-6 space-y-4 shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-base font-semibold text-[#F5F1F2]">{r.fraudType}</span>
                        <RiskBadge status={r.status || 'Pending'} />
                      </div>
                      <p className="text-xs text-[#A8A0A3] font-mono mt-0.5">
                        Report ID: #{r._id} | Transaction Amount: ₹{tx.amount?.toLocaleString() || 'N/A'}
                      </p>
                    </div>

                    <div className="text-right text-xs text-[#A8A0A3] font-mono">
                      <div>Created: {new Date(r.createdAt).toLocaleDateString()}</div>
                      {r.updatedAt && <div>Updated: {new Date(r.updatedAt).toLocaleTimeString()}</div>}
                    </div>
                  </div>

                  <p className="text-xs text-[#F5F1F2]/80 leading-relaxed bg-[#151116] p-3 rounded-lg border border-white/5">
                    {r.description}
                  </p>

                  {/* Visual Status Progression Bar */}
                  <div className="pt-2">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-[#A8A0A3] mb-2">
                      Investigation Progress
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-semibold">
                      {workflowSteps.map((step, idx) => {
                        const isDone = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;
                        return (
                          <div
                            key={step}
                            className={`py-2 rounded-lg border transition ${
                              isCurrent
                                ? 'bg-[#5A1020] border-[#7A1F35] text-[#F5F1F2] font-bold shadow-md'
                                : isDone
                                ? 'bg-[#2E9B63]/10 border-[#2E9B63]/30 text-[#2E9B63]'
                                : 'bg-[#151116] border-white/5 text-[#A8A0A3]/30'
                            }`}
                          >
                            {step}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
