import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth';
import {
  Shield,
  Layers,
  Inbox,
  BarChart3,
  Sparkles,
  FileText,
  AlertTriangle,
  Settings,
  LogOut,
  UserCircle2,
  Lock
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleSwitch = async (roleEmail: string) => {
    try {
      const res = await authService.login({ email: roleEmail, password: 'password123' });
      setAuth(res.user, res.access_token);
      if (res.user.role === 'employee') {
        navigate('/employee/dashboard');
      } else if (['hr_reviewer', 'hr_resolver'].includes(res.user.role)) {
        navigate('/hr/review-queue');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('Role switch failed', err);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight gradient-text">
                  GRIEVANCE.AI
                </span>
                <span className="block text-[10px] text-teal-400 font-mono tracking-wider font-semibold">
                  DPDP ACT 2023 COMPLIANT
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          {isAuthenticated && user && (
            <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
              {/* Employee Links */}
              {user.role === 'employee' && (
                <>
                  <Link
                    to="/employee/dashboard"
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      isActive('/employee/dashboard')
                        ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/employee/submit"
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      isActive('/employee/submit')
                        ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    + Submit Grievance
                  </Link>
                  <Link
                    to="/employee/tickets"
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      isActive('/employee/tickets')
                        ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    My Grievances
                  </Link>
                </>
              )}

              {/* HR Reviewer / Resolver / Legal Links */}
              {['hr_reviewer', 'hr_resolver', 'legal', 'hr_lead', 'admin'].includes(user.role) && (
                <>
                  <Link
                    to="/hr/dashboard"
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      isActive('/hr/dashboard')
                        ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    HR KPIs
                  </Link>
                  <Link
                    to="/hr/review-queue"
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                      isActive('/hr/review-queue')
                        ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    Review Queue
                  </Link>
                  <Link
                    to="/hr/tickets"
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      isActive('/hr/tickets')
                        ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    All Tickets
                  </Link>
                </>
              )}

              {/* Admin / Leadership Links */}
              {['hr_lead', 'legal', 'admin'].includes(user.role) && (
                <>
                  <Link
                    to="/admin/patterns"
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                      isActive('/admin/patterns')
                        ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-orange-400" />
                    Systemic Patterns
                  </Link>
                  <Link
                    to="/admin/sla-monitor"
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                      isActive('/admin/sla-monitor')
                        ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    SLA Monitor
                  </Link>
                  <Link
                    to="/admin/audit-logs"
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                      isActive('/admin/audit-logs')
                        ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    Audit Logs
                  </Link>
                  <Link
                    to="/admin/settings"
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                      isActive('/admin/settings')
                        ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    DPDP Erasure
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* Right Area: Demo Role Switcher & User Profile */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* Role Switcher Dropdown for Quick Pair-Programming Evaluation */}
                <div className="hidden lg:flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-xs">
                  <span className="text-slate-500 text-[11px] font-medium">Switch Role:</span>
                  <select
                    value={user.email}
                    onChange={(e) => handleRoleSwitch(e.target.value)}
                    className="bg-transparent text-teal-300 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="employee@company.com" className="bg-slate-900 text-slate-200">
                      Employee (Rajesh)
                    </option>
                    <option value="reviewer@company.com" className="bg-slate-900 text-slate-200">
                      HR Reviewer (Priya)
                    </option>
                    <option value="resolver@company.com" className="bg-slate-900 text-slate-200">
                      HR Resolver (Amit)
                    </option>
                    <option value="legal@company.com" className="bg-slate-900 text-slate-200">
                      Legal Counsel (Kavita)
                    </option>
                    <option value="lead@company.com" className="bg-slate-900 text-slate-200">
                      HR Lead (Suresh)
                    </option>
                    <option value="admin@company.com" className="bg-slate-900 text-slate-200">
                      System Admin
                    </option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-200">{user.email}</span>
                    <span className="text-[10px] uppercase font-mono font-bold text-teal-400">
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/auth/login');
                    }}
                    title="Logout"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/privacy-policy"
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  DPDP Privacy Notice
                </Link>
                <Link
                  to="/auth/login"
                  className="gradient-btn px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-md"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
