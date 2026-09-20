import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/user/profile');
        setProfile(res.data);
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <Layout title="Account Profile & Authorization">
      <div className="max-w-3xl mx-auto bg-[#151116] border border-[#5A1020]/20 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#5A1020]/20 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#5A1020]/20 border border-[#7A1F35]/40 flex items-center justify-center text-[#F5F1F2] text-2xl font-bold">
              👤
            </div>
            <div>
              <h2 className="font-serif text-2xl text-[#F5F1F2] font-semibold">{user?.name}</h2>
              <p className="text-xs text-[#A8A0A3] font-mono mt-0.5">{user?.email}</p>
            </div>
          </div>
          <RiskBadge status={user?.isFrozen || user?.status === 'frozen' ? 'FROZEN' : 'ACTIVE'} />
        </div>

        {loading ? (
          <p className="text-xs text-[#A8A0A3]/50 py-8 text-center animate-pulse">Loading profile metadata...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#0D0D0F] border border-white/5 rounded-xl p-4 space-y-1">
              <span className="text-[#A8A0A3] uppercase tracking-wider text-[10px]">Access Role</span>
              <p className="font-semibold text-sm text-[#7A1F35]">{user?.role?.toUpperCase()}</p>
            </div>

            <div className="bg-[#0D0D0F] border border-white/5 rounded-xl p-4 space-y-1">
              <span className="text-[#A8A0A3] uppercase tracking-wider text-[10px]">Account Security Status</span>
              <p className="font-semibold text-sm text-[#2E9B63]">
                {user?.isFrozen || user?.status === 'frozen' ? 'Restricted (Frozen)' : 'Active Monitoring Protected'}
              </p>
            </div>

            <div className="bg-[#0D0D0F] border border-white/5 rounded-xl p-4 space-y-1">
              <span className="text-[#A8A0A3] uppercase tracking-wider text-[10px]">Total Monitored Transactions</span>
              <p className="font-serif text-xl font-bold text-[#F5F1F2]">
                {profile?.transactionCount ?? 0}
              </p>
            </div>

            <div className="bg-[#0D0D0F] border border-white/5 rounded-xl p-4 space-y-1">
              <span className="text-[#A8A0A3] uppercase tracking-wider text-[10px]">Filed Investigation Reports</span>
              <p className="font-serif text-xl font-bold text-[#F5F1F2]">
                {profile?.reportCount ?? 0}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
