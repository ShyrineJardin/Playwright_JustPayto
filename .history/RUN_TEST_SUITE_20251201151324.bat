@echo off
REM Playwright Test Runner - GUI Launcher for Windows
REM Non-technical QA staff can double-click this file to start the test runner

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   Playwright QA Test Runner - Starting...                 ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Change to the directory where this batch file is located
cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo ⏳ Installing dependencies... This may take a minute.
    call npm install
    if errorlevel 1 (
        echo.
        echo ❌ ERROR: Failed to install dependencies
        echo Please ensure Node.js is installed: https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
)

REM Check if express is installed
if not exist "node_modules\express" (
    echo ⏳ Installing Express... 
    call npm install express body-parser open
)

echo ✅ Dependencies ready
echo.
echo 🌐 Opening browser to http://localhost:3000
echo.
echo ⏳ Test Runner is starting... Your browser should open automatically.
echo.
echo 📌 If browser doesn't open:
echo    1. Wait 3 seconds for server to start
echo    2. Manually go to: http://localhost:3000
echo    3. Close this window when done testing
echo.

REM Start the server
node gui/test-runner.js

pause
