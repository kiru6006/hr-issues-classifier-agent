import io
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.database.db import get_db
from app.database.models import Ticket, User, AuditLog
from app.auth.utils import get_current_user
from app.tickets.schemas import (
    TicketSubmit,
    TicketSubmitResponse,
    TicketResponse,
    ConfirmationSubmit
)
from app.tickets.services import ticket_service
from app.middleware.encryption import encryptor

router = APIRouter(prefix="/tickets", tags=["Tickets"])

@router.post("/submit", response_model=TicketSubmitResponse, status_code=status.HTTP_201_CREATED)
async def submit_ticket(
    submission: TicketSubmit,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    if not submission.dpdp_consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DPDP Act 2023 explicit consent is required to process employee grievances."
        )

    client_ip = request.client.host if request.client else "127.0.0.1"
    ticket = await ticket_service.process_new_submission(
        db=db,
        submission=submission,
        user=current_user,
        ip_address=client_ip
    )

    expected_hours = ticket.sla_hours or 72
    confirmation_msg = f"Your grievance ticket #{ticket.id[:8]} has been received. Expected initial triage and response time: within {expected_hours} hours under our enterprise SLA."

    primary_cat = ticket.classification.primary_category if ticket.classification else "General"
    requires_review = ticket.classification.requires_manual_review if ticket.classification else False

    return TicketSubmitResponse(
        ticket_id=ticket.id,
        status=ticket.status,
        risk_level=ticket.risk_level,
        confirmation_message=confirmation_msg,
        primary_category=primary_cat,
        requires_manual_review=requires_review
    )

@router.get("/my", response_model=List[TicketResponse])
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all tickets submitted by the authenticated employee."""
    tickets = (
        db.query(Ticket)
        .filter(Ticket.created_by_id == current_user.id)
        .order_by(Ticket.created_at.desc())
        .all()
    )
    return [ticket_service.build_ticket_response(t) for t in tickets]

@router.get("/{ticket_id}/status", response_model=TicketResponse)
def get_ticket_status(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Access control: creator or HR/admin
    if current_user.role == "employee" and ticket.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this ticket")

    return ticket_service.build_ticket_response(ticket)

@router.post("/{ticket_id}/confirm-resolution", response_model=TicketResponse)
def confirm_resolution(
    ticket_id: str,
    conf_in: ConfirmationSubmit,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == "employee" and ticket.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this ticket")

    if conf_in.resolved:
        ticket.employee_confirmation = "confirmed"
        ticket.status = "resolved"
        action_name = "employee_confirmed_resolution"
    else:
        ticket.employee_confirmation = "disputed"
        ticket.status = "reopened"
        action_name = "employee_disputed_resolution"

    if conf_in.feedback_score is not None:
        ticket.employee_feedback_score = conf_in.feedback_score
    if conf_in.feedback_text:
        ticket.employee_feedback_text = conf_in.feedback_text

    db.commit()
    db.refresh(ticket)

    # Audit log
    client_ip = request.client.host if request.client else "127.0.0.1"
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action=action_name,
        ticket_id=ticket.id,
        resource_type="ticket",
        resource_id=ticket.id,
        changes={
            "resolved": conf_in.resolved,
            "status": ticket.status,
            "feedback_score": conf_in.feedback_score
        },
        ip_address=client_ip
    )
    db.add(audit)
    db.commit()

    return ticket_service.build_ticket_response(ticket)

@router.get("/{ticket_id}/export-pdf")
def export_ticket_pdf(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """DPDP Act 2023 Right to Access: Export complete ticket and audit record as PDF."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == "employee" and ticket.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Generate simple clean PDF report
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, 750, "HR AI Grievance Classification Report (DPDP Act 2023)")
    
    p.setFont("Helvetica", 10)
    p.drawString(50, 730, f"Ticket ID: {ticket.id}")
    p.drawString(50, 715, f"Date Submitted: {ticket.created_at.strftime('%Y-%m-%d %H:%M UTC')}")
    p.drawString(50, 700, f"Status: {ticket.status.upper()} | Risk Level: {ticket.risk_level.upper()}")
    
    p.line(50, 690, 550, 690)
    
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, 670, f"Title: {ticket.title}")
    
    p.setFont("Helvetica", 10)
    desc = encryptor.decrypt(ticket.description)
    p.drawString(50, 650, "Description Summary:")
    y = 635
    for line in [desc[i:i+80] for i in range(0, min(len(desc), 320), 80)]:
        p.drawString(60, y, line)
        y -= 15

    if ticket.classification:
        y -= 10
        p.setFont("Helvetica-Bold", 11)
        p.drawString(50, y, f"Classification: {ticket.classification.primary_category} ({int(ticket.classification.primary_confidence*100)}%)")
        y -= 15
        p.setFont("Helvetica", 9)
        p.drawString(50, y, f"Reasoning: {ticket.classification.reasoning or 'N/A'}")

    if ticket.resolution_notes:
        y -= 25
        p.setFont("Helvetica-Bold", 11)
        p.drawString(50, y, "Resolution Notes:")
        y -= 15
        p.setFont("Helvetica", 9)
        res_notes = encryptor.decrypt(ticket.resolution_notes)
        p.drawString(60, y, res_notes[:100])

    p.setFont("Helvetica-Oblique", 8)
    p.drawString(50, 50, "Confidential HR Record - Protected under Digital Personal Data Protection Act 2023")
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ticket_{ticket.id[:8]}.pdf"}
    )
