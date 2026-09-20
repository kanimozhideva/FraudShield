import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  // User Navigation items (Section 21)
  const userNavItems = [
    { label: 'Dashboard', path: '/user/dashboard', icon: '📊' },
    { label: 'Transactions', path: '/user/transactions', icon: '💳' },
    { label: 'Fraud Alerts', path: '/user/alerts', icon: '🔔' },
    { label: 'Reports', path: '/user/reports', icon: '📜' },
    { label: 'Report Fraud', path: '/user/report-fraud', icon: '⚠️' },
    { label: 'Profile', path: '/user/profile', icon: '👤' },
  ];

  // Admin Navigation items (Section 21)
  const adminNavItems = [
    { label: 'Security Dashboard', path: '/admin/dashboard', icon: '🛡️' },
    { label: 'Transactions', path: '/admin/transactions', icon: '💳' },
    { label: 'Fraud Reports', path: '/admin/reports', icon: '📋' },
    { label: 'Investigation Center', path: '/admin/investigations', icon: '🔍' },
    { label: 'Fraud Simulator', path: '/admin/simulator', icon: '⚡' },
    { label: 'User Management', path: '/admin/users', icon: '👥' },
    { label: 'Profile', path: '/admin/profile', icon: '👤' },
  ];

  const items = isAdmin ? adminNavItems : userNavItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile Hamburger Header Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 bg-[#0B1118] border border-[#00F0FF]/40 text-[#F5F7FA] rounded-xl shadow-lg focus:outline-none"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-[#030507]/90 backdrop-blur-xs z-40"
        />
      )}

      {/* Persistent Sidebar (Dark Neon Cyberpunk Theme) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-[#030507] border-r border-[#00F0FF]/22 flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="px-6 py-6 border-b border-[#00F0FF]/22 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] text-lg font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]">
              🛡️
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold tracking-wider text-[#00F0FF]">
                FraudShield
              </h1>
              <p className="text-[9px] text-[#7D8996] uppercase tracking-widest font-mono">
                DIGITAL PAYMENT FRAUD DETECTION
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <p className="px-3 py-2 text-[9px] uppercase font-mono tracking-wider text-[#7D8996]">
              {isAdmin ? 'SOC NAVIGATION' : 'PERSONAL NAVIGATION'}
            </p>
            {items.map((item) => (
              <NavLink
                key={item.path + item.label}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#0B1118] text-[#00F0FF] border border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)] font-bold'
                      : 'text-[#7D8996] hover:bg-[#0B1118] hover:text-[#F5F7FA]'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Account Card & Logout */}
        <div className="p-4 border-t border-[#00F0FF]/22 space-y-3">
          <div className="bg-[#0B1118] border border-white/5 rounded-xl p-3 flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-semibold text-[#F5F7FA] truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-[#7D8996] truncate">{user?.email || 'N/A'}</p>
            </div>
            <span
              className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                isAdmin ? 'bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/40' : 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40'
              }`}
            >
              {user?.role?.toUpperCase()}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-[#0B1118] hover:bg-[#FF3158]/20 hover:border-[#FF3158]/50 border border-white/10 text-xs font-medium text-[#7D8996] hover:text-[#FF3158] py-2.5 rounded-xl transition flex items-center justify-center gap-2 font-mono"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
