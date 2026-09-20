import { useEffect, useState } from 'react';

export default function KPICard({ title, value, icon, subtext, color = 'text-[#F5F7FA]' }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseInt(value, 10);
    if (isNaN(target)) {
      setDisplayValue(value);
      return;
    }

    if (target === 0) {
      setDisplayValue(0);
      return;
    }

    let start = 0;
    const duration = 1000;
    const increment = Math.max(1, Math.floor(target / (duration / 16)));

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setDisplayValue(target);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="bg-[#0B1118] border border-[#00F0FF]/22 rounded-xl p-5 hover:border-[#00F0FF]/60 transition group shadow-lg shadow-[#00F0FF]/5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-[#7D8996] font-semibold tracking-widest uppercase font-mono">{title}</span>
        {icon && <div className="p-2 bg-[#06090D] rounded-lg border border-[#00F0FF]/30 text-[#00F0FF]">{icon}</div>}
      </div>
      <div className={`font-serif text-3xl font-bold tracking-tight mb-1 ${color}`}>
        {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
      </div>
      {subtext && <p className="text-[11px] text-[#7D8996]/80">{subtext}</p>}
    </div>
  );
}
