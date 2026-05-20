@echo off
title SCTS Backend Server
echo ==================================================
echo   Starting Smart Classroom (SCTS) Backend Server
echo ==================================================
:: Change directory and drive to the backend folder where this script is located
cd /d "%~dp0backend"
echo Executing Maven spring-boot:run...
call "%~dp0apache-maven-3.9.6\bin\mvn.cmd" spring-boot:run
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Failed to start the backend server.
    echo Please make sure you have JDK 17+ installed and configured in your PATH.
    echo.
)
pause
