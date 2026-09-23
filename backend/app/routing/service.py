from datetime import datetime, timedelta
from typing import Tuple, Optional, Dict
from sqlalchemy.orm import Session

from app.database.models import Ticket, Routing, User, AuditLog

TEAM_MAPPING: Dict[str, str] = {
    "Payroll": "Payroll Team",
    "Leave & Attendance": "Leave & Attendance Team",
    "Benefits": "Benefits Team",
    "Policy & Compliance": "HR Policy Team",
    "Employee Relations": "Employee Relations Team",
    "Recruitment & Onboarding": "Talent Acquisition / Onboarding Team",
    "Learning & Development": "L&D Team",
    "General HR Query": "HR Helpdesk",
    "Others": "HR Helpdesk"
}

SLA_HOURS_BY_RISK: Dict[str, int] = {
    "critical": 24,
    "high": 72,
    "medium": 168, # 7 days
    "low": 336     # 14 days
}

class RoutingService:
    @staticmethod
    def get_suggested_team(primary_category: str, risk_level: str) -> str:
        if risk_level == "critical":
            return "Employee Relations Team"
        return TEAM_MAPPING.get(primary_category, "HR Helpdesk")

    @staticmethod
    def calculate_sla(risk_level: str) -> Tuple[int, datetime]:
        hours = SLA_HOURS_BY_RISK.get(risk_level.lower(), 72)
        deadline = datetime.utcnow() + timedelta(hours=hours)
        return hours, deadline

    @staticmethod
    def auto_route_ticket(
        db: Session,
        ticket: Ticket,
        primary_category: str,
        confidence: float,
        risk_level: str,
        routed_by_id: Optional[str] = None
    ) -> Routing:
        suggested_team = RoutingService.get_suggested_team(primary_category, risk_level)
        
        # Find active user in that team/department if available
        assignee = db.query(User).filter(
            User.role.in_(["hr_resolver", "hr_reviewer", "legal", "hr_lead"]),
            User.is_active == True
        ).first()

        sla_hours, sla_deadline = RoutingService.calculate_sla(risk_level)
        ticket.sla_hours = sla_hours
        ticket.sla_deadline = sla_deadline

        routing = Routing(
            ticket_id=ticket.id,
            assigned_to_team=suggested_team,
            assigned_to_user_id=assignee.id if assignee else None,
            routing_reason=f"Predictive routing based on category: {primary_category} and risk level: {risk_level}",
            routing_confidence=round(confidence, 2),
            predicted_resolution_time=min(sla_hours, 48),
            routed_at=datetime.utcnow(),
            routed_by_id=routed_by_id
        )
        db.add(routing)
        
        # Update ticket status
        ticket.status = "routed"
        db.commit()
        db.refresh(routing)

        # Add Audit log
        audit = AuditLog(
            user_id=routed_by_id,
            action="ticket_routed",
            ticket_id=ticket.id,
            resource_type="routing",
            resource_id=routing.id,
            changes={
                "assigned_team": suggested_team,
                "assignee_id": assignee.id if assignee else None,
                "sla_hours": sla_hours
            }
        )
        db.add(audit)
        db.commit()

        return routing

routing_service = RoutingService()
