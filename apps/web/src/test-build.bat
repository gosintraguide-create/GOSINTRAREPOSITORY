@echo off
REM Test Build Script for Go Sintra (Windows)
REM This script validates that the build works locally before deploying to Vercel

echo ========================================
echo Go Sintra - Build Test Script (Windows)
echo ========================================
echo.

REM Step 1: Check Node version
echo [Step 1] Checking Node version...
node -v
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    exit /b 1
)
echo OK: Node.js is installed
echo.

REM Step 2: Validate package.json
echo [Step 2] Validating package.json...
node -e "require('./package.json')" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: package.json has syntax errors
    exit /b 1
)
echo OK: package.json is valid
echo.

REM Step 3: Validate vercel.json
echo [Step 3] Validating vercel.json...
node -e "require('./vercel.json')" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: vercel.json has syntax errors
    exit /b 1
)
echo OK: vercel.json is valid
echo.

REM Step 4: Check dependencies
echo [Step 4] Checking dependencies...
if not exist "node_modules\" (
    echo WARNING: node_modules not found. Installing...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: npm install failed
        exit /b 1
    )
) else (
    echo OK: Dependencies installed
)
echo.

REM Step 5: Clean previous build
echo [Step 5] Cleaning previous build...
if exist "Build\" (
    rmdir /s /q Build
    echo OK: Previous build cleaned
) else if exist "dist\" (
    rmdir /s /q dist
    echo OK: Previous build cleaned (old dist folder)
) else (
    echo No previous build found (this is fine)
)
echo.

REM Step 6: Run build
echo [Step 6] Running build command...
echo Command: npm run build
echo.
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo ERROR: BUILD FAILED
    echo ========================================
    echo Check the error messages above
    echo.
    echo Common issues:
    echo - TypeScript errors
    echo - Missing dependencies
    echo - Import path errors
    exit /b 1
)
echo.

REM Step 7: Verify build output
echo [Step 7] Verifying build output...
if not exist "Build\" (
    echo ERROR: Build folder was not created
    exit /b 1
)

if not exist "Build\index.html" (
    echo ERROR: Build\index.html not found
    exit /b 1
)

echo OK: Build output verified
echo.

REM Step 8: Show statistics
echo [Step 8] Build statistics...
echo Files in Build folder:
dir /b Build
echo.

if exist "Build\assets\" (
    echo Files in Build\assets folder:
    dir /b Build\assets | findstr /n "^" | findstr "^[1-9]:"
    echo.
)

echo ========================================
echo SUCCESS: BUILD TEST PASSED!
echo ========================================
echo.
echo Your build is ready for Vercel deployment!
echo.
echo Next steps:
echo 1. Commit and push to GitHub:
echo    git add .
echo    git commit -m "Fix vercel.json syntax error"
echo    git push origin main
echo.
echo 2. Vercel will automatically deploy, OR
echo    Deploy manually via CLI:
echo    npm install -g vercel
echo    vercel --prod
echo.
echo Good luck!
pause
