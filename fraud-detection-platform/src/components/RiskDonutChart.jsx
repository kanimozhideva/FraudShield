import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function RiskDonutChart({ data }) {
  const chartData = [
    { name: 'Normal', value: data?.normal || 0, color: '#4A9D6F' },
    { name: 'Suspicious', value: data?.suspicious || 0, color: '#D9A441' },
    { name: 'High Risk', value: data?.highRisk || 0, color: '#C0433F' },
  ];

  const total = (data?.normal || 0) + (data?.suspicious || 0) + (data?.highRisk || 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const count = entry.value;
      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-[#0F1B2B] border border-white/10 p-3 rounded-lg text-xs space-y-1 shadow-xl">
          <p className="font-semibold text-[#F4EFE6]" style={{ color: entry.payload.color }}>
            {entry.name}
          </p>
          <p className="text-[#F4EFE6]/80 font-mono">Count: {count.toLocaleString()}</p>
          <p className="text-[#F4EFE6]/60 font-mono">Share: {pct}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative w-full h-[260px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#16263B" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-[#F4EFE6]/70 font-medium">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center Total Count Display */}
      <div className="absolute top-[42%] left-[50%] -translate-x-[50%] -translate-y-[50%] text-center pointer-events-none">
        <p className="font-serif text-2xl font-bold text-[#F4EFE6]">{total}</p>
        <p className="text-[10px] text-[#F4EFE6]/40 uppercase tracking-widest">Total</p>
      </div>
    </div>
  );
}
