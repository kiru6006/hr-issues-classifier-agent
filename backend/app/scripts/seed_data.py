import asyncio
from datetime import datetime, timedelta
from app.database.db import SessionLocal, engine, Base
from app.database.models import User, Ticket, Classification, Routing, SLARule, AuditLog, TicketEmbedding
from app.auth.utils import get_password_hash
from app.classification.service import classification_service
from app.embeddings.service import embedding_service
from app.routing.service import routing_service
from app.patterns.service import pattern_service
from app.middleware.encryption import encryptor

def seed():
    print("Creating tables if not present...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Users
        print("Seeding users...")
        users_data = [
            {"email": "employee@company.com", "role": "employee", "department": "Engineering", "team": "Frontend"},
            {"email": "employee2@company.com", "role": "employee", "department": "Sales", "team": "Enterprise"},
            {"email": "reviewer@company.com", "role": "hr_reviewer", "department": "Human Resources", "team": "Triage"},
            {"email": "resolver@company.com", "role": "hr_resolver", "department": "Human Resources", "team": "Payroll Operations"},
            {"email": "legal@company.com", "role": "legal", "department": "Legal & Compliance", "team": "Labor Law"},
            {"email": "lead@company.com", "role": "hr_lead", "department": "Human Resources", "team": "Leadership"},
            {"email": "admin@company.com", "role": "admin", "department": "Executive", "team": "Operations"}
        ]

        user_objects = {}
        for u in users_data:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                user = User(
                    email=u["email"],
                    password_hash=get_password_hash("password123"),
                    role=u["role"],
                    department=u["department"],
                    team=u["team"],
                    consent_to_store=True,
                    consent_timestamp=datetime.utcnow()
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                user_objects[u["email"]] = user
            else:
                user_objects[u["email"]] = existing

        # 2. Seed SLA Rules
        print("Seeding SLA rules...")
        sla_defaults = [
            {"risk_level": "critical", "sla_hours": 24, "escalation_role": "hr_lead", "description": "PoSH / Harassment / Legal Holds"},
            {"risk_level": "high", "sla_hours": 72, "escalation_role": "hr_lead", "description": "Discrimination / Retaliation / Major Violations"},
            {"risk_level": "medium", "sla_hours": 168, "escalation_role": "hr_resolver", "description": "Workplace Relations / Termination Disputes"},
            {"risk_level": "low", "sla_hours": 336, "escalation_role": "hr_resolver", "description": "Payroll / Benefits / Leave Routine Inquiries"}
        ]
        for sla in sla_defaults:
            existing = db.query(SLARule).filter(SLARule.risk_level == sla["risk_level"]).first()
            if not existing:
                rule = SLARule(**sla)
                db.add(rule)
        db.commit()

        # 3. Seed Realistic Grievance Tickets
        if db.query(Ticket).count() == 0:
            print("Seeding sample grievance tickets...")
            emp1 = user_objects.get("employee@company.com")
            emp2 = user_objects.get("employee2@company.com")

            test_tickets = [
                {
                    "title": "Annual bonus payout 40% less than communicated in appraisal letter",
                    "description": "My annual performance rating was Exceeds Expectations (Level 5), but the April payroll credited only 60% of the variable bonus component without any breakdown or explanation. Please clarify arrears calculation.",
                    "submission_type": "form",
                    "is_anonymous": False,
                    "user": emp1,
                    "created_offset_hours": 36
                },
                {
                    "title": "Cashless Mediclaim hospital insurance denied for father's emergency surgery",
                    "description": "Our group health insurance provider rejected the pre-authorization cashless claim at Apollo Hospital stating dependency limit, although I had added my parents during the annual open enrollment window.",
                    "submission_type": "form",
                    "is_anonymous": False,
                    "user": emp2,
                    "created_offset_hours": 12
                },
                {
                    "title": "Repeated verbal intimidation, targeted yelling and hostile behavior by Director",
                    "description": "During sprint review meetings, Director Rajesh has repeatedly engaged in public verbal abuse, shouting, and threatening termination against junior engineers. This has created an unbearable hostile environment and severe mental health distress.",
                    "submission_type": "form",
                    "is_anonymous": True,
                    "user": None,
                    "created_offset_hours": 8
                },
                {
                    "title": "Intimidation and public humiliation by Director Rajesh during retrospective",
                    "description": "Reporting another incident of verbal abuse and aggressive desk pounding by Director Rajesh in the Bangalore office. Team members feel unsafe speaking up due to fear of retaliation.",
                    "submission_type": "form",
                    "is_anonymous": True,
                    "user": None,
                    "created_offset_hours": 6
                },
                {
                    "title": "Unwarranted project removal and hostile treatment by Director Rajesh",
                    "description": "Director Rajesh stripped my project ownership after I raised a disagreement in architecture review. Facing continuous intimidation, bullying, and exclusion from team communications.",
                    "submission_type": "form",
                    "is_anonymous": False,
                    "user": emp1,
                    "created_offset_hours": 4
                },
                {
                    "title": "Discrimination in promotion cycle based on regional and caste background",
                    "description": "Despite achieving highest sales quota in the South zone for 4 consecutive quarters, the senior manager openly favored a less qualified peer citing cultural compatibility. This is blatant discriminatory bias.",
                    "submission_type": "form",
                    "is_anonymous": False,
                    "user": emp2,
                    "created_offset_hours": 24
                },
                {
                    "title": "Maternity leave extension paperwork delayed in HR portal causing LOP",
                    "description": "Submitted doctor medical certificate for 4-week maternity leave extension 2 weeks in advance. The portal still shows Pending Approval, and my salary has been marked as Loss of Pay (LOP).",
                    "submission_type": "email",
                    "is_anonymous": False,
                    "user": emp1,
                    "created_offset_hours": 48
                }
            ]

            for item in test_tickets:
                created_time = datetime.utcnow() - timedelta(hours=item["created_offset_hours"])
                enc_desc = encryptor.encrypt(item["description"])
                emp_id = "ANONYMOUS" if item["is_anonymous"] else (item["user"].email.split("@")[0] if item["user"] else "emp_seed")

                ticket = Ticket(
                    employee_id=emp_id,
                    submission_type=item["submission_type"],
                    title=item["title"],
                    description=enc_desc,
                    is_anonymous=item["is_anonymous"],
                    created_by_id=item["user"].id if item["user"] else None,
                    created_at=created_time,
                    updated_at=created_time
                )
                db.add(ticket)
                db.commit()
                db.refresh(ticket)

                # Heuristic classification
                cls_result = classification_service._heuristic_fallback_classifier(
                    ticket.title,
                    item["description"],
                    ticket.submission_type
                )

                classification = Classification(
                    ticket_id=ticket.id,
                    primary_category=cls_result.primary_category,
                    primary_confidence=cls_result.primary_confidence,
                    secondary_categories=[sc.model_dump() for sc in cls_result.secondary_categories],
                    reasoning=cls_result.reasoning,
                    risk_keywords=cls_result.risk_keywords,
                    requires_manual_review=cls_result.requires_manual_review,
                    classified_at=created_time
                )
                db.add(classification)

                # Embedding
                emb = embedding_service.generate_embedding(f"{ticket.title} {item['description']}")
                ticket_emb = TicketEmbedding(
                    ticket_id=ticket.id,
                    embedding=emb,
                    created_at=created_time
                )
                db.add(ticket_emb)

                # Risk & SLA
                ticket.risk_level = cls_result.risk_level
                ticket.legal_hold = cls_result.legal_hold
                sla_hours, sla_deadline = routing_service.calculate_sla(cls_result.risk_level)
                ticket.sla_hours = sla_hours
                ticket.sla_deadline = created_time + timedelta(hours=sla_hours)

                if not cls_result.requires_manual_review and cls_result.risk_level in ["low", "medium"]:
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

            print("Running initial pattern clustering check...")
            pattern_service.detect_systemic_patterns(db, time_window_days=7, similarity_threshold=0.65, min_cluster_size=2)

        print("Database seeding completed successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
