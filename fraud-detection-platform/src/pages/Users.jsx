import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import api from '../api/axios';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Freeze Modal State
  const [freezeModal, setFreezeModal] = useState({ isOpen: false, userId: null, userName: '', isCurrentlyFrozen: false });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching user list:', err);
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
      await api.put(endpoint, { freezeReason: 'Admin administrative freeze action' });
      setFreezeModal({ isOpen: false, userId: null, userName: '', isCurrentlyFrozen: false });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user freeze status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Layout title="User Management & Access Control">
      <div className="bg-[#16263B] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="font-serif text-lg text-[#F4EFE6]">Registered System Users</h2>
            <p className="text-xs text-[#F4EFE6]/50">Manage account authorization status</p>
          </div>
          <span className="text-xs font-mono bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30 font-bold">
            {users.length} Users Total
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-[#F4EFE6]/40 py-12 text-center animate-pulse">Loading user records...</p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => {
              const isFrozen = u.isFrozen || u.status === 'frozen';
              return (
                <div
                  key={u._id}
                  className="bg-[#0F1B2B] border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm text-[#F4EFE6]">{u.name}</span>
                      <span className="text-xs text-[#F4EFE6]/40">({u.email})</span>
                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-[#F4EFE6]/60 font-mono">
                        {u.role?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isFrozen ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-[#4A9D6F]/20 text-[#4A9D6F] border border-[#4A9D6F]/30'
                      }`}
                    >
                      {isFrozen ? 'FROZEN' : 'ACTIVE'}
                    </span>

                    {u.role !== 'admin' && (
                      <button
                        onClick={() => openFreezeModal(u)}
                        className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl border transition ${
                          isFrozen
                            ? 'bg-[#4A9D6F]/10 border-[#4A9D6F]/30 text-[#4A9D6F] hover:bg-[#4A9D6F]/20'
                            : 'bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30'
                        }`}
                      >
                        {isFrozen ? 'Unfreeze' : 'Freeze Account'}
                      </button>
                    )}
                  </div>
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
            ? `Restoring access will allow ${freezeModal.userName} to log in and initiate protected transactions.`
            : `Freezing this account will immediately block ${freezeModal.userName} from performing transactions or logging in.`
        }
        confirmText={freezeModal.isCurrentlyFrozen ? 'Confirm Unfreeze' : 'Confirm Freeze'}
        confirmStyle={freezeModal.isCurrentlyFrozen ? 'bg-[#4A9D6F]' : 'bg-[#C0433F]'}
        loading={actionLoading}
        onConfirm={handleConfirmFreezeToggle}
        onCancel={() => setFreezeModal({ isOpen: false, userId: null, userName: '', isCurrentlyFrozen: false })}
      />
    </Layout>
  );
}
