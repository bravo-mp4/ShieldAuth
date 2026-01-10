@echo off
echo Manual library build with lib.exe
echo.

call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1

echo Compiling source files...
echo.

REM Compile each source file
cl /c /EHsc /MT /std:c++17 /O2 /I include src\shieldauth.cpp /Fo:shieldauth.obj
cl /c /EHsc /MT /std:c++17 /O2 /I include src\hwid.cpp /Fo:hwid.obj  
cl /c /EHsc /MT /std:c++17 /O2 /I include src\http.cpp /Fo:http.obj

echo.
echo Creating static library...
lib /OUT:shieldauth.lib shieldauth.obj hwid.obj http.obj winhttp.lib iphlpapi.lib

echo.
echo Checking symbols in the new library...
dumpbin /symbols shieldauth.lib | findstr /C:"Initialize" /C:"Validate" /C:"GetHWID" /C:"GetSessionID"

echo.
echo Copying to dist folder...
if not exist dist mkdir dist
if not exist dist\lib mkdir dist\lib
if not exist dist\include mkdir dist\include
copy /Y shieldauth.lib dist\lib\
copy /Y include\shieldauth.h dist\include\

echo.
echo Done! Library created in dist\lib\shieldauth.lib
pause
