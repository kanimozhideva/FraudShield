import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function FraudTrendChart({ analytics }) {
  const data = analytics ? [
    { name: 'Normal', count: analytics.normal, color: '#4A9D6F' },
    { name: 'Suspicious', count: analytics.suspicious, color: '#D9A441' },
    { name: 'High Risk', count: analytics.highRisk, color: '#C0433F' },
  ] : [];

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" stroke="#F4EFE6" opacity={0.5} tick={{ fontSize: 12 }} />
          <YAxis stroke="#F4EFE6" opacity={0.5} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0F1B2B', borderColor: '#334155', borderRadius: '8px', color: '#F4EFE6' }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
