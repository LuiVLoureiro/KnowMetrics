"""
KnowMetrics API - Study tracking and performance prediction system.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from database import init_db
from routes import quizzes_router, questions_router, sessions_router, analytics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    print("🚀 Starting KnowMetrics API...")
    init_db()
    print("✅ Database ready")
    print("📚 API Documentation: http://localhost:8000/docs")
    yield
    print("👋 Shutting down KnowMetrics API...")


app = FastAPI(
    title="KnowMetrics API",
    description="""
    ## Study Tracking & Performance Prediction System
    
    KnowMetrics helps you track your study progress and predict exam performance
    using the Ebbinghaus forgetting curve and statistical analysis.
    
    ### Features:
    - 📚 **Quiz Management** - Create and organize question sets
    - ❓ **Questions** - CRUD operations with bulk import (CSV/JSON)
    - 📊 **Study Sessions** - Track progress with detailed analytics
    - 📈 **Performance Prediction** - Estimate exam results
    - 🧠 **Retention Analysis** - Optimize study schedule
    
    ### Quick Start:
    1. Create a quiz via POST `/api/quizzes`
    2. Import questions via POST `/api/quizzes/import-csv`
    3. Start a session via POST `/api/sessions/start`
    4. Submit answers via POST `/api/sessions/{id}/answer`
    5. View analytics via GET `/api/analytics/dashboard`
    """,
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "path": str(request.url)
        }
    )


# Root endpoint
@app.get("/", tags=["Root"])
def root():
    return {
        "name": "KnowMetrics API",
        "version": "2.0.0",
        "status": "running",
        "documentation": "/docs",
        "endpoints": {
            "quizzes": "/api/quizzes",
            "questions": "/api/questions",
            "sessions": "/api/sessions",
            "analytics": "/api/analytics"
        }
    }


# Health check
@app.get("/health", tags=["Root"])
def health_check():
    return {"status": "healthy", "service": "knowmetrics-api"}


# Include routers
app.include_router(quizzes_router, prefix="/api")
app.include_router(questions_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
