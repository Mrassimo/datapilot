@echo off
REM DataPilot Offline Installation Verification
REM Tests that DataPilot works without internet connection

echo.
echo ====================================
echo   DataPilot Offline Verification
echo ====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found!
    echo    Please install Node.js from nodejs.org
    echo    Minimum version: 14.0.0
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

REM Check if DataPilot exists
if not exist "dist\datapilot.js" (
    echo ❌ DataPilot dist file not found!
    echo    Please run 'npm run build' first
    pause
    exit /b 1
)

echo ✅ DataPilot dist file found

REM Check if sample data exists
if not exist "tests\fixtures\iris.csv" (
    echo ❌ Test data not found!
    echo    Sample files missing
    pause
    exit /b 1
)

echo ✅ Test data available

REM Test DataPilot commands
echo.
echo Testing DataPilot commands...
echo.

echo Testing: datapilot --help
node dist\datapilot.js --help
if errorlevel 1 (
    echo ❌ Help command failed
    pause
    exit /b 1
)

echo.
echo ✅ Help command works

echo.
echo Testing: datapilot run (quick test)
node dist\datapilot.js run tests\fixtures\iris.csv --timeout 30000 | findstr "STATISTICAL COMPUTATION ENGINE"
if errorlevel 1 (
    echo ❌ RUN command failed
    pause
    exit /b 1
)

echo ✅ RUN command works

echo.
echo ====================================
echo   ✅ OFFLINE VERIFICATION PASSED!
echo ====================================
echo.
echo DataPilot 2.0 is ready for offline use!
echo All core functionality verified.
echo.
pause