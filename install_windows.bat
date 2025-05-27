@echo off
REM DataPilot Windows Installer
REM This script sets up DataPilot for easy global usage

echo.
echo ====================================
echo   DataPilot Installation Script
echo ====================================
echo.

REM Get the current directory (where DataPilot is installed)
set DATAPILOT_DIR=%~dp0
set DATAPILOT_DIR=%DATAPILOT_DIR:~0,-1%

echo DataPilot directory: %DATAPILOT_DIR%
echo.

REM Check if dist/datapilot.js exists
if not exist "%DATAPILOT_DIR%\dist\datapilot.js" (
    echo Error: dist\datapilot.js not found!
    echo Please run 'npm run build' first.
    pause
    exit /b 1
)

echo Choose installation method:
echo 1. Add DataPilot directory to PATH (Recommended)
echo 2. Create datapilot.bat in Windows directory
echo 3. Setup PowerShell alias only
echo 4. All of the above
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto addpath
if "%choice%"=="2" goto copybat
if "%choice%"=="3" goto psonly
if "%choice%"=="4" goto all
goto invalid

:addpath
echo.
echo Adding DataPilot to PATH...
REM Add to user PATH
setx PATH "%PATH%;%DATAPILOT_DIR%"
echo DataPilot directory added to PATH!
echo You may need to restart your terminal for changes to take effect.
goto done

:copybat
echo.
echo Creating global batch file...
REM Create a batch file in Windows directory
echo @echo off > "%WINDIR%\datapilot.bat"
echo node "%DATAPILOT_DIR%\dist\datapilot.js" %%* >> "%WINDIR%\datapilot.bat"
echo Global datapilot command created!
goto done

:psonly
echo.
echo Setting up PowerShell...
goto setupps

:all
echo.
echo Performing complete installation...
REM Add to PATH
setx PATH "%PATH%;%DATAPILOT_DIR%"
REM Create batch file
echo @echo off > "%WINDIR%\datapilot.bat"
echo node "%DATAPILOT_DIR%\dist\datapilot.js" %%* >> "%WINDIR%\datapilot.bat"
goto setupps

:setupps
echo.
echo Setting up PowerShell module...
REM Get PowerShell module path
powershell -Command "if (!(Test-Path $env:USERPROFILE\Documents\WindowsPowerShell\Modules\DataPilot)) { New-Item -ItemType Directory -Path $env:USERPROFILE\Documents\WindowsPowerShell\Modules\DataPilot -Force }"

REM Update the module with correct path
powershell -Command "(Get-Content '%DATAPILOT_DIR%\DataPilot.psm1') -replace 'C:\\Users\\61414\\Documents\\Code\\datapilot', '%DATAPILOT_DIR%' | Set-Content '$env:USERPROFILE\Documents\WindowsPowerShell\Modules\DataPilot\DataPilot.psm1'"

echo PowerShell module installed!
echo Add this line to your PowerShell profile to auto-load:
echo Import-Module DataPilot
goto done

:invalid
echo Invalid choice!
pause
exit /b 1

:done
echo.
echo ====================================
echo   Installation Complete!
echo ====================================
echo.
echo You can now use DataPilot from anywhere:
echo   datapilot ui
echo   datapilot all mydata.csv
echo   datapilot help
echo.
echo For detailed usage, see EASY_INSTALL.md
echo.
pause
