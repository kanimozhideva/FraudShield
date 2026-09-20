import { useState } from 'react';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import api from '../api/axios';

export default function FraudSimulator() {
  const [scenario, setScenario] = useState('HIGH_VALUE');
  const [simulationData, setSimulationData] = useState({
    amount: 150000,
    location: 'Moscow, Russia',
    device: 'Tor Browser on Linux',
    paymentMethod: 'Wire Transfer',
    activity: 'Bank Transfer'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const scenarios = [
    {
      id: 'NORMAL',
      name: 'Normal Transaction Pattern',
      description: 'Standard transaction matching historical amount and recognized device/location.',
      data: {
        amount: 250,
        location: 'Mumbai, India',
        device: 'Chrome on Windows 11',
        paymentMethod: 'UPI',
        activity: 'UPI Payment'
      }
    },
    {
      id: 'SUSPICIOUS',
      name: 'Unusual Location & Amount',
      description: 'Transaction initiated from a new city with an amount moderately above average.',
      data: {
        amount: 12500,
        location: 'Dubai, UAE',
        device: 'Safari on iPhone',
        paymentMethod: 'Credit Card',
        activity: 'Card Payment'
      }
    },
    {
      id: 'HIGH_VALUE',
      name: 'High-Value Fraud Alert',
      description: 'Massive transaction spike exceeding normal historical average by over 10×.',
      data: {
        amount: 150000,
        location: 'Moscow, Russia',
        device: 'Tor Browser on Linux',
        paymentMethod: 'Wire Transfer',
        activity: 'Bank Transfer'
      }
    },
    {
      id: 'NEW_DEVICE',
      name: 'Unrecognized Device Attack',
      description: 'Transaction coming from a totally new device fingerprint.',
      data: {
        amount: 4500,
        location: 'Mumbai, India',
        device: 'Unknown Linux Android Emulator',
        paymentMethod: 'UPI',
        activity: 'UPI Payment'
      }
    }
  ];

  const handleScenarioSelect = (selectedId) => {
    setScenario(selectedId);
    const found = scenarios.find(s => s.id === selectedId);
    if (found) {
      setSimulationData(found.data);
    }
  };

  const handleRunSimulation = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Execute test transaction through real backend endpoint
      const res = await api.post('/transactions', {
        ...simulationData,
        source: 'manual'
      });

      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Simulation execution failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="FRAUD SIMULATOR">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#00F0FF]/22 pb-4 font-mono">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#FFD000]/20 text-[#FFD000] border border-[#FFD000]/40 px-2 py-0.5 rounded font-bold uppercase tracking-widest animate-pulse">
              ⚡ DEMO / SIMULATION MODE — ADMIN ONLY
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#F5F7FA] tracking-wide mt-1">FRAUD THREAT SIMULATOR</h2>
          <p className="text-xs text-[#7D8996]">Simulate synthetic fraud scenarios and test FraudShield real-time risk engine rules.</p>
        </div>
      </div>

      {error && (
        <div className="bg-[#FF3158]/15 border border-[#FF3158]/50 text-[#FF3158] text-xs p-4 rounded-xl font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarios.map((s) => (
          <div
            key={s.id}
            onClick={() => handleScenarioSelect(s.id)}
            className={`p-5 rounded-2xl border cursor-pointer transition space-y-2 font-mono ${
              scenario === s.id
                ? 'bg-[#0B1118] border-[#00F0FF] text-[#00F0FF] shadow-lg shadow-[#00F0FF]/20 font-bold'
                : 'bg-[#06090D] border-white/10 text-[#7D8996] hover:border-[#00F0FF]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider">{s.id} SCENARIO</span>
              {scenario === s.id && <span className="text-[#00F0FF]">✓</span>}
            </div>
            <h3 className="font-serif text-sm font-bold text-[#F5F7FA]">{s.name}</h3>
            <p className="text-[11px] text-[#7D8996] leading-relaxed font-sans">{s.description}</p>
          </div>
        ))}
      </div>

      {/* Simulation Configuration Panel */}
      <div className="bg-[#0B1118] border border-[#00F0FF]/22 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-white/10 pb-4">
          <h3 className="font-serif text-lg font-bold text-[#00F0FF] uppercase tracking-wider">SIMULATION PARAMETERS</h3>
          <p className="text-xs text-[#7D8996] font-mono">Test parameters evaluated by backend risk engine</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div>
            <label className="block text-[10px] text-[#7D8996] uppercase mb-1">Amount (₹)</label>
            <input
              type="number"
              value={simulationData.amount}
              onChange={(e) => setSimulationData({ ...simulationData, amount: Number(e.target.value) })}
              className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
            />
          </div>

          <div>
            <label className="block text-[10px] text-[#7D8996] uppercase mb-1">Location</label>
            <input
              type="text"
              value={simulationData.location}
              onChange={(e) => setSimulationData({ ...simulationData, location: e.target.value })}
              className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
            />
          </div>

          <div>
            <label className="block text-[10px] text-[#7D8996] uppercase mb-1">Device Fingerprint</label>
            <input
              type="text"
              value={simulationData.device}
              onChange={(e) => setSimulationData({ ...simulationData, device: e.target.value })}
              className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
            />
          </div>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={loading}
          className="w-full bg-[#7C3AED] hover:bg-[#a855f7] text-white font-bold text-xs py-3.5 rounded-xl transition shadow-lg shadow-[#7C3AED]/30 font-mono uppercase tracking-wider disabled:opacity-50"
        >
          {loading ? 'RUNNING SIMULATION ENGINE…' : '⚡ EXECUTE SIMULATED TRANSACTION'}
        </button>
      </div>

      {/* Simulation Result Output */}
      {result && (
        <div className="bg-[#0B1118] border border-[#00FF88]/40 rounded-2xl p-6 space-y-4 font-mono shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] bg-[#FFD000]/20 text-[#FFD000] border border-[#FFD000]/40 px-2 py-0.5 rounded font-bold uppercase">
                DEMO / SIMULATION RESULT
              </span>
              <h3 className="font-serif text-xl font-bold text-[#F5F7FA] tracking-wide mt-1">EVALUATION COMPLETE</h3>
            </div>
            <RiskBadge status={result.risk?.level || result.transaction?.riskLevel} score={result.risk?.score || result.transaction?.riskScore} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-[#06090D] p-3 rounded-xl border border-white/5">
              <span className="text-[#7D8996] block text-[10px] uppercase">Simulated Amount</span>
              <span className="font-bold text-[#F5F7FA]">₹{result.transaction?.amount?.toLocaleString()}</span>
            </div>
            <div className="bg-[#06090D] p-3 rounded-xl border border-white/5">
              <span className="text-[#7D8996] block text-[10px] uppercase">Evaluated Risk Score</span>
              <span className="font-bold text-[#7C3AED]">{result.risk?.score || result.transaction?.riskScore} / 100</span>
            </div>
            <div className="bg-[#06090D] p-3 rounded-xl border border-white/5">
              <span className="text-[#7D8996] block text-[10px] uppercase">Risk Level</span>
              <span className="font-semibold text-[#00F0FF]">{result.risk?.level || result.transaction?.riskLevel}</span>
            </div>
            <div className="bg-[#06090D] p-3 rounded-xl border border-white/5">
              <span className="text-[#7D8996] block text-[10px] uppercase">Database Status</span>
              <span className="text-[#00FF88] font-bold">✓ SAVED</span>
            </div>
          </div>

          {result.risk?.reasons && result.risk.reasons.length > 0 && (
            <div className="bg-[#06090D] border border-[#00F0FF]/30 p-4 rounded-xl space-y-1 text-xs">
              <span className="text-[#7D8996] uppercase text-[10px] font-bold block">FLAGGED ANOMALY REASONS:</span>
              <ul className="list-disc list-inside text-[#F5F7FA]">
                {result.risk.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
