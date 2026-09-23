import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ticketService, TicketDetail } from '../../services/tickets';
import { TicketCard } from '../../components/TicketCard';
import { Filter, Search, FilePlus2, RefreshCw } from 'lucide-react';

export const MyTickets: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  const navigate = useNavigate();

  const { data: tickets = [], isLoading, refetch } = useQuery<TicketDetail[]>({
    queryKey: ['my-tickets'],
    queryFn: ticketService.getMyTickets,
  });

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.classification?.primary_category || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ? true : t.status === statusFilter;
    const matchesRisk = riskFilter === 'all' ? true : t.risk_level === riskFilter;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Plus_Jakarta_Sans']">
            My Submitted Grievances
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track status, AI classification, assigned resolver, and confirm resolution feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1.5"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <Link
            to="/employee/submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-btn text-white text-xs font-semibold shadow-md"
          >
            <FilePlus2 className="w-3.5 h-3.5" /> New Grievance
          </Link>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, category, or #ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="classified">Classified</option>
            <option value="routed">Routed</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 glass-panel rounded-xl animate-pulse">
          Loading grievance records...
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-300">No grievances matching your filters</p>
          <p className="text-xs text-slate-500">Try adjusting your search criteria or create a new ticket.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => navigate(`/employee/tickets/${ticket.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
