import React from 'react';

interface ConfidenceBarProps {
  score: number; // 0.0 to 1.0
  showLabel?: boolean;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ score, showLabel = true }) => {
  const percentage = Math.round((score || 0) * 100);

  let barColor = 'bg-emerald-500';
  if (percentage < 70) {
    barColor = 'bg-rose-500';
  } else if (percentage < 85) {
    barColor = 'bg-amber-500';
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-slate-300">{percentage}%</span>
      )}
    </div>
  );
};
