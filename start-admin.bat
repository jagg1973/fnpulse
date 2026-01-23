@echo off
echo ========================================
echo    FNPulse Admin Dashboard Starter
echo ========================================
echo.

REM Navigate to admin directory
cd /d "%~dp0admin"

echo [1/3] Checking for processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo       Found process %%a using port 3000
    echo       Killing process...
    taskkill /F /PID %%a >nul 2>&1
    echo       Process terminated
)

echo.
echo [2/3] Starting admin server...
echo.

REM Start the server
npm start

echo.
echo Server stopped.
pause
