@echo off
chcp 65001 >nul
title سامانه ثبت نام پرسنل
color 0B

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     سامانه ثبت نام پرسنل - SQLite       ║
echo  ║     Personnel Registration System        ║
echo  ╚══════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Node.js نصب نیست!
    echo  لطفاً Node.js را از https://nodejs.org دانلود و نصب کنید.
    echo.
    pause
    exit /b 1
)

echo  [INFO] Node.js یافت شد.
node --version
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo  [INFO] در حال نصب وابستگی‌ها...
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo  [ERROR] خطا در نصب وابستگی‌ها!
        pause
        exit /b 1
    )
    echo.
    echo  [OK] وابستگی‌ها با موفقیت نصب شدند.
    echo.
)

REM Check if dist exists (build)
if not exist "dist" (
    echo  [INFO] در حال ساخت پروژه...
    echo.
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo.
        echo  [ERROR] خطا در ساخت پروژه!
        pause
        exit /b 1
    )
    echo.
    echo  [OK] پروژه با موفقیت ساخته شد.
    echo.
)

echo  ════════════════════════════════════════════
echo.
echo  [OK] سرور در حال اجرا...
echo.
echo  آدرس: http://localhost:4173
echo.
echo  برای توقف سرور: Ctrl+C
echo.
echo  ════════════════════════════════════════════
echo.

REM Start browser
start http://localhost:4173

REM Start preview server
npx vite preview --host 0.0.0.0 --port 4173

pause
