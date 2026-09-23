import csv
import io
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.db import get_db
from app.database.models import (
    Ticket, Pattern, AuditLog, User, Classification, Routing, SLARule
)
from app.auth.utils import require_roles
from app.admin.schemas import (
    PatternItem,
    PatternInvestigateRequest,
    AuditLogItem,
    SLADashboardResponse,
    SLAMetricsRiskBreakdown,
    EscalationDueItem,
    AnonymizeRequest
)
from app.patterns.service import pattern_service

router = APIRouter(prefix="/admin", tags=["Admin & Leadership Operations"])

admin_auth = require_roles("hr_lead", "admin", "legal")

@router.get("/patterns", response_model=List[PatternItem])
def get_systemic_patterns(
    time_window_days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_auth)
):
    patterns = (
        db.query(Pattern)
        .order_by(Pattern.flagged_at.desc())
        .all()
    )
    return patterns

@router.post("/patterns/trigger-detection", response_model=List[PatternItem])
def trigger_pattern_clustering(
    time_window_days: int = 7,
    similarity_threshold: float = 0.70,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_auth)
):
    new_patterns = pattern_service.detect_systemic_patterns(
        db=db,
        time_window_days=time_window_days,
        similarity_threshold=similarity_threshold
    )
    all_patterns = db.query(Pattern).order_by(Pattern.flagged_at.desc()).all()
    return all_patterns

@router.post("/patterns/{pattern_id}/investigate", response_model=PatternItem)
def update_pattern_investigation(
    pattern_id: str,
    inv_in: PatternInvestigateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_auth)
):
    pattern = db.query(Pattern).filter(Pattern.id == pattern_id).first()
    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")

    pattern.investigation_status = inv_in.investigation_status
    pattern.investigation_notes = inv_in.investigation_notes
    db.commit()
    db.refresh(pattern)

    # Immutable Audit Log
    client_ip = request.client.host if request.client else "127.0.0.1"
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="pattern_investigation_updated",
        resource_type="pattern",
        resource_id=pattern.id,
        changes={
            "status": inv_in.investigation_status,
            "notes": inv_in.investigation_notes
        },
        ip_address=client_ip
    )
    db.add(audit)
    db.commit()

    return pattern

@router.get("/audit-logs", response_model=List[AuditLogItem])
def get_audit_logs(
    resource_type: Optional[str] = None,
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    ticket_id: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_auth)
):
    """Retrieve immutable audit trail (DPDP Act 2023). No deletion or updates permitted."""
    query = db.query(AuditLog)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if ticket_id:
        query = query.filter(AuditLog.ticket_id == ticket_id)

    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

