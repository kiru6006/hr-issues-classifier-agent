from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class Attachment(BaseModel):
    filename: str
    url: str
    mimetype: Optional[str] = None
    size: Optional[int] = None

class TicketSubmit(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=5)
    submission_type: str = "form" # email, form, slack, support_ticket, exit_interview
    is_anonymous: bool = False
    attachments: List[Attachment] = []
    dpdp_consent: bool = True

class ConfirmationSubmit(BaseModel):
    resolved: bool # True if confirmed, False if disputed (reopens)
    feedback_score: Optional[int] = Field(None, ge=1, le=5)
    feedback_text: Optional[str] = None

class ClassificationSummary(BaseModel):
    primary_category: str
    primary_confidence: float
    secondary_categories: List[Dict[str, Any]] = []
    reasoning: Optional[str] = None
    risk_keywords: List[str] = []
    requires_manual_review: bool = False
    classifier_override: bool = False
    override_reason: Optional[str] = None

class RoutingSummary(BaseModel):
    assigned_to_team: str
    assigned_to_user_name: Optional[str] = None
    routing_reason: Optional[str] = None
    routing_confidence: Optional[float] = None
    predicted_resolution_time: Optional[int] = None
    routed_at: Optional[datetime] = None

class TicketStatusTimelineItem(BaseModel):
    status: str
    timestamp: datetime
    description: str

class TicketResponse(BaseModel):
    id: str
    employee_id: str
    submission_type: str
    title: str
    description: str
    attachments: List[Any] = []
    is_anonymous: bool
    status: str
    risk_level: str
    legal_hold: bool
    is_pattern_flag: bool
    created_at: datetime
    updated_at: datetime
    sla_hours: Optional[int] = None
    sla_deadline: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    employee_confirmation: str
    employee_feedback_score: Optional[int] = None
    employee_feedback_text: Optional[str] = None
    
    classification: Optional[ClassificationSummary] = None
    routing: Optional[RoutingSummary] = None
    timeline: List[TicketStatusTimelineItem] = []

    class Config:
        from_attributes = True

class TicketSubmitResponse(BaseModel):
    ticket_id: str
    status: str
    risk_level: str
    confirmation_message: str
    primary_category: Optional[str] = None
    requires_manual_review: bool = False
