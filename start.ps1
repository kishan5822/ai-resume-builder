# AI Resume Builder - Start Script
# This script helps you start the development servers

Write-Host "🚀 AI Resume Builder - Starting..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if Tectonic is installed
Write-Host "Checking Tectonic installation..." -ForegroundColor Yellow
try {
    $tectonicVersion = tectonic --version
    Write-Host "✅ Tectonic is installed: $tectonicVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Tectonic is not installed or not in PATH" -ForegroundColor Yellow
    Write-Host "LaTeX compilation will not work without Tectonic" -ForegroundColor Yellow
    Write-Host "Install it with: choco install tectonic" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

Write-Host ""
Write-Host "Checking if dependencies are installed..." -ForegroundColor Yellow

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing root dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "server/node_modules")) {
    Write-Host "Installing server dependencies..." -ForegroundColor Yellow
    cd server
    npm install
    cd ..
}

if (-not (Test-Path "client/node_modules")) {
    Write-Host "Installing client dependencies..." -ForegroundColor Yellow
    cd client
    npm install
    cd ..
}

Write-Host ""
Write-Host "✅ All dependencies are installed!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting development servers..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Backend will run on: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🎨 Frontend will run on: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the servers" -ForegroundColor Yellow
Write-Host ""

# Start the application
npm run dev
