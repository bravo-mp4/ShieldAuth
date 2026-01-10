@echo off
echo Checking object file symbols...
echo.

call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1

echo Checking shieldauth.cpp.obj:
dumpbin /symbols build\CMakeFiles\shieldauth.dir\src\shieldauth.cpp.obj | findstr /C:"Initialize" /C:"Validate" /C:"GetSessionID"

echo.
echo Checking hwid.cpp.obj:
dumpbin /symbols build\CMakeFiles\shieldauth.dir\src\hwid.cpp.obj | findstr /C:"GetHWID"

echo.
echo Checking the final .lib file:
dumpbin /symbols build\shieldauth.lib | findstr /C:"Initialize" /C:"Validate" /C:"GetHWID" /C:"GetSessionID"

echo.
echo Listing ALL symbols in the .lib:
dumpbin /symbols build\shieldauth.lib

pause
