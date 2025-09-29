@echo off
echo Starting ATM System...
echo.

echo Killing any existing Node processes...
taskkill /F /IM node.exe 2>nul

echo.
echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "node server.js"
cd ..

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo System starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press any key to stop all servers...
pause >nul

echo.
echo Stopping all servers...
taskkill /F /IM node.exe 2>nul
echo System stopped.

