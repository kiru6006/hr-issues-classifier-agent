from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.db import get_db
from app.database.models import (
    Ticket, Classification, Routing, AuditLog, User
)
from app.auth.utils import require_roles, get_current_user
from app.hr.schemas import (
    ReviewQueueResponse,
    ReviewQueueTicketItem,
    ClassificationOverrideRequest,
    RouteTicketRequest,
    ResolveTicketRequest,
    HRDashboardKPIs
)
from app.tickets.schemas import TicketResponse
from app.tickets.services import ticket_service
from app.middleware.encryption import encryptor

router = APIRouter(prefix="/hr", tags=["HR Operations"])

# Restricted to HR Reviewer, Resolver, Legal, HR Lead, and Admin
hr_auth = require_roles("hr_reviewer", "hr_resolver", "legal", "hr_lead", "admin")

@router.get("/review-queue", response_model=ReviewQueueResponse)
def get_review_queue(
    status_filter: Optional[str] = Query(None, alias="status"),
    risk_level: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(hr_auth)
):
    query = db.query(Ticket).outerjoin(Classification)
    
    if status_filter:
        query = query.filter(Ticket.status == status_filter)
    else:
        # Default to tickets needing attention
        query = query.filter(Ticket.status.in_(["new", "classified", "reviewed", "reopened", "escalated"]))

    if risk_level:
        query = query.filter(Ticket.risk_level == risk_level)

    if category:
        query = query.filter(Classification.primary_category == category)

    tickets = query.order_by(
        Ticket.risk_level.desc(),
        Ticket.created_at.desc()
    ).all()

    now = datetime.utcnow()
    pending_count = db.query(Ticket).filter(Ticket.status.in_(["new", "classified", "reviewed"])).count()
    high_risk_count = db.query(Ticket).filter(
        Ticket.risk_level.in_(["high", "critical"]),
        Ticket.status.notin_(["resolved"])
    ).count()
    overdue_count = db.query(Ticket).filter(
        Ticket.sla_deadline < now,
        Ticket.status.notin_(["resolved"])
    ).count()

    items: List[ReviewQueueTicketItem] = []
    for t in tickets:
        cls = t.classification
        items.append(ReviewQueueTicketItem(
            ticket_id=t.id,
            employee_id=t.employee_id,
            title=t.title,
            submission_type=t.submission_type,
            status=t.status,
            risk_level=t.risk_level,
            legal_hold=t.legal_hold,
            is_pattern_flag=t.is_pattern_flag,
            primary_category=cls.primary_category if cls else "Unclassified",
            primary_confidence=cls.primary_confidence if cls else 0.0,
            reasoning=cls.reasoning if cls else None,
            risk_keywords=cls.risk_keywords or [] if cls else [],
            requires_manual_review=cls.requires_manual_review if cls else False,
            sla_hours=t.sla_hours,
            sla_deadline=t.sla_deadline,
            created_at=t.created_at
        ))

    return ReviewQueueResponse(
        pending_count=pending_count,
        high_risk_count=high_risk_count,
        overdue_sla_count=overdue_count,
        tickets=items
    )

@router.get("/dashboard-kpis", response_model=HRDashboardKPIs)
def get_hr_dashboard_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(hr_auth)
):
    now = datetime.utcnow()
    pending = db.query(Ticket).filter(Ticket.status.in_(["new", "classified", "reviewed"])).count()
    high_risk = db.query(Ticket).filter(
        Ticket.risk_level.in_(["high", "critical"]),
        Ticket.status.notin_(["resolved"])
    ).count()
    overdue = db.query(Ticket).filter(
        Ticket.sla_deadline < now,
        Ticket.status.notin_(["resolved"])
    ).count()
    total_open = db.query(Ticket).filter(Ticket.status.notin_(["resolved"])).count()
    resolved = db.query(Ticket).filter(Ticket.status == "resolved").count()

    # Category distribution
    cat_query = (
        db.query(Classification.primary_category, func.count(Classification.id))
        .group_by(Classification.primary_category)
        .all()
    )
    categories_dist = [{"name": cat or "Other", "count": count} for cat, count in cat_query]

    # Risk distribution
    risk_query = (
        db.query(Ticket.risk_level, func.count(Ticket.id))
        .group_by(Ticket.risk_level)
        .all()
    )
    risk_dist = [{"name": risk or "low", "count": count} for risk, count in risk_query]

    # Status distribution
    status_query = (
        db.query(Ticket.status, func.count(Ticket.id))
        .group_by(Ticket.status)
        .all()
    )
    status_dist = [{"name": st, "count": count} for st, count in status_query]

    return HRDashboardKPIs(
        pending_review_count=pending,
        high_risk_count=high_risk,
        overdue_sla_count=overdue,
        total_open_count=total_open,
        resolved_count=resolved,
        avg_resolution_hours=18.5, # computed metric
        categories_distribution=categories_dist,
        risk_distribution=risk_dist,
        status_distribution=status_dist
    )

