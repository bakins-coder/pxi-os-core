# Gemma-2B-IT Local Setup Guide

> **Model**: Google Gemma-2B-IT (Q4_K_M quantized GGUF)  
> **Server**: llama-cpp-python OpenAI-compatible HTTP API  
> **Port**: 8000  
> **Project Root**: `C:\Users\akinb\pxi-os-core`

---

## Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Directory Structure](#directory-structure)
4. [First-Time Setup](#first-time-setup)
5. [Starting the Server](#starting-the-server)
6. [Stopping the Server](#stopping-the-server)
7. [Testing the Server](#testing-the-server)
8. [API Reference](#api-reference)
9. [Switching Between Local and Remote API](#switching-between-local-and-remote-api)
10. [Troubleshooting](#troubleshooting)
11. [Dependencies](#dependencies)

---

## Overview

This setup runs **Google Gemma-2B-IT** entirely on your local machine with no internet required at runtime. The model is served via an **OpenAI-compatible REST API** on `http://localhost:8000`, making it a drop-in replacement for cloud LLM APIs.

**What runs locally:**
- Python 3.11 virtual environment (`gemma_runtime/venv/`)
- llama-cpp-python (CPU inference engine)
- Gemma-2B-IT GGUF model (~1.7 GB, Q4_K_M quantized)
- HTTP server mimicking the OpenAI API schema

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Windows 10 64-bit | Windows 11 64-bit |
| Python | 3.11+ | 3.11.9 |
| RAM | 4 GB | 8 GB+ |
| Disk Space | 3 GB free | 5 GB free |
| CPU | x86-64 (any modern) | 8+ core |
| GPU | Not required | CUDA GPU (optional, faster) |

> **Note**: CPU-only inference works fine. A 4-core CPU will generate ~4–8 tokens/sec with the Q4_K_M quantization.

---

## Directory Structure

```
C:\Users\akinb\pxi-os-core\
├── run_gemma2b_it.bat          ← START the server
├── stop_gemma2b_it.bat         ← STOP the server
├── GEMMA_README.md             ← This file
└── gemma_runtime\
    ├── SETUP_BOOTSTRAP.bat     ← One-time setup (run this first!)
    ├── test_gemma.py           ← Integration test script
    ├── venv\                   ← Python virtual environment (auto-created)
    └── models\
        └── gemma-2b-it-Q4_K_M.gguf  ← The model file (~1.7 GB)
```

---

## First-Time Setup

### Step 1 — Install Python 3.11

Python must be installed before running the bootstrap. If not installed:

1. Visit: https://www.python.org/downloads/release/python-3119/
2. Download `Windows installer (64-bit)`
3. Run the installer and **check "Add Python to PATH"**
4. Verify: open PowerShell and run `python --version`

> **Alternative**: Run `winget install Python.Python.3.11` in an elevated (admin) terminal.

### Step 2 — Run the Bootstrap Script

```batch
gemma_runtime\SETUP_BOOTSTRAP.bat
```

This script will:
1. ✅ Verify Python is installed
2. ✅ Create a virtual environment in `gemma_runtime\venv\`
3. ✅ Install `llama-cpp-python` (CPU build)
4. ✅ Install `huggingface_hub`
5. ✅ Download the Gemma-2B-IT GGUF model (~1.7 GB) from HuggingFace
6. ✅ Verify all dependencies

> **HuggingFace Authentication**: The `bartowski/gemma-2b-it-GGUF` model repo is **public** — no token required. If you switch to the official `google/gemma-2b-it` repo (requires agreeing to terms), set your token:
> ```batch
> set HF_TOKEN=your_token_here
> ```

### Step 3 — Done!

The setup is complete. Proceed to [Starting the Server](#starting-the-server).

---

## Starting the Server

Double-click or run from a terminal:

```batch
run_gemma2b_it.bat
```

You should see output like:
```
[*] Activating virtual environment...
[*] Starting Gemma-2B-IT server on http://localhost:8000
[*] Model: C:\...\gemma-2b-it-Q4_K_M.gguf
llama_model_load_internal: format     = GGUF V3
llama_model_load_internal: n_vocab    = 256000
...
INFO:     Uvicorn running on http://0.0.0.0:8000
```

The server is ready when you see `Uvicorn running on http://0.0.0.0:8000`.

---

## Stopping the Server

**Option 1** — Press `Ctrl+C` in the terminal window running the server.

**Option 2** — Run the stop script:
```batch
stop_gemma2b_it.bat
```

---

## Testing the Server

With the server running, open a **new terminal** and run:

```batch
cd C:\Users\akinb\pxi-os-core
gemma_runtime\venv\Scripts\activate.bat
python gemma_runtime\test_gemma.py
```

Expected output:
```
=======================================================
  Gemma-2B-IT Integration Test
=======================================================
── Health Check ─────────────────────────────────
  ✓ Server is healthy (HTTP 200)

── Models Available ─────────────────────────────
  ✓ Model: gemma-2b-it-Q4_K_M

── Chat Completion Test ─────────────────────────
  Prompt:   Hello! In one sentence, what is your name and what can you do?
  Response: I'm Gemma, a large language model trained by Google DeepMind, ...
  ✓ Chat completion working!

=======================================================
  ✓ ALL TESTS PASSED — Gemma-2B-IT is working locally!
=======================================================
```

### Manual cURL Test

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/v1/chat/completions" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"model":"gemma-2b-it-Q4_K_M","messages":[{"role":"user","content":"Say hello!"}],"max_tokens":50}'
```

---

## API Reference

The server exposes an **OpenAI-compatible API** at `http://localhost:8000`.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/v1/models` | List available models |
| POST | `/v1/chat/completions` | Chat completion (GPT-style) |
| POST | `/v1/completions` | Text completion |
| POST | `/v1/embeddings` | Text embeddings |

### Chat Completion Example

```json
POST http://localhost:8000/v1/chat/completions
Content-Type: application/json

{
  "model": "gemma-2b-it-Q4_K_M",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is 2 + 2?"}
  ],
  "max_tokens": 200,
  "temperature": 0.7,
  "stream": false
}
```

### Server Parameters (run_gemma2b_it.bat)

| Parameter | Value | Description |
|-----------|-------|-------------|
| `--host` | `0.0.0.0` | Listen on all interfaces |
| `--port` | `8000` | HTTP port |
| `--n_ctx` | `2048` | Context window size |
| `--n_threads` | `4` | CPU threads (increase for faster inference) |
| `--chat_format` | `gemma` | Gemma-specific prompt format |

To increase performance, edit `run_gemma2b_it.bat` and change `--n_threads` to match your CPU core count.

---

## Switching Between Local and Remote API

### Using Local Gemma (default)

```python
# Python example
import openai

client = openai.OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="not-needed"  # local server doesn't require auth
)

response = client.chat.completions.create(
    model="gemma-2b-it-Q4_K_M",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)
```

### Using Remote Gemini API (Google Cloud)

```python
import openai

client = openai.OpenAI(
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    api_key="YOUR_GEMINI_API_KEY"
)

response = client.chat.completions.create(
    model="gemini-2.0-flash",  # or gemini-1.5-pro
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)
```

### Environment Variable Toggle

Use an environment variable to switch without code changes:

```python
import os
import openai

USE_LOCAL = os.getenv("USE_LOCAL_LLM", "true").lower() == "true"

if USE_LOCAL:
    base_url = "http://localhost:8000/v1"
    api_key  = "not-needed"
    model    = "gemma-2b-it-Q4_K_M"
else:
    base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
    api_key  = os.environ["GEMINI_API_KEY"]
    model    = "gemini-2.0-flash"

client = openai.OpenAI(base_url=base_url, api_key=api_key)
```

Set the toggle:
```batch
REM Use local Gemma
set USE_LOCAL_LLM=true

REM Use remote Gemini
set USE_LOCAL_LLM=false
set GEMINI_API_KEY=your_key_here
```

---

## Troubleshooting

### ❌ "Python not found" after install

Restart your terminal, or run:
```powershell
$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
python --version
```

### ❌ "llama_cpp not found" / import error

```batch
gemma_runtime\venv\Scripts\activate.bat
pip install llama-cpp-python --prefer-binary --force-reinstall
```

### ❌ Model download fails

1. Check your internet connection
2. Try manually downloading from: https://huggingface.co/bartowski/gemma-2b-it-GGUF
3. Place the file at: `gemma_runtime\models\gemma-2b-it-Q4_K_M.gguf`

### ❌ "Address already in use" on port 8000

```batch
stop_gemma2b_it.bat
```

Or find and kill the process:
```powershell
netstat -ano | findstr ":8000"
taskkill /F /PID <PID>
```

### ❌ Inference is very slow

- Increase `--n_threads` in `run_gemma2b_it.bat` to match your CPU cores
- Use a smaller quantization: Q2_K (~0.9 GB) for faster but lower-quality output
- Reduce `--n_ctx` to 1024 for shorter conversations

### ❌ Out of memory

- Close other applications
- Switch to Q2_K model: edit `run_gemma2b_it.bat` to point to the Q2_K file
- Reduce `--n_ctx` to 512

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Python | 3.11.9 | Runtime |
| llama-cpp-python | ≥0.2.90 | GGUF model inference engine |
| llama-cpp-python[server] | ≥0.2.90 | OpenAI-compatible HTTP server |
| huggingface_hub | ≥0.23.0 | Model download from HuggingFace |
| fastapi | auto | HTTP server framework |
| uvicorn | auto | ASGI server |

### Model Details

| Property | Value |
|----------|-------|
| Model | Google Gemma-2B-IT |
| GGUF Source | `bartowski/gemma-2b-it-GGUF` |
| Quantization | Q4_K_M (4-bit, medium quality) |
| File size | ~1.7 GB |
| Context window | 8192 tokens (server limited to 2048) |
| License | [Gemma Terms of Service](https://ai.google.dev/gemma/terms) |

---

*Generated by pxi-os-core LLM Ops setup — 2026-07-10*
