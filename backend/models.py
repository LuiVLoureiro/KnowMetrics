from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Quiz(Base):
    """Model for storing quizzes (question sets)"""
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, default=generate_uuid, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    sessions = relationship("StudySession", back_populates="quiz", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Quiz(id={self.id}, name='{self.name}')>"


class Question(Base):
    """Model for storing questions"""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, default=generate_uuid, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    topic = Column(String(255), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    alternatives = Column(JSON, nullable=False)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    difficulty = Column(Integer, default=1)  # 1-5
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    quiz = relationship("Quiz", back_populates="questions")
    answers = relationship("SessionAnswer", back_populates="question", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Question(id={self.id}, topic='{self.topic}')>"


class StudySession(Base):
    """Model for storing study/test sessions"""
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, default=generate_uuid, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, default=0)
    wrong_answers = Column(Integer, default=0)
    total_time = Column(Float, default=0.0)
    average_time = Column(Float, default=0.0)
    score = Column(Float, default=0.0)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)

    quiz = relationship("Quiz", back_populates="sessions")
    topics = relationship("SessionTheme", back_populates="session", cascade="all, delete-orphan")
    answers = relationship("SessionAnswer", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<StudySession(id={self.id}, quiz_id={self.quiz_id}, score={self.score})>"


class SessionTheme(Base):
    """Model for storing statistics by topic in each session"""
    __tablename__ = "session_themes"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("study_sessions.id"), nullable=False)
    topic = Column(String(255), nullable=False)
    correct_answers = Column(Integer, default=0)
    wrong_answers = Column(Integer, default=0)
    total_time = Column(Float, default=0.0)
    average_time = Column(Float, default=0.0)

    session = relationship("StudySession", back_populates="topics")

    def __repr__(self):
        return f"<SessionTheme(topic='{self.topic}', correct={self.correct_answers})>"


class SessionAnswer(Base):
    """Model for storing each individual answer of a session"""
    __tablename__ = "session_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("study_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    user_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_spent = Column(Float, default=0.0)
    answered_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("StudySession", back_populates="answers")
    question = relationship("Question", back_populates="answers")

    def __repr__(self):
        return f"<SessionAnswer(question_id={self.question_id}, is_correct={self.is_correct})>"
