import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService, PatternItem } from '../../services/tickets';
import {
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const Patterns: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedPattern, setSelectedPattern] = useState<PatternItem | null>(null);
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [investigationStatus, setInvestigationStatus] = useState('investigating');
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

  const { data: patterns = [], isLoading, refetch } = useQuery<PatternItem[]>({
    queryKey: ['admin-patterns'],
    queryFn: ticketService.getPatterns,
  });

  const triggerMutation = useMutation({
    mutationFn: ticketService.triggerPatternClustering,
    onSuccess: (updated) => {
      queryClient.setQueryData(['admin-patterns'], updated);
      setTriggerMessage(`Batch clustering complete! Detected ${updated.length} systemic pattern clusters.`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      ticketService.investigatePattern(selectedPattern!.id, investigationStatus, investigationNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-patterns'] });
      setTriggerMessage('Pattern investigation status updated successfully.');
      setSelectedPattern(null);
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-300 border border-orange-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Embedding Clustering Engine (Use Case 4)
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <Layers className="w-7 h-7 text-orange-400" />
            Systemic Pattern & Cluster Alerts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Detects organizational hotspots when ≥3 similar grievance embeddings cluster within a 7-day window.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending}
            className="px-4 py-2.5 rounded-xl gradient-btn text-white text-xs font-semibold shadow-md flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${triggerMutation.isPending ? 'animate-spin' : ''}`} />
            {triggerMutation.isPending ? 'Clustering Embeddings...' : 'Run Clustering Scan Now'}
          </button>
        </div>
      </div>

      {triggerMessage && (
        <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs text-teal-300 flex items-center justify-between">
          <span>{triggerMessage}</span>
          <button onClick={() => setTriggerMessage(null)} className="text-slate-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Pattern Cluster Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 glass-panel rounded-2xl animate-pulse">
          Analyzing pgvector cosine clusters...
        </div>
      ) : patterns.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-teal-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">No Systemic Hotspots Detected</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Grievances are currently isolated without dense embedding clusters exceeding the similarity threshold (0.70).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {patterns.map((p) => (
            <div
              key={p.id}
              className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 relative overflow-hidden group hover:border-orange-500/40 transition-all shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-orange-950/70 text-orange-300 border border-orange-500/30 font-bold">
                    Cluster #{p.id.slice(0, 8)} • {p.category}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-orange-300 transition-colors">
                    {p.issue_type}
                  </h3>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                    p.investigation_status === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : p.investigation_status === 'investigating'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {p.investigation_status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Cluster Size</span>
                  <span className="font-extrabold text-white text-sm">{p.cluster_size} Tickets</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Cosine Similarity</span>
                  <span className="font-mono font-bold text-teal-300 text-sm">{Math.round(p.similarity_score * 100)}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Time Window</span>
                  <span className="font-medium text-slate-300 text-xs">{p.time_window_days} Days</span>
                </div>
              </div>

              {p.recommendation && (
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                  <strong className="text-orange-300 block mb-0.5">AI Systemic Recommendation:</strong>
                  {p.recommendation}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                <span>Detected: {new Date(p.flagged_at).toLocaleDateString()}</span>
                <button
                  onClick={() => {
                    setSelectedPattern(p);
                    setInvestigationStatus(p.investigation_status || 'investigating');
                    setInvestigationNotes(p.investigation_notes || '');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1"
                >
                  Investigate Hotspot →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Pattern Investigation (Use Case 10) */}
      {selectedPattern && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-orange-400" /> Systemic Hotspot Investigation (Use Case 10)
              </h3>
              <button onClick={() => setSelectedPattern(null)} className="text-slate-400 hover:text-white text-base">
                ×
              </button>
            </div>

            <div className="text-xs space-y-2">
              <span className="font-bold text-slate-200">{selectedPattern.issue_type}</span>
              <p className="text-slate-400">
                Cluster of {selectedPattern.cluster_size} tickets with {Math.round(selectedPattern.similarity_score * 100)}% semantic cosine similarity.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Investigation Status
                </label>
                <select
                  value={investigationStatus}
                  onChange={(e) => setInvestigationStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="pending">Pending Review</option>
                  <option value="investigating">Formal Investigation Active (Legal Hold)</option>
                  <option value="resolved">Systemic Policy Remediation Applied</option>
                  <option value="closed">Closed / False Alarm</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Investigation Notes & Leadership Action Plan *
                </label>
                <textarea
                  required
                  rows={4}
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  placeholder="Record findings, interview schedules, legal hold instructions, or policy corrections..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedPattern(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate()}
                className="px-4 py-1.5 rounded-lg gradient-btn text-white text-xs font-semibold shadow disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Updating...' : 'Save Case Notes & Log Audit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
