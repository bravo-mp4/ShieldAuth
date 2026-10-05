# ShieldAuth Professional Upgrade Installation Script (Windows)
# Run with PowerShell

Write-Host "======================================" -ForegroundColor Blue
Write-Host "ShieldAuth Professional Upgrade" -ForegroundColor Blue
Write-Host "======================================" -ForegroundColor Blue
Write-Host ""

# Step 1: Install Frontend Dependencies
Write-Host "Step 1/7: Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install lucide-react @tanstack/react-table react-hook-form zod cmdk recharts react-markdown
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Step 2: Install Backend Dependencies
Write-Host "Step 2/7: Installing backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install bull redis express-rate-limit helmet winston
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Step 3: Check Environment Variables
Write-Host "Step 3/7: Checking environment variables..." -ForegroundColor Cyan
if (-not $env:ADMIN_EMAILS) {
    Write-Host "⚠ ADMIN_EMAILS not set" -ForegroundColor Yellow
    $admin_email = Read-Host "Enter your admin email"
    $env:ADMIN_EMAILS = $admin_email
    Write-Host "✓ ADMIN_EMAILS set to: $admin_email" -ForegroundColor Green
} else {
    Write-Host "✓ ADMIN_EMAILS already set" -ForegroundColor Green
}

# Step 4: Database Migration Info
Write-Host "Step 4/7: Database migration..." -ForegroundColor Cyan
Write-Host "Please run this command manually:" -ForegroundColor Yellow
Write-Host "psql `$DATABASE_URL -f backend/migrations/admin_system.sql" -ForegroundColor White
Write-Host "Or use Railway CLI: railway run psql `$DATABASE_URL -f backend/migrations/admin_system.sql" -ForegroundColor White
Write-Host ""

# Step 5: Backend Configuration
Write-Host "Step 5/7: Backend configuration check..." -ForegroundColor Cyan
$indexContent = Get-Content -Path "backend\src\index.ts" -Raw
if ($indexContent -match "securityHeaders") {
    Write-Host "✓ Backend security already configured" -ForegroundColor Green
} else {
    Write-Host "⚠ Backend needs manual security middleware integration" -ForegroundColor Yellow
    Write-Host "Add these to backend/src/index.ts:" -ForegroundColor White
    Write-Host "  import { securityHeaders, corsOptions, apiLimiter } from './middleware/security';" -ForegroundColor Gray
    Write-Host "  import logger from './logger';" -ForegroundColor Gray
}

# Step 6: Redis Check
Write-Host "Step 6/7: Checking Redis..." -ForegroundColor Cyan
try {
    $redisRunning = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue
    if ($redisRunning.TcpTestSucceeded) {
        Write-Host "✓ Redis is running" -ForegroundColor Green
    } else {
        Write-Host "⚠ Redis not running (optional but recommended)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Redis not installed (optional)" -ForegroundColor Yellow
    Write-Host "Download from: https://github.com/tporadowski/redis/releases" -ForegroundColor White
}

# Step 7: Summary
Write-Host ""
Write-Host "Step 7/7: Installation Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Blue
Write-Host "✓ All dependencies installed" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run database migration (see command above)"
Write-Host "2. Set environment variables in Railway/Vercel"
Write-Host "3. Start backend: cd backend; npm run dev"
Write-Host "4. Start frontend: cd frontend; npm run dev"
Write-Host "5. Visit http://localhost:5173"
Write-Host "6. Login and navigate to /admin"
Write-Host ""
Write-Host "Manual Tasks Remaining:" -ForegroundColor Yellow
Write-Host "- Replace emojis (see docs/archive/IMPLEMENTATION_STATUS.md)"
Write-Host "- Add CommandPalette to App.tsx"
Write-Host "- Add admin routes to App.tsx"
Write-Host ""
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Read docs/guides/QUICK_START_GUIDE.md for detailed next steps" -ForegroundColor Cyan
