@echo off
REM DataPilot TUI Windows Test Runner
REM This script runs automated TUI tests on Windows

echo DataPilot TUI Windows Test Suite
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Get current directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%.."

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to install dependencies
        exit /b 1
    )
)

echo Running automated TUI tests...
echo.

REM Set environment variables for Windows
set FORCE_COLOR=0
set NO_COLOR=1
set NODE_ENV=test

REM Run the automated test suite
node tests\automated_tui_test.js

REM Capture exit code
set TEST_RESULT=%ERRORLEVEL%

echo.
echo ================================

if %TEST_RESULT% EQU 0 (
    echo All tests passed!
) else (
    echo Some tests failed. Check the report for details.
)

REM Run additional Windows-specific clipboard test if available
if exist "tests\windows_clipboard_test.js" (
    echo.
    echo Running Windows clipboard tests...
    node tests\windows_clipboard_test.js
)

exit /b %TEST_RESULT%