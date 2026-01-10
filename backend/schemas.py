from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime


# ========== Quiz Schemas ==========
class QuizBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class QuizCreate(QuizBase):
    pass


class QuizUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class QuizResponse(QuizBase):
    id: int
    uuid: str
    created_at: datetime
    updated_at: datetime
    is_active: bool
    question_count: int = 0
    session_count: int = 0

    class Config:
        from_attributes = True


# ========== Question Schemas ==========
class QuestionBase(BaseModel):
    topic: str = Field(..., min_length=1, max_length=255)
    question_text: str = Field(..., min_length=1)
    alternatives: List[str] = Field(..., min_length=2, max_length=6)
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: int = Field(default=1, ge=1, le=5)

    @field_validator('correct_answer')
    @classmethod
    def validate_correct_answer(cls, v, info):
        alternatives = info.data.get('alternatives', [])
        if alternatives and v not in alternatives:
            raise ValueError('correct_answer must be one of the alternatives')
        return v


class QuestionCreate(QuestionBase):
    quiz_id: int


class QuestionUpdate(BaseModel):
    topic: Optional[str] = Field(None, min_length=1, max_length=255)
    question_text: Optional[str] = Field(None, min_length=1)
    alternatives: Optional[List[str]] = Field(None, min_length=2, max_length=6)
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    is_active: Optional[bool] = None


class QuestionResponse(QuestionBase):
    id: int
    uuid: str
    quiz_id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class QuestionBulkCreate(BaseModel):
    quiz_id: int
    questions: List[QuestionBase]


# ========== CSV Import Schemas ==========
class CSVImportResponse(BaseModel):
    success: bool
    quiz_id: int
    quiz_name: str
    questions_imported: int
    questions_failed: int
    errors: List[str] = []


class CSVTemplateColumn(BaseModel):
    name: str
    description: str
    required: bool
    example: str


# ========== Session Schemas ==========
class SessionStart(BaseModel):
    quiz_id: int
    num_questions: Optional[int] = None


class SessionAnswer(BaseModel):
    question_id: int
    user_answer: str
    time_spent: float = Field(..., ge=0)


class SessionQuestionResponse(BaseModel):
    id: int
    uuid: str
    topic: str
    question_text: str
    alternatives: List[str]
    difficulty: int

    class Config:
        from_attributes = True


class SessionStartResponse(BaseModel):
    session_id: int
    session_uuid: str
    quiz_name: str
    total_questions: int
    questions: List[SessionQuestionResponse]


class SessionAnswerResponse(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: Optional[str]
    current_score: int
    questions_answered: int
    total_questions: int


class TopicStats(BaseModel):
    topic: str
    correct: int
    wrong: int
    accuracy: float
    average_time: float


class SessionFinishResponse(BaseModel):
    session_id: int
    total_questions: int
    correct_answers: int
    wrong_answers: int
    score: float
    total_time: float
    average_time: float
    topics: List[TopicStats]


class SessionResponse(BaseModel):
    id: int
    uuid: str
    quiz_id: int
    quiz_name: str
    total_questions: int
    correct_answers: int
    wrong_answers: int
    score: float
    total_time: float
    average_time: float
    started_at: datetime
    finished_at: Optional[datetime]
    is_completed: bool

    class Config:
        from_attributes = True


class SessionSummary(BaseModel):
    total_sessions: int
    completed_sessions: int
    total_questions_answered: int
    total_correct: int
    total_wrong: int
    average_score: float
    total_study_time: float
    best_score: float
    worst_score: float


# ========== Analytics Schemas ==========
class DashboardStats(BaseModel):
    total_quizzes: int
    total_questions: int
    total_sessions: int
    total_study_time: float
    average_score: float
    total_correct: int
    total_wrong: int
    accuracy: float
    recent_sessions: List[SessionResponse]


class TopicRetention(BaseModel):
    topic: str
    accuracy: float
    retention_rate: float
    exposures: int
    days_since_review: int
    hours_until_review: float
    priority_index: float


class StudyScheduleItem(BaseModel):
    topic: str
    retention_rate: float
    next_review: str
    priority: str


class PredictionResponse(BaseModel):
    predicted_correct: int
    predicted_time: str
    pass_probability: float
    topics_retention: dict
    study_schedule: List[StudyScheduleItem]


class RetentionResponse(BaseModel):
    quiz_id: int
    quiz_name: str
    total_sessions: int
    total_questions: int
    overall_retention: float
    topics_at_risk: List[TopicRetention]
    topics_mastered: List[TopicRetention]
    all_topics: List[TopicRetention]


# ========== Generic Schemas ==========
class MessageResponse(BaseModel):
    message: str
    success: bool = True


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    total_pages: int
