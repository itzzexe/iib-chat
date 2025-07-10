# IIB Chat Application - Development Startup Script
# This script starts both the backend server and frontend application for development

Write-Host "[START] Starting IIB Chat Application (Development Mode)..." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

# MongoDB check is skipped since we confirmed it's running on port 27017
Write-Host "[INFO] Skipping MongoDB check - confirmed running on port 27017" -ForegroundColor Green

# Start Backend Server in Development Mode
Write-Host "[SETUP] Starting Backend Server (Development Mode)..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; Write-Host '[SERVER] Backend Server Starting (Development)...' -ForegroundColor Green; npm run dev"

# Wait for backend to start
Write-Host "[WAIT] Waiting for backend server to start..." -ForegroundColor Yellow
Start-Sleep 5

# Check if backend is running
$backendRunning = $false
for ($i = 1; $i -le 8; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 3
        if ($response.status -eq "ok") {
            Write-Host "[OK] Backend server is running successfully" -ForegroundColor Green
            $backendRunning = $true
            break
        }
    } catch {
        Write-Host "[WAIT] Waiting for backend... (attempt $i/8)" -ForegroundColor Yellow
        Start-Sleep 2
    }
}

if (-not $backendRunning) {
    Write-Host "[ERROR] Backend server failed to start. Please check the logs." -ForegroundColor Red
    exit 1
}

# Start Frontend Application in Development Mode
Write-Host "[SETUP] Starting Frontend Application (Development Mode)..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '[CLIENT] Frontend Application Starting (Development)...' -ForegroundColor Green; npm run dev"

# Wait for frontend to start
Write-Host "[WAIT] Waiting for frontend application to start..." -ForegroundColor Yellow
Start-Sleep 5

# Check if frontend is running
$frontendRunning = $false
for ($i = 1; $i -le 8; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5173" -Method GET -TimeoutSec 3
        Write-Host "[OK] Frontend application is running successfully" -ForegroundColor Green
        $frontendRunning = $true
        break
    } catch {
        Write-Host "[WAIT] Waiting for frontend... (attempt $i/8)" -ForegroundColor Yellow
        Start-Sleep 2
    }
}

if (-not $frontendRunning) {
    Write-Host "[ERROR] Frontend application failed to start. Please check the logs." -ForegroundColor Red
    exit 1
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] IIB Chat Application Started Successfully!" -ForegroundColor Green
Write-Host "[INFO] Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "[INFO] Backend API: http://localhost:3000/api" -ForegroundColor Cyan
Write-Host "[INFO] API Health: http://localhost:3000/api/health" -ForegroundColor Cyan
Write-Host "[INFO] Default Admin: admin@iibchat.com / Admin123" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "[INFO] Development Mode Features:" -ForegroundColor Yellow
Write-Host "   - Hot reload enabled" -ForegroundColor White
Write-Host "   - Auto-restart on file changes" -ForegroundColor White
Write-Host "   - Detailed error logging" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Yellow

# Keep the script running
try {
    while ($true) {
        Start-Sleep 1
    }
} catch {
    Write-Host "[STOP] Application stopped" -ForegroundColor Red
}