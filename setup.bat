@echo off
echo ========================================
echo FPED Dashboard - Setup Script
echo ========================================
echo.

echo [1/4] Installing Backend Dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend installation failed!
    pause
    exit /b 1
)
echo Backend dependencies installed successfully!
echo.

echo [2/4] Installing Frontend Dependencies...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend installation failed!
    pause
    exit /b 1
)
echo Frontend dependencies installed successfully!
echo.

echo [3/4] Seeding Database...
cd ..\server
call npm run seed
if %errorlevel% neq 0 (
    echo WARNING: Database seeding failed. Make sure MongoDB is running!
    echo You can run 'npm run seed' manually later.
)
echo.

echo [4/4] Setup Complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Make sure MongoDB is running
echo 2. Start Backend:  cd server ^&^& npm run dev
echo 3. Start Frontend: cd client ^&^& npm run dev
echo 4. Open browser: http://localhost:5173
echo.
echo Default Login:
echo   Email: admin@fped.com
echo   Password: Admin@123
echo ========================================
echo.
pause
