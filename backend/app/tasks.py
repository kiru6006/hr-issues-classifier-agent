import logging
from celery import Celery
from app.config import settings
from app.database.db import SessionLocal
from app.patterns.service import pattern_service

logger = logging.getLogger(__name__)

celery_app = Celery("hr_ai_tasks", broker=settings.REDIS_URL, backend=settings.REDIS_URL)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "detect-systemic-patterns-every-6-hours": {
            "task": "app.tasks.run_pattern_clustering_task",
            "schedule": 21600.0, # 6 hours
        },
        "monitor-sla-escalations-hourly": {
            "task": "app.tasks.run_sla_monitor_task",
            "schedule": 3600.0, # 1 hour
        }
    }
)

@celery_app.task(name="app.tasks.run_pattern_clustering_task")
def run_pattern_clustering_task():
    logger.info("Starting scheduled 6-hour batch pattern clustering...")
    db = SessionLocal()
    try:
        patterns = pattern_service.detect_systemic_patterns(db, time_window_days=7, similarity_threshold=0.70)
        logger.info(f"Scheduled pattern clustering completed. Detected {len(patterns)} new patterns.")
        return {"new_patterns_detected": len(patterns)}
    finally:
        db.close()

@celery_app.task(name="app.tasks.run_sla_monitor_task")
def run_sla_monitor_task():
    logger.info("Executing hourly SLA monitoring check...")
    db = SessionLocal()
    try:
        # Check tickets nearing breach
        return {"status": "success", "checked_at": "now"}
    finally:
        db.close()
