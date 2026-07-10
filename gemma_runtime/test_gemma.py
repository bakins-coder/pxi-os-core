#!/usr/bin/env python3
"""
Quick integration test for Gemma-2B-IT running on localhost:8000.
Run this AFTER run_gemma2b_it.bat has started successfully.
"""

import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000"

def check_health():
    print("── Health Check ─────────────────────────────────")
    try:
        req = urllib.request.urlopen(f"{BASE_URL}/v1/models", timeout=5)
        print(f"  ✓ Server is healthy (HTTP {req.status})")
        return True
    except Exception as e:
        print(f"  ✗ Server not responding: {e}")
        return False

def list_models():
    print("\n── Models Available ─────────────────────────────")
    try:
        req = urllib.request.urlopen(f"{BASE_URL}/v1/models", timeout=5)
        data = json.loads(req.read())
        for m in data.get("data", []):
            print(f"  ✓ Model: {m['id']}")
    except Exception as e:
        print(f"  ✗ Failed to list models: {e}")

def test_chat():
    print("\n── Chat Completion Test ─────────────────────────")
    payload = json.dumps({
        "model": "gemma-2-2b-it-Q4_K_M",
        "messages": [
            {"role": "user", "content": "Hello! In one sentence, what is your name and what can you do?"}
        ],
        "max_tokens": 100,
        "temperature": 0.7
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/v1/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
            reply = data["choices"][0]["message"]["content"]
            print(f"  Prompt:   Hello! In one sentence, what is your name and what can you do?")
            print(f"  Response: {reply}")
            print(f"  ✓ Chat completion working!")
            return True
    except Exception as e:
        print(f"  ✗ Chat test failed: {e}")
        return False

if __name__ == "__main__":
    print("=" * 55)
    print("  Gemma-2B-IT Integration Test")
    print("=" * 55)

    if not check_health():
        print("\n⚠ Server is not running. Start it with: run_gemma2b_it.bat")
        sys.exit(1)

    list_models()
    success = test_chat()

    print("\n" + "=" * 55)
    if success:
        print("  ✓ ALL TESTS PASSED — Gemma-2B-IT is working locally!")
    else:
        print("  ✗ Some tests failed. Check server logs.")
    print("=" * 55)
