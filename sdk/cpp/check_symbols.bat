@echo off
echo Checking symbols in shieldauth.lib...
echo.

where dumpbin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1
)

echo Looking for ShieldAuth symbols:
echo.
dumpbin /symbols dist\shieldauth.lib | findstr /C:"ShieldAuth" | findstr /C:"External"

echo.
echo Looking for Initialize:
dumpbin /symbols dist\shieldauth.lib | findstr /C:"Initialize"

echo.
echo Looking for Validate:
dumpbin /symbols dist\shieldauth.lib | findstr /C:"Validate"

echo.
echo Looking for GetHWID:
dumpbin /symbols dist\shieldauth.lib | findstr /C:"GetHWID"

pause
