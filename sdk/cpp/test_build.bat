@echo off
echo Testing library linking...
echo.

REM Initialize VS compiler
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1

REM Compile and link test
cl /EHsc /MT /std:c++17 /I. test_link.cpp dist\lib\shieldauth.lib winhttp.lib iphlpapi.lib /Fe:test_link.exe

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Success! Library links correctly.
    echo Running test...
    echo.
    test_link.exe
) else (
    echo.
    echo Failed to link. This means there's an issue with the library itself.
)

pause
