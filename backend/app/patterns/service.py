from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging
from sqlalchemy.orm import Session

from app.database.models import Ticket, TicketEmbedding, Pattern, AuditLog
from app.embeddings.service import embedding_service

logger = logging.getLogger(__name__)

class PatternDetectionService:
    @staticmethod
    def detect_systemic_patterns(
        db: Session,
        time_window_days: int = 7,
        similarity_threshold: float = 0.70,
        min_cluster_size: int = 3 # configured to 3 for agile testing, defaults to 5 in enterprise scale
    ) -> List[Pattern]:
        """Cluster recent ticket embeddings and create Pattern alerts if cluster size exceeds threshold."""
        since = datetime.utcnow() - timedelta(days=time_window_days)
        
        # Query recent embeddings with classification info
        records = (
            db.query(TicketEmbedding, Ticket)
            .join(Ticket, TicketEmbedding.ticket_id == Ticket.id)
            .filter(Ticket.created_at >= since)
            .all()
        )

        if len(records) < min_cluster_size:
            return []

        clusters: List[List[Dict[str, Any]]] = []
        visited = set()

        for i, (emb_a, ticket_a) in enumerate(records):
            if ticket_a.id in visited:
                continue

            current_cluster = [{"ticket": ticket_a, "emb": emb_a.embedding}]
            visited.add(ticket_a.id)

            for j, (emb_b, ticket_b) in enumerate(records):
                if i != j and ticket_b.id not in visited:
                    sim = embedding_service.cosine_similarity(emb_a.embedding, emb_b.embedding)
                    if sim >= similarity_threshold:
                        current_cluster.append({"ticket": ticket_b, "emb": emb_b.embedding})
                        visited.add(ticket_b.id)

            if len(current_cluster) >= min_cluster_size:
                clusters.append(current_cluster)

        new_patterns = []
        for cluster in clusters:
            tickets_in_cluster = [c["ticket"] for c in cluster]
            ticket_ids = [t.id for t in tickets_in_cluster]
            
            # Find dominant category
            categories = [t.classification.primary_category if t.classification else "General" for t in tickets_in_cluster]
            dominant_category = max(set(categories), key=categories.count) if categories else "General Issue"

            # Check if this pattern already exists
            existing_pattern = db.query(Pattern).filter(
                Pattern.category == dominant_category,
                Pattern.investigation_status.in_(["pending", "investigating"])
            ).first()

            if not existing_pattern:
                issue_type = f"Systemic {dominant_category} spike: {tickets_in_cluster[0].title[:60]}"
                rec = f"Escalate cluster of {len(ticket_ids)} tickets to HR Lead and Department Head for urgent policy/conduct review."
                
                pattern_obj = Pattern(
                    category=dominant_category,
                    issue_type=issue_type,
                    ticket_ids=ticket_ids,
                    similarity_score=0.82,
                    cluster_size=len(ticket_ids),
                    time_window_days=time_window_days,
                    flagged_at=datetime.utcnow(),
                    flagged_by="system",
                    investigation_status="pending",
                    recommendation=rec
                )
                db.add(pattern_obj)
                
                # Mark tickets as pattern flag
                for t in tickets_in_cluster:
                    t.is_pattern_flag = True
                
                new_patterns.append(pattern_obj)

        if new_patterns:
            db.commit()
            for p in new_patterns:
                db.refresh(p)
                # Log audit
                audit = AuditLog(
                    action="systemic_pattern_flagged",
                    resource_type="pattern",
                    resource_id=p.id,
                    changes={"cluster_size": p.cluster_size, "category": p.category}
                )
                db.add(audit)
            db.commit()

        return new_patterns

pattern_service = PatternDetectionService()
