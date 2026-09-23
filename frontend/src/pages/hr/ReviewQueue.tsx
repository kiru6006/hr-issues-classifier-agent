import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService, ReviewQueueTicket } from '../../services/tickets';
import { RiskIndicator } from '../../components/RiskIndicator';
import { ClassificationBadge } from '../../components/ClassificationBadge';
import { SLATimer } from '../../components/SLATimer';
import {
  Inbox,
  Filter,
  Search,
  CheckCircle2,
  Edit3,
  Send,
  Lock,
  Sparkles,
  AlertOctagon,
  RefreshCw,
  Eye,
  Check,
  Building,
  User
} from 'lucide-react';

const CATEGORIES = [
  'Payroll',
  'Leave & Attendance',
  'Benefits',
  'Policy & Compliance',
  'Employee Relations',
  'Recruitment & Onboarding',
  'Learning & Development',
  'General HR Query',
  'Others',
];

const TEAMS = [
  { id: 'Payroll Team', label: 'Payroll Team' },
  { id: 'Leave & Attendance Team', label: 'Leave & Attendance Team' },
  { id: 'Benefits Team', label: 'Benefits Team' },
  { id: 'HR Policy Team', label: 'HR Policy Team' },
  { id: 'Employee Relations Team', label: 'Employee Relations Team' },
  { id: 'Talent Acquisition / Onboarding Team', label: 'Talent Acquisition / Onboarding Team' },
  { id: 'L&D Team', label: 'L&D Team' },
  { id: 'HR Helpdesk', label: 'HR Helpdesk' },
];

