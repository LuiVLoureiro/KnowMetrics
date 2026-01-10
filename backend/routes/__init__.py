from .quizzes import router as quizzes_router
from .questions import router as questions_router
from .sessions import router as sessions_router
from .analytics import router as analytics_router

__all__ = [
    "quizzes_router",
    "questions_router", 
    "sessions_router",
    "analytics_router"
]
