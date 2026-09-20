import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Password Strength Calculator
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: '', width: '0%' };
    if (pass.length < 6) return { label: 'WEAK', color: 'bg-[#FF3158]', width: '33%' };
    const hasNumbers = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    if (pass.length >= 8 && (hasNumbers || hasSpecial)) {
      return { label: 'STRONG', color: 'bg-[#00FF88]', width: '100%' };
    }
    return { label: 'FAIR', color: 'bg-[#FFD000]', width: '66%' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Inline Validation
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Always register as 'user'
      await api.post('/auth/register', {
        name,
        email,
        password,
        role: 'user'
      });

      setSuccess('Account created successfully! Redirecting to login…');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } catch (err) {
      console.error('[REGISTRATION ERROR]', err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Registration failed. Email may already be registered.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030507] text-[#F5F7FA] flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-md bg-[#0B1118] border border-[#00F0FF]/22 rounded-3xl p-8 shadow-2xl shadow-[#00F0FF]/10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] flex items-center justify-center text-2xl font-bold mx-auto shadow-[0_0_12px_rgba(0,245,255,0.3)]">
            🛡️
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-[#F4F7FA]">
            CREATE YOUR FRAUDSHIELD ACCOUNT
          </h1>
          <p className="text-xs text-[#7D8996]">Sign up for digital payment fraud protection</p>
        </div>

        {/* Inline Error & Success Banners */}
        {error && (
          <div className="bg-[#FF3158]/15 border border-[#FF3158]/50 text-[#FF3158] text-xs p-3.5 rounded-xl font-medium">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="bg-[#00FF88]/15 border border-[#00FF88]/50 text-[#00FF88] text-xs p-3.5 rounded-xl font-medium font-mono">
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#7D8996] mb-1.5 uppercase font-mono tracking-wider">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Kani"
              className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-4 py-2.5 text-xs text-[#F5F7FA] placeholder-[#7D8996]/40 focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#7D8996] mb-1.5 uppercase font-mono tracking-wider">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@test.com"
              className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-4 py-2.5 text-xs text-[#F5F7FA] placeholder-[#7D8996]/40 focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
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
                className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-4 py-2.5 text-xs text-[#F5F7FA] placeholder-[#7D8996]/40 focus:outline-none focus:ring-2 focus:ring-[#00F0FF] pr-20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-[#00F0FF] hover:underline"
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-[#7D8996]">PASSWORD STRENGTH:</span>
                  <span className={`font-bold ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span>
                </div>
                <div className="w-full bg-[#06090D] h-1.5 rounded-full overflow-hidden border border-white/10">
                  <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#7D8996] mb-1.5 uppercase font-mono tracking-wider">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-[#06090D] border border-[#00F0FF]/30 rounded-xl px-4 py-2.5 text-xs text-[#F5F7FA] placeholder-[#7D8996]/40 focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00F0FF] hover:bg-[#33f3ff] text-[#030507] font-bold rounded-xl py-3 text-xs transition shadow-lg shadow-[#00F0FF]/30 disabled:opacity-50 uppercase tracking-wider font-mono"
          >
            {loading ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT →'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-white/5 text-xs text-[#7D8996]">
          Already have an account?{' '}
          <Link to="/" className="text-[#00F0FF] hover:underline font-bold font-mono">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}