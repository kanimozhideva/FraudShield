const badgeStyles = {
  // Risk levels
  Normal: 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40 shadow-[0_0_8px_rgba(0,255,136,0.2)]',
  NORMAL: 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40 shadow-[0_0_8px_rgba(0,255,136,0.2)]',
  Suspicious: 'bg-[#FFD000]/15 text-[#FFD000] border-[#FFD000]/40 shadow-[0_0_8px_rgba(255,208,0,0.2)]',
  SUSPICIOUS: 'bg-[#FFD000]/15 text-[#FFD000] border-[#FFD000]/40 shadow-[0_0_8px_rgba(255,208,0,0.2)]',
  'High Risk': 'bg-[#FF3158]/15 text-[#FF3158] border-[#FF3158]/40 shadow-[0_0_8px_rgba(255,49,88,0.2)]',
  HIGH_RISK: 'bg-[#FF3158]/15 text-[#FF3158] border-[#FF3158]/40 shadow-[0_0_8px_rgba(255,49,88,0.2)]',
  'HIGH RISK': 'bg-[#FF3158]/15 text-[#FF3158] border-[#FF3158]/40 shadow-[0_0_8px_rgba(255,49,88,0.2)]',

  // Report statuses
  Pending: 'bg-[#FFD000]/15 text-[#FFD000] border-[#FFD000]/40',
  'Under Investigation': 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40',
  'Confirmed Fraud': 'bg-[#FF3158]/15 text-[#FF3158] border-[#FF3158]/40',
  Resolved: 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40',

  // User account statuses
  active: 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40',
  frozen: 'bg-[#A855F7]/20 text-[#A855F7] border-[#A855F7]/40',
  ACTIVE: 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40',
  FROZEN: 'bg-[#A855F7]/20 text-[#A855F7] border-[#A855F7]/40',
};

export default function RiskBadge({ status, score }) {
  const style = badgeStyles[status] || 'bg-white/10 text-white/70 border-white/20';

  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono tracking-wider font-semibold px-2.5 py-1 rounded-full border uppercase ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
      {score !== undefined && score !== null && <span className="opacity-80">({score})</span>}
    </span>
  );
}
