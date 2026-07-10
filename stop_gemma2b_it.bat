@echo off
REM ── Stop Gemma-2B-IT Server ───────────────────────────────────
echo Stopping Gemma-2B-IT server on port 8000...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Killing PID: %%p
    taskkill /F /PID %%p 2>nul
)
echo Done.
pause
