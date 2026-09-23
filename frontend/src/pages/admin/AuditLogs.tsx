import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketService, AuditLogItem } from '../../services/tickets';
import {
  Lock,
  Download,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  Calendar,
  User,
  Database
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [resourceType, setResourceType] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logs = [], isLoading, refetch } = useQuery<AuditLogItem[]>({
    queryKey: ['admin-audit-logs', resourceType, actionFilter],
    queryFn: () => ticketService.getAuditLogs(resourceType || undefined, actionFilter || undefined),
  });

  const filteredLogs = logs.filter((l) => {
    return (
      (l.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.ticket_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30 mb-2">
            <Lock className="w-3.5 h-3.5" /> Immutable Audit Ledger (DPDP Act 2023)
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-purple-400" />
            Compliance & System Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Permanent, append-only record of all ticket access, AI classifications, manual overrides, and routing events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href="http://localhost:8000/api/v1/admin/audit-logs/export-csv"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-btn text-white text-xs font-semibold shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit Ledger (CSV)
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by email, action, or ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Resource Types</option>
            <option value="ticket">Ticket</option>
            <option value="classification">Classification</option>
            <option value="routing">Routing</option>
            <option value="user">User</option>
            <option value="pattern">Pattern</option>
            <option value="dpdp">DPDP Erasure</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Actions</option>
            <option value="ticket_submitted">ticket_submitted</option>
            <option value="classification_override">classification_override</option>
            <option value="ticket_routed">ticket_routed</option>
            <option value="ticket_resolved">ticket_resolved</option>
            <option value="user_logged_in">user_logged_in</option>
            <option value="systemic_pattern_flagged">systemic_pattern_flagged</option>
            <option value="dpdp_anonymization_performed">dpdp_anonymization_performed</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Timestamp (UTC)</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Resource</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4">State Delta / Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading immutable ledger...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-200 block">
                        {log.user_email || 'System Agent'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 text-teal-300 border border-teal-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                      <span className="capitalize">{log.resource_type || 'N/A'}</span>
                      {log.ticket_id && (
                        <span className="font-mono text-[10px] text-slate-500 block">
                          #{log.ticket_id.slice(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <pre className="text-[10px] font-mono bg-slate-950 p-1.5 rounded border border-slate-900 text-slate-400 overflow-x-auto">
                        {JSON.stringify(log.changes || {})}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
