import React from 'react';
import { AlertTriangle, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RiskIndicatorProps {
  level: 'low' | 'medium' | 'high' | 'critical' | string;
  showIcon?: boolean;
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({ level, showIcon = true }) => {
  const normLevel = (level || 'low').toLowerCase();

  switch (normLevel) {
    case 'critical':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
          CRITICAL RISK
        </span>
      );
    case 'high':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          HIGH RISK
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />}
          MEDIUM
        </span>
      );
    case 'low':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          LOW RISK
        </span>
      );
  }
};
