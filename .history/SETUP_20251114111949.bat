@echo off
REM Automated Setup Script for New Developers
REM This script sets up the Playwright project automatically

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     Playwright JustPayTo - Automated Setup Script         ║
echo ║                                                            ║
echo ║     This will install all dependencies and set up          ║
echo ║     the project automatically                              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
echo ⏳ Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo (Choose the LTS version)
    echo.
    echo After installation, run this script again.
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js is installed
node --version

echo.
echo ⏳ Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ ERROR: npm is not installed!
    echo Please reinstall Node.js
    echo.
    pause
    exit /b 1
)

echo ✅ npm is installed
npm --version

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           Installing Project Dependencies...              ║
echo ║                                                            ║
echo ║     This may take 5-10 minutes on first run               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo ⏳ Installing npm packages...
call npm install
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Failed to install npm packages
    echo.
    pause
    exit /b 1
)

echo ✅ npm packages installed successfully

echo.
echo ⏳ Installing Playwright browsers...
call npx playwright install --with-deps
if errorlevel 1 (
    echo.
    echo ⚠️  WARNING: Playwright browser installation had issues
    echo    But this is usually not critical
    echo.
)

echo ✅ Setup complete!

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              🎉 Setup Complete! 🎉                        ║
echo ║                                                            ║
echo ║  Next Steps:                                              ║
echo ║  1. Create .env file in project root with credentials     ║
echo ║     (ask your team lead for the .env file)                ║
echo ║                                                            ║
echo ║  2. Run the Test Suite:                                   ║
echo ║     Double-click: RUN_TEST_SUITE.bat                      ║
echo ║                                                            ║
echo ║  3. Or run tests from command line:                       ║
echo ║     npx playwright test                                   ║
echo ║                                                            ║
echo ║  See SETUP_GUIDE.md for detailed instructions             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

pause
