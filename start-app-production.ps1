# IIB Chat Application - Production Startup Script
# This script starts both the backend server and frontend application

Write-Host "🚀 Starting IIB Chat Application..." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

# Check if MongoDB is running
Write-Host "🔍 Checking MongoDB connection..." -ForegroundColor Yellow
try {
    $mongoTest = Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet
    if ($mongoTest.TcpTestSucceeded) {
        Write-Host "✅ MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "❌ MongoDB is not running. Please start MongoDB first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Could not check MongoDB status. Please ensure MongoDB is installed and running." -ForegroundColor Red
    exit 1
}

# Start Backend Server
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; Write-Host '🖥️ Backend Server Starting...' -ForegroundColor Green; npm start"

# Wait for backend to start
Write-Host "⏳ Waiting for backend server to start..." -ForegroundColor Yellow
Start-Sleep 5

# Check if backend is running
$backendRunning = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 2
        if ($response.status -eq "ok") {
            Write-Host "✅ Backend server is running successfully" -ForegroundColor Green
            $backendRunning = $true
            break
        }
    } catch {
        Write-Host "⏳ Waiting for backend... (attempt $i/10)" -ForegroundColor Yellow
        Start-Sleep 2
    }
}

if (-not $backendRunning) {
    Write-Host "❌ Backend server failed to start. Please check the logs." -ForegroundColor Red
    exit 1
}

# Start Frontend Application
Write-Host "🎨 Starting Frontend Application..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🌐 Frontend Application Starting...' -ForegroundColor Green; npm run dev"

# Wait for frontend to start
Write-Host "⏳ Waiting for frontend application to start..." -ForegroundColor Yellow
Start-Sleep 5

# Check if frontend is running
$frontendRunning = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5173" -Method GET -TimeoutSec 2
        Write-Host "✅ Frontend application is running successfully" -ForegroundColor Green
        $frontendRunning = $true
        break
    } catch {
        Write-Host "⏳ Waiting for frontend... (attempt $i/10)" -ForegroundColor Yellow
        Start-Sleep 2
    }
}

if (-not $frontendRunning) {
    Write-Host "❌ Frontend application failed to start. Please check the logs." -ForegroundColor Red
    exit 1
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🎉 IIB Chat Application Started Successfully!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://localhost:3000/api" -ForegroundColor Cyan
Write-Host "👤 Default Admin: admin@iibchat.com / Admin123" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Yellow

# Keep the script running
try {
    while ($true) {
        Start-Sleep 1
    }
} catch {
    Write-Host "🛑 Application stopped" -ForegroundColor Red
} 