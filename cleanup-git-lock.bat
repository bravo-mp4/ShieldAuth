@echo off
REM Cleanup stale git lock file
echo Removing git lock file...
del /F /Q ".git\index.lock" 2>nul
if errorlevel 1 (
    echo No lock file found or already removed
) else (
    echo Lock file removed successfully
)
echo Done!
pause
