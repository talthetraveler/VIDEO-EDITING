@echo off
title Setup everything - Tal video editing
cd /d "%~dp0"
echo Setting up every tool the video editor uses. This can take a while the first time.
echo.
where python >nul 2>nul || (echo Python is not installed. Install it with:  winget install Python.Python.3.12  then run this again. & pause & exit /b 1)
python system\setup\setup_everything.py %*
echo.
pause
