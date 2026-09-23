import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService, TicketDetail as TTicketDetail } from '../../services/tickets';
import { RiskIndicator } from '../../components/RiskIndicator';
import { ClassificationBadge } from '../../components/ClassificationBadge';
import { SLATimer } from '../../components/SLATimer';
import { StatusTimeline } from '../../components/StatusTimeline';
import {
  ArrowLeft,
  FileDown,
  Lock,
  User,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  Star,
  Sparkles,
  Paperclip
} from 'lucide-react';

export const TicketDetail: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [feedbackScore, setFeedbackScore] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);

  const { data: ticket, isLoading, error } = useQuery<TTicketDetail>({
    queryKey: ['ticket-status', ticketId],
    queryFn: () => ticketService.getStatus(ticketId!),
    enabled: !!ticketId,
  });

  const confirmMutation = useMutation({
    mutationFn: ({ resolved, score, text }: { resolved: boolean; score?: number; text?: string }) =>
      ticketService.confirmResolution(ticketId!, resolved, score, text),
    onSuccess: (updated) => {
      queryClient.setQueryData(['ticket-status', ticketId], updated);
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      setConfirmSuccess(
        updated.employee_confirmation === 'confirmed'
          ? 'Thank you! Your resolution confirmation and feedback have been recorded.'
          : 'Ticket has been reopened and escalated back to HR for further resolution.'
      );
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading ticket details & audit history...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
          Ticket not found or you do not have permission to view it.
        </div>
        <Link to="/employee/tickets" className="text-xs text-teal-400 hover:text-teal-300">
          ← Back to My Grievances
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <a
          href={`http://localhost:8000/api/v1/tickets/${ticket.id}/export-pdf`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 shadow-sm"
        >
          <FileDown className="w-3.5 h-3.5 text-teal-400" />
          Export PDF (DPDP Right of Access)
        </a>
      </div>

      {/* Main Ticket Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-400">#{ticket.id}</span>
              <RiskIndicator level={ticket.risk_level} />
              {ticket.legal_hold && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40">
                  LEGAL HOLD ACTIVE
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{ticket.title}</h1>
          </div>

          <SLATimer
            deadline={ticket.sla_deadline}
            slaHours={ticket.sla_hours}
            isResolved={ticket.status === 'resolved'}
          />
        </div>

        {/* Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Submitted By</span>
            <span className="font-medium text-slate-200 flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 text-slate-400" />
              {ticket.is_anonymous ? 'Anonymous' : ticket.employee_id}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Submission Channel</span>
            <span className="font-medium text-slate-200 capitalize mt-0.5 block">
              {ticket.submission_type.replace('_', ' ')}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Assigned Team</span>
            <span className="font-medium text-teal-300 capitalize mt-0.5 flex items-center gap-1">
              <Building className="w-3 h-3" />
              {ticket.routing?.assigned_to_team || 'Triage in progress'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Current Status</span>
            <span className="font-bold text-indigo-300 uppercase mt-0.5 block">
              {ticket.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Description Section */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Grievance Description (Encrypted at Rest)
          </h3>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
            {ticket.description}
          </div>
        </div>

        {/* Attachments */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5" /> Attachments
            </h3>
            <div className="flex gap-2 flex-wrap">
              {ticket.attachments.map((att, i) => (
                <div key={i} className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-teal-300">
                  {att.filename}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Classification & Risk Section */}
        {ticket.classification && (
          <div className="p-5 rounded-xl bg-teal-950/20 border border-teal-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-400" /> Enterprise AI Classification
              </span>
              <span className="text-[11px] font-mono text-teal-400">
                Confidence: {Math.round(ticket.classification.primary_confidence * 100)}%
              </span>
            </div>

            <ClassificationBadge
              primaryCategory={ticket.classification.primary_category}
              confidence={ticket.classification.primary_confidence}
              secondaryCategories={ticket.classification.secondary_categories}
              isOverride={ticket.classification.classifier_override}
              requiresReview={ticket.classification.requires_manual_review}
            />

            {ticket.classification.reasoning && (
              <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                <strong className="text-slate-400">AI Reasoning: </strong>
                {ticket.classification.reasoning}
              </p>
            )}

            {ticket.classification.risk_keywords && ticket.classification.risk_keywords.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
                <span className="text-rose-300 text-[11px] font-semibold">Flagged Risk Keywords:</span>
                {ticket.classification.risk_keywords.map((kw, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Status Progression Timeline */}
        <div className="border-t border-slate-800 pt-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Lifecycle & Audit Progression
          </h3>
          <StatusTimeline timeline={ticket.timeline} currentStatus={ticket.status} />
        </div>

        {/* Resolution Notes from HR */}
        {ticket.resolution_notes && (
          <div className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
            <h3 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> HR Resolution Outcome
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/70 p-3.5 rounded-lg border border-slate-800">
              {ticket.resolution_notes}
            </p>
            {ticket.resolved_at && (
              <span className="text-[10px] text-slate-400 block">
                Resolved on: {new Date(ticket.resolved_at).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Employee Confirmation & Feedback Action Card (Use Case 13) */}
        {ticket.status === 'resolved' && (
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400" /> Employee Confirmation & Feedback (Use Case 13)
            </h3>
            <p className="text-xs text-slate-300">
              Please confirm if this grievance was resolved to your satisfaction. Disputing the outcome will immediately reopen the case for senior review.
            </p>

            {confirmSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300">
                {confirmSuccess}
              </div>
            )}

            {ticket.employee_confirmation === 'pending' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Satisfaction Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackScore(star)}
                      className={`p-1 transition-transform hover:scale-125 ${
                        star <= feedbackScore ? 'text-amber-400' : 'text-slate-600'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Optional resolution feedback..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                />

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => confirmMutation.mutate({ resolved: true, score: feedbackScore, text: feedbackText })}
                    disabled={confirmMutation.isPending}
                    className="px-4 py-2 rounded-lg gradient-btn text-white text-xs font-semibold shadow flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Resolved
                  </button>

                  <button
                    onClick={() => confirmMutation.mutate({ resolved: false, score: feedbackScore, text: feedbackText })}
                    disabled={confirmMutation.isPending}
                    className="px-4 py-2 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-semibold"
                  >
                    Dispute & Reopen
                  </button>
                </div>
              </div>
            )}

            {ticket.employee_confirmation !== 'pending' && (
              <div className="text-xs text-slate-300">
                Status: <strong className="uppercase text-teal-300">{ticket.employee_confirmation}</strong>
                {ticket.employee_feedback_score && (
                  <span className="ml-3 font-mono text-amber-300">
                    Rating: {ticket.employee_feedback_score}/5 stars
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
