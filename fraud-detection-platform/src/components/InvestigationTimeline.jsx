export default function InvestigationTimeline({ activities = [] }) {
  if (!activities || activities.length === 0) {
    return <p className="text-xs text-[#7D8996]/50 italic py-4 font-mono">No recent investigation activities recorded.</p>;
  }

  const getActionColor = (action = '') => {
    const actUpper = action.toUpperCase();
    if (actUpper.includes('FROZEN') && !actUpper.includes('UNFROZEN')) return 'text-[#A855F7] border-[#A855F7]/40 bg-[#7C3AED]/10';
    if (actUpper.includes('CONFIRMED') || actUpper.includes('HIGH-RISK')) return 'text-[#FF3158] border-[#FF3158]/40 bg-[#FF3158]/10';
    if (actUpper.includes('INVESTIGATION') || actUpper.includes('STARTED')) return 'text-[#FFD000] border-[#FFD000]/40 bg-[#FFD000]/10';
    if (actUpper.includes('RESOLVED') || actUpper.includes('UNFROZEN')) return 'text-[#00FF88] border-[#00FF88]/40 bg-[#00FF88]/10';
    return 'text-[#00F0FF] border-[#00F0FF]/40 bg-[#00F0FF]/10';
  };

  const getActionIcon = (action = '') => {
    const actUpper = action.toUpperCase();
    if (actUpper.includes('FROZEN') && !actUpper.includes('UNFROZEN')) return '🔴';
    if (actUpper.includes('UNFROZEN')) return '🟢';
    if (actUpper.includes('CONFIRMED')) return '🔴';
    if (actUpper.includes('RESOLVED')) return '🟢';
    if (actUpper.includes('INVESTIGATION')) return '🟡';
    return '⚠️';
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10 font-mono">
      {activities.map((act) => {
        const dateStr = act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';
        const colorClass = getActionColor(act.action);
        const icon = getActionIcon(act.action);

        return (
          <div key={act._id} className="relative group">
            {/* Timeline Marker Bullet */}
            <div className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 ${colorClass}`} />

            <div className="bg-[#06090D] border border-white/5 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span>{icon}</span>
                  <span className="text-[#F5F7FA]">{act.action}</span>
                </div>
                <span className="text-[10px] text-[#7D8996] font-mono">{dateStr}</span>
              </div>
              <p className="text-xs text-[#7D8996] leading-relaxed font-sans">{act.description}</p>
              {act.adminId && (
                <p className="text-[10px] text-[#7C3AED]">
                  Actor: Admin ({act.adminId.name || act.adminId.email})
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
