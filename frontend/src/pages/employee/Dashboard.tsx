import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ticketService, TicketDetail } from '../../services/tickets';
import { useAuthStore } from '../../store/authStore';
import { TicketCard } from '../../components/TicketCard';
import {
  FilePlus2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: tickets = [], isLoading } = useQuery<TicketDetail[]>({
    queryKey: ['my-tickets'],
    queryFn: ticketService.getMyTickets,
  });

  const openCount = tickets.filter((t) => t.status !== 'resolved').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;
  const criticalCount = tickets.filter((t) => t.risk_level === 'critical' || t.risk_level === 'high').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Action Banner */}
      <div className="relative rounded-2xl glass-panel p-8 border border-slate-800 overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Employee Self-Service Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Plus_Jakarta_Sans']">
              Welcome, {user?.email.split('@')[0]}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Report workplace grievances, track AI triage progress, and review resolutions securely under the DPDP Act 2023.
            </p>
          </div>

          <Link
            to="/employee/submit"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl gradient-btn text-white text-sm font-semibold shadow-xl shadow-teal-500/20 hover:scale-105 transition-all self-start md:self-auto"
          >
            <FilePlus2 className="w-4 h-4" />
            Submit New Grievance
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Grievances</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{openCount}</p>
          <span className="text-[11px] text-slate-400">In triage / investigation</span>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Resolved Grievances</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{resolvedCount}</p>
          <span className="text-[11px] text-slate-400">Confirmation completed</span>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>High Risk / Fast Track</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{criticalCount}</p>
          <span className="text-[11px] text-slate-400">24h - 72h SLA Priority</span>
        </div>
      </div>

      {/* Recent Grievances */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Recent Grievances</h2>
          {tickets.length > 0 && (
            <Link
              to="/employee/tickets"
              className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
            >
              View all ({tickets.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 glass-panel rounded-xl animate-pulse">
            Loading your grievance records...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <CheckCircle2 className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No active grievances filed</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              If you have questions regarding salary, benefits, workplace conduct, or policies, submit a new intake.
            </p>
            <Link
              to="/employee/submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-btn text-xs font-semibold text-white shadow"
            >
              <FilePlus2 className="w-3.5 h-3.5" /> File First Ticket
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.slice(0, 4).map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => navigate(`/employee/tickets/${ticket.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
