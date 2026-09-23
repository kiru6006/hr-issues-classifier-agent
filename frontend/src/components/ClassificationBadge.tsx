import React from 'react';
import { ConfidenceBar } from './ConfidenceBar';
import { Sparkles, Edit3 } from 'lucide-react';

interface ClassificationBadgeProps {
  primaryCategory: string;
  confidence?: number;
  secondaryCategories?: Array<{ category: string; confidence: number }>;
  isOverride?: boolean;
  requiresReview?: boolean;
}

export const ClassificationBadge: React.FC<ClassificationBadgeProps> = ({
  primaryCategory,
  confidence = 0.85,
  secondaryCategories = [],
  isOverride = false,
  requiresReview = false,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-teal-950/60 text-teal-300 border border-teal-500/30">
          {isOverride ? (
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          )}
          {primaryCategory}
        </span>
        {confidence !== undefined && <ConfidenceBar score={confidence} />}
        {requiresReview && (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Manual Review Req
          </span>
        )}
      </div>

      {secondaryCategories.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pl-1">
          <span>Secondary:</span>
          {secondaryCategories.map((sec, idx) => (
            <span key={idx} className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
              {sec.category} ({Math.round(sec.confidence * 100)}%)
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
