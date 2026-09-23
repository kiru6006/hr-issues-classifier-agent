import React, { useState, useEffect } from 'react';
import { Clock, AlertOctagon } from 'lucide-react';

interface SLATimerProps {
  deadline?: string;
  slaHours?: number;
  isResolved?: boolean;
}

export const SLATimer: React.FC<SLATimerProps> = ({ deadline, slaHours = 72, isResolved = false }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; isBreached: boolean }>({
    hours: 0,
    minutes: 0,
    isBreached: false,
  });

  useEffect(() => {
    if (!deadline || isResolved) return;

    const calculate = () => {
      const target = new Date(deadline).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        const absDiff = Math.abs(diff);
        const hours = Math.floor(absDiff / (1000 * 60 * 60));
        const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft({ hours, minutes, isBreached: true });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft({ hours, minutes, isBreached: false });
      }
    };

    calculate();
    const interval = setInterval(calculate, 60000);
    return () => clearInterval(interval);
  }, [deadline, isResolved]);

  if (isResolved) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
        <Clock className="w-3 h-3" /> Resolved within SLA
      </span>
    );
  }

  if (!deadline) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
        <Clock className="w-3 h-3" /> SLA: {slaHours}h target
      </span>
    );
  }

  if (timeLeft.isBreached) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-300 bg-rose-950/70 px-2.5 py-0.5 rounded-full border border-rose-500/40 animate-pulse">
        <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
        BREACHED (+{timeLeft.hours}h {timeLeft.minutes}m)
      </span>
    );
  }

  const isUrgent = timeLeft.hours < 6;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded border ${
        isUrgent
          ? 'bg-amber-950/50 text-amber-300 border-amber-500/30 font-semibold'
          : 'bg-slate-800 text-slate-300 border-slate-700'
      }`}
    >
      <Clock className={`w-3 h-3 ${isUrgent ? 'text-amber-400' : 'text-slate-400'}`} />
      {timeLeft.hours}h {timeLeft.minutes}m remaining
    </span>
  );
};
