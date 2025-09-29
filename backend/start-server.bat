@echo off
echo ========================================
echo    ATM Backend Server Manager
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json not found
    echo Please run this script from the backend directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found
    echo Creating default .env file...
    copy "env.example" ".env" >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Failed to create .env file
        pause
        exit /b 1
    )
    echo ✅ Created .env file from env.example
    echo Please edit .env file with your configuration
)

echo 🚀 Starting ATM Backend Server...
echo.
echo Server will automatically restart on crashes
echo Press Ctrl+C to stop the server
echo.

REM Start the enhanced server with auto-restart
node start-server.js

echo.
echo Server stopped.
pause
