@echo off
REM Create Desktop Shortcut for Playwright Test Runner
REM This allows QA to access the test runner directly from Desktop

setlocal enabledelayedexpansion

set "BATCH_FILE=%~dp0RUN_TEST_SUITE.bat"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_NAME=Playwright Test Runner"

echo.
echo Creating desktop shortcut for Playwright Test Runner...
echo.

REM Create VBS script to generate shortcut
(
    echo Set oWS = WScript.CreateObject("WScript.Shell"^)
    echo sLinkFile = "%DESKTOP%\%SHORTCUT_NAME%.lnk"
    echo Set oLink = oWS.CreateShortCut(sLinkFile^)
    echo oLink.TargetPath = "%BATCH_FILE%"
    echo oLink.WorkingDirectory = "%~dp0."
    echo oLink.Description = "Playwright QA Test Runner - Non-technical dashboard for running tests"
    echo oLink.IconLocation = "cmd.exe"
    echo oLink.Save
) > "%TEMP%\create_shortcut.vbs"

cscript "%TEMP%\create_shortcut.vbs"

if exist "%DESKTOP%\%SHORTCUT_NAME%.lnk" (
    echo ✅ SUCCESS!
    echo.
    echo Desktop shortcut created: "%SHORTCUT_NAME%.lnk"
    echo.
    echo 🎯 You can now:
    echo    1. Go to Desktop
    echo    2. Double-click "%SHORTCUT_NAME%"
    echo    3. Test runner opens automatically!
    echo.
) else (
    echo ❌ Failed to create shortcut
    echo Please run this file with Administrator privileges
)

REM Cleanup
del "%TEMP%\create_shortcut.vbs" 2>nul

pause
