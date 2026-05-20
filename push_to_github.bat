@echo off
title SCTS Push to GitHub Helper
echo ==================================================
echo   Smart Classroom (SCTS) GitHub Push Helper
echo ==================================================
echo.

:: Check if git is installed
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Git is not installed or not in your system PATH!
    echo Please download and install Git from: https://git-scm.com/
    echo.
    pause
    exit /b
)

:: Change to script directory and ensure we are on the D: drive
cd /d "%~dp0"

:: Check if Git username and email are configured
git config --get user.email >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ==================================================
    echo   First-Time Git Setup (Identity Configuration)
    echo ==================================================
    echo It looks like Git is newly installed! We need to set
    echo your name and email so Git can attribute your commits.
    echo.
    set /p GIT_EMAIL="Enter your GitHub email address: "
    set /p GIT_NAME="Enter your name/GitHub username: "
    echo.
    
    git config --global user.email "%GIT_EMAIL%"
    git config --global user.name "%GIT_NAME%"
    echo Identity configured successfully!
    echo ==================================================
    echo.
)

:: Initialize repository if not already done
if not exist .git (
    echo Initializing Git repository...
    git init
    git branch -M main
    echo.
) else (
    echo Git repository already initialized.
    echo.
)

:: Stage and commit
echo Staging SCTS project files...
git add .
echo.
echo Committing files...
git commit -m "Initial commit of SCTS project (Next.js + Spring Boot)"
echo.

:: Ask for remote repository URL
echo Paste the HTTPS URL of your new GitHub repository.
echo.
set /p REPO_URL="Paste your GitHub Repository HTTPS URL here: "

if "%REPO_URL%"=="" (
    echo ERROR: Repository URL cannot be empty!
    pause
    exit /b
)

:: Set remote origin
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo.
echo ==================================================
echo   Pushing code to GitHub on branch 'main'...
echo ==================================================
git push -f -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo SUCCESS: Project successfully pushed to GitHub!
    echo.
) else (
    echo.
    echo ERROR: Failed to push to GitHub. 
    echo Please make sure you have created the repository on GitHub and have correct permissions/logged in.
    echo.
)

pause
