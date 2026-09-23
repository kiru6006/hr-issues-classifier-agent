import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketService, SLADashboardData } from '../../services/tickets';
import { RiskIndicator } from '../../components/RiskIndicator';
import {
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  BarChart3,
  Flame,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SLAMonitor: React.FC = () => {
  const navigate = useNavigate();

  const { data: sla, isLoading, refetch } = useQuery<SLADashboardData>({
    queryKey: ['admin-sla-dashboard'],
    queryFn: ticketService.getSLADashboard,
  });

  if (isLoading || !sla) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading real-time SLA matrix...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30 mb-2">
            <Clock className="w-3.5 h-3.5" /> Real-time SLA Enforcement Engine (Use Case 6)
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-sky-400" />
            SLA Compliance & Escalation Command
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracks SLA countdowns by risk level (Critical 24h, High 72h, Medium 7d, Low 14d) and triggers breach escalations.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
        </button>
      </div>

      {/* Global Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Open Grievances</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">{sla.total_open}</p>
          <span className="text-[11px] text-slate-400">Under active triage</span>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>On SLA Target (&lt;75%)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">{sla.on_sla}</p>
          <span className="text-[11px] text-emerald-300">Healthy resolution trajectory</span>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>At-Risk (&gt;75% Consumed)</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400 mt-2">{sla.at_risk}</p>
          <span className="text-[11px] text-amber-300">Attention alert sent to team lead</span>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>SLA Overdue (Breached)</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-rose-400 mt-2">{sla.overdue}</p>
          <span className="text-[11px] text-rose-300">Escalated to VP HR & Legal</span>
        </div>
      </div>

      {/* Breakdown by Risk Tier */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white">SLA Performance by Risk Tier</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Object.entries(sla.by_risk_level || {}).map(([risk, stats]) => (
            <div key={risk} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <RiskIndicator level={risk} />
                <span className="font-mono text-xs font-bold text-white">{stats.total} Total</span>
              </div>
              <div className="space-y-1 text-xs pt-2">
                <div className="flex justify-between text-slate-400">
                  <span>On SLA:</span>
                  <span className="text-emerald-400 font-semibold">{stats.on_sla}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>At-Risk:</span>
                  <span className="text-amber-400 font-semibold">{stats.at_risk}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Overdue:</span>
                  <span className="text-rose-400 font-semibold">{stats.overdue}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Urgent Escalations Due Queue */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            Urgent Escalations & At-Risk Queue ({sla.escalations_due?.length || 0})
          </h2>
          <span className="text-xs text-slate-400">Auto-Alert Trigger List</span>
        </div>

        {sla.escalations_due && sla.escalations_due.length > 0 ? (
          <div className="space-y-3">
            {sla.escalations_due.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{item.ticket_id.slice(0, 8)}
                    </span>
                    <RiskIndicator level={item.risk_level} />
                    <span className="text-xs text-slate-400">Team: {item.assigned_team}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-100">{item.title}</h4>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span
                    className={`text-xs font-mono px-2.5 py-1 rounded-full font-bold ${
                      item.time_remaining_hours <= 0
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40 animate-pulse'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {item.time_remaining_hours <= 0
                      ? `OVERDUE ${Math.abs(item.time_remaining_hours)}h`
                      : `${item.time_remaining_hours}h Remaining`}
                  </span>

                  <button
                    onClick={() => navigate(`/hr/review-queue`)}
                    className="px-3 py-1.5 rounded-lg gradient-btn text-white text-xs font-semibold shadow flex items-center gap-1"
                  >
                    Triage Now <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            All tickets currently executing well within SLA parameters.
          </div>
        )}
      </div>
    </div>
  );
};
