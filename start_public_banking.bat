@echo off
title Apex Online Banking System - Live Cloud Runner
echo ========================================================
echo   Apex Bank India - Fullstack Online Banking System
echo ========================================================
echo.
echo Starting backend server and client...
start "" cmd /c "npm run dev"
timeout /t 4 /nobreak >nul
echo.
echo Exposing secure public HTTPS link with keep-alive...
ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o StrictHostKeyChecking=no -R 80:localhost:5000 nokey@localhost.run
pause
