# 📊 KnowMetrics

> A smart quiz application with spaced repetition, performance analytics, and AI-powered question generation.

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.8+-yellow)
![React](https://img.shields.io/badge/react-18-cyan)

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Features](#-features)
3. [Quick Start](#-quick-start)
4. [User Walkthrough](#-user-walkthrough)
   - [Dashboard (Metrics)](#1-dashboard-metrics)
   - [Taking a Quiz](#2-taking-a-quiz)
   - [Creating Questions](#3-creating-questions-manually)
   - [Importing Questions](#4-importing-questions-from-csv-or-json)
   - [AI Prompt Generator](#5-ai-prompt-generator)
   - [Performance Prediction](#6-performance-prediction)
   - [Retention Analysis](#7-retention-analysis)
5. [CSV Format Reference](#-csv-format-reference)
6. [JSON Format Reference](#-json-format-reference)
7. [API Reference](#-api-reference)
8. [Project Structure](#-project-structure)
9. [Tech Stack](#-tech-stack)
10. [Contributing](#-contributing)

---

## 🎯 Overview

**KnowMetrics** is a full-stack quiz application designed to help students and learners track their study progress using scientifically-backed learning techniques. The app uses the **Ebbinghaus Forgetting Curve** to analyze memory retention and provides personalized study schedules.

### Why KnowMetrics?

- 📈 **Track Progress**: See your performance evolve over time
- 🧠 **Spaced Repetition**: Get reminders to review topics before you forget them
- 🎯 **Exam Prediction**: Know your probability of passing before the exam
- 🤖 **AI Integration**: Generate hundreds of questions using AI prompts
- 📊 **Visual Analytics**: Beautiful charts and statistics

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 **Metrics Dashboard** | View overall stats, charts, and recent sessions |
| ▶️ **Interactive Quizzes** | Take quizzes with immediate feedback and timing |
| ✏️ **Question Creator** | Create questions manually with explanations |
| 📥 **CSV/JSON Import** | Bulk import questions from files |
| 🤖 **AI Prompt Generator** | Generate prompts to create questions with ChatGPT/Claude |
| 📈 **Performance Prediction** | Predict exam results using statistical models |
| 🧠 **Retention Analysis** | Track memory retention with Ebbinghaus curve |
| 📅 **Study Schedule** | Get personalized review recommendations |

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** - [Download](https://python.org)
- **Node.js 16+** - [Download](https://nodejs.org)

### Installation

#### Option 1: Using Start Scripts (Recommended)

**Linux/Mac:**
```bash
# Clone or extract the project
cd knowmetrics-fullstack

# Make script executable and run
chmod +x start-dev.sh
./start-dev.sh
```

**Windows:**
```cmd
# Open Command Prompt in the project folder
start-dev.bat
```

#### Option 2: Manual Setup

**Backend:**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Seed example data (optional)
python seed.py

# Start server
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 📖 User Walkthrough

### 1. Dashboard (Metrics)

The **Metrics** page is your home screen. Here you'll find:

**What you'll see:**
- **Total Quizzes**: Number of quizzes in the system
- **Total Questions**: All questions across all quizzes
- **Study Sessions**: How many times you've practiced
- **Average Score**: Your overall performance

**Charts:**
- **Performance Over Time**: Line chart showing your progress
- **Correct vs Wrong**: Doughnut chart of your answers

**Recent Sessions Table:**
Shows your last study sessions with quiz name, score, accuracy, and duration.

---

### 2. Taking a Quiz

Click **"Start Quiz"** in the sidebar to begin practicing.

**Step 1: Select a Quiz**
- Choose from available quizzes in the dropdown
- Click "Start Quiz" button

**Step 2: Answer Questions**
- Read the question carefully
- Click on your answer choice
- Get immediate feedback:
  - ✅ **Green** = Correct answer
  - ❌ **Red** = Wrong answer (correct one highlighted in green)
- Sound effects indicate right/wrong

**Step 3: View Results**
After completing all questions:
- See your final score (0-10)
- View a pie chart of correct vs wrong answers
- Check performance breakdown by topic
- Option to retry or go back

**Pro Tips:**
- Questions are shuffled each time
- Answer choices are also randomized
- Time spent on each question is tracked

---

### 3. Creating Questions Manually

Click **"Create Question"** to add questions one by one.

**Required Fields:**
1. **Quiz**: Select existing or create new
2. **Topic**: Subject area (e.g., "Algebra", "World War II")
3. **Question Text**: The question itself
4. **Alternatives**: 2-6 answer options
5. **Correct Answer**: Select which alternative is correct

**Optional Fields:**
- **Difficulty**: 1-5 stars (1 = easy, 5 = hard)
- **Explanation**: Why the answer is correct

**Workflow:**
1. Fill in the fields
2. Click "Preview" to see how it looks
3. Click "Save & Add Another" to continue creating
4. Click "Save & Exit" when done

**Keyboard Shortcut:**
- `Ctrl + Enter` = Save & Add Another

---

### 4. Importing Questions from CSV or JSON

For bulk import, use the **"Import Questions"** page.

**Step 1: Prepare Your File**

You can download a CSV template by clicking "Download CSV Template".

**Step 2: Fill the File**

See [CSV Format Reference](#-csv-format-reference) below for the exact format.

**Step 3: Upload**
1. Enter a quiz name
2. Add a description (optional)
3. Click the upload area or drag & drop your file
4. Click "Import Questions"

**Step 4: Review Results**
- See how many questions were imported
- Check for any errors
- Fix issues and re-import if needed

---

### 5. AI Prompt Generator

> 🤖 **This is the fastest way to create quizzes!**

The **Prompt Generator** helps you create optimized prompts for AI tools like ChatGPT or Claude to generate quiz questions automatically.

**How It Works:**

1. **Enter Your Topic**
   - Example: "Brazilian History - Colonial Period"
   - Be specific for better results

2. **Add Subtopics (Optional)**
   - Example: "Independence, Republic, Military Dictatorship"
   - Separate with commas

3. **Configure Options**
   - **Number of questions**: 5, 10, 15, 20, 30, or 50
   - **Difficulty**: Easy, Medium, Hard, or Mixed
   - **Language**: Portuguese or English

4. **Advanced Settings**
   - **Alternatives per question**: 2-6 options
   - **Include explanations**: Yes/No

5. **Generate & Copy**
   - Click "Generate Prompt"
   - A customized prompt will appear
   - Click "Copy Prompt" button

6. **Use with AI**
   - Open [ChatGPT](https://chat.openai.com) or [Claude](https://claude.ai)
   - Paste the prompt
   - The AI will generate questions in CSV format

7. **Download the CSV**
   - If the AI provides a **download button**, click it
   - Otherwise:
     1. Copy the CSV content from the AI response
     2. Open Notepad or any text editor
     3. Paste the content
     4. Save as `.csv` file (use UTF-8 encoding)
     5. Name it something like `quiz_history.csv`

8. **Import the CSV**
   - Go to **"Import Questions"** page
   - Upload your downloaded CSV file
   - Enter a quiz name
   - Click Import
   - Done! Your quiz is ready to use

**Adding Prompt Generator to Sidebar:**

To add this feature to your navigation, edit `Sidebar.js`:

```jsx
// Add to imports at the top
import { Sparkles } from 'lucide-react';

// Add to menuItems array
{ id: 'prompt', label: 'AI Generator', icon: Sparkles },
```

Then in `App.js`, add:
```jsx
// Add import at the top
import PromptGenerator from './components/PromptGenerator';

// Add case in renderPage() function
case 'prompt':
  return <PromptGenerator />;
```

---

### 6. Performance Prediction

Click **"Performance"** to predict exam results.

**Input Required:**
- **Select Quiz**: Choose which quiz to analyze
- **Number of Questions**: How many questions will be on the exam
- **Passing Score**: Minimum score needed to pass

**What You Get:**

1. **Predicted Correct Answers**
   - Based on your historical performance
   - Uses normal distribution model

2. **Estimated Time**
   - How long the exam will take you
   - Based on your average answer time

3. **Pass Probability**
   - Percentage chance of passing
   - Color-coded bar:
     - 🟢 Green (>70%) = Good chances
     - 🟡 Yellow (40-70%) = Moderate risk
     - 🔴 Red (<40%) = High risk

4. **Topic Retention Table**
   - Shows retention rate for each topic
   - Helps identify weak areas

5. **Study Schedule**
   - Prioritized list of topics to review
   - Based on entropy (uncertainty) and familiarity
   - Topics with highest priority need the most attention

---

### 7. Retention Analysis

Click **"Retention"** to analyze your memory retention.

**Overview Cards:**
- **Topics Studied**: Total unique topics
- **Average Retention**: Overall memory retention %
- **Mastered Topics**: Topics with >85% retention
- **Topics at Risk**: Topics needing immediate review

**Topic Status Colors:**
- 🔴 **Critical** (< 50%): Review immediately
- 🟡 **Low** (50-70%): Review soon
- 🟢 **Good** (70-85%): Maintain with occasional review
- ✅ **Mastered** (> 85%): Well learned!

**Visual Elements:**
- **Radar Chart**: Visual map of retention across all topics
- **Full Topic Table**: Detailed breakdown with:
  - Topic name
  - Retention percentage
  - Status badge
  - Time until next review
  - Hours since last practice

**The Science Behind It:**

KnowMetrics uses the **Ebbinghaus Forgetting Curve**:

```
R(t) = p × e^(-λt)
```

Where:
- `R(t)` = Retention at time t
- `p` = Initial learning strength (your accuracy on that topic)
- `λ` = Decay constant (how fast you forget)
- `t` = Time since last review (in hours)

This formula predicts when you'll forget information and schedules reviews at optimal intervals to maximize long-term retention.

---

## 📋 CSV Format Reference

### Required Columns

| Column | Description | Example |
|--------|-------------|---------|
| `topic` | Subject area | "Mathematics" |
| `question_text` | The question | "What is 2+2?" |
| `alternative_1` | First option | "3" |
| `alternative_2` | Second option | "4" |
| `alternative_3` | Third option | "5" |
| `alternative_4` | Fourth option | "6" |
| `correct_answer` | Must match one alternative exactly | "4" |
| `difficulty` | Number 1-5 | "2" |

### Optional Columns

| Column | Description | Example |
|--------|-------------|---------|
| `alternative_5` | Fifth option | "7" |
| `alternative_6` | Sixth option | "8" |
| `explanation` | Why answer is correct | "Basic addition" |

### Example CSV

```csv
topic,question_text,alternative_1,alternative_2,alternative_3,alternative_4,correct_answer,explanation,difficulty
Mathematics,What is 2+2?,3,4,5,6,4,Basic addition: 2+2=4,1
Mathematics,What is 5×5?,20,25,30,35,25,5 multiplied by 5 equals 25,2
History,When did WWII end?,1943,1944,1945,1946,1945,WWII ended in September 1945,3
```

### Important Notes

- Use commas to separate fields
- If a field contains commas, wrap it in double quotes
- Save with **UTF-8 encoding**
- First row must be the header
- `correct_answer` must **exactly match** one of the alternatives

---

## 📋 JSON Format Reference

### Array Format (Recommended)

```json
[
  {
    "topic": "Mathematics",
    "question_text": "What is 2+2?",
    "alternatives": ["3", "4", "5", "6"],
    "correct_answer": "4",
    "explanation": "Basic addition",
    "difficulty": 1
  },
  {
    "topic": "Science",
    "question_text": "What is H2O?",
    "alternatives": ["Water", "Fire", "Air", "Earth"],
    "correct_answer": "Water",
    "difficulty": 2
  }
]
```

### Object Format

```json
{
  "questions": [
    {
      "topic": "Geography",
      "question_text": "Capital of France?",
      "alternatives": ["London", "Berlin", "Paris", "Madrid"],
      "correct_answer": "Paris",
      "difficulty": 1
    }
  ]
}
```

### Portuguese Field Names (Also Supported)

The system automatically maps Portuguese field names:

```json
[
  {
    "tema": "Matemática",
    "pergunta": "Quanto é 2+2?",
    "alternativas": ["3", "4", "5", "6"],
    "resposta": "4",
    "explicacao": "Soma básica",
    "dificuldade": 1
  }
]
```

| Portuguese | English |
|------------|---------|
| `tema` | `topic` |
| `pergunta` | `question_text` |
| `alternativas` | `alternatives` |
| `resposta` | `correct_answer` |
| `explicacao` | `explanation` |
| `dificuldade` | `difficulty` |

---

## 🔌 API Reference

### Base URL

```
http://localhost:8000/api
```

### Quizzes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/quizzes` | List all quizzes |
| POST | `/quizzes` | Create a quiz |
| GET | `/quizzes/{id}` | Get quiz details |
| PUT | `/quizzes/{id}` | Update a quiz |
| DELETE | `/quizzes/{id}` | Delete a quiz |
| POST | `/quizzes/import-csv` | Import from CSV |
| POST | `/quizzes/import-json` | Import from JSON |
| GET | `/quizzes/{id}/export` | Export quiz |
| GET | `/quizzes/csv-template` | Download template |
| GET | `/quizzes/csv-template/columns` | Get column descriptions |

### Questions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/questions` | List questions (with filters) |
| POST | `/questions` | Create question |
| GET | `/questions/{id}` | Get question |
| PUT | `/questions/{id}` | Update question |
| DELETE | `/questions/{id}` | Delete question |
| POST | `/questions/bulk` | Bulk create questions |
| GET | `/questions/random` | Get random question set |
| GET | `/questions/stats/by-topic` | Stats grouped by topic |

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sessions/start` | Start a study session |
| POST | `/sessions/{id}/answer` | Submit an answer |
| POST | `/sessions/{id}/finish` | End session & calculate stats |
| GET | `/sessions` | List all sessions |
| GET | `/sessions/{id}` | Get session details |
| GET | `/sessions/summary` | Get summary statistics |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/dashboard` | Dashboard statistics |
| GET | `/analytics/prediction/{quiz_id}` | Predict performance |
| GET | `/analytics/retention/{quiz_id}` | Retention analysis |
| GET | `/analytics/topics` | All topic statistics |

### Example API Calls

**Start a quiz session:**
```bash
curl -X POST "http://localhost:8000/api/sessions/start" \
  -H "Content-Type: application/json" \
  -d '{"quiz_id": 1, "num_questions": 10}'
```

**Submit an answer:**
```bash
curl -X POST "http://localhost:8000/api/sessions/1/answer" \
  -H "Content-Type: application/json" \
  -d '{"question_id": 1, "user_answer": "4", "time_spent": 5.2}'
```

**Get performance prediction:**
```bash
curl "http://localhost:8000/api/analytics/prediction/1?num_questions=20&passing_score=14"
```

---

## 📁 Project Structure

```
knowmetrics-fullstack/
├── backend/
│   ├── data/                  # SQLite database
│   ├── routes/
│   │   ├── quizzes.py        # Quiz CRUD + import/export
│   │   ├── questions.py      # Question CRUD + bulk
│   │   ├── sessions.py       # Study session management
│   │   └── analytics.py      # Stats & predictions
│   ├── utils/
│   │   └── analytics.py      # Math functions (retention, probability)
│   ├── database.py           # Database configuration
│   ├── models.py             # SQLAlchemy ORM models
│   ├── schemas.py            # Pydantic validation schemas
│   ├── main.py               # FastAPI application entry
│   ├── seed.py               # Example data generator
│   └── requirements.txt      # Python dependencies
│
├── frontend/
│   ├── public/
│   │   └── index.html        # HTML template
│   ├── src/
│   │   ├── components/
│   │   │   ├── Metrics.js           # Dashboard with charts
│   │   │   ├── Quiz.js              # Interactive quiz
│   │   │   ├── CreateQuestion.js    # Manual question creator
│   │   │   ├── ImportQuestions.js   # CSV/JSON import
│   │   │   ├── PromptGenerator.js   # AI prompt generator
│   │   │   ├── PerformancePrediction.js  # Exam prediction
│   │   │   ├── RetentionAnalysis.js # Memory retention
│   │   │   ├── Sidebar.js           # Navigation menu
│   │   │   └── Notification.js      # Toast notifications
│   │   ├── contexts/
│   │   │   └── AppContext.js        # Global state management
│   │   ├── services/
│   │   │   └── api.js               # API client functions
│   │   ├── App.js                   # Main application component
│   │   └── index.css                # Tailwind + custom styles
│   ├── package.json                 # Node.js dependencies
│   ├── tailwind.config.js           # Tailwind configuration
│   └── postcss.config.js            # PostCSS configuration
│
├── start-dev.sh              # Linux/Mac startup script
├── start-dev.bat             # Windows startup script
└── README.md                 # This documentation
```

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Modern Python web framework |
| **SQLAlchemy** | Database ORM |
| **SQLite** | Lightweight database |
| **Pydantic** | Data validation |
| **Pandas** | CSV processing |
| **Uvicorn** | ASGI server |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **Tailwind CSS** | Utility-first styling |
| **Chart.js** | Beautiful charts |
| **react-chartjs-2** | React wrapper for Chart.js |
| **Lucide React** | Modern icons |

### Analytics & Science
| Model | Purpose |
|-------|---------|
| **Ebbinghaus Curve** | Memory retention prediction |
| **Normal Distribution** | Pass probability calculation |
| **Entropy Calculation** | Topic complexity analysis |
| **Error Function (erf)** | Statistical computations |

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test new features thoroughly
- Update README if adding features

### Ideas for Contribution

- [ ] Dark/Light theme toggle
- [ ] Export study reports as PDF
- [ ] Multiplayer quiz mode
- [ ] Mobile app version
- [ ] Integration with Anki
- [ ] Gamification (badges, streaks)

---

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 👨‍💻 Author

**Lui Loureiro**

- GitHub: [@luiloureiro](https://github.com/luiloureiro)

---

## 🙏 Acknowledgments

- **Hermann Ebbinghaus** - For the forgetting curve research
- **Sebastian Leitner** - For spaced repetition concepts
- **Open Source Community** - For amazing tools and libraries

---

<div align="center">
  
  ### ⭐ Star this repo if you find it helpful!
  
  <p>Made with ❤️ for learners everywhere</p>
  
  <p><strong>KnowMetrics v2.0</strong></p>
  
</div>