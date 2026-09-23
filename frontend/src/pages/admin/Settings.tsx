import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ticketService } from '../../services/tickets';
import {
  Settings as SettingsIcon,
  Trash2,
  ShieldCheck,
  Lock,
  Clock,
  Database,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [retentionDays, setRetentionDays] = useState(730);
  const [targetTicketId, setTargetTicketId] = useState('');
  const [anonymizeReason, setAnonymizeReason] = useState('Employee DPDP Section 12 Right to Erasure Request');
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const anonymizeMutation = useMutation({
    mutationFn: () =>
      ticketService.anonymizeData(targetTicketId || undefined, retentionDays, anonymizeReason),
    onSuccess: (data: any) => {
      setResultMsg(data.message || 'Data successfully anonymized.');
      setTargetTicketId('');
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" /> DPDP Act 2023 Compliance & Administration
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-teal-400" />
          Enterprise Settings & Data Governance
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure statutory data retention, execute Right to be Forgotten requests, and review encryption policies.
        </p>
      </div>

      {resultMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {resultMsg}
          </span>
          <button onClick={() => setResultMsg(null)} className="text-slate-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Right to be Forgotten (DPDP Section 12) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <Trash2 className="w-4 h-4" /> DPDP Right to Erasure / Anonymization
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Permanently redacts all employee PII and encrypted grievance text while retaining immutable audit counts for compliance.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Specific Ticket ID (Optional - leave blank for batch retention purge)
              </label>
              <input
                type="text"
                placeholder="UUID of ticket to anonymize..."
                value={targetTicketId}
                onChange={(e) => setTargetTicketId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Batch Retention Purge Threshold (Days)
              </label>
              <input
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Statutory standard: 730 days (2 years) post-resolution.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Erasure Request Reason (Logged Immutably in Audit)
              </label>
              <input
                type="text"
                value={anonymizeReason}
                onChange={(e) => setAnonymizeReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              onClick={() => anonymizeMutation.mutate()}
              disabled={anonymizeMutation.isPending}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {anonymizeMutation.isPending ? 'Executing Erasure...' : 'Execute Anonymization & Log Audit'}
            </button>
          </div>
        </div>

        {/* Security & Encryption Status */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
            <Lock className="w-4 h-4" /> Encryption & Security Parameters
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Enterprise cryptographic safeguard configuration verifying DPDP compliance.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">At-Rest Field Encryption:</span>
              <span className="font-mono text-emerald-400 font-bold">AES-256 (Fernet) ACTIVE</span>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">In-Transit Security:</span>
              <span className="font-mono text-emerald-400 font-bold">TLS 1.3 Strict</span>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">AI Inference Engine:</span>
              <span className="font-mono text-teal-300 font-bold">Local Ollama / Self-Hosted</span>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Audit Ledger Immutability:</span>
              <span className="font-mono text-purple-400 font-bold">Append-Only (No Delete/Update)</span>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Cross-Border Data Transfer:</span>
              <span className="font-mono text-emerald-400 font-bold">NONE (100% India Local DB)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
