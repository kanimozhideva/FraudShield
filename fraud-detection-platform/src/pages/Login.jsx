import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      const userRole = (loggedUser?.role || '').toLowerCase();

      if (userRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/user/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('[LOGIN ERROR]', err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Login failed. Invalid email or password.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030507] text-[#F5F7FA] flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-4xl bg-[#0B1118] border border-[#00F0FF]/22 rounded-3xl shadow-2xl shadow-[#00F0FF]/10 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        
        {/* LEFT SIDE: FraudShield Cyber Security Branding */}
        <div className="bg-[#06090D] p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-[#00F0FF]/22 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00F0FF_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              🛡️
            </div>

            <div>
              <h1 className="font-serif text-3xl font-bold tracking-wider text-[#00F0FF]">
                FraudShield
              </h1>
              <p className="text-xs text-[#7D8996] uppercase tracking-widest font-mono mt-1">
                DIGITAL PAYMENT FRAUD DETECTION
              </p>
            </div>

            <div className="p-4 bg-[#0B1118] border border-[#7C3AED]/30 rounded-2xl space-y-2 text-xs">
              <span className="text-[10px] font-mono text-[#7C3AED] uppercase font-bold tracking-wider block">
                SECURITY ARCHITECTURE
              </span>
              <p className="text-[#F5F7FA] font-medium leading-relaxed">
                Transaction Security & Real-Time Cyber Threat Prevention.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-8 space-y-2 font-mono text-[11px]">
            <div className="flex items-center gap-2 text-[#00FF88]">
              <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping" />
              <span>REAL-TIME ANALYSIS</span>
            </div>
            <div className="flex items-center gap-2 text-[#00F0FF]">
              <span>✓</span> <span>FRAUD DETECTION ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 text-[#7D8996]">
              <span>🔒</span> <span>SECURE AUTHENTICATION</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Secure Login Card */}
        <div className="p-8 lg:p-12 flex flex-col justify-center space-y-6 bg-[#0B1118]">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold text-[#F5F7FA] tracking-wide">LOGIN</h2>
            <p className="text-xs text-[#7D8996]">Secure access to FraudShield</p>
          </div>

          {error && (
            <div className="bg-[#FF3158]/15 border border-[#FF3158]/50 text-[#FF3158] text-xs p-3.5 rounded-xl font-medium shadow-md">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#7D8996] mb-1.5 uppercase font-mono tracking-wider">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@test.com or admin@test.com"
                className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-4 py-3 text-xs text-[#F5F7FA] placeholder-[#7D8996]/40 focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#7D8996] mb-1.5 uppercase font-mono tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-4 py-3 text-xs text-[#F5F7FA] placeholder-[#7D8996]/40 focus:outline-none focus:ring-2 focus:ring-[#00F0FF] pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-[#00F0FF] hover:underline"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00F0FF] hover:bg-[#33f3ff] text-[#030507] font-bold rounded-xl py-3.5 text-xs transition shadow-lg shadow-[#00F0FF]/30 disabled:opacity-50 uppercase tracking-wider font-mono"
            >
              {loading ? 'AUTHENTICATING…' : 'SIGN IN →'}
            </button>
          </form>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-[#7D8996]">Don't have an account?</span>
            <Link to="/register" className="text-[#00F0FF] hover:underline font-bold font-mono">
              CREATE ACCOUNT
            </Link>
          </div>

          <div className="pt-2 text-center text-[10px] font-mono text-[#00FF88] flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" />
            <span>● SECURE AUTHENTICATION — JWT protected</span>
          </div>
        </div>

      </div>
    </div>
  );
}