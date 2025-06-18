@echo off
setlocal enabledelayedexpansion

:: DataPilot Windows Installation Script
:: Handles common Windows npm install issues and provides fallback options

echo.
echo ===============================================
echo    DataPilot CLI - Windows Installation
echo ===============================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARNING] Not running as Administrator
    echo [INFO] Some installation methods may require Administrator privileges
    echo.
)

:: Check Node.js installation
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo [INFO] Please download and install Node.js from https://nodejs.org/
    echo [INFO] Minimum required version: Node.js 18+
    pause
    exit /b 1
)

echo [OK] Node.js found: 
node --version

:: Check npm installation
echo [2/6] Checking npm installation...
npm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] npm is not available
    echo [INFO] npm should be installed with Node.js
    pause
    exit /b 1
)

echo [OK] npm found: 
npm --version

:: Clear npm cache to prevent hanging issues
echo [3/6] Clearing npm cache...
npm cache clean --force >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARNING] Could not clear npm cache, continuing anyway...
) else (
    echo [OK] npm cache cleared
)

:: Configure npm for Windows optimization
echo [4/6] Configuring npm for Windows...
npm config set fetch-timeout 300000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set fetch-retries 3
npm config set prefer-offline true
npm config set audit false
npm config set maxsockets 15
echo [OK] npm configuration optimized for Windows

:: Attempt installation with multiple fallback methods
echo [5/6] Installing DataPilot CLI...
echo.

:: Method 1: Standard installation with optimized flags
echo Attempting Method 1: Standard installation with optimized flags...
npm install -g datapilot-cli --no-audit --prefer-offline --silent
if %errorLevel% equ 0 (
    echo [SUCCESS] DataPilot CLI installed successfully!
    goto :verify_installation
)

echo [FAILED] Method 1 failed, trying Method 2...
echo.

:: Method 2: Installation with unsafe-perm (for permission issues)
echo Attempting Method 2: Installation with unsafe-perm...
npm install -g datapilot-cli --unsafe-perm --no-audit --prefer-offline --silent
if %errorLevel% equ 0 (
    echo [SUCCESS] DataPilot CLI installed successfully!
    goto :verify_installation
)

echo [FAILED] Method 2 failed, trying Method 3...
echo.

:: Method 3: Check for yarn and try with yarn
where yarn >nul 2>&1
if %errorLevel% equ 0 (
    echo Attempting Method 3: Installation with Yarn...
    yarn global add datapilot-cli --silent
    if !errorLevel! equ 0 (
        echo [SUCCESS] DataPilot CLI installed successfully with Yarn!
        goto :verify_installation
    )
    echo [FAILED] Method 3 with Yarn failed, trying Method 4...
    echo.
)

:: Method 4: Check for pnpm and try with pnpm
where pnpm >nul 2>&1
if %errorLevel% equ 0 (
    echo Attempting Method 4: Installation with pnpm...
    pnpm add -g datapilot-cli --silent
    if !errorLevel! equ 0 (
        echo [SUCCESS] DataPilot CLI installed successfully with pnpm!
        goto :verify_installation
    )
    echo [FAILED] Method 4 with pnpm failed
    echo.
)

:: All methods failed
echo.
echo ===============================================
echo    INSTALLATION FAILED
echo ===============================================
echo.
echo All installation methods failed. Please try:
echo.
echo 1. Manual installation:
echo    npm install -g datapilot-cli
echo.
echo 2. Check Windows installation guide:
echo    docs/WINDOWS_INSTALL.md
echo.
echo 3. Download offline package from:
echo    https://github.com/Mrassimo/datapilot/releases
echo.
echo 4. Report issue at:
echo    https://github.com/Mrassimo/datapilot/issues
echo.
pause
exit /b 1

:verify_installation
echo.
echo [6/6] Verifying installation...

:: Test if datapilot command is available
datapilot --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARNING] datapilot command not found in PATH
    echo [INFO] You may need to restart your command prompt
    echo [INFO] Or add npm global directory to PATH
    goto :installation_complete
)

echo [OK] DataPilot CLI is working correctly!
echo.
datapilot --version

:installation_complete
echo.
echo ===============================================
echo    INSTALLATION COMPLETE
echo ===============================================
echo.
echo DataPilot CLI has been installed successfully!
echo.
echo Quick start:
echo   datapilot --help           Show help
echo   datapilot file.csv         Analyze CSV file
echo   datapilot *.csv            Analyze multiple files
echo.
echo Documentation:
echo   README.md                  General documentation
echo   docs/WINDOWS_INSTALL.md    Windows-specific help
echo.
echo Support:
echo   https://github.com/Mrassimo/datapilot/issues
echo.

:: Check if we should keep the window open
if "%1" neq "--no-pause" (
    echo Press any key to exit...
    pause >nul
)

endlocal