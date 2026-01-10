from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import csv
import io
import json

from database import get_db
from models import Quiz, Question, StudySession
from schemas import (
    QuizCreate, QuizUpdate, QuizResponse, 
    CSVImportResponse, CSVTemplateColumn, MessageResponse
)

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@router.get("", response_model=List[QuizResponse])
def list_quizzes(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """List all quizzes with question and session counts"""
    query = db.query(Quiz)
    if active_only:
        query = query.filter(Quiz.is_active == True)
    
    quizzes = query.offset(skip).limit(limit).all()
    
    result = []
    for quiz in quizzes:
        question_count = db.query(func.count(Question.id)).filter(
            Question.quiz_id == quiz.id,
            Question.is_active == True
        ).scalar()
        
        session_count = db.query(func.count(StudySession.id)).filter(
            StudySession.quiz_id == quiz.id,
            StudySession.is_completed == True
        ).scalar()
        
        quiz_dict = {
            "id": quiz.id,
            "uuid": quiz.uuid,
            "name": quiz.name,
            "description": quiz.description,
            "created_at": quiz.created_at,
            "updated_at": quiz.updated_at,
            "is_active": quiz.is_active,
            "question_count": question_count,
            "session_count": session_count
        }
        result.append(QuizResponse(**quiz_dict))
    
    return result


@router.get("/csv-template")
def get_csv_template():
    """Download CSV template for question import"""
    template_content = """topic,question_text,alternative_1,alternative_2,alternative_3,alternative_4,correct_answer,explanation,difficulty
Math,What is 2 + 2?,3,4,5,6,4,Basic addition,1
Science,What is H2O?,Water,Fire,Air,Earth,Water,Chemical formula for water,2
History,When did WW2 end?,1943,1944,1945,1946,1945,World War 2 ended in 1945,3
"""
    
    output = io.StringIO()
    output.write(template_content)
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=questions_template.csv"}
    )


@router.get("/csv-template/columns", response_model=List[CSVTemplateColumn])
def get_csv_columns():
    """Get CSV column descriptions"""
    return [
        CSVTemplateColumn(
            name="topic",
            description="Topic/theme of the question",
            required=True,
            example="Mathematics"
        ),
        CSVTemplateColumn(
            name="question_text",
            description="The question content",
            required=True,
            example="What is 2 + 2?"
        ),
        CSVTemplateColumn(
            name="alternative_1",
            description="First answer option",
            required=True,
            example="3"
        ),
        CSVTemplateColumn(
            name="alternative_2",
            description="Second answer option",
            required=True,
            example="4"
        ),
        CSVTemplateColumn(
            name="alternative_3",
            description="Third answer option (optional)",
            required=False,
            example="5"
        ),
        CSVTemplateColumn(
            name="alternative_4",
            description="Fourth answer option (optional)",
            required=False,
            example="6"
        ),
        CSVTemplateColumn(
            name="correct_answer",
            description="The correct answer (must match one alternative)",
            required=True,
            example="4"
        ),
        CSVTemplateColumn(
            name="explanation",
            description="Explanation for the correct answer",
            required=False,
            example="Basic arithmetic"
        ),
        CSVTemplateColumn(
            name="difficulty",
            description="Difficulty level (1-5)",
            required=False,
            example="1"
        )
    ]


