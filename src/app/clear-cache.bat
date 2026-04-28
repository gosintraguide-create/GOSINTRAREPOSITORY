@echo off
REM Cache Buster Script for Hop On Sintra (Windows)
REM This script clears all cache and temporary files

echo Clearing Vite cache...
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist .vite rmdir /s /q .vite

echo Clearing dist folder...
if exist dist rmdir /s /q dist

echo Cache cleared!
echo.
echo Now run: npm run dev

pause
