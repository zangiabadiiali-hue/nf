@echo off
chcp 65001 >nul
title ساخت پروژه - سامانه پرسنل
color 0E

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     ساخت پروژه (Build)                   ║
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

echo  [INFO] در حال ساخت پروژه...
echo.
call npm run build

if %ERRORLEVEL% equ 0 (
    echo.
    echo  ╔══════════════════════════════════════════╗
    echo  ║     [OK] ساخت با موفقیت انجام شد!        ║
    echo  ║     خروجی در پوشه dist/ قرار دارد        ║
    echo  ╚══════════════════════════════════════════╝
) else (
    echo.
    echo  [ERROR] خطا در ساخت پروژه!
)

echo.
pause
