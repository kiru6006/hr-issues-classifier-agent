from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ClassificationOverrideRequest(BaseModel):
    primary_category: str
    override_reason: str = Field(min_length=3)

class RouteTicketRequest(BaseModel):
    assigned_to_team: str
    assigned_to_user_id: Optional[str] = None
    routing_reason: str = Field(min_length=3)

class ResolveTicketRequest(BaseModel):
    resolution_notes: str = Field(min_length=5)
    investigation_complete: bool = True

class ReviewQueueTicketItem(BaseModel):
    ticket_id: str
    employee_id: str
    title: str
    submission_type: str
    status: str
    risk_level: str
    legal_hold: bool
    is_pattern_flag: bool
    primary_category: Optional[str] = None
    primary_confidence: Optional[float] = None
    reasoning: Optional[str] = None
    risk_keywords: List[str] = []
    requires_manual_review: bool
    sla_hours: Optional[int] = None
    sla_deadline: Optional[datetime] = None
    created_at: datetime

class ReviewQueueResponse(BaseModel):
    pending_count: int
    high_risk_count: int
    overdue_sla_count: int
    tickets: List[ReviewQueueTicketItem]

class HRDashboardKPIs(BaseModel):
    pending_review_count: int
    high_risk_count: int
    overdue_sla_count: int
    total_open_count: int
    resolved_count: int
    avg_resolution_hours: float
    categories_distribution: List[Dict[str, Any]]
    risk_distribution: List[Dict[str, Any]]
    status_distribution: List[Dict[str, Any]]
