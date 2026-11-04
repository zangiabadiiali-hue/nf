@echo off
chcp 65001 >nul
title حالت توسعه - سامانه پرسنل
color 0A

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     حالت توسعه (Development Mode)        ║
echo  ╚══════════════════════════════════════════╝
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Node.js نصب نیست!
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo  [INFO] نصب وابستگی‌ها...
    call npm install
)

echo  [OK] سرور توسعه در حال اجرا...
echo  آدرس: http://localhost:5173
echo.

start http://localhost:5173

npx vite --host 0.0.0.0 --port 5173

pause
