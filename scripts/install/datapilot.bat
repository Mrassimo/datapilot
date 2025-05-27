@echo off
REM DataPilot Short Command Launcher for Windows
REM Usage: datapilot.bat [command] [args...]
REM Makes running DataPilot as simple as: datapilot ui

REM Get the directory where this script is located
set "DIR=%~dp0"

REM Check if we have the bundled version
if exist "%DIR%dist\datapilot.js" (
    REM Use the bundled version (fastest)
    node "%DIR%dist\datapilot.js" %*
) else if exist "%DIR%bin\datapilot.js" (
    REM Fall back to unbundled version
    node "%DIR%bin\datapilot.js" %*
) else (
    echo Error: DataPilot not found. Please run 'npm run build' first.
    exit /b 1
)