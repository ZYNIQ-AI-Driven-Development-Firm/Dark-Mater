@echo off
echo Setting up Dark Matter MCP...
echo.

REM Check if .env exists
if not exist .env (
    echo Copying .env.example to .env...
    copy .env.example .env
    echo.
    echo Please edit .env file with your SMTP credentials before continuing!
    echo Required settings:
    echo   SMTP_USER=your-email@gmail.com
    echo   SMTP_PASS=your-gmail-app-password
    echo.
    pause
)

REM Install frontend dependencies
echo Installing frontend dependencies...
npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies
    pause
    exit /b 1
)

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo Setup complete! To run the application:
echo.
echo 1. Start Redis: redis-server
echo 2. Start Backend: cd backend ^&^& python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo 3. Start Frontend: npm run dev
echo.
echo Or use Docker: docker-compose up -d
echo.
pause