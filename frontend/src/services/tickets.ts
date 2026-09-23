import api from './api';

export interface Attachment {
  filename: string;
  url: string;
  mimetype?: string;
  size?: number;
}

export interface TicketSubmitPayload {
  title: string;
  description: string;
  submission_type: 'email' | 'form' | 'slack' | 'support_ticket' | 'exit_interview';
  is_anonymous: boolean;
  attachments?: Attachment[];
  dpdp_consent: boolean;
}

export interface TicketSubmitResponse {
  ticket_id: string;
  status: string;
  risk_level: string;
  confirmation_message: string;
  primary_category?: string;
  requires_manual_review: boolean;
}

export interface ClassificationSummary {
  primary_category: string;
  primary_confidence: number;
  secondary_categories: Array<{ category: string; confidence: number }>;
  reasoning?: string;
  risk_keywords: string[];
  requires_manual_review: boolean;
  classifier_override: boolean;
  override_reason?: string;
}

export interface RoutingSummary {
  assigned_to_team: string;
  assigned_to_user_name?: string;
  routing_reason?: string;
  routing_confidence?: number;
  predicted_resolution_time?: number;
  routed_at?: string;
}

export interface TimelineItem {
  status: string;
  timestamp: string;
  description: string;
}

export interface TicketDetail {
  id: string;
  employee_id: string;
  submission_type: string;
  title: string;
  description: string;
  attachments: Attachment[];
  is_anonymous: boolean;
  status: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  legal_hold: boolean;
  is_pattern_flag: boolean;
  created_at: string;
  updated_at: string;
  sla_hours?: number;
  sla_deadline?: string;
  resolved_at?: string;
  resolution_notes?: string;
  employee_confirmation: 'pending' | 'confirmed' | 'disputed';
  employee_feedback_score?: number;
  employee_feedback_text?: string;
  classification?: ClassificationSummary;
  routing?: RoutingSummary;
  timeline: TimelineItem[];
}

export interface ReviewQueueTicket {
  ticket_id: string;
  employee_id: string;
  title: string;
  submission_type: string;
  status: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  legal_hold: boolean;
  is_pattern_flag: boolean;
  primary_category?: string;
  primary_confidence?: number;
  reasoning?: string;
  risk_keywords: string[];
  requires_manual_review: boolean;
  sla_hours?: number;
  sla_deadline?: string;
  created_at: string;
}

export interface ReviewQueueResponse {
  pending_count: number;
  high_risk_count: number;
  overdue_sla_count: number;
  tickets: ReviewQueueTicket[];
}

export interface PatternItem {
  id: string;
  category: string;
  issue_type: string;
  ticket_ids: string[];
  similarity_score: number;
  cluster_size: number;
  time_window_days: number;
  flagged_at: string;
  flagged_by: string;
  investigation_status: 'pending' | 'investigating' | 'resolved' | 'closed';
  investigation_notes?: string;
  recommendation?: string;
}

export interface SLADashboardData {
  total_open: number;
  on_sla: number;
  at_risk: number;
  overdue: number;
  average_resolution_time_hours: number;
  by_risk_level: Record<string, { total: number; on_sla: number; at_risk: number; overdue: number }>;
  escalations_due: Array<{
    ticket_id: string;
    title: string;
    risk_level: string;
    time_remaining_hours: number;
    sla_threshold_hours: number;
    assigned_team?: string;
    action_required: string;
  }>;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user_id?: string;
  user_email?: string;
  action: string;
  ticket_id?: string;
  resource_type?: string;
  resource_id?: string;
  changes: Record<string, any>;
  ip_address?: string;
}

export const ticketService = {
  submit: async (payload: TicketSubmitPayload): Promise<TicketSubmitResponse> => {
    const res = await api.post<TicketSubmitResponse>('/tickets/submit', payload);
    return res.data;
  },

  getMyTickets: async (): Promise<TicketDetail[]> => {
    const res = await api.get<TicketDetail[]>('/tickets/my');
    return res.data;
  },

  getStatus: async (ticketId: string): Promise<TicketDetail> => {
    const res = await api.get<TicketDetail>(`/tickets/${ticketId}/status`);
    return res.data;
  },

  confirmResolution: async (ticketId: string, resolved: boolean, score?: number, text?: string): Promise<TicketDetail> => {
    const res = await api.post<TicketDetail>(`/tickets/${ticketId}/confirm-resolution`, {
      resolved,
      feedback_score: score,
      feedback_text: text,
    });
    return res.data;
  },

  exportPdfUrl: (ticketId: string) => {
    const token = localStorage.getItem('hr_token');
    return `/api/v1/tickets/${ticketId}/export-pdf?token=${token}`;
  },

  // HR Endpoints
  getReviewQueue: async (status?: string, risk_level?: string, category?: string): Promise<ReviewQueueResponse> => {
    const res = await api.get<ReviewQueueResponse>('/hr/review-queue', {
      params: { status, risk_level, category },
    });
    return res.data;
  },

  getHRKPIs: async () => {
    const res = await api.get('/hr/dashboard-kpis');
    return res.data;
  },

  overrideClassification: async (ticketId: string, primary_category: string, override_reason: string): Promise<TicketDetail> => {
    const res = await api.post<TicketDetail>(`/hr/classify-override/${ticketId}`, {
      primary_category,
      override_reason,
    });
    return res.data;
  },

  routeTicket: async (ticketId: string, assigned_to_team: string, routing_reason: string, assigned_to_user_id?: string): Promise<TicketDetail> => {
    const res = await api.post<TicketDetail>(`/hr/route/${ticketId}`, {
      assigned_to_team,
      assigned_to_user_id,
      routing_reason,
    });
    return res.data;
  },

  resolveTicket: async (ticketId: string, resolution_notes: string, investigation_complete = true): Promise<TicketDetail> => {
    const res = await api.post<TicketDetail>(`/hr/resolve/${ticketId}`, {
      resolution_notes,
      investigation_complete,
    });
    return res.data;
  },

  getAllHRTickets: async (status?: string, risk_level?: string): Promise<TicketDetail[]> => {
    const res = await api.get<TicketDetail[]>('/hr/tickets', {
      params: { status, risk_level },
    });
    return res.data;
  },

  // Admin Endpoints
  getPatterns: async (): Promise<PatternItem[]> => {
    const res = await api.get<PatternItem[]>('/admin/patterns');
    return res.data;
  },

  triggerPatternClustering: async (): Promise<PatternItem[]> => {
    const res = await api.post<PatternItem[]>('/admin/patterns/trigger-detection');
    return res.data;
  },

  investigatePattern: async (patternId: string, status: string, notes: string): Promise<PatternItem> => {
    const res = await api.post<PatternItem>(`/admin/patterns/${patternId}/investigate`, {
      investigation_status: status,
      investigation_notes: notes,
    });
    return res.data;
  },

  getAuditLogs: async (resource_type?: string, action?: string): Promise<AuditLogItem[]> => {
    const res = await api.get<AuditLogItem[]>('/admin/audit-logs', {
      params: { resource_type, action },
    });
    return res.data;
  },

  getSLADashboard: async (): Promise<SLADashboardData> => {
    const res = await api.get<SLADashboardData>('/admin/sla-dashboard');
    return res.data;
  },

  anonymizeData: async (ticketId?: string, olderThanDays = 730, reason = 'DPDP Right to be Forgotten') => {
    const res = await api.post('/admin/data-management/anonymize', {
      ticket_id: ticketId,
      older_than_days: olderThanDays,
      reason,
    });
    return res.data;
  },
};
