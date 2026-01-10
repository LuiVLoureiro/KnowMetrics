from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime
import random

from database import get_db
from models import Quiz, Question, StudySession, SessionTheme, SessionAnswer
from schemas import (
    SessionStart, SessionAnswer as SessionAnswerSchema,
    SessionStartResponse, SessionAnswerResponse, SessionFinishResponse,
    SessionResponse, SessionSummary, TopicStats, MessageResponse,
    SessionQuestionResponse
)

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.get("", response_model=List[SessionResponse])
def list_sessions(
    quiz_id: Optional[int] = None,
    completed_only: bool = False,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List study sessions"""
    query = db.query(StudySession)
    
    if quiz_id:
        query = query.filter(StudySession.quiz_id == quiz_id)
    if completed_only:
        query = query.filter(StudySession.is_completed == True)
    
    sessions = query.order_by(desc(StudySession.started_at)).offset(skip).limit(limit).all()
    
    result = []
    for session in sessions:
        quiz = db.query(Quiz).filter(Quiz.id == session.quiz_id).first()
        result.append(SessionResponse(
            id=session.id,
            uuid=session.uuid,
            quiz_id=session.quiz_id,
            quiz_name=quiz.name if quiz else "Unknown",
            total_questions=session.total_questions,
            correct_answers=session.correct_answers,
            wrong_answers=session.wrong_answers,
            score=session.score,
            total_time=session.total_time,
            average_time=session.average_time,
            started_at=session.started_at,
            finished_at=session.finished_at,
            is_completed=session.is_completed
        ))
    
    return result


@router.get("/summary", response_model=SessionSummary)
def get_sessions_summary(quiz_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get summary statistics for sessions"""
    query = db.query(StudySession).filter(StudySession.is_completed == True)
    
    if quiz_id:
        query = query.filter(StudySession.quiz_id == quiz_id)
    
    sessions = query.all()
    
    if not sessions:
        return SessionSummary(
            total_sessions=0,
            completed_sessions=0,
            total_questions_answered=0,
            total_correct=0,
            total_wrong=0,
            average_score=0.0,
            total_study_time=0.0,
            best_score=0.0,
            worst_score=0.0
        )
    
    total_correct = sum(s.correct_answers for s in sessions)
    total_wrong = sum(s.wrong_answers for s in sessions)
    scores = [s.score for s in sessions]
    
    return SessionSummary(
        total_sessions=len(sessions),
        completed_sessions=len(sessions),
        total_questions_answered=total_correct + total_wrong,
        total_correct=total_correct,
        total_wrong=total_wrong,
        average_score=sum(scores) / len(scores) if scores else 0.0,
        total_study_time=sum(s.total_time for s in sessions),
        best_score=max(scores) if scores else 0.0,
        worst_score=min(scores) if scores else 0.0
    )


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    """Get session by ID"""
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    quiz = db.query(Quiz).filter(Quiz.id == session.quiz_id).first()
    
    return SessionResponse(
        id=session.id,
        uuid=session.uuid,
        quiz_id=session.quiz_id,
        quiz_name=quiz.name if quiz else "Unknown",
        total_questions=session.total_questions,
        correct_answers=session.correct_answers,
        wrong_answers=session.wrong_answers,
        score=session.score,
        total_time=session.total_time,
        average_time=session.average_time,
        started_at=session.started_at,
        finished_at=session.finished_at,
        is_completed=session.is_completed
    )


@router.post("/start", response_model=SessionStartResponse)
def start_session(session_data: SessionStart, db: Session = Depends(get_db)):
    """Start a new study session"""
    quiz = db.query(Quiz).filter(Quiz.id == session_data.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Get questions
    query = db.query(Question).filter(
        Question.quiz_id == session_data.quiz_id,
        Question.is_active == True
    )
    
    questions = query.all()
    
    if not questions:
        raise HTTPException(status_code=400, detail="Quiz has no active questions")
    
    # Limit questions if requested
    if session_data.num_questions and session_data.num_questions < len(questions):
        questions = random.sample(questions, session_data.num_questions)
    else:
        random.shuffle(questions)
    
    # Create session
    session = StudySession(
        quiz_id=quiz.id,
        total_questions=len(questions)
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Shuffle alternatives for each question
    question_responses = []
    for q in questions:
        alternatives = q.alternatives.copy()
        random.shuffle(alternatives)
        question_responses.append(SessionQuestionResponse(
            id=q.id,
            uuid=q.uuid,
            topic=q.topic,
            question_text=q.question_text,
            alternatives=alternatives,
            difficulty=q.difficulty
        ))
    
    return SessionStartResponse(
        session_id=session.id,
        session_uuid=session.uuid,
        quiz_name=quiz.name,
        total_questions=len(questions),
        questions=question_responses
    )


@router.post("/{session_id}/answer", response_model=SessionAnswerResponse)
def submit_answer(
    session_id: int,
    answer_data: SessionAnswerSchema,
    db: Session = Depends(get_db)
):
    """Submit an answer for a question in a session"""
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.is_completed:
        raise HTTPException(status_code=400, detail="Session already completed")
    
    question = db.query(Question).filter(Question.id == answer_data.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if already answered
    existing = db.query(SessionAnswer).filter(
        SessionAnswer.session_id == session_id,
        SessionAnswer.question_id == answer_data.question_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Question already answered")
    
    # Check answer
    is_correct = answer_data.user_answer == question.correct_answer
    
    # Save answer
    session_answer = SessionAnswer(
        session_id=session_id,
        question_id=answer_data.question_id,
        user_answer=answer_data.user_answer,
        is_correct=is_correct,
        time_spent=answer_data.time_spent
    )
    db.add(session_answer)
    
    # Update session stats
    session.total_time += answer_data.time_spent
    if is_correct:
        session.correct_answers += 1
    else:
        session.wrong_answers += 1
    
    db.commit()
    
    questions_answered = session.correct_answers + session.wrong_answers
    
    return SessionAnswerResponse(
        is_correct=is_correct,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        current_score=session.correct_answers,
        questions_answered=questions_answered,
        total_questions=session.total_questions
    )


@router.post("/{session_id}/finish", response_model=SessionFinishResponse)
def finish_session(session_id: int, db: Session = Depends(get_db)):
    """Finish a study session and calculate final statistics"""
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.is_completed:
        raise HTTPException(status_code=400, detail="Session already completed")
    
    # Calculate final stats
    total_answered = session.correct_answers + session.wrong_answers
    session.score = round((session.correct_answers / session.total_questions) * 10, 2) if session.total_questions > 0 else 0
    session.average_time = session.total_time / total_answered if total_answered > 0 else 0
    session.finished_at = datetime.utcnow()
    session.is_completed = True
    
    # Calculate topic statistics
    answers = db.query(SessionAnswer).filter(SessionAnswer.session_id == session_id).all()
    
    topic_stats = {}
    for answer in answers:
        question = db.query(Question).filter(Question.id == answer.question_id).first()
        if not question:
            continue
        
        topic = question.topic
        if topic not in topic_stats:
            topic_stats[topic] = {
                "correct": 0,
                "wrong": 0,
                "total_time": 0.0,
                "count": 0
            }
        
        topic_stats[topic]["count"] += 1
        topic_stats[topic]["total_time"] += answer.time_spent
        if answer.is_correct:
            topic_stats[topic]["correct"] += 1
        else:
            topic_stats[topic]["wrong"] += 1
    
    # Save topic stats and build response
    topics_response = []
    for topic, stats in topic_stats.items():
        total = stats["correct"] + stats["wrong"]
        accuracy = (stats["correct"] / total * 100) if total > 0 else 0
        avg_time = stats["total_time"] / stats["count"] if stats["count"] > 0 else 0
        
        # Save to database
        topic_record = SessionTheme(
            session_id=session_id,
            topic=topic,
            correct_answers=stats["correct"],
            wrong_answers=stats["wrong"],
            total_time=stats["total_time"],
            average_time=avg_time
        )
        db.add(topic_record)
        
        topics_response.append(TopicStats(
            topic=topic,
            correct=stats["correct"],
            wrong=stats["wrong"],
            accuracy=round(accuracy, 1),
            average_time=round(avg_time, 2)
        ))
    
    db.commit()
    
    return SessionFinishResponse(
        session_id=session.id,
        total_questions=session.total_questions,
        correct_answers=session.correct_answers,
        wrong_answers=session.wrong_answers,
        score=session.score,
        total_time=round(session.total_time, 2),
        average_time=round(session.average_time, 2),
        topics=topics_response
    )


@router.delete("/{session_id}", response_model=MessageResponse)
def delete_session(session_id: int, db: Session = Depends(get_db)):
    """Delete a session"""
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    
    return MessageResponse(message="Session deleted successfully")
