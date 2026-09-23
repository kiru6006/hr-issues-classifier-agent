import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Login } from './pages/auth/Login';
import { PrivacyPolicy } from './pages/auth/PrivacyPolicy';
import { EmployeeDashboard } from './pages/employee/Dashboard';
import { SubmitTicket } from './pages/employee/SubmitTicket';
import { MyTickets } from './pages/employee/MyTickets';
import { TicketDetail } from './pages/employee/TicketDetail';
import { HRDashboard } from './pages/hr/Dashboard';
import { ReviewQueue } from './pages/hr/ReviewQueue';
import { AllTickets } from './pages/hr/AllTickets';
import { Patterns } from './pages/admin/Patterns';
import { AuditLogs } from './pages/admin/AuditLogs';
import { SLAMonitor } from './pages/admin/SLAMonitor';
import { Settings } from './pages/admin/Settings';
import { useAuthStore } from './store/authStore';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Root index redirector based on role
const RootRedirector: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user.role === 'employee') {
    return <Navigate to="/employee/dashboard" replace />;
  } else if (['hr_reviewer', 'hr_resolver'].includes(user.role)) {
    return <Navigate to="/hr/review-queue" replace />;
  } else {
    return <Navigate to="/hr/dashboard" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950">
        <Navbar />

        <main className="flex-1">
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

            {/* Root Dispatcher */}
            <Route path="/" element={<RootRedirector />} />

            {/* Employee Routes */}
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/submit"
              element={
                <ProtectedRoute>
                  <SubmitTicket />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/tickets"
              element={
                <ProtectedRoute>
                  <MyTickets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/tickets/:ticketId"
              element={
                <ProtectedRoute>
                  <TicketDetail />
                </ProtectedRoute>
              }
            />

            {/* HR Operations Routes */}
            <Route
              path="/hr/dashboard"
              element={
                <ProtectedRoute allowedRoles={['hr_reviewer', 'hr_resolver', 'legal', 'hr_lead', 'admin']}>
                  <HRDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr/review-queue"
              element={
                <ProtectedRoute allowedRoles={['hr_reviewer', 'hr_resolver', 'legal', 'hr_lead', 'admin']}>
                  <ReviewQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr/tickets"
              element={
                <ProtectedRoute allowedRoles={['hr_reviewer', 'hr_resolver', 'legal', 'hr_lead', 'admin']}>
                  <AllTickets />
                </ProtectedRoute>
              }
            />

            {/* Admin & Leadership Routes */}
            <Route
              path="/admin/patterns"
              element={
                <ProtectedRoute allowedRoles={['legal', 'hr_lead', 'admin']}>
                  <Patterns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['legal', 'hr_lead', 'admin']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sla-monitor"
              element={
                <ProtectedRoute allowedRoles={['legal', 'hr_lead', 'admin']}>
                  <SLAMonitor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['hr_lead', 'admin']}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Enterprise Footer */}
        <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-400 bg-slate-950">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>HR AI Problem Classifier v1.0 • DPDP Act 2023 Compliant</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>Local Self-Hosted LLM</span>
              <span>•</span>
              <span>Zero Cross-Border Data Transfer</span>
              <span>•</span>
              <a href="/privacy-policy" className="hover:text-teal-300 transition-colors">
                Privacy Notice
              </a>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};
