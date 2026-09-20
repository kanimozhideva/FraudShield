import { useAuth } from '../context/AuthContext';

export default function Navbar({ title = 'Dashboard' }) {
  const { isFrozen } = useAuth();

  return (
    <header className="border-b border-[#00F0FF]/22 bg-[#030507]/90 backdrop-blur-md px-6 lg:px-10 py-4 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="font-serif text-xl lg:text-2xl font-bold text-[#F5F7FA] tracking-wide">{title}</h1>
        <p className="text-xs text-[#7D8996]">FraudShield — Digital Payment Fraud Detection</p>
      </div>

      <div className="flex items-center gap-4">
        {isFrozen && (
          <span className="text-xs bg-[#FF3158]/20 text-[#FF3158] border border-[#FF3158]/50 px-3 py-1 rounded-full font-mono font-bold animate-pulse">
            ⚠️ ACCOUNT FROZEN
          </span>
        )}

        <div className="hidden sm:flex items-center gap-3 bg-[#0B1118] border border-[#00F0FF]/30 px-3.5 py-1.5 rounded-xl text-xs shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88] animate-ping" />
          <span className="text-[#7D8996] font-medium font-mono">CYBER MONITORING ACTIVE</span>
        </div>
      </div>
    </header>
  );
}
