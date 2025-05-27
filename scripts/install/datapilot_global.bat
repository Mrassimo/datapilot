@echo off
REM DataPilot Global Launcher
REM Place this file in a directory that's in your PATH
REM Or add the DataPilot directory to your PATH

setlocal

REM Set the path to your DataPilot installation
REM UPDATE THIS PATH to match your installation location
set DATAPILOT_PATH=C:\Users\61414\Documents\Code\datapilot

REM Check if DataPilot exists at the specified path
if not exist "%DATAPILOT_PATH%\dist\datapilot.js" (
    echo Error: DataPilot not found at %DATAPILOT_PATH%
    echo Please update the DATAPILOT_PATH in this batch file
    exit /b 1
)

REM Run DataPilot with all arguments passed to this batch file
node "%DATAPILOT_PATH%\dist\datapilot.js" %*
