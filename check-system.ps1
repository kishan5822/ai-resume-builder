# AI Resume Builder - System Check
# This script checks if all prerequisites are installed

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         AI Resume Builder - System Check                 ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Node.js
Write-Host "1. Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    $npmVersion = npm --version 2>$null
    
    if ($nodeVersion) {
        Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
        Write-Host "   ✅ npm: v$npmVersion" -ForegroundColor Green
    } else {
        throw "Not found"
    }
} catch {
    Write-Host "   ❌ Node.js is NOT installed" -ForegroundColor Red
    Write-Host "   📥 Download from: https://nodejs.org/" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""

# Check Tectonic
Write-Host "2. Checking Tectonic (LaTeX Compiler)..." -ForegroundColor Yellow
try {
    $tectonicVersion = tectonic --version 2>$null
    
    if ($tectonicVersion) {
        Write-Host "   ✅ Tectonic: $tectonicVersion" -ForegroundColor Green
    } else {
        throw "Not found"
    }
} catch {
    Write-Host "   ❌ Tectonic is NOT installed" -ForegroundColor Red
    Write-Host "   📥 Install with: choco install tectonic" -ForegroundColor Yellow
    Write-Host "   📥 Or download from: https://github.com/tectonic-typesetting/tectonic/releases" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""

# Check Git (optional)
Write-Host "3. Checking Git (optional)..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>$null
    
    if ($gitVersion) {
        Write-Host "   ✅ $gitVersion" -ForegroundColor Green
    } else {
        throw "Not found"
    }
} catch {
    Write-Host "   ⚠️  Git is not installed (optional)" -ForegroundColor Yellow
    Write-Host "   📥 Download from: https://git-scm.com/" -ForegroundColor Gray
}

Write-Host ""

# Check project files
Write-Host "4. Checking Project Files..." -ForegroundColor Yellow

$requiredFiles = @(
    "package.json",
    "server/package.json",
    "server/server.js",
    "client/package.json",
    "client/src/App.js",
    "resume.cls",
    "resume_faangpath.tex"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file - MISSING" -ForegroundColor Red
        $missingFiles += $file
        $allGood = $false
    }
}

Write-Host ""

# Check dependencies
Write-Host "5. Checking Dependencies..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "   ✅ Root dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Root dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Run: npm install" -ForegroundColor Gray
}

if (Test-Path "server/node_modules") {
    Write-Host "   ✅ Server dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Server dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Run: cd server && npm install" -ForegroundColor Gray
}

if (Test-Path "client/node_modules") {
    Write-Host "   ✅ Client dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Client dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Run: cd client && npm install" -ForegroundColor Gray
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Summary
if ($allGood -and (Test-Path "node_modules") -and (Test-Path "server/node_modules") -and (Test-Path "client/node_modules")) {
    Write-Host "🎉 SYSTEM CHECK PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your system is ready to run AI Resume Builder!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run: .\start.ps1" -ForegroundColor White
    Write-Host "2. Open: http://localhost:3000" -ForegroundColor White
    Write-Host "3. Configure your OpenRouter API key in settings" -ForegroundColor White
    Write-Host ""
} elseif (!$allGood) {
    Write-Host "⚠️  SYSTEM CHECK FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install missing prerequisites:" -ForegroundColor Yellow
    Write-Host "- Node.js: https://nodejs.org/" -ForegroundColor White
    Write-Host "- Tectonic: choco install tectonic" -ForegroundColor White
    Write-Host ""
    
    if ($missingFiles.Count -gt 0) {
        Write-Host "Missing files:" -ForegroundColor Red
        foreach ($file in $missingFiles) {
            Write-Host "  - $file" -ForegroundColor Red
        }
        Write-Host ""
    }
} else {
    Write-Host "⚠️  DEPENDENCIES NOT INSTALLED" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run the following commands:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "npm install" -ForegroundColor White
    Write-Host "cd server && npm install && cd .." -ForegroundColor White
    Write-Host "cd client && npm install && cd .." -ForegroundColor White
    Write-Host ""
    Write-Host "Or simply run: .\start.ps1" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "For more help, check:" -ForegroundColor Gray
Write-Host "- SETUP.html (open in browser)" -ForegroundColor Gray
Write-Host "- QUICKSTART.md" -ForegroundColor Gray
Write-Host "- README.md" -ForegroundColor Gray
Write-Host ""
