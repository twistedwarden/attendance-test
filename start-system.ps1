Write-Host "Starting ATM System..." -ForegroundColor Green
Write-Host ""

# Kill any existing Node processes
Write-Host "Killing any existing Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host ""
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd backend && node server.js" -WindowStyle Normal

Write-Host ""
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Start-Process -FilePath "cmd" -ArgumentList "/k", "npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "System starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers..." -ForegroundColor Red

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host ""
    Write-Host "Stopping all servers..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "System stopped." -ForegroundColor Red
}

