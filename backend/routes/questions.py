from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import random

from database import get_db
from models import Quiz, Question
from schemas import (
    QuestionCreate, QuestionUpdate, QuestionResponse,
    QuestionBulkCreate, MessageResponse
)

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.get("", response_model=List[QuestionResponse])
def list_questions(
    quiz_id: Optional[int] = None,
    topic: Optional[str] = None,
    difficulty: Optional[int] = Query(None, ge=1, le=5),
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """List questions with optional filters"""
    query = db.query(Question)
    
    if active_only:
        query = query.filter(Question.is_active == True)
    if quiz_id:
        query = query.filter(Question.quiz_id == quiz_id)
    if topic:
        query = query.filter(Question.topic.ilike(f"%{topic}%"))
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    questions = query.offset(skip).limit(limit).all()
    return questions


@router.get("/random", response_model=List[QuestionResponse])
def get_random_questions(
    quiz_id: int,
    count: int = Query(10, ge=1, le=100),
    topic: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get random questions from a quiz"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    query = db.query(Question).filter(
        Question.quiz_id == quiz_id,
        Question.is_active == True
    )
    
    if topic:
        query = query.filter(Question.topic == topic)
    
    questions = query.all()
    
    if len(questions) <= count:
        random.shuffle(questions)
        return questions
    
    return random.sample(questions, count)


@router.get("/stats/by-topic")
def get_stats_by_topic(quiz_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get question statistics grouped by topic"""
    query = db.query(
        Question.topic,
        func.count(Question.id).label('total'),
        func.avg(Question.difficulty).label('avg_difficulty')
    ).filter(Question.is_active == True)
    
    if quiz_id:
        query = query.filter(Question.quiz_id == quiz_id)
    
    results = query.group_by(Question.topic).all()
    
    return [
        {
            "topic": r.topic,
            "total_questions": r.total,
            "average_difficulty": round(float(r.avg_difficulty or 0), 2)
        }
        for r in results
    ]


@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(question_id: int, db: Session = Depends(get_db)):
    """Get question by ID"""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.post("", response_model=QuestionResponse)
def create_question(question_data: QuestionCreate, db: Session = Depends(get_db)):
    """Create a new question"""
    quiz = db.query(Quiz).filter(Quiz.id == question_data.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    question = Question(**question_data.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.post("/bulk", response_model=dict)
def create_bulk_questions(bulk_data: QuestionBulkCreate, db: Session = Depends(get_db)):
    """Create multiple questions at once"""
    quiz = db.query(Quiz).filter(Quiz.id == bulk_data.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    created = 0
    errors = []
    
    for i, q_data in enumerate(bulk_data.questions):
        try:
            question = Question(
                quiz_id=bulk_data.quiz_id,
                **q_data.model_dump()
            )
            db.add(question)
            created += 1
        except Exception as e:
            errors.append(f"Question {i+1}: {str(e)}")
    
    db.commit()
    
    return {
        "success": created > 0,
        "questions_created": created,
        "questions_failed": len(errors),
        "errors": errors
    }


@router.put("/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    question_data: QuestionUpdate,
    db: Session = Depends(get_db)
):
    """Update a question"""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    update_data = question_data.model_dump(exclude_unset=True)
    
    # Validate correct_answer if both alternatives and correct_answer are being updated
    if 'alternatives' in update_data or 'correct_answer' in update_data:
        new_alternatives = update_data.get('alternatives', question.alternatives)
        new_correct = update_data.get('correct_answer', question.correct_answer)
        if new_correct not in new_alternatives:
            raise HTTPException(
                status_code=400,
                detail="correct_answer must be one of the alternatives"
            )
    
    for key, value in update_data.items():
        setattr(question, key, value)
    
    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}", response_model=MessageResponse)
def delete_question(
    question_id: int,
    hard_delete: bool = False,
    db: Session = Depends(get_db)
):
    """Delete a question (soft delete by default)"""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    if hard_delete:
        db.delete(question)
        message = "Question permanently deleted"
    else:
        question.is_active = False
        message = "Question deactivated"
    
    db.commit()
    return MessageResponse(message=message)
