import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import api from '../api/axios';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [freezeModal, setFreezeModal] = useState({ isOpen: false, userId: null, userName: '', isCurrentlyFrozen: false });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openFreezeModal = (userObj) => {
    setFreezeModal({
      isOpen: true,
      userId: userObj._id,
      userName: userObj.name || userObj.email || 'User',
      isCurrentlyFrozen: userObj.isFrozen || userObj.status === 'frozen'
    });
  };

  const handleConfirmFreezeToggle = async () => {
    setActionLoading(true);
    const endpoint = freezeModal.isCurrentlyFrozen
      ? `/admin/users/${freezeModal.userId}/unfreeze`
      : `/admin/users/${freezeModal.userId}/freeze`;

    try {
      await api.put(endpoint, { freezeReason: 'Admin security account freeze action.' });
      setFreezeModal({ isOpen: false, userId: null, userName: '', isCurrentlyFrozen: false });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user freeze status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Layout title="User Operations Management">
      <div className="bg-[#151116] border border-[#5A1020]/20 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-[#5A1020]/20 pb-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#F5F1F2]">System User Directory</h2>
            <p className="text-xs text-[#A8A0A3]">Manage user account freeze status and role authorization</p>
          </div>
          <span className="text-xs font-mono bg-[#5A1020]/30 text-[#F5F1F2] px-3 py-1 rounded-full border border-[#7A1F35] font-bold">
            {users.length} Users Registered
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-[#A8A0A3]/50 py-12 text-center animate-pulse">Loading directory...</p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => {
              const isFrozen = u.isFrozen || u.status === 'frozen';
              return (
                <div
                  key={u._id}
                  className="bg-[#0D0D0F] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-[#5A1020]/40 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm text-[#F5F1F2]">{u.name || 'User'}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          u.role === 'admin'
                            ? 'bg-[#5A1020] text-[#F5F1F2] border border-[#7A1F35]'
                            : 'bg-[#2E9B63]/20 text-[#2E9B63]'
                        }`}
                      >
                        {u.role?.toUpperCase()}
                      </span>
                      {isFrozen && (
                        <span className="text-[10px] bg-[#D94A5A]/20 text-[#D94A5A] border border-[#D94A5A]/40 px-2 py-0.5 rounded font-mono font-bold">
                          FROZEN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#A8A0A3] font-mono">{u.email}</p>
                  </div>

                  {u.role !== 'admin' && (
                    <button
                      onClick={() => openFreezeModal(u)}
                      className={`text-xs font-semibold px-4 py-1.5 rounded-xl border transition ${
                        isFrozen
                          ? 'bg-[#2E9B63]/10 text-[#2E9B63] border-[#2E9B63]/30 hover:bg-[#2E9B63]/20'
                          : 'bg-[#5A1020]/40 text-[#F5F1F2] border-[#7A1F35] hover:bg-[#5A1020]'
                      }`}
                    >
                      {isFrozen ? 'Unfreeze Account' : 'Freeze Account'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={freezeModal.isOpen}
        title={freezeModal.isCurrentlyFrozen ? `Unfreeze account for ${freezeModal.userName}?` : `Freeze account for ${freezeModal.userName}?`}
        message={
          freezeModal.isCurrentlyFrozen
            ? `Restoring access will allow ${freezeModal.userName} to log in and perform transactions.`
            : `Freezing this account will immediately block ${freezeModal.userName} from performing transactions or signing in.`
        }
        confirmText={freezeModal.isCurrentlyFrozen ? 'Confirm Unfreeze' : 'Confirm Freeze'}
        confirmStyle={freezeModal.isCurrentlyFrozen ? 'bg-[#2E9B63]' : 'bg-[#D94A5A]'}
        loading={actionLoading}
        onConfirm={handleConfirmFreezeToggle}
        onCancel={() => setFreezeModal({ isOpen: false, userId: null, userName: '', isCurrentlyFrozen: false })}
      />
    </Layout>
  );
}
