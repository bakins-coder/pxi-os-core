@echo off
setlocal EnableDelayedExpansion

echo ============================================================
echo   Gemma-2B-IT Local Server  ^|  Port 8000
echo ============================================================
echo.

set "SCRIPT_DIR=%~dp0gemma_runtime\"
set "VENV_DIR=%SCRIPT_DIR%venv"
set "MODEL_FILE=%SCRIPT_DIR%models\gemma-2-2b-it-Q4_K_M.gguf"

REM ── Sanity checks ────────────────────────────────────────────
if not exist "%VENV_DIR%\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found at: %VENV_DIR%
    echo         Please run gemma_runtime\SETUP_BOOTSTRAP.bat first.
    pause
    exit /b 1
)

if not exist "%MODEL_FILE%" (
    echo [ERROR] Model file not found at: %MODEL_FILE%
    echo         Please run gemma_runtime\SETUP_BOOTSTRAP.bat first.
    pause
    exit /b 1
)

REM ── Activate venv ────────────────────────────────────────────
echo [*] Activating virtual environment...
call "%VENV_DIR%\Scripts\activate.bat"

REM ── Start llama-cpp-python OpenAI-compatible HTTP server ─────
echo [*] Starting Gemma-2B-IT server on http://localhost:8000
echo [*] Model: %MODEL_FILE%
echo [*] Press Ctrl+C to stop the server
echo.
echo     API Endpoints:
echo       - Chat:        http://localhost:8000/v1/chat/completions
echo       - Models list: http://localhost:8000/v1/models
echo       - Health:      http://localhost:8000/health
echo.

python -m llama_cpp.server ^
    --model "%MODEL_FILE%" ^
    --host 0.0.0.0 ^
    --port 8000 ^
    --n_ctx 2048 ^
    --n_threads 4 ^
    --chat_format gemma ^
    --verbose False

echo.
echo [*] Server stopped.
pause
