@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto missing
call npm start
if errorlevel 1 pause
exit /b
:missing
echo Node.js 22 or later is required. Please install Node.js and try again.
pause
