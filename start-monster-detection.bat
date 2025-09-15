@echo off
echo.
echo ===============================================
echo   EVONY MONSTER LOCATION DETECTOR
echo ===============================================
echo.
echo 🎯 Checking for Evony game...

cd /d "C:\Users\TIGER\Evony\evony\services"

echo.
echo 🚀 Starting monster location extractor...
echo.

node streamlined-monster-extractor.js

pause