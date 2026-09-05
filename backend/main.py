"""Main FastAPI application entrypoint for SIH26044."""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import engine, Base
from backend.seed import seed_database
from backend.routes.auth_routes import router as auth_router
from backend.routes.student_routes import router as student_router
from backend.routes.job_routes import router as job_router
from backend.routes.recruiter_routes import router as recruiter_router
from backend.routes.institution_routes import router as institution_router
from backend.routes.admin_routes import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and seed initial demo data
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield

app = FastAPI(
    title="Portal for Academia–Industry Collaboration (SIH26044)",
    description="Skill Mapping, Internships & Placement Platform for Smart India Hackathon 2026",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router)
app.include_router(student_router)
app.include_router(job_router)
app.include_router(recruiter_router)
app.include_router(institution_router)
app.include_router(admin_router)

@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "project": "SIH26044 Portal for Academia-Industry Collaboration",
        "version": "1.0.0",
        "architecture": "FastAPI + SQLAlchemy + TF-IDF Cosine Matching Engine + React 18 SPA"
    }

# Mount static frontend assets
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
