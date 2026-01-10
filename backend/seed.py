"""
Seed script to populate the database with example data.
Run with: python seed.py
"""
import random
from datetime import datetime, timedelta
from database import SessionLocal, init_db
from models import Quiz, Question, StudySession, SessionTheme

def seed_database():
    """Populate database with example quizzes and questions"""
    init_db()
    db = SessionLocal()
    
    # Check if data already exists
    if db.query(Quiz).count() > 0:
        print("⚠️  Database already has data. Skipping seed.")
        db.close()
        return
    
    print("🌱 Seeding database with example data...")
    
    # Create quizzes with questions
    quizzes_data = [
        {
            "name": "Basic Mathematics",
            "description": "Fundamental math concepts including algebra and geometry",
            "questions": [
                {
                    "topic": "Algebra",
                    "question_text": "What is the value of x in the equation 2x + 5 = 15?",
                    "alternatives": ["3", "4", "5", "6"],
                    "correct_answer": "5",
                    "explanation": "2x + 5 = 15 → 2x = 10 → x = 5",
                    "difficulty": 1
                },
                {
                    "topic": "Algebra",
                    "question_text": "Simplify: 3(x + 2) - 2x",
                    "alternatives": ["x + 6", "x + 2", "5x + 6", "x - 6"],
                    "correct_answer": "x + 6",
                    "explanation": "3x + 6 - 2x = x + 6",
                    "difficulty": 2
                },
                {
                    "topic": "Geometry",
                    "question_text": "What is the area of a rectangle with length 8 and width 5?",
                    "alternatives": ["13", "26", "40", "80"],
                    "correct_answer": "40",
                    "explanation": "Area = length × width = 8 × 5 = 40",
                    "difficulty": 1
                },
                {
                    "topic": "Geometry",
                    "question_text": "A circle has radius 7. What is its diameter?",
                    "alternatives": ["3.5", "7", "14", "49"],
                    "correct_answer": "14",
                    "explanation": "Diameter = 2 × radius = 2 × 7 = 14",
                    "difficulty": 1
                },
                {
                    "topic": "Arithmetic",
                    "question_text": "What is 15% of 200?",
                    "alternatives": ["15", "30", "45", "60"],
                    "correct_answer": "30",
                    "explanation": "15% × 200 = 0.15 × 200 = 30",
                    "difficulty": 2
                },
                {
                    "topic": "Arithmetic",
                    "question_text": "What is the square root of 144?",
                    "alternatives": ["10", "11", "12", "14"],
                    "correct_answer": "12",
                    "explanation": "12 × 12 = 144",
                    "difficulty": 1
                },
                {
                    "topic": "Equations",
                    "question_text": "Solve for y: 3y - 9 = 0",
                    "alternatives": ["0", "3", "6", "9"],
                    "correct_answer": "3",
                    "explanation": "3y = 9 → y = 3",
                    "difficulty": 1
                },
                {
                    "topic": "Equations",
                    "question_text": "If 2a + 3b = 12 and a = 3, what is b?",
                    "alternatives": ["1", "2", "3", "4"],
                    "correct_answer": "2",
                    "explanation": "2(3) + 3b = 12 → 6 + 3b = 12 → 3b = 6 → b = 2",
                    "difficulty": 3
                }
            ]
        },
        {
            "name": "World History",
            "description": "Major events in world history",
            "questions": [
                {
                    "topic": "Ancient History",
                    "question_text": "In which year did the Roman Empire fall?",
                    "alternatives": ["376 AD", "410 AD", "476 AD", "500 AD"],
                    "correct_answer": "476 AD",
                    "explanation": "The Western Roman Empire fell in 476 AD",
                    "difficulty": 2
                },
                {
                    "topic": "Ancient History",
                    "question_text": "Who was the first Emperor of Rome?",
                    "alternatives": ["Julius Caesar", "Augustus", "Nero", "Caligula"],
                    "correct_answer": "Augustus",
                    "explanation": "Augustus (Octavian) was the first Roman Emperor",
                    "difficulty": 2
                },
                {
                    "topic": "Modern History",
                    "question_text": "When did World War II end?",
                    "alternatives": ["1943", "1944", "1945", "1946"],
                    "correct_answer": "1945",
                    "explanation": "WWII ended in September 1945",
                    "difficulty": 1
                },
                {
                    "topic": "Modern History",
                    "question_text": "Who was the British Prime Minister during most of WWII?",
                    "alternatives": ["Chamberlain", "Churchill", "Attlee", "Eden"],
                    "correct_answer": "Churchill",
                    "explanation": "Winston Churchill led Britain through most of WWII",
                    "difficulty": 1
                },
                {
                    "topic": "Medieval History",
                    "question_text": "In which century did the Black Death devastate Europe?",
                    "alternatives": ["12th century", "13th century", "14th century", "15th century"],
                    "correct_answer": "14th century",
                    "explanation": "The Black Death peaked in Europe from 1347-1351",
                    "difficulty": 3
                },
                {
                    "topic": "Renaissance",
                    "question_text": "Who painted the Mona Lisa?",
                    "alternatives": ["Michelangelo", "Raphael", "Leonardo da Vinci", "Botticelli"],
                    "correct_answer": "Leonardo da Vinci",
                    "explanation": "Leonardo da Vinci painted the Mona Lisa c. 1503-1519",
                    "difficulty": 1
                }
            ]
        },
        {
            "name": "Python Programming",
            "description": "Python fundamentals and best practices",
            "questions": [
                {
                    "topic": "Basic Syntax",
                    "question_text": "Which keyword is used to define a function in Python?",
                    "alternatives": ["function", "def", "func", "define"],
                    "correct_answer": "def",
                    "explanation": "The 'def' keyword is used to define functions",
                    "difficulty": 1
                },
                {
                    "topic": "Basic Syntax",
                    "question_text": "What is the output of print(type([]))?",
                    "alternatives": ["<class 'tuple'>", "<class 'list'>", "<class 'dict'>", "<class 'set'>"],
                    "correct_answer": "<class 'list'>",
                    "explanation": "[] creates an empty list",
                    "difficulty": 1
                },
                {
                    "topic": "Data Structures",
                    "question_text": "Which data structure uses key-value pairs?",
                    "alternatives": ["List", "Tuple", "Dictionary", "Set"],
                    "correct_answer": "Dictionary",
                    "explanation": "Dictionaries store data as key-value pairs",
                    "difficulty": 1
                },
                {
                    "topic": "Data Structures",
                    "question_text": "What method adds an element to the end of a list?",
                    "alternatives": ["add()", "append()", "insert()", "push()"],
                    "correct_answer": "append()",
                    "explanation": "list.append(x) adds x to the end of the list",
                    "difficulty": 1
                },
                {
                    "topic": "Functions",
                    "question_text": "What does the 'return' keyword do?",
                    "alternatives": ["Prints a value", "Exits the program", "Sends a value back from a function", "Creates a loop"],
                    "correct_answer": "Sends a value back from a function",
                    "explanation": "return sends a value back to the caller",
                    "difficulty": 2
                },
                {
                    "topic": "Functions",
                    "question_text": "What is a lambda function?",
                    "alternatives": ["A named function", "An anonymous function", "A recursive function", "A built-in function"],
                    "correct_answer": "An anonymous function",
                    "explanation": "Lambda functions are anonymous (unnamed) functions",
                    "difficulty": 2
                },
                {
                    "topic": "OOP",
                    "question_text": "Which keyword is used to create a class?",
                    "alternatives": ["class", "Class", "def", "object"],
                    "correct_answer": "class",
                    "explanation": "The 'class' keyword defines a new class",
                    "difficulty": 1
                },
                {
                    "topic": "OOP",
                    "question_text": "What is 'self' in a Python class?",
                    "alternatives": ["A built-in function", "Reference to the current instance", "A reserved keyword", "A data type"],
                    "correct_answer": "Reference to the current instance",
                    "explanation": "'self' refers to the current instance of the class",
                    "difficulty": 2
                }
            ]
        }
    ]
    
    # Insert quizzes and questions
    for quiz_data in quizzes_data:
        quiz = Quiz(
            name=quiz_data["name"],
            description=quiz_data["description"]
        )
        db.add(quiz)
        db.flush()
        
        for q_data in quiz_data["questions"]:
            question = Question(
                quiz_id=quiz.id,
                **q_data
            )
            db.add(question)
        
        print(f"  ✓ Created quiz: {quiz.name} ({len(quiz_data['questions'])} questions)")
    
    db.commit()
    
    # Create some example sessions
    print("\n🎯 Creating example study sessions...")
    
    quizzes = db.query(Quiz).all()
    for quiz in quizzes:
        questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
        
        # Create 2-4 random sessions per quiz
        for _ in range(random.randint(2, 4)):
            num_questions = min(len(questions), random.randint(5, len(questions)))
            session_questions = random.sample(questions, num_questions)
            
            correct = random.randint(int(num_questions * 0.4), num_questions)
            wrong = num_questions - correct
            total_time = sum(random.uniform(5, 30) for _ in range(num_questions))
            
            session = StudySession(
                quiz_id=quiz.id,
                total_questions=num_questions,
                correct_answers=correct,
                wrong_answers=wrong,
                total_time=total_time,
                average_time=total_time / num_questions,
                score=round((correct / num_questions) * 10, 2),
                started_at=datetime.utcnow() - timedelta(days=random.randint(0, 14)),
                finished_at=datetime.utcnow() - timedelta(days=random.randint(0, 14)),
                is_completed=True
            )
            db.add(session)
            db.flush()
            
            # Create topic stats
            topics = {}
            for q in session_questions:
                if q.topic not in topics:
                    topics[q.topic] = {"correct": 0, "wrong": 0, "time": 0}
                
                is_correct = random.random() < (correct / num_questions)
                if is_correct:
                    topics[q.topic]["correct"] += 1
                else:
                    topics[q.topic]["wrong"] += 1
                topics[q.topic]["time"] += random.uniform(5, 25)
            
            for topic_name, stats in topics.items():
                total = stats["correct"] + stats["wrong"]
                theme = SessionTheme(
                    session_id=session.id,
                    topic=topic_name,
                    correct_answers=stats["correct"],
                    wrong_answers=stats["wrong"],
                    total_time=stats["time"],
                    average_time=stats["time"] / total if total > 0 else 0
                )
                db.add(theme)
        
        print(f"  ✓ Created sessions for: {quiz.name}")
    
    db.commit()
    db.close()
    
    print("\n✅ Database seeded successfully!")
    print("\nYou can now start the application:")
    print("  Backend:  cd backend && uvicorn main:app --reload")
    print("  Frontend: cd frontend && npm start")


if __name__ == "__main__":
    seed_database()
