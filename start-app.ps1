# Start the application - both frontend and backend

Write-Host "Starting IIB Chat Application..." -ForegroundColor Green

# Check if MongoDB is running
Write-Host "Checking MongoDB connection..." -ForegroundColor Yellow
$mongoRunning = $false
try {
    $tcpConnection = Test-NetConnection -ComputerName localhost -Port 27017 -ErrorAction SilentlyContinue
    if ($tcpConnection.TcpTestSucceeded) {
        $mongoRunning = $true
        Write-Host "MongoDB is running on port 27017" -ForegroundColor Green
    }
} catch {
    # Ignore errors
}

if (-not $mongoRunning) {
    Write-Host "WARNING: MongoDB doesn't appear to be running on port 27017" -ForegroundColor Red
    Write-Host "Please ensure MongoDB is installed and running before starting the application" -ForegroundColor Yellow
    Write-Host "You can install MongoDB from: https://www.mongodb.com/try/download/community" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit
    }
}

# Start backend server
Write-Host "`nStarting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start" -WindowStyle Normal

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend development server
Write-Host "Starting frontend development server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host "`nApplication started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nPress any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 