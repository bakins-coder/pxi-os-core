@echo off
setlocal EnableDelayedExpansion

echo ============================================================
echo   Gemma-2B-IT Local Setup Bootstrap
echo   Project: pxi-os-core
echo ============================================================
echo.

REM ── Step 1: Check Python ─────────────────────────────────────
echo [1/6] Checking for Python 3.11+...
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo     Python not found in PATH.
    echo     Attempting install via winget (requires admin once)...
    winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    IF %ERRORLEVEL% NEQ 0 (
        echo     [ERROR] winget install failed. Please install Python 3.11 manually from:
        echo     https://www.python.org/downloads/release/python-3119/
        echo     Then re-run this script.
        pause
        exit /b 1
    )
    REM Refresh PATH
    for /f "tokens=*" %%i in ('powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable(\"PATH\",\"Machine\") + \";\" + [Environment]::GetEnvironmentVariable(\"PATH\",\"User\")"') do set "PATH=%%i"
) else (
    for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo     Found: %%v
)

REM ── Step 2: Create virtual environment ───────────────────────
echo.
echo [2/6] Creating virtual environment in gemma_runtime\venv ...
set "SCRIPT_DIR=%~dp0"
set "VENV_DIR=%SCRIPT_DIR%venv"

if not exist "%VENV_DIR%" (
    python -m venv "%VENV_DIR%"
    if %ERRORLEVEL% NEQ 0 (
        echo     [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo     Virtual environment created at: %VENV_DIR%
) else (
    echo     Virtual environment already exists at: %VENV_DIR%
)

REM ── Step 3: Activate venv and upgrade pip ────────────────────
echo.
echo [3/6] Activating venv and upgrading pip...
call "%VENV_DIR%\Scripts\activate.bat"
python -m pip install --upgrade pip --quiet
echo     pip upgraded.

REM ── Step 4: Install dependencies ─────────────────────────────
echo.
echo [4/6] Installing llama-cpp-python and huggingface_hub...
pip install huggingface_hub --quiet
echo     huggingface_hub installed.

echo     Installing llama-cpp-python (CPU build - no GPU required)...
pip install llama-cpp-python --prefer-binary --quiet
if %ERRORLEVEL% NEQ 0 (
    echo     [WARN] Binary install failed, trying source build...
    set "CMAKE_ARGS=-DLLAMA_BLAS=OFF"
    pip install llama-cpp-python
)
echo     llama-cpp-python installed.

REM Install llama-cpp-python server extras
pip install "llama-cpp-python[server]" --prefer-binary --quiet
echo     llama-cpp-python server extras installed.

REM ── Step 5: Download Gemma-2B-IT GGUF model ──────────────────
echo.
echo [5/6] Downloading Gemma-2B-IT GGUF model from HuggingFace...
set "MODEL_DIR=%SCRIPT_DIR%models"
if not exist "%MODEL_DIR%" mkdir "%MODEL_DIR%"

set "MODEL_FILE=%MODEL_DIR%\gemma-2-2b-it-Q4_K_M.gguf"

if not exist "%MODEL_FILE%" (
    echo     Downloading gemma-2-2b-it Q4_K_M quantized GGUF...
    echo     Source: bartowski/gemma-2-2b-it-GGUF on HuggingFace
    python -c "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='bartowski/gemma-2-2b-it-GGUF', filename='gemma-2-2b-it-Q4_K_M.gguf', local_dir=r'%MODEL_DIR%'); print('Model downloaded successfully.')"
    if %ERRORLEVEL% NEQ 0 (
        echo     [ERROR] Model download failed. Check your internet connection.
        echo     You can manually download from:
        echo     https://huggingface.co/bartowski/gemma-2-2b-it-GGUF
        pause
        exit /b 1
    )
) else (
    echo     Model already exists at: %MODEL_FILE%
)

REM ── Step 6: Verify installation ───────────────────────────────
echo.
echo [6/6] Verifying installation...
python -c "import llama_cpp; print('llama_cpp version:', llama_cpp.__version__)"
python -c "import huggingface_hub; print('huggingface_hub version:', huggingface_hub.__version__)"
echo     All dependencies verified.

echo.
echo ============================================================
echo   SETUP COMPLETE!
echo   Run: run_gemma2b_it.bat to start the server on port 8000
echo ============================================================
echo.
pause
