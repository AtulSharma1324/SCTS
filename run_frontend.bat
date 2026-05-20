@echo off
title SCTS Frontend Server
echo ==================================================
echo   Starting Smart Classroom (SCTS) Next.js Frontend
echo ==================================================
:: Change directory and drive to the frontend folder where this script is located
cd /d "%~dp0frontend"
echo Executing npm run dev...
call npm run dev
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Failed to start the frontend server.
    echo Please make sure Node.js (npm) is installed and available in your PATH.
    echo.
)
pause
