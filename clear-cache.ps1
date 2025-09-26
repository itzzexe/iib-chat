# Clear Cache and Restart Application
Write-Host "🧹 Clearing application cache..." -ForegroundColor Yellow

# Stop any running processes on port 3000 and 5173
Write-Host "🛑 Stopping existing processes..." -ForegroundColor Blue
$processes = Get-NetTCPConnection -LocalPort 3000,5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
foreach ($processId in $processes) {
    try {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Host "   Stopped process $processId" -ForegroundColor Green
    } catch {
        Write-Host "   Could not stop process $processId" -ForegroundColor Red
    }
}

# Clear npm cache
Write-Host "📦 Clearing npm cache..." -ForegroundColor Blue
npm cache clean --force

# Clear browser cache (instructions)
Write-Host "🌐 To clear browser cache:" -ForegroundColor Cyan
Write-Host "   1. Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)" -ForegroundColor White
Write-Host "   2. Or press F12 -> Application -> Clear Storage -> Clear site data" -ForegroundColor White

# Restart server
Write-Host "🚀 Starting server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start"

# Wait a moment
Start-Sleep -Seconds 3

# Start frontend
Write-Host "🎨 Starting frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "✅ Application restarted!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:3000" -ForegroundColor Cyan 