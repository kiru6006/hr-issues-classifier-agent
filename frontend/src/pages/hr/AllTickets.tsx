import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ticketService, TicketDetail } from '../../services/tickets';
import { TicketCard } from '../../components/TicketCard';
import { Search, Filter, RefreshCw, Layers } from 'lucide-react';

export const AllTickets: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const navigate = useNavigate();

  const { data: tickets = [], isLoading, refetch } = useQuery<TicketDetail[]>({
    queryKey: ['all-hr-tickets', statusFilter, riskFilter],
    queryFn: () => ticketService.getAllHRTickets(statusFilter || undefined, riskFilter || undefined),
  });

  const filtered = tickets.filter((t) => {
    return (
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.classification?.primary_category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <Layers className="w-6 h-6 text-teal-400" />
            Enterprise Grievance Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete organization-wide grievance repository with full audit trail and status tracking.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets, employee, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="classified">Classified</option>
            <option value="reviewed">Reviewed</option>
            <option value="routed">Routed</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="reopened">Reopened</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 glass-panel rounded-xl animate-pulse">
          Loading enterprise tickets...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800 text-xs text-slate-400">
          No tickets found matching current query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              onClick={() => navigate(`/employee/tickets/${t.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
