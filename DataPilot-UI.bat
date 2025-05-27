@echo off
REM DataPilot Interactive UI Launcher (Windows)
REM Double-click this file to launch DataPilot's interactive UI!

REM Get the directory where this script is located
set "DIR=%~dp0"

REM Clear terminal and show welcome
cls
echo 🚀 Starting DataPilot Interactive UI...
echo.

REM Change to the DataPilot directory
cd /d "%DIR%"

REM Launch the interactive UI
if exist "%DIR%dist\datapilot.js" (
    node "%DIR%dist\datapilot.js" ui
) else if exist "%DIR%bin\datapilot.js" (
    node "%DIR%bin\datapilot.js" ui
) else (
    echo ❌ Error: DataPilot not found.
    echo Please run 'npm run build' first.
    echo.
    pause
    exit /b 1
)

REM Keep terminal open when done
echo.
echo 👋 Thanks for using DataPilot!
pause