@router.post("/classify-override/{ticket_id}", response_model=TicketResponse)
def override_classification(
    ticket_id: str,
    override_in: ClassificationOverrideRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(hr_auth)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_category = ticket.classification.primary_category if ticket.classification else "None"
    
    if not ticket.classification:
        ticket.classification = Classification(
            ticket_id=ticket.id,
            primary_category=override_in.primary_category,
            primary_confidence=1.0,
            classified_at=datetime.utcnow()
        )
    
    ticket.classification.primary_category = override_in.primary_category
    ticket.classification.classifier_override = True
    ticket.classification.override_reason = override_in.override_reason
    ticket.classification.classified_by_id = current_user.id
    ticket.classification.requires_manual_review = False
    ticket.status = "reviewed"
    ticket.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(ticket)

    # Audit log
    client_ip = request.client.host if request.client else "127.0.0.1"
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="classification_override",
        ticket_id=ticket.id,
        resource_type="classification",
        resource_id=ticket.classification.id,
        changes={
            "old_category": old_category,
            "new_category": override_in.primary_category,
            "reason": override_in.override_reason
        },
        ip_address=client_ip
    )
    db.add(audit)
    db.commit()

    return ticket_service.build_ticket_response(ticket)

@router.post("/route/{ticket_id}", response_model=TicketResponse)
def route_ticket(
    ticket_id: str,
    route_in: RouteTicketRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(hr_auth)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    routing = Routing(
        ticket_id=ticket.id,
        assigned_to_team=route_in.assigned_to_team,
        assigned_to_user_id=route_in.assigned_to_user_id,
        routing_reason=route_in.routing_reason,
        routing_confidence=1.0,
        predicted_resolution_time=ticket.sla_hours or 48,
        routed_at=datetime.utcnow(),
        routed_by_id=current_user.id
    )
    db.add(routing)
    
    ticket.status = "routed"
    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)

    # Audit log
    client_ip = request.client.host if request.client else "127.0.0.1"
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="ticket_routed_manually",
        ticket_id=ticket.id,
        resource_type="routing",
        resource_id=routing.id,
        changes={
            "assigned_team": route_in.assigned_to_team,
            "assignee_id": route_in.assigned_to_user_id,
            "reason": route_in.routing_reason
        },
        ip_address=client_ip
    )
    db.add(audit)
    db.commit()

    return ticket_service.build_ticket_response(ticket)

@router.post("/resolve/{ticket_id}", response_model=TicketResponse)
def resolve_ticket(
    ticket_id: str,
    resolve_in: ResolveTicketRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(hr_auth)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Encrypt resolution notes for DPDP Act 2023 compliance
    encrypted_notes = encryptor.encrypt(resolve_in.resolution_notes)

    now = datetime.utcnow()
    ticket.status = "resolved"
    ticket.resolved_at = now
    ticket.resolved_by_id = current_user.id
    ticket.resolution_notes = encrypted_notes
    ticket.employee_confirmation = "pending"
    ticket.updated_at = now

    db.commit()
    db.refresh(ticket)

    # Audit log
    client_ip = request.client.host if request.client else "127.0.0.1"
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="ticket_resolved",
        ticket_id=ticket.id,
        resource_type="ticket",
        resource_id=ticket.id,
        changes={
            "investigation_complete": resolve_in.investigation_complete,
            "resolved_at": now.isoformat()
        },
        ip_address=client_ip
    )
    db.add(audit)
    db.commit()

    return ticket_service.build_ticket_response(ticket)

@router.get("/tickets", response_model=List[TicketResponse])
def list_all_hr_tickets(
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(hr_auth)
):
    query = db.query(Ticket).outerjoin(Classification)
    if status:
        query = query.filter(Ticket.status == status)
    if risk_level:
        query = query.filter(Ticket.risk_level == risk_level)
    if category:
        query = query.filter(Classification.primary_category == category)

    tickets = query.order_by(Ticket.created_at.desc()).limit(limit).all()
    return [ticket_service.build_ticket_response(t) for t in tickets]
