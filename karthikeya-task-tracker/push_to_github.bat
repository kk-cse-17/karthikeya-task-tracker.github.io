@echo off
set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
cd /d "%~dp0"

echo ============================================================
echo   Pushing Karthikeya Task Tracker to GitHub
echo   Repo: https://github.com/kk-cse-17/karthikeya-task-tracker.github.io
echo ============================================================
echo.
echo Connecting to GitHub...
echo (If a GitHub sign-in window appears, click 'Sign in with browser')
echo.

git push -u origin main

echo.
echo ============================================================
if %ERRORLEVEL% EQU 0 (
    echo   [SUCCESS] Your code is successfully deployed to GitHub!
    echo   Check it out: https://github.com/kk-cse-17/karthikeya-task-tracker.github.io
) else (
    echo   [NOTICE] If authorization was needed, please complete it above.
)
echo ============================================================
echo.
pause
