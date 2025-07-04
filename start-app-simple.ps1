# Start the IIB Chat application without MongoDB

Write-Host "Starting IIB Chat Application (JSON Database Mode)..." -ForegroundColor Green
Write-Host "No MongoDB required - using local JSON files for data storage" -ForegroundColor Yellow
Write-Host ""

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start" -WindowStyle Normal

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend development server
Write-Host "Starting frontend development server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host "`nApplication started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nDefault Admin Credentials:" -ForegroundColor Yellow
Write-Host "Email: admin@iibchat.com" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
Write-Host "`nPress any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 