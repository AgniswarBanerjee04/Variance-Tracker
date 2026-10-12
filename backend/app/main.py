"""
Variance Tracker — Main FastAPI Application Entrypoint.

MCA Minor Project: Micro-Expenditure & Anomaly Detection System.
Meghnad Saha Institute of Technology.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.routers import auth_router, transactions_router, analytics_router, nlp_router
from app.services.transaction_service import seed_default_categories
from app.services.auth_service import get_or_create_demo_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager.
    Initializes database tables and default seed data on startup.
    """
    # Initialize cloud PostgreSQL tables and seed data
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
        async with AsyncSessionLocal() as session:
            await seed_default_categories(session)
            await get_or_create_demo_user(session)
    except Exception as exc:
        print(f"[Variance Tracker] Startup database initialization notice: {exc}")
        
    yield
    
    # Clean shutdown of engine pool
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="""
## Variance Tracker: Micro-Expenditure & Anomaly Detection System

Academic Context: Semester Minor Project for Master of Computer Applications (MCA) 
at Meghnad Saha Institute of Technology.

### Core Capabilities:
- **Unstructured Statement Ingestion:** Ingest raw Indian UPI and digital banking statements.
- **NLP Normalization:** Normalize irregular merchant descriptors using NLP and heuristics.
- **Micro-Expenditure Anomaly Detection:** Identify low-value recurring discretionary spends under ₹500.
- **Relational Integrity:** Strict 3NF PostgreSQL normalization using asynchronous SQLAlchemy 2.0.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware Configuration
# Note: When allow_credentials=True, origins cannot use "*" wildcard per CORS specification.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://variance-tracker-x56m.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers Mounting
api_prefix = settings.API_V1_PREFIX
app.include_router(auth_router, prefix=api_prefix)
app.include_router(transactions_router, prefix=api_prefix)
app.include_router(analytics_router, prefix=api_prefix)
app.include_router(nlp_router, prefix=api_prefix)

# Fallback root mounting for direct base URL routing
app.include_router(auth_router)
app.include_router(transactions_router)
app.include_router(analytics_router)
app.include_router(nlp_router)


@app.get("/", tags=["System"])
async def root():
    """Root status endpoint."""
    return {
        "system": settings.APP_NAME,
        "status": "operational",
        "academic_context": "MCA Minor Project - Meghnad Saha Institute of Technology",
        "docs": "/docs",
    }


@app.get("/health", tags=["System"])
async def health_check():
    """System health check endpoint."""
    return {"status": "healthy", "environment": settings.APP_ENV}
