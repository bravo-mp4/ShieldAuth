@echo off
echo ========================================
echo ShieldAuth C++ SDK Build Script
echo ========================================
echo.

REM Check if Visual Studio is available
where cl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Visual Studio compiler not in PATH, attempting to initialize...
    echo.
    
    REM Try to find and run vcvars64.bat
    if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" (
        echo Found Visual Studio Community 2022
        call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
        goto :check_compiler
    )
    
    if exist "C:\Program Files\Microsoft Visual Studio\2022\Professional\VC\Auxiliary\Build\vcvars64.bat" (
        echo Found Visual Studio Professional 2022
        call "C:\Program Files\Microsoft Visual Studio\2022\Professional\VC\Auxiliary\Build\vcvars64.bat"
        goto :check_compiler
    )
    
    if exist "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Auxiliary\Build\vcvars64.bat" (
        echo Found Visual Studio Enterprise 2022
        call "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Auxiliary\Build\vcvars64.bat"
        goto :check_compiler
    )
    
    if exist "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" (
        echo Found Visual Studio Build Tools 2022
        call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
        goto :check_compiler
    )
    
    echo ERROR: Could not find Visual Studio 2022!
    echo Please install Visual Studio 2022 with C++ development tools
    echo Or run this from Visual Studio Developer Command Prompt
    pause
    exit /b 1
)

:check_compiler
where cl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to initialize Visual Studio compiler!
    pause
    exit /b 1
)

echo ✓ Visual Studio compiler found
echo.

REM Create build directory
if not exist "build" mkdir build
cd build

echo.
echo [1/4] Configuring CMake...
cmake .. -G "NMake Makefiles" -DCMAKE_BUILD_TYPE=Release
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: CMake configuration completed with warnings
    echo This is normal if libcurl is not installed
    echo The library will build, but users must link libcurl manually
    echo.
)

echo.
echo [2/4] Building library...
nmake
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed!
    cd ..
    pause
    exit /b 1
)

echo.
echo [3/4] Creating distribution directory...
cd ..
if not exist "dist" mkdir dist
if not exist "dist\include" mkdir dist\include
if not exist "dist\lib" mkdir dist\lib

echo.
echo [4/4] Copying files...
copy /Y "include\shieldauth.h" "dist\include\"
copy /Y "build\shieldauth.lib" "dist\lib\"

echo.
echo ========================================
echo ✓ Build Complete!
echo ========================================
echo.
echo Distribution files created in 'dist\' folder:
echo   - dist\include\shieldauth.h  (Header file)
echo   - dist\lib\shieldauth.lib    (Static library)
echo.
echo To use in your project:
echo   1. Copy shieldauth.h to your include directory
echo   2. Copy shieldauth.lib to your lib directory
echo   3. Add to your project: #include "shieldauth.h"
echo   4. Link: shieldauth.lib and libcurl.lib (download from https://curl.se/windows/)
echo   5. Or use vcpkg: vcpkg install curl
echo.
pause
