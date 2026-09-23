from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class PatternItem(BaseModel):
    id: str
    category: str
    issue_type: str
    ticket_ids: List[str]
    similarity_score: float
    cluster_size: int
    time_window_days: int
    flagged_at: datetime
    flagged_by: str
    investigation_status: str
    investigation_notes: Optional[str] = None
    recommendation: Optional[str] = None

    class Config:
        from_attributes = True

class PatternInvestigateRequest(BaseModel):
    investigation_status: str # pending, investigating, resolved, closed
    investigation_notes: str

class AuditLogItem(BaseModel):
    id: str
    timestamp: datetime
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    ticket_id: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    changes: Dict[str, Any] = {}
    ip_address: Optional[str] = None

    class Config:
        from_attributes = True

class SLAMetricsRiskBreakdown(BaseModel):
    total: int
    on_sla: int
    at_risk: int
    overdue: int

class EscalationDueItem(BaseModel):
    ticket_id: str
    title: str
    risk_level: str
    time_remaining_hours: float
    sla_threshold_hours: int
    assigned_team: Optional[str] = None
    action_required: str

class SLADashboardResponse(BaseModel):
    total_open: int
    on_sla: int
    at_risk: int
    overdue: int
    average_resolution_time_hours: float
    by_risk_level: Dict[str, SLAMetricsRiskBreakdown]
    escalations_due: List[EscalationDueItem]

class AnonymizeRequest(BaseModel):
    ticket_id: Optional[str] = None
    older_than_days: Optional[int] = 730 # 2 years default per DPDP Act
    reason: str = "DPDP Right to be Forgotten Request"