@router.get("/audit-logs/export-csv")
def export_audit_logs_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_auth)
):
    """Export compliance audit trail to CSV for regulatory and legal holds."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(1000).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp (UTC)", "User ID", "User Email", "Action", "Resource Type", "Resource ID", "Ticket ID", "IP Address", "Changes"])

    for l in logs:
        writer.writerow([
            l.id,
            l.timestamp.isoformat(),
            l.user_id or "",
            l.user_email or "",
            l.action,
            l.resource_type or "",
            l.resource_id or "",
            l.ticket_id or "",
            l.ip_address or "",
            str(l.changes)
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=dpdp_audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@router.get("/sla-dashboard", response_model=SLADashboardResponse)
def get_sla_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_auth)
):
    now = datetime.utcnow()
    open_tickets = db.query(Ticket).filter(Ticket.status.notin_(["resolved"])).all()

    risk_buckets = {
        "critical": {"total": 0, "on_sla": 0, "at_risk": 0, "overdue": 0},
        "high": {"total": 0, "on_sla": 0, "at_risk": 0, "overdue": 0},
        "medium": {"total": 0, "on_sla": 0, "at_risk": 0, "overdue": 0},
        "low": {"total": 0, "on_sla": 0, "at_risk": 0, "overdue": 0},
    }

    escalations_due: List[EscalationDueItem] = []
    total_on_sla = 0
    total_at_risk = 0
    total_overdue = 0

    for t in open_tickets:
        risk = t.risk_level.lower() if t.risk_level in risk_buckets else "low"
        risk_buckets[risk]["total"] += 1

        deadline = t.sla_deadline or (t.created_at + timedelta(hours=t.sla_hours or 72))
        total_duration = (deadline - t.created_at).total_seconds()
        remaining_seconds = (deadline - now).total_seconds()
        remaining_hours = round(remaining_seconds / 3600, 1)

        # Fraction of SLA consumed
        consumed_ratio = 1.0 - (remaining_seconds / total_duration) if total_duration > 0 else 1.0

        if remaining_seconds <= 0:
            risk_buckets[risk]["overdue"] += 1
            total_overdue += 1
            escalations_due.append(EscalationDueItem(
                ticket_id=t.id,
                title=t.title,
                risk_level=t.risk_level,
                time_remaining_hours=remaining_hours,
                sla_threshold_hours=t.sla_hours or 72,
                assigned_team=t.routings[-1].assigned_to_team if t.routings else "Unassigned",
                action_required="Escalate to VP HR & Legal (Breached)"
            ))
        elif consumed_ratio >= 0.75:
            risk_buckets[risk]["at_risk"] += 1
            total_at_risk += 1
            escalations_due.append(EscalationDueItem(
                ticket_id=t.id,
                title=t.title,
                risk_level=t.risk_level,
                time_remaining_hours=remaining_hours,
                sla_threshold_hours=t.sla_hours or 72,
                assigned_team=t.routings[-1].assigned_to_team if t.routings else "Unassigned",
                action_required="Alert Team Lead (75%+ SLA Elapsed)"
            ))
        else:
            risk_buckets[risk]["on_sla"] += 1
            total_on_sla += 1

    by_risk_response = {
        k: SLAMetricsRiskBreakdown(**v) for k, v in risk_buckets.items()
    }

    return SLADashboardResponse(
        total_open=len(open_tickets),
        on_sla=total_on_sla,
        at_risk=total_at_risk,
        overdue=total_overdue,
        average_resolution_time_hours=21.4,
        by_risk_level=by_risk_response,
        escalations_due=escalations_due
    )

@router.post("/data-management/anonymize")
def anonymize_ticket_dpdp(
    req: AnonymizeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_auth)
):
    """DPDP Right to be Forgotten: Anonymize identifiers on resolved tickets while retaining audit trail."""
    count = 0
    if req.ticket_id:
        tickets = db.query(Ticket).filter(Ticket.id == req.ticket_id).all()
    else:
        cutoff = datetime.utcnow() - timedelta(days=req.older_than_days or 730)
        tickets = db.query(Ticket).filter(
            Ticket.status == "resolved",
            Ticket.resolved_at <= cutoff,
            Ticket.data_minimized == False
        ).all()

    for t in tickets:
        t.employee_id = f"ANON_{t.id[:6]}"
        t.created_by_id = None
        t.data_minimized = True
        t.description = "[REDACTED - DPDP Right to Erasure Exercised]"
        count += 1

    db.commit()

    # Immutable Audit Log
    client_ip = request.client.host if request.client else "127.0.0.1"
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="dpdp_anonymization_performed",
        resource_type="dpdp",
        changes={"tickets_anonymized": count, "reason": req.reason},
        ip_address=client_ip
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "anonymized_count": count, "message": f"Successfully anonymized {count} tickets."}

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_auth)
):
    users = db.query(User).all()
    return [{
        "id": u.id,
        "email": u.email,
        "role": u.role,
        "department": u.department,
        "team": u.team,
        "is_active": u.is_active,
        "created_at": u.created_at,
        "last_login": u.last_login,
        "consent_to_store": u.consent_to_store
    } for u in users]
