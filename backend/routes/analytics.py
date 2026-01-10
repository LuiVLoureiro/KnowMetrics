from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from datetime import datetime, timedelta

from database import get_db
from models import Quiz, Question, StudySession, SessionTheme, SessionAnswer
from schemas import (
    DashboardStats, PredictionResponse, RetentionResponse,
    SessionResponse, TopicRetention, StudyScheduleItem
)
from utils.analytics import (
    predict_performance, analyze_topic_retention, 
    generate_study_schedule, format_time
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db)):
    """Get overall dashboard statistics"""
    # Count totals
    total_quizzes = db.query(func.count(Quiz.id)).filter(Quiz.is_active == True).scalar()
    total_questions = db.query(func.count(Question.id)).filter(Question.is_active == True).scalar()
    total_sessions = db.query(func.count(StudySession.id)).filter(
        StudySession.is_completed == True
    ).scalar()
    
    # Get completed sessions stats
    sessions = db.query(StudySession).filter(StudySession.is_completed == True).all()
    
    total_time = sum(s.total_time for s in sessions)
    total_correct = sum(s.correct_answers for s in sessions)
    total_wrong = sum(s.wrong_answers for s in sessions)
    total_answered = total_correct + total_wrong
    
    avg_score = sum(s.score for s in sessions) / len(sessions) if sessions else 0
    accuracy = (total_correct / total_answered * 100) if total_answered > 0 else 0
    
    # Get recent sessions
    recent_sessions_query = db.query(StudySession).filter(
        StudySession.is_completed == True
    ).order_by(desc(StudySession.finished_at)).limit(5).all()
    
    recent_sessions = []
    for session in recent_sessions_query:
        quiz = db.query(Quiz).filter(Quiz.id == session.quiz_id).first()
        recent_sessions.append(SessionResponse(
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
    
    return DashboardStats(
        total_quizzes=total_quizzes,
        total_questions=total_questions,
        total_sessions=total_sessions,
        total_study_time=total_time,
        average_score=round(avg_score, 2),
        total_correct=total_correct,
        total_wrong=total_wrong,
        accuracy=round(accuracy, 1),
        recent_sessions=recent_sessions
    )


@router.get("/prediction/{quiz_id}", response_model=PredictionResponse)
def get_performance_prediction(
    quiz_id: int,
    exam_questions: int = Query(..., ge=1, description="Number of questions in the exam"),
    min_score: float = Query(..., ge=1, description="Minimum correct answers to pass"),
    db: Session = Depends(get_db)
):
    """Predict performance for an upcoming exam"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Get all completed sessions for this quiz
    sessions = db.query(StudySession).filter(
        StudySession.quiz_id == quiz_id,
        StudySession.is_completed == True
    ).all()
    
    if not sessions:
        raise HTTPException(
            status_code=400, 
            detail="No completed sessions found. Complete some study sessions first."
        )
    
    # Prepare session data for prediction
    sessions_data = []
    for session in sessions:
        sessions_data.append({
            'correct': session.correct_answers,
            'wrong': session.wrong_answers,
            'time': session.total_time,
            'date': session.finished_at
        })
    
    # Get topic-level data
    current_time = datetime.utcnow()
    topics_data = {}
    
    for session in sessions:
        topic_stats = db.query(SessionTheme).filter(
            SessionTheme.session_id == session.id
        ).all()
        
        for stat in topic_stats:
            if stat.topic not in topics_data:
                topics_data[stat.topic] = {
                    'correct': 0,
                    'wrong': 0,
                    'exposures': 0,
                    'last_review': session.finished_at or current_time
                }
            
            topics_data[stat.topic]['correct'] += stat.correct_answers
            topics_data[stat.topic]['wrong'] += stat.wrong_answers
            topics_data[stat.topic]['exposures'] += 1
            
            if session.finished_at and session.finished_at > topics_data[stat.topic]['last_review']:
                topics_data[stat.topic]['last_review'] = session.finished_at
    
    # Analyze retention by topic
    topics_retention = {}
    topics_analysis = []
    
    for topic, data in topics_data.items():
        analysis = analyze_topic_retention(data, current_time)
        analysis['topic'] = topic
        topics_analysis.append(analysis)
        topics_retention[topic] = analysis['retention_rate']
    
    # Generate prediction
    prediction = predict_performance(sessions_data, exam_questions, min_score)
    
    # Generate study schedule
    study_schedule = generate_study_schedule(topics_analysis)
    
    return PredictionResponse(
        predicted_correct=prediction['predicted_correct'],
        predicted_time=prediction['predicted_time'],
        pass_probability=round(prediction['pass_probability'], 1),
        topics_retention=topics_retention,
        study_schedule=[
            StudyScheduleItem(**item) for item in study_schedule
        ]
    )


@router.get("/retention/{quiz_id}", response_model=RetentionResponse)
def get_retention_analysis(quiz_id: int, db: Session = Depends(get_db)):
    """Get detailed retention analysis for a quiz"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    sessions = db.query(StudySession).filter(
        StudySession.quiz_id == quiz_id,
        StudySession.is_completed == True
    ).all()
    
    if not sessions:
        raise HTTPException(
            status_code=400,
            detail="No completed sessions found"
        )
    
    current_time = datetime.utcnow()
    
    # Aggregate topic data
    topics_data = {}
    for session in sessions:
        topic_stats = db.query(SessionTheme).filter(
            SessionTheme.session_id == session.id
        ).all()
        
        for stat in topic_stats:
            if stat.topic not in topics_data:
                topics_data[stat.topic] = {
                    'correct': 0,
                    'wrong': 0,
                    'exposures': 0,
                    'last_review': session.finished_at or current_time
                }
            
            topics_data[stat.topic]['correct'] += stat.correct_answers
            topics_data[stat.topic]['wrong'] += stat.wrong_answers
            topics_data[stat.topic]['exposures'] += 1
            
            if session.finished_at and session.finished_at > topics_data[stat.topic]['last_review']:
                topics_data[stat.topic]['last_review'] = session.finished_at
    
    # Analyze each topic
    all_topics = []
    topics_at_risk = []
    topics_mastered = []
    
    for topic, data in topics_data.items():
        analysis = analyze_topic_retention(data, current_time)
        
        topic_retention = TopicRetention(
            topic=topic,
            accuracy=analysis['accuracy'],
            retention_rate=analysis['retention_rate'],
            exposures=analysis['exposures'],
            days_since_review=analysis['days_since_review'],
            hours_until_review=analysis['hours_until_review'],
            priority_index=analysis['priority_index']
        )
        
        all_topics.append(topic_retention)
        
        if analysis['retention_rate'] < 50:
            topics_at_risk.append(topic_retention)
        elif analysis['retention_rate'] >= 70:
            topics_mastered.append(topic_retention)
    
    # Sort by retention rate
    all_topics.sort(key=lambda x: x.retention_rate)
    topics_at_risk.sort(key=lambda x: x.retention_rate)
    topics_mastered.sort(key=lambda x: -x.retention_rate)
    
    # Calculate overall retention
    total_correct = sum(d['correct'] for d in topics_data.values())
    total_questions = sum(d['correct'] + d['wrong'] for d in topics_data.values())
    overall_accuracy = (total_correct / total_questions * 100) if total_questions > 0 else 0
    
    avg_retention = sum(t.retention_rate for t in all_topics) / len(all_topics) if all_topics else 0
    
    return RetentionResponse(
        quiz_id=quiz.id,
        quiz_name=quiz.name,
        total_sessions=len(sessions),
        total_questions=total_questions,
        overall_retention=round(avg_retention, 1),
        topics_at_risk=topics_at_risk,
        topics_mastered=topics_mastered,
        all_topics=all_topics
    )


@router.get("/topics")
def get_all_topics_analytics(db: Session = Depends(get_db)):
    """Get analytics for all topics across all quizzes"""
    topics_data = db.query(
        SessionTheme.topic,
        func.sum(SessionTheme.correct_answers).label('total_correct'),
        func.sum(SessionTheme.wrong_answers).label('total_wrong'),
        func.avg(SessionTheme.average_time).label('avg_time'),
        func.count(SessionTheme.id).label('occurrences')
    ).group_by(SessionTheme.topic).all()
    
    result = []
    for topic in topics_data:
        total = topic.total_correct + topic.total_wrong
        accuracy = (topic.total_correct / total * 100) if total > 0 else 0
        
        result.append({
            "topic": topic.topic,
            "total_questions": total,
            "correct": topic.total_correct,
            "wrong": topic.total_wrong,
            "accuracy": round(accuracy, 1),
            "average_time": round(topic.avg_time or 0, 2),
            "sessions_with_topic": topic.occurrences
        })
    
    # Sort by accuracy (lowest first = needs more work)
    result.sort(key=lambda x: x['accuracy'])
    
    return result
