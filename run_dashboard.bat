@echo off
cd /d "%~dp0"
python server.py
if errorlevel 1 (
    echo.
    echo Could not start the dashboard. Make sure Python is installed and available as "python".
    pause
)
