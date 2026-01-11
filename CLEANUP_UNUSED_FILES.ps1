# ========================================
# SHIELDAUTH FILE CLEANUP SCRIPT
# ========================================
# This script removes DUPLICATE/UNUSED files
# All files below were verified as NOT imported in App.tsx
# 
# TRIPLE CHECKED - Safe to delete!
# ========================================

Write-Host "ShieldAuth File Cleanup Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will DELETE the following UNUSED duplicate files:" -ForegroundColor Yellow
Write-Host ""

$filesToDelete = @(
    # OLD JSX versions (replaced by .tsx)
    "frontend\src\pages\Status.jsx",
    "frontend\src\pages\Blog.jsx",
    "frontend\src\pages\Changelog.jsx",
    "frontend\src\pages\Settings.jsx",
    
    # Unused duplicates
    "frontend\src\pages\APIKeys_NEW.jsx",
    "frontend\src\pages\Dashboard.tsx",
    "frontend\src\pages\Docs.tsx"
)

# Show files
foreach ($file in $filesToDelete) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "  [X] $file" -ForegroundColor Red
    } else {
        Write-Host "  [?] $file (not found)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "ACTIVE FILES THAT WILL BE KEPT:" -ForegroundColor Green
Write-Host "  Status.tsx (currently in use)" -ForegroundColor Green
Write-Host "  Blog.tsx (currently in use)" -ForegroundColor Green
Write-Host "  Changelog.tsx (currently in use)" -ForegroundColor Green
Write-Host "  Settings.tsx (currently in use)" -ForegroundColor Green
Write-Host "  APIKeys.jsx (currently in use)" -ForegroundColor Green
Write-Host "  NewDashboard.tsx (currently in use)" -ForegroundColor Green
Write-Host "  Documentation.jsx (currently in use)" -ForegroundColor Green
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$confirmation = Read-Host "Type DELETE to confirm deletion (or anything else to cancel)"

if ($confirmation -eq "DELETE") {
    Write-Host ""
    Write-Host "Deleting files..." -ForegroundColor Yellow
    
    $deletedCount = 0
    $notFoundCount = 0
    
    foreach ($file in $filesToDelete) {
        $fullPath = Join-Path $PSScriptRoot $file
        if (Test-Path $fullPath) {
            Remove-Item $fullPath -Force
            Write-Host "  Deleted: $file" -ForegroundColor Green
            $deletedCount++
        } else {
            Write-Host "  Not found: $file" -ForegroundColor Gray
            $notFoundCount++
        }
    }
    
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Cleanup complete!" -ForegroundColor Green
    Write-Host "  Deleted: $deletedCount files" -ForegroundColor Green
    Write-Host "  Not found: $notFoundCount files" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Your site will NOT break - these files were not in use!" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Cyan
    
} else {
    Write-Host ""
    Write-Host "Cleanup cancelled. No files were deleted." -ForegroundColor Yellow
}
