@echo off
REM KnowMetrics Development Startup Script for Windows
REM =================================================

echo.
echo Starting KnowMetrics Development Environment...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install Python 3.8+
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed. Please install Node.js 16+
    pause
    exit /b 1
)

REM Navigate to project root
cd /d "%~dp0"

REM Setup Backend
echo Setting up Backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt -q

REM Run seed script if database is empty
if not exist "data\knowmetrics.db" (
    echo Seeding database with example data...
    python seed.py
)

REM Start backend server in new window
echo Starting Backend on http://localhost:8000
start "KnowMetrics Backend" cmd /k "venv\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

cd ..

REM Setup Frontend
echo.
echo Setting up Frontend...
cd frontend

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    call npm install
)

REM Start frontend server in new window
echo Starting Frontend on http://localhost:3000
start "KnowMetrics Frontend" cmd /k "npm start"

cd ..

echo.
echo ====================================
echo   KnowMetrics is starting!
echo ====================================
echo.
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo Close the backend and frontend windows to stop services.
echo.
pause
