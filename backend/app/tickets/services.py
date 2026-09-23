from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.database.models import (
    Ticket, Classification, Routing, AuditLog, TicketEmbedding, User
)
from app.tickets.schemas import TicketSubmit
from app.classification.service import classification_service
from app.embeddings.service import embedding_service
from app.routing.service import routing_service
from app.patterns.service import pattern_service
from app.middleware.encryption import encryptor

class TicketService:
    @staticmethod
    async def process_new_submission(
        db: Session,
        submission: TicketSubmit,
        user: Optional[User] = None,
        ip_address: str = "127.0.0.1"
    ) -> Ticket:
        """Complete intake pipeline: ingest -> encrypt -> AI classify -> embed -> route / queue -> audit."""
        emp_id = "ANONYMOUS" if submission.is_anonymous else (user.email.split("@")[0] if user else "emp_unknown")
        user_dept = user.department if user else "General"

        # Encrypt sensitive description at rest for DPDP Act 2023 compliance
        encrypted_description = encryptor.encrypt(submission.description)

        # 1. Create initial Ticket entity
        ticket = Ticket(
            employee_id=emp_id,
            submission_type=submission.submission_type,
            title=submission.title,
            description=encrypted_description,
            attachments=[att.model_dump() for att in submission.attachments],
            is_anonymous=submission.is_anonymous,
            status="new",
            risk_level="low",
            created_by_id=user.id if user else None,
            created_at=datetime.utcnow()
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)

        # 2. Audit submission
        audit_submit = AuditLog(
            user_id=user.id if user else None,
            user_email=user.email if user else "anonymous",
            action="ticket_submitted",
            ticket_id=ticket.id,
            resource_type="ticket",
            resource_id=ticket.id,
            changes={"title": ticket.title, "submission_type": ticket.submission_type, "is_anonymous": ticket.is_anonymous},
            ip_address=ip_address
        )
        db.add(audit_submit)
        db.commit()

        # 3. AI Multi-Classification (Ollama zero-shot with fallback)
        cls_result = await classification_service.classify_ticket(
            title=submission.title,
            description=submission.description,
            submission_type=submission.submission_type,
            department=user_dept
        )

        # 4. Save Classification
        classification = Classification(
            ticket_id=ticket.id,
            primary_category=cls_result.primary_category,
            primary_confidence=cls_result.primary_confidence,
            secondary_categories=[sc.model_dump() for sc in cls_result.secondary_categories],
            reasoning=cls_result.reasoning,
            risk_keywords=cls_result.risk_keywords,
            requires_manual_review=cls_result.requires_manual_review,
            classified_at=datetime.utcnow()
        )
        db.add(classification)

        # 5. Generate and store embeddings for systemic pattern detection
        emb_vector = embedding_service.generate_embedding(f"{submission.title} {submission.description}")
        ticket_emb = TicketEmbedding(
            ticket_id=ticket.id,
            embedding=emb_vector,
            created_at=datetime.utcnow()
        )
        db.add(ticket_emb)

        # 6. Apply risk level and SLA calculations
        ticket.risk_level = cls_result.risk_level
        ticket.legal_hold = cls_result.legal_hold
        sla_hours, sla_deadline = routing_service.calculate_sla(cls_result.risk_level)
        ticket.sla_hours = sla_hours
        ticket.sla_deadline = sla_deadline

        # 7. Intelligent routing logic:
        # If low/medium risk and high confidence and no manual review required -> Auto-route
        # If high/critical risk or manual review required -> Put in HR review queue
        if not cls_result.requires_manual_review and cls_result.risk_level in ["low", "medium"] and cls_result.primary_confidence >= 0.80:
            routing_service.auto_route_ticket(
                db=db,
                ticket=ticket,
                primary_category=cls_result.primary_category,
                confidence=cls_result.primary_confidence,
                risk_level=cls_result.risk_level
            )
            ticket.status = "routed"
        else:
            ticket.status = "classified"

        db.commit()
        db.refresh(ticket)

        # 8. Check for systemic patterns asynchronously
        try:
            pattern_service.detect_systemic_patterns(db, time_window_days=7, similarity_threshold=0.70)
        except Exception as e:
            # Pattern detection error shouldn't fail the submission
            pass

        return ticket

    @staticmethod
    def build_ticket_response(ticket: Ticket) -> Dict[str, Any]:
        """Format ticket with decrypted content and full history."""
        # Decrypt sensitive fields
        decrypted_description = encryptor.decrypt(ticket.description)
        decrypted_resolution = encryptor.decrypt(ticket.resolution_notes) if ticket.resolution_notes else None

        classification_summary = None
        if ticket.classification:
            classification_summary = {
                "primary_category": ticket.classification.primary_category,
                "primary_confidence": ticket.classification.primary_confidence,
                "secondary_categories": ticket.classification.secondary_categories or [],
                "reasoning": ticket.classification.reasoning,
                "risk_keywords": ticket.classification.risk_keywords or [],
                "requires_manual_review": ticket.classification.requires_manual_review,
                "classifier_override": ticket.classification.classifier_override,
                "override_reason": ticket.classification.override_reason
            }

        latest_routing = ticket.routings[-1] if ticket.routings else None
        routing_summary = None
        if latest_routing:
            assigned_user_name = latest_routing.assigned_user.email if latest_routing.assigned_user else None
            routing_summary = {
                "assigned_to_team": latest_routing.assigned_to_team,
                "assigned_to_user_name": assigned_user_name,
                "routing_reason": latest_routing.routing_reason,
                "routing_confidence": latest_routing.routing_confidence,
                "predicted_resolution_time": latest_routing.predicted_resolution_time,
                "routed_at": latest_routing.routed_at
            }

        # Build timeline
        timeline = [
            {"status": "new", "timestamp": ticket.created_at, "description": "Ticket submitted and ingested"}
        ]
        if ticket.classification:
            timeline.append({
                "status": "classified",
                "timestamp": ticket.classification.classified_at or ticket.created_at,
                "description": f"AI classified as {ticket.classification.primary_category} ({int(ticket.classification.primary_confidence*100)}% confidence)"
            })
        if ticket.classification and ticket.classification.classifier_override:
            timeline.append({
                "status": "reviewed",
                "timestamp": ticket.classification.classified_at,
                "description": f"HR reviewer manually adjusted category: {ticket.classification.override_reason or ''}"
            })
        if latest_routing:
            timeline.append({
                "status": "routed",
                "timestamp": latest_routing.routed_at,
                "description": f"Assigned to {latest_routing.assigned_to_team.title()} Team"
            })
        if ticket.status in ["in_progress", "resolved", "reopened", "escalated"]:
            timeline.append({
                "status": ticket.status,
                "timestamp": ticket.updated_at,
                "description": f"Ticket marked as {ticket.status.replace('_', ' ')}"
            })
        if ticket.resolved_at:
            timeline.append({
                "status": "resolved",
                "timestamp": ticket.resolved_at,
                "description": "HR resolution completed"
            })
        if ticket.employee_confirmation != "pending":
            timeline.append({
                "status": f"confirmation_{ticket.employee_confirmation}",
                "timestamp": ticket.updated_at,
                "description": f"Employee {ticket.employee_confirmation} the resolution"
            })

        return {
            "id": ticket.id,
            "employee_id": ticket.employee_id,
            "submission_type": ticket.submission_type,
            "title": ticket.title,
            "description": decrypted_description,
            "attachments": ticket.attachments or [],
            "is_anonymous": ticket.is_anonymous,
            "status": ticket.status,
            "risk_level": ticket.risk_level,
            "legal_hold": ticket.legal_hold,
            "is_pattern_flag": ticket.is_pattern_flag,
            "created_at": ticket.created_at,
            "updated_at": ticket.updated_at,
            "sla_hours": ticket.sla_hours,
            "sla_deadline": ticket.sla_deadline,
            "resolved_at": ticket.resolved_at,
            "resolution_notes": decrypted_resolution,
            "employee_confirmation": ticket.employee_confirmation,
            "employee_feedback_score": ticket.employee_feedback_score,
            "employee_feedback_text": ticket.employee_feedback_text,
            "classification": classification_summary,
            "routing": routing_summary,
            "timeline": timeline
        }

ticket_service = TicketService()