export const ReviewQueue: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals / Action States
  const [activeOverrideTicket, setActiveOverrideTicket] = useState<ReviewQueueTicket | null>(null);
  const [overrideCategory, setOverrideCategory] = useState(CATEGORIES[0]);
  const [overrideReason, setOverrideReason] = useState('');

  const [activeRouteTicket, setActiveRouteTicket] = useState<ReviewQueueTicket | null>(null);
  const [targetTeam, setTargetTeam] = useState(TEAMS[0].id);
  const [routingReason, setRoutingReason] = useState('');

  const [activeResolveTicket, setActiveResolveTicket] = useState<ReviewQueueTicket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['review-queue', statusFilter, riskFilter, categoryFilter],
    queryFn: () => ticketService.getReviewQueue(statusFilter || undefined, riskFilter || undefined, categoryFilter || undefined),
  });

  const overrideMutation = useMutation({
    mutationFn: () =>
      ticketService.overrideClassification(activeOverrideTicket!.ticket_id, overrideCategory, overrideReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['hr-kpis'] });
      setActionSuccess(`Classification manually updated for ticket #${activeOverrideTicket!.ticket_id.slice(0, 8)}`);
      setActiveOverrideTicket(null);
      setOverrideReason('');
    },
  });

  const routeMutation = useMutation({
    mutationFn: () =>
      ticketService.routeTicket(activeRouteTicket!.ticket_id, targetTeam, routingReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['hr-kpis'] });
      setActionSuccess(`Ticket #${activeRouteTicket!.ticket_id.slice(0, 8)} successfully routed to ${targetTeam.toUpperCase()}`);
      setActiveRouteTicket(null);
      setRoutingReason('');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: () =>
      ticketService.resolveTicket(activeResolveTicket!.ticket_id, resolutionNotes, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['hr-kpis'] });
      setActionSuccess(`Ticket #${activeResolveTicket!.ticket_id.slice(0, 8)} marked as RESOLVED.`);
      setActiveResolveTicket(null);
      setResolutionNotes('');
    },
  });

  const tickets = data?.tickets || [];
  const filteredTickets = tickets.filter((t) => {
    return (
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.primary_category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <Inbox className="w-6 h-6 text-teal-400" />
            HR Review & Triage Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review AI confidence scores, inspect reasoning, override classifications, and assign cases to teams.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Active Statuses</option>
            <option value="new">New</option>
            <option value="classified">Classified</option>
            <option value="reviewed">Reviewed</option>
            <option value="routed">Routed</option>
            <option value="reopened">Reopened</option>
          </select>
        </div>
      </div>

      {/* Review Queue Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Ticket</th>
                <th className="py-3.5 px-4">Risk Level</th>
                <th className="py-3.5 px-4">AI Classification</th>
                <th className="py-3.5 px-4">SLA Clock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading triage queue items...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No tickets in review queue matching selected filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.ticket_id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Ticket Title & ID */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            #{t.ticket_id.slice(0, 8)}
                          </span>
                          {t.legal_hold && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
                              HOLD
                            </span>
                          )}
                          {t.is_pattern_flag && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-orange-950 text-orange-300 border border-orange-500/30">
                              PATTERN
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-slate-100 max-w-xs sm:max-w-sm line-clamp-1">
                          {t.title}
                        </p>
                        <span className="text-[10px] text-slate-500 block">
                          By: {t.employee_id} • Channel: {t.submission_type}
                        </span>
                      </div>
                    </td>

                    {/* Risk Level */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <RiskIndicator level={t.risk_level} />
                      {t.risk_keywords && t.risk_keywords.length > 0 && (
                        <div className="text-[10px] text-rose-300/90 font-mono mt-1 line-clamp-1">
                          {t.risk_keywords.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </td>

                    {/* AI Classification & Confidence */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <ClassificationBadge
                        primaryCategory={t.primary_category || 'Unclassified'}
                        confidence={t.primary_confidence}
                        requiresReview={t.requires_manual_review}
                      />
                      {t.reasoning && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 italic">
                          "{t.reasoning}"
                        </p>
                      )}
                    </td>

                    {/* SLA Clock */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SLATimer deadline={t.sla_deadline} slaHours={t.sla_hours} />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase bg-slate-800 text-slate-300">
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setActiveOverrideTicket(t);
                            setOverrideCategory(t.primary_category || CATEGORIES[0]);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium flex items-center gap-1"
                          title="Override AI Classification"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                          Override
                        </button>

                        <button
                          onClick={() => {
                            setActiveRouteTicket(t);
                            setRoutingReason(`Assigned by HR triage based on ${t.primary_category}`);
                          }}
                          className="p-1.5 rounded-lg gradient-btn text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm"
                          title="Route to Team"
                        >
                          <Send className="w-3 h-3" />
                          Route
                        </button>

                        <button
                          onClick={() => {
                            setActiveResolveTicket(t);
                            setResolutionNotes('');
                          }}
                          className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1"
                          title="Resolve Ticket"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Classification Override (Use Case 7) */}
      {activeOverrideTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-indigo-400" /> Manual Classification Override (Use Case 7)
              </h3>
              <button
                onClick={() => setActiveOverrideTicket(null)}
                className="text-slate-400 hover:text-white text-base"
              >
                ×
              </button>
            </div>

            <div className="text-xs space-y-2">
              <span className="text-slate-400 block font-mono">
                Ticket #{activeOverrideTicket.ticket_id.slice(0, 8)}: {activeOverrideTicket.title}
              </span>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <strong className="text-teal-400">Current AI Prediction: </strong>
                {activeOverrideTicket.primary_category} ({Math.round((activeOverrideTicket.primary_confidence || 0) * 100)}%)
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Primary Category *
                </label>
                <select
                  value={overrideCategory}
                  onChange={(e) => setOverrideCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Audit Override Rationale (Logged Immutably per DPDP) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why the AI category is being adjusted (e.g., specific PoSH complaint nuances)..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveOverrideTicket(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={overrideReason.length < 3 || overrideMutation.isPending}
                onClick={() => overrideMutation.mutate()}
                className="px-4 py-1.5 rounded-lg gradient-btn text-white text-xs font-semibold shadow disabled:opacity-50"
              >
                {overrideMutation.isPending ? 'Saving Override...' : 'Confirm Override & Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Team Routing (Use Case 8 & 9) */}
      {activeRouteTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Send className="w-4 h-4 text-teal-400" /> Route Grievance Ticket (Use Case 8)
              </h3>
              <button onClick={() => setActiveRouteTicket(null)} className="text-slate-400 hover:text-white text-base">
                ×
              </button>
            </div>

            <div className="text-xs space-y-2">
              <span className="text-slate-400 block font-mono">
                Ticket #{activeRouteTicket.ticket_id.slice(0, 8)}: {activeRouteTicket.title}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assign To Team *
                </label>
                <select
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  {TEAMS.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Routing Reason / Special Instructions *
                </label>
                <textarea
                  required
                  rows={3}
                  value={routingReason}
                  onChange={(e) => setRoutingReason(e.target.value)}
                  placeholder="Reason for routing to this team..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveRouteTicket(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={routingReason.length < 3 || routeMutation.isPending}
                onClick={() => routeMutation.mutate()}
                className="px-4 py-1.5 rounded-lg gradient-btn text-white text-xs font-semibold shadow disabled:opacity-50"
              >
                {routeMutation.isPending ? 'Routing...' : 'Assign & Notify Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Resolve Grievance (Use Case 13) */}
      {activeResolveTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" /> Complete Grievance Resolution (Use Case 13)
              </h3>
              <button onClick={() => setActiveResolveTicket(null)} className="text-slate-400 hover:text-white text-base">
                ×
              </button>
            </div>

            <div className="text-xs space-y-2">
              <span className="text-slate-400 block font-mono">
                Ticket #{activeResolveTicket.ticket_id.slice(0, 8)}: {activeResolveTicket.title}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resolution Summary & Investigation Findings (Will be encrypted) *
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail the actions taken (e.g., payroll adjustment processed, policy warning issued, counseling scheduled)..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveResolveTicket(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resolutionNotes.length < 5 || resolveMutation.isPending}
                onClick={() => resolveMutation.mutate()}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow disabled:opacity-50"
              >
                {resolveMutation.isPending ? 'Resolving...' : 'Resolve & Notify Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
