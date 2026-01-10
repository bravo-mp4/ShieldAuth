@echo off
REM Force delete the lock file if it exists
if exist ".git\index.lock" del /f /q ".git\index.lock"

REM Add all changes
git add .

REM Commit with message
git commit -m "Fix Vercel proxy - route /api/v1 to Railway backend"

REM Push to GitHub
git push

echo Done!
pause