@router.post("/import-csv", response_model=CSVImportResponse)
async def import_questions_csv(
    file: UploadFile = File(...),
    quiz_name: str = Form(...),
    quiz_description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Import questions from CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    # Check if quiz exists or create new
    existing_quiz = db.query(Quiz).filter(Quiz.name == quiz_name).first()
    if existing_quiz:
        quiz = existing_quiz
    else:
        quiz = Quiz(name=quiz_name, description=quiz_description)
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
    
    # Read CSV content
    content = await file.read()
    try:
        decoded = content.decode('utf-8')
    except UnicodeDecodeError:
        decoded = content.decode('latin-1')
    
    reader = csv.DictReader(io.StringIO(decoded))
    
    questions_imported = 0
    questions_failed = 0
    errors = []
    
    for row_num, row in enumerate(reader, start=2):
        try:
            # Clean row keys (remove BOM and whitespace)
            row = {k.strip().replace('\ufeff', ''): v.strip() if v else '' for k, v in row.items()}
            
            # Extract required fields
            topic = row.get('topic', '').strip()
            question_text = row.get('question_text', '').strip()
            correct_answer = row.get('correct_answer', '').strip()
            
            if not topic or not question_text or not correct_answer:
                errors.append(f"Row {row_num}: Missing required fields (topic, question_text, or correct_answer)")
                questions_failed += 1
                continue
            
            # Build alternatives list
            alternatives = []
            for i in range(1, 7):
                alt = row.get(f'alternative_{i}', '').strip()
                if alt:
                    alternatives.append(alt)
            
            if len(alternatives) < 2:
                errors.append(f"Row {row_num}: At least 2 alternatives required")
                questions_failed += 1
                continue
            
            if correct_answer not in alternatives:
                errors.append(f"Row {row_num}: correct_answer must be one of the alternatives")
                questions_failed += 1
                continue
            
            # Get optional fields
            explanation = row.get('explanation', '').strip() or None
            try:
                difficulty = int(row.get('difficulty', 1) or 1)
                difficulty = max(1, min(5, difficulty))
            except ValueError:
                difficulty = 1
            
            # Create question
            question = Question(
                quiz_id=quiz.id,
                topic=topic,
                question_text=question_text,
                alternatives=alternatives,
                correct_answer=correct_answer,
                explanation=explanation,
                difficulty=difficulty
            )
            db.add(question)
            questions_imported += 1
            
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
            questions_failed += 1
    
    db.commit()
    
    return CSVImportResponse(
        success=questions_imported > 0,
        quiz_id=quiz.id,
        quiz_name=quiz.name,
        questions_imported=questions_imported,
        questions_failed=questions_failed,
        errors=errors[:10]  # Limit errors shown
    )


@router.post("/import-json", response_model=CSVImportResponse)
async def import_questions_json(
    file: UploadFile = File(...),
    quiz_name: str = Form(...),
    quiz_description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Import questions from JSON file"""
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="File must be JSON")
    
    content = await file.read()
    try:
        data = json.loads(content.decode('utf-8'))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    
    # Check if quiz exists or create new
    existing_quiz = db.query(Quiz).filter(Quiz.name == quiz_name).first()
    if existing_quiz:
        quiz = existing_quiz
    else:
        quiz = Quiz(name=quiz_name, description=quiz_description)
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
    
    # Handle both array and object with 'questions' key
    questions_data = data if isinstance(data, list) else data.get('questions', [])
    
    questions_imported = 0
    questions_failed = 0
    errors = []
    
    for i, q in enumerate(questions_data, start=1):
        try:
            # Map different possible field names
            topic = q.get('topic') or q.get('tema') or q.get('theme', 'General')
            question_text = q.get('question_text') or q.get('pergunta') or q.get('question', '')
            alternatives = q.get('alternatives') or q.get('alternativas') or q.get('options', [])
            correct_answer = q.get('correct_answer') or q.get('resposta') or q.get('answer', '')
            explanation = q.get('explanation') or q.get('explicacao') or None
            difficulty = q.get('difficulty') or q.get('dificuldade') or 1
            
            if not question_text or not alternatives or not correct_answer:
                errors.append(f"Question {i}: Missing required fields")
                questions_failed += 1
                continue
            
            if len(alternatives) < 2:
                errors.append(f"Question {i}: At least 2 alternatives required")
                questions_failed += 1
                continue
            
            if correct_answer not in alternatives:
                errors.append(f"Question {i}: correct_answer must be in alternatives")
                questions_failed += 1
                continue
            
            question = Question(
                quiz_id=quiz.id,
                topic=str(topic),
                question_text=str(question_text),
                alternatives=alternatives,
                correct_answer=str(correct_answer),
                explanation=explanation,
                difficulty=max(1, min(5, int(difficulty)))
            )
            db.add(question)
            questions_imported += 1
            
        except Exception as e:
            errors.append(f"Question {i}: {str(e)}")
            questions_failed += 1
    
    db.commit()
    
    return CSVImportResponse(
        success=questions_imported > 0,
        quiz_id=quiz.id,
        quiz_name=quiz.name,
        questions_imported=questions_imported,
        questions_failed=questions_failed,
        errors=errors[:10]
    )


@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    """Get quiz by ID"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    question_count = db.query(func.count(Question.id)).filter(
        Question.quiz_id == quiz.id,
        Question.is_active == True
    ).scalar()
    
    session_count = db.query(func.count(StudySession.id)).filter(
        StudySession.quiz_id == quiz.id,
        StudySession.is_completed == True
    ).scalar()
    
    return QuizResponse(
        id=quiz.id,
        uuid=quiz.uuid,
        name=quiz.name,
        description=quiz.description,
        created_at=quiz.created_at,
        updated_at=quiz.updated_at,
        is_active=quiz.is_active,
        question_count=question_count,
        session_count=session_count
    )


@router.post("", response_model=QuizResponse)
def create_quiz(quiz_data: QuizCreate, db: Session = Depends(get_db)):
    """Create a new quiz"""
    existing = db.query(Quiz).filter(Quiz.name == quiz_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Quiz with this name already exists")
    
    quiz = Quiz(**quiz_data.model_dump())
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    
    return QuizResponse(
        id=quiz.id,
        uuid=quiz.uuid,
        name=quiz.name,
        description=quiz.description,
        created_at=quiz.created_at,
        updated_at=quiz.updated_at,
        is_active=quiz.is_active,
        question_count=0,
        session_count=0
    )


@router.put("/{quiz_id}", response_model=QuizResponse)
def update_quiz(quiz_id: int, quiz_data: QuizUpdate, db: Session = Depends(get_db)):
    """Update a quiz"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    update_data = quiz_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(quiz, key, value)
    
    db.commit()
    db.refresh(quiz)
    
    question_count = db.query(func.count(Question.id)).filter(
        Question.quiz_id == quiz.id,
        Question.is_active == True
    ).scalar()
    
    session_count = db.query(func.count(StudySession.id)).filter(
        StudySession.quiz_id == quiz.id,
        StudySession.is_completed == True
    ).scalar()
    
    return QuizResponse(
        id=quiz.id,
        uuid=quiz.uuid,
        name=quiz.name,
        description=quiz.description,
        created_at=quiz.created_at,
        updated_at=quiz.updated_at,
        is_active=quiz.is_active,
        question_count=question_count,
        session_count=session_count
    )


@router.delete("/{quiz_id}", response_model=MessageResponse)
def delete_quiz(quiz_id: int, hard_delete: bool = False, db: Session = Depends(get_db)):
    """Delete a quiz (soft delete by default)"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if hard_delete:
        db.delete(quiz)
        message = f"Quiz '{quiz.name}' permanently deleted"
    else:
        quiz.is_active = False
        message = f"Quiz '{quiz.name}' deactivated"
    
    db.commit()
    return MessageResponse(message=message)


@router.get("/{quiz_id}/topics", response_model=List[str])
def get_quiz_topics(quiz_id: int, db: Session = Depends(get_db)):
    """Get all unique topics for a quiz"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    topics = db.query(Question.topic).filter(
        Question.quiz_id == quiz_id,
        Question.is_active == True
    ).distinct().all()
    
    return [t[0] for t in topics]


@router.get("/{quiz_id}/export")
def export_quiz(quiz_id: int, format: str = "csv", db: Session = Depends(get_db)):
    """Export quiz questions as CSV or JSON"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    questions = db.query(Question).filter(
        Question.quiz_id == quiz_id,
        Question.is_active == True
    ).all()
    
    if format == "json":
        data = []
        for q in questions:
            data.append({
                "topic": q.topic,
                "question_text": q.question_text,
                "alternatives": q.alternatives,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
                "difficulty": q.difficulty
            })
        
        return StreamingResponse(
            iter([json.dumps(data, indent=2, ensure_ascii=False)]),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={quiz.name}_questions.json"}
        )
    else:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['topic', 'question_text', 'alternative_1', 'alternative_2', 
                        'alternative_3', 'alternative_4', 'alternative_5', 'alternative_6',
                        'correct_answer', 'explanation', 'difficulty'])
        
        for q in questions:
            alts = q.alternatives + [''] * (6 - len(q.alternatives))
            writer.writerow([
                q.topic, q.question_text, 
                alts[0], alts[1], alts[2], alts[3], alts[4], alts[5],
                q.correct_answer, q.explanation or '', q.difficulty
            ])
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={quiz.name}_questions.csv"}
        )
