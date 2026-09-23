import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database.db import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="employee", nullable=False) # employee, hr_reviewer, hr_resolver, legal, hr_lead, admin
    department = Column(String(100), nullable=True)
    team = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # DPDP Compliance
    consent_to_store = Column(Boolean, default=False)
    consent_timestamp = Column(DateTime, nullable=True)

    # Relationships
    tickets = relationship("Ticket", back_populates="creator", foreign_keys="Ticket.created_by_id")
    audit_logs = relationship("AuditLog", back_populates="user")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    employee_id = Column(String(50), nullable=False, index=True)
    submission_type = Column(String(50), default="form") # email, form, slack, support_ticket, exit_interview
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    attachments = Column(JSON, default=list) # [{filename, url, mimetype, size}]
    is_anonymous = Column(Boolean, default=False)
    status = Column(String(50), default="new", index=True) # new, classified, reviewed, routed, in_progress, resolved, reopened, escalated
    risk_level = Column(String(50), default="low", index=True) # low, medium, high, critical
    legal_hold = Column(Boolean, default=False)
    is_pattern_flag = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # SLA metadata
    sla_hours = Column(Integer, default=72)
    sla_deadline = Column(DateTime, nullable=True)
    escalation_level = Column(Integer, default=0) # 0=normal, 1=50%, 2=75%, 3=90%, 4=breached

    # Resolution
    resolved_at = Column(DateTime, nullable=True)
    resolved_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    employee_confirmation = Column(String(50), default="pending") # pending, confirmed, disputed
    employee_feedback_score = Column(Integer, nullable=True) # 1-5 stars
    employee_feedback_text = Column(Text, nullable=True)

    # DPDP & Audit
    created_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    data_minimized = Column(Boolean, default=False) # True if anonymized for erasure

    # Relationships
    creator = relationship("User", back_populates="tickets", foreign_keys=[created_by_id])
    resolver = relationship("User", foreign_keys=[resolved_by_id])
    classification = relationship("Classification", back_populates="ticket", uselist=False, cascade="all, delete-orphan")
    routings = relationship("Routing", back_populates="ticket", cascade="all, delete-orphan")
    embedding = relationship("TicketEmbedding", back_populates="ticket", uselist=False, cascade="all, delete-orphan")


class Classification(Base):
    __tablename__ = "classifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), unique=True, nullable=False)
    primary_category = Column(String(100), nullable=False)
    primary_confidence = Column(Float, default=0.0)
    secondary_categories = Column(JSON, default=list) # [{"category": str, "confidence": float}]
    reasoning = Column(Text, nullable=True)
    risk_keywords = Column(JSON, default=list) # ["harassment", "retaliation", "legal", "safety"]
    requires_manual_review = Column(Boolean, default=False)
    classified_at = Column(DateTime, default=datetime.utcnow)
    classified_by_id = Column(String(36), ForeignKey("users.id"), nullable=True) # NULL if AI-only
    classifier_override = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)

    # Relationships
    ticket = relationship("Ticket", back_populates="classification")
    classified_by = relationship("User", foreign_keys=[classified_by_id])


class Routing(Base):
    __tablename__ = "routings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    assigned_to_team = Column(String(100), nullable=False) # payroll, benefits, learning, relations, legal, leadership, workplace_safety
    assigned_to_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    routing_reason = Column(String(255), nullable=True)
    routing_confidence = Column(Float, default=0.85)
    predicted_resolution_time = Column(Integer, default=48) # hours
    routed_at = Column(DateTime, default=datetime.utcnow)
    routed_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)

    # Relationships
    ticket = relationship("Ticket", back_populates="routings")
    assigned_user = relationship("User", foreign_keys=[assigned_to_user_id])
    routed_by = relationship("User", foreign_keys=[routed_by_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False, index=True) # viewed_ticket, classified, overrode, resolved, escalated, anonymized, submitted
    ticket_id = Column(String(36), nullable=True, index=True)
    resource_type = Column(String(50), nullable=True) # ticket, classification, routing, user, dpdp
    resource_id = Column(String(36), nullable=True)
    changes = Column(JSON, default=dict) # {"before": ..., "after": ...}
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    ip_address = Column(String(50), nullable=True)

    # Relationship
    user = relationship("User", back_populates="audit_logs")


class Pattern(Base):
    __tablename__ = "patterns"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    category = Column(String(100), nullable=False)
    issue_type = Column(String(255), nullable=False)
    ticket_ids = Column(JSON, default=list) # list of UUID strings
    similarity_score = Column(Float, default=0.0)
    cluster_size = Column(Integer, default=0)
    time_window_days = Column(Integer, default=7)
    flagged_at = Column(DateTime, default=datetime.utcnow)
    flagged_by = Column(String(50), default="system") # system or user_id
    investigation_status = Column(String(50), default="pending") # pending, investigating, resolved, closed
    investigation_notes = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)


class TicketEmbedding(Base):
    __tablename__ = "ticket_embeddings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("tickets.id", ondelete="CASCADE"), unique=True, nullable=False)
    embedding = Column(JSON, nullable=False) # 384-dimensional vector stored as JSON array for universal DB compatibility
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    ticket = relationship("Ticket", back_populates="embedding")


class SLARule(Base):
    __tablename__ = "sla_rules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    risk_level = Column(String(50), unique=True, nullable=False) # critical, high, medium, low
    sla_hours = Column(Integer, nullable=False)
    escalation_role = Column(String(50), default="hr_lead")
    description = Column(String(255), nullable=True)
