import React from 'react';
import { TimelineItem } from '../services/tickets';
import { CheckCircle2, Clock, ArrowRightCircle } from 'lucide-react';

interface StatusTimelineProps {
  timeline: TimelineItem[];
  currentStatus: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ timeline = [], currentStatus }) => {
  const steps = [
    { key: 'new', label: 'Submitted' },
    { key: 'classified', label: 'AI Classified' },
    { key: 'reviewed', label: 'HR Reviewed' },
    { key: 'routed', label: 'Team Routed' },
    { key: 'in_progress', label: 'In Investigation' },
    { key: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="py-3">
      <div className="flex items-center justify-between relative mb-6">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
        {steps.map((step, idx) => {
          const isPassed = timeline.some((t) => t.status.toLowerCase().includes(step.key));
          const isCurrent = currentStatus.toLowerCase() === step.key;

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isPassed
                    ? 'bg-teal-500 text-slate-950 ring-4 ring-slate-900'
                    : isCurrent
                    ? 'bg-indigo-500 text-white ring-4 ring-slate-900 animate-pulse'
                    : 'bg-slate-800 text-slate-500 ring-4 ring-slate-900'
                }`}
              >
                {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`text-[11px] mt-1.5 font-medium ${isPassed || isCurrent ? 'text-slate-200' : 'text-slate-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 border-l-2 border-slate-800 pl-4 ml-3">
        {timeline.map((item, idx) => (
          <div key={idx} className="relative text-xs">
            <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-teal-400 ring-4 ring-slate-900" />
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
              <span>{new Date(item.timestamp).toLocaleString()}</span>
              <span className="uppercase font-semibold text-teal-400/80">{item.status.replace('_', ' ')}</span>
            </div>
            <p className="text-slate-200 mt-0.5">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
