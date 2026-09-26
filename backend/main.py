import sys
from pathlib import Path

# Ensure repository root is on sys.path when running from backend directory
_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.supabase_client import is_supabase_connected
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

from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi import Request, HTTPException
from backend.supabase_client import get_database_status

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "status_code": exc.status_code, "detail": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": True, "status_code": 422, "detail": "Validation error", "errors": exc.errors()},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=500,
        content={"error": True, "status_code": 500, "detail": "Internal server error"},
    )

# Health & System Status
@app.get("/health", tags=["System"])
@app.get(f"{settings.API_V1_STR}/health", tags=["System"])
def health_check():
    """System health check and database connectivity status"""
    connected = is_supabase_connected()
    db_status = get_database_status()
    is_healthy = (db_status == "database_connected") or (settings.USE_MEMORY_FALLBACK and db_status == "memory_fallback_active")
    response = {
        "status": "healthy" if is_healthy else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "supabase_connected": connected,
        "memory_fallback_active": (db_status == "memory_fallback_active"),
        "environment": "development" if settings.USE_MEMORY_FALLBACK else "production"
    }
    if not is_healthy:
        return JSONResponse(status_code=503, content=response)
    return response

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

