import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ticketService } from '../../services/tickets';
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldAlert,
  BarChart2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const RISK_COLORS: Record<string, string> = {
  critical: '#f43f5e',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#10b981',
};

export const HRDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['hr-kpis'],
    queryFn: ticketService.getHRKPIs,
  });

  if (isLoading || !kpis) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading HR Triage Analytics & KPIs...
      </div>
    );
  }

  const catData = (kpis.categories_distribution || []).map((c: any) => ({
    name: c.name.length > 18 ? `${c.name.slice(0, 16)}...` : c.name,
    fullName: c.name,
    count: c.count,
  }));

  const riskData = (kpis.risk_distribution || []).map((r: any) => ({
    name: r.name.toUpperCase(),
    value: r.count,
    color: RISK_COLORS[r.name.toLowerCase()] || '#64748b',
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30 mb-2">
            <BarChart2 className="w-3.5 h-3.5" /> Enterprise Operations Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Plus_Jakarta_Sans']">
            HR Triage & Grievance Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated 13-category zero-shot intake, risk escalation triage, and SLA enforcement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/hr/review-queue"
            className="px-4 py-2.5 rounded-xl gradient-btn text-white text-xs font-semibold shadow-lg shadow-teal-500/20 flex items-center gap-2"
          >
            <Inbox className="w-4 h-4" />
            Open Review Queue ({kpis.pending_review_count})
          </Link>
          <Link
            to="/admin/patterns"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-orange-400" />
            Systemic Patterns
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => navigate('/hr/review-queue?status=classified')}
          className="glass-card p-5 rounded-xl border border-slate-800 cursor-pointer hover:border-teal-500/40"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Pending Review</span>
            <Inbox className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">{kpis.pending_review_count}</p>
          <span className="text-[11px] text-teal-400 font-medium">Requires triage or override</span>
        </div>

        <div
          onClick={() => navigate('/hr/review-queue?risk_level=critical')}
          className="glass-card p-5 rounded-xl border border-slate-800 cursor-pointer hover:border-rose-500/40"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Critical / High Risk</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-rose-400 mt-2">{kpis.high_risk_count}</p>
          <span className="text-[11px] text-rose-300 font-medium">PoSH, legal holds, discrimination</span>
        </div>

        <div
          onClick={() => navigate('/admin/sla-monitor')}
          className="glass-card p-5 rounded-xl border border-slate-800 cursor-pointer hover:border-amber-500/40"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Overdue SLA</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400 mt-2">{kpis.overdue_sla_count}</p>
          <span className="text-[11px] text-amber-300 font-medium">Breached SLA escalation queue</span>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Avg Resolution Time</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">{kpis.avg_resolution_hours}h</p>
          <span className="text-[11px] text-emerald-400 font-medium">Target: &lt; 24h average</span>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown (2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Grievances by Category (13 Types)</h2>
            <span className="text-xs text-slate-400">Real-time AI Distribution</span>
          </div>

          <div className="h-64 w-full">
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No categorical data available yet
              </div>
            )}
          </div>
        </div>

        {/* Risk Distribution (1 Col) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Risk Profile Breakdown</h2>
            <span className="text-xs text-slate-400">SLA Priority</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {riskData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">No risk data recorded</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
