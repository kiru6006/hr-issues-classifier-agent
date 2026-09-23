from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import settings
from app.database.db import engine, Base
from app.auth.routes import router as auth_router
from app.tickets.routes import router as tickets_router
from app.hr.routes import router as hr_router
from app.admin.routes import router as admin_router
from app.scripts.seed_data import seed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized. Running seed data check...")
    try:
        seed()
    except Exception as e:
        logger.warning(f"Auto-seeding notice: {e}")
    yield
    logger.info("Application shutdown complete.")

# Initialize FastAPI application with Lifespan
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="India-first, DPDP Act 2023 compliant HR AI Problem Classification and Triage System with 13 categories, risk scoring, pattern detection, and automated routing.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(tickets_router, prefix=settings.API_V1_PREFIX)
app.include_router(hr_router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "compliance": "DPDP Act 2023 Compliant",
        "llm_engine": "Ollama / Enterprise Heuristic Fallback"
    }

@app.get("/", tags=["Root"])
def root_redirect():
    return {
        "message": "Welcome to HR AI Problem Classification API",
        "docs": "/docs",
        "health": "/health"
    }
