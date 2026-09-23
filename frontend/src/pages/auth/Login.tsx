import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth';
import { Shield, Lock, CheckCircle, ArrowRight, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('employee@company.com');
  const [password, setPassword] = useState('password123');
  const [consent, setConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError('You must accept the DPDP Act 2023 Consent to proceed.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authService.login({ email, password, consent_to_store: consent });
      setAuth(res.user, res.access_token);
      if (res.user.role === 'employee') {
        navigate('/employee/dashboard');
      } else if (['hr_reviewer', 'hr_resolver'].includes(res.user.role)) {
        navigate('/hr/review-queue');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials or login failed.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl relative">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center shadow-lg shadow-teal-500/20 mb-4">
            <Shield className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            HR AI Grievance Intake & Triage
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Compliant with Digital Personal Data Protection (DPDP) Act 2023
          </p>
        </div>

        {/* Demo Fast-Login Helper */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs">
          <span className="text-[11px] font-semibold text-teal-400 flex items-center gap-1 mb-2">
            <UserCheck className="w-3.5 h-3.5" /> Quick Demo Role Selection:
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setDemoRole('employee@company.com')}
              className={`p-1.5 rounded text-left border transition-all ${
                email === 'employee@company.com'
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-200'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Employee (Rajesh)
            </button>
            <button
              type="button"
              onClick={() => setDemoRole('reviewer@company.com')}
              className={`p-1.5 rounded text-left border transition-all ${
                email === 'reviewer@company.com'
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-200'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
              }`}
            >
              HR Reviewer (Priya)
            </button>
            <button
              type="button"
              onClick={() => setDemoRole('resolver@company.com')}
              className={`p-1.5 rounded text-left border transition-all ${
                email === 'resolver@company.com'
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-200'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
              }`}
            >
              HR Resolver (Amit)
            </button>
            <button
              type="button"
              onClick={() => setDemoRole('admin@company.com')}
              className={`p-1.5 rounded text-left border transition-all ${
                email === 'admin@company.com'
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-200'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
              }`}
            >
              System Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Work Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="••••••••"
            />
          </div>

          {/* DPDP Act 2023 Explicit Consent Checkbox */}
          <div className="p-3 rounded-lg bg-teal-950/30 border border-teal-500/20 text-xs">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-900"
              />
              <span className="text-slate-300 text-[11px] leading-relaxed">
                I consent to HR AI storing my grievance data for HR triage, resolution, and pattern detection under the <strong>DPDP Act 2023</strong>. Data is retained for 2 years post-resolution.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg gradient-btn text-white text-sm font-semibold shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In Securely</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            to="/privacy-policy"
            className="text-xs text-slate-400 hover:text-teal-300 transition-colors"
          >
            Read DPDP Act 2023 Privacy Policy & Data Processing Notice →
          </Link>
        </div>
      </div>
    </div>
  );
};
