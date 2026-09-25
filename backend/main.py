from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.supabase_client import get_supabase_client, is_supabase_connected
from backend.routers import (
    projects,
    discussions,
    tasks,
    documents,
    activities,
    intelligence
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mindmesh.api")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production-ready FastAPI backend for Mind-Mesh: AI Collaborative Learning Intelligence. "
        "Provides participation equity analysis (Gini Index), discussion fragmentation detection, "
        "coherent solution synthesis, and collaboration activity orchestration with Supabase integration."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health & System Status
@app.get("/health", tags=["System"])
def health_check():
    """System health check and Supabase connectivity status"""
    connected = is_supabase_connected()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "supabase" if connected else "memory_fallback_active",
        "supabase_connected": connected
    }

# Mount API Routers
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(discussions.router, prefix=settings.API_V1_STR)
app.include_router(tasks.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(activities.router, prefix=settings.API_V1_STR)
app.include_router(intelligence.router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
