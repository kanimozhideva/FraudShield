import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import api from '../api/axios';

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/fraud/alerts');
        setAlerts(res.data);
      } catch (err) {
        console.error('Error fetching alerts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  return (
    <Layout title="Security Alerts">
      <div className="bg-[#16263B] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="font-serif text-lg text-[#F4EFE6]">Flagged Security Alerts</h2>
            <p className="text-xs text-[#F4EFE6]/50">High-priority alerts requiring user awareness</p>
          </div>
          <span className="text-xs font-mono bg-[#C0433F]/20 text-[#C0433F] px-3 py-1 rounded-full border border-[#C0433F]/30 font-bold">
            {alerts.length} Active
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-[#F4EFE6]/40 py-12 text-center animate-pulse">Loading security alerts...</p>
        ) : alerts.length === 0 ? (
          <p className="text-xs text-[#4A9D6F] py-12 text-center bg-[#4A9D6F]/10 border border-[#4A9D6F]/20 rounded-xl">
            ✓ No security alerts detected on your account.
          </p>
        ) : (
          <div className="space-y-4">
            {alerts.map((alt) => {
              const tx = alt.transactionId || {};
              return (
                <div
                  key={alt._id}
                  className="bg-[#0F1B2B] border border-red-500/30 hover:border-red-500/50 rounded-xl p-5 transition space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-base">🚨</span>
                      <span className="font-serif text-base font-semibold text-[#F4EFE6]">
                        Transaction Amount: ₹{tx.amount?.toLocaleString() || 'N/A'}
                      </span>
                      <RiskBadge status={alt.riskLevel} score={alt.riskScore} />
                    </div>
                    <span className="text-xs text-[#F4EFE6]/40 font-mono">
                      {new Date(alt.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="bg-[#16263B] border border-white/5 rounded-lg p-3 space-y-1 text-xs">
                    <p className="text-[#D9A441] font-semibold">Flagged Reasons:</p>
                    <ul className="list-disc list-inside text-[#F4EFE6]/80 space-y-0.5">
                      {alt.reasons?.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <span className="text-[#F4EFE6]/50">
                      Location: {tx.location || 'N/A'} | Device: {tx.device || 'N/A'}
                    </span>
                    {tx._id && (
                      <Link
                        to={`/user/transactions/${tx._id}`}
                        className="text-[#D9A441] hover:underline font-semibold"
                      >
                        Inspect Transaction →
                      </Link>
                    )}
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
