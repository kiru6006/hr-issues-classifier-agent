import React from 'react';
import { TicketDetail } from '../services/tickets';
import { RiskIndicator } from './RiskIndicator';
import { ClassificationBadge } from './ClassificationBadge';
import { SLATimer } from './SLATimer';
import { ShieldCheck, User, Calendar, ArrowRight, Lock } from 'lucide-react';

interface TicketCardProps {
  ticket: TicketDetail;
  onClick: () => void;
  showAdminActions?: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="glass-card rounded-xl p-5 cursor-pointer hover:scale-[1.01] transition-all border border-slate-800 hover:border-teal-500/40 relative overflow-hidden group"
    >
      {/* Top Banner Accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          ticket.risk_level === 'critical'
            ? 'bg-rose-500'
            : ticket.risk_level === 'high'
            ? 'bg-amber-500'
            : ticket.risk_level === 'medium'
            ? 'bg-yellow-500'
            : 'bg-teal-500'
        }`}
      />

      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-slate-400">
            #{ticket.id.slice(0, 8)}
          </span>
          <RiskIndicator level={ticket.risk_level} />
          {ticket.legal_hold && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-950/60 text-purple-300 border border-purple-500/40">
              <Lock className="w-3 h-3" /> LEGAL HOLD
            </span>
          )}
          {ticket.is_pattern_flag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-orange-950/60 text-orange-300 border border-orange-500/40">
              SYSTEMIC PATTERN
            </span>
          )}
        </div>

        <SLATimer
          deadline={ticket.sla_deadline}
          slaHours={ticket.sla_hours}
          isResolved={ticket.status === 'resolved'}
        />
      </div>

      <h3 className="text-base font-semibold text-slate-100 group-hover:text-teal-300 transition-colors line-clamp-1 mb-2">
        {ticket.title}
      </h3>

      <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
        {ticket.description}
      </p>

      {ticket.classification && (
        <div className="mb-4">
          <ClassificationBadge
            primaryCategory={ticket.classification.primary_category}
            confidence={ticket.classification.primary_confidence}
            secondaryCategories={ticket.classification.secondary_categories}
            isOverride={ticket.classification.classifier_override}
            requiresReview={ticket.classification.requires_manual_review}
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-500" />
            {ticket.is_anonymous ? (
              <span className="italic text-slate-400">Anonymous</span>
            ) : (
              ticket.employee_id
            )}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {new Date(ticket.created_at).toLocaleDateString()}
          </span>
          <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
            {ticket.status.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center text-teal-400 text-xs font-medium group-hover:translate-x-1 transition-transform">
          View details <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </div>
      </div>
    </div>
  );
};
