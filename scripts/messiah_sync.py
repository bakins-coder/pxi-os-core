import os
import sys
import json
import requests
import hashlib
from datetime import datetime

# ==========================================
# Messiah: Enterprise Sync Engine
# Handles multi-tenant knowledge ingestion
# ==========================================

def load_env(file_path):
    env = {}
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            for line in f:
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    env[key] = value
    return env

def get_embedding(text, api_key):
    # Standardizing on 3072 dimensions via gemini-embedding-004 if available, 
    # but gemini-embedding-001 is stable.
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={api_key}"
    payload = {
        "model": "models/gemini-embedding-001",
        "content": {"parts": [{"text": text}]}
    }
    response = requests.post(url, json=payload)
    if response.status_code != 200:
        print(f"Embedding error: {response.text}")
        return None
    return response.json()['embedding']['values']

def upsert_to_pinecone(host, api_key, vector_id, values, metadata, namespace):
    url = f"{host}/vectors/upsert"
    headers = {
        "Api-Key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "vectors": [{
            "id": vector_id,
            "values": values,
            "metadata": metadata
        }],
        "namespace": namespace
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code != 200:
        print(f"Pinecone error: {response.text}")
        return False
    return True

def process_directory(dir_path, namespace, gemini_key, pinecone_key, pinecone_host, root_label):
    print(f"\n--- Syncing [{root_label}] to Namespace: {namespace} ---")
    
    for root, dirs, files in os.walk(dir_path):
        # Skip common non-documentation folders
        if any(skip in root for skip in ['.git', 'node_modules', '__pycache__', 'dist', 'build']):
            continue
            
        for file in files:
            if file.endswith(".md"):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, dir_path)
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                if not content.strip():
                    continue

                print(f"[{namespace}] Processing {rel_path}...")
                
                # Generate stable ID including namespace to avoid collisions
                unique_identifier = f"{namespace}:{rel_path}"
                vector_id = hashlib.md5(unique_identifier.encode()).hexdigest()
                
                # Get Embedding
                values = get_embedding(content, gemini_key)
                if not values:
                    continue

                # Prepare Metadata
                metadata = {
                    "path": rel_path,
                    "filename": file,
                    "content": content[:1500], # Increased snippet size for better context
                    "tenant": namespace,
                    "source": root_label,
                    "synced_at": datetime.now().isoformat()
                }

                # Upsert
                success = upsert_to_pinecone(pinecone_host, pinecone_key, vector_id, values, metadata, namespace)
                if success:
                    print(f"OK: {rel_path}")

def main():
    # Setup Paths
    pxi_env = r"c:\Users\akinb\pxi-os-core\.env.local"
    env = load_env(pxi_env)
    
    gemini_key = env.get('VITE_GEMINI_API_KEY')
    pinecone_key = env.get('VITE_PINECONE_API_KEY')
    pinecone_host = env.get('VITE_PINECONE_URL')

    if not all([gemini_key, pinecone_key, pinecone_host]):
        print("Error: Missing credentials in .env.local")
        return

    # Configuration for Multi-Tenant Sync
    # Format: (path, namespace, label)
    sync_targets = [
        # Personal Brain (Foundational Messiah)
        (r"c:\Users\akinb\OneDrive\Desktop\Personal Assistant\Knowledge", "personal_brain", "Personal Vault"),
        
        # Business Tenants (GitHub Clones & Manual Vaults)
        (r"c:\Users\akinb\pxi-os-core", "business_core", "PXI OS Core"),
        (r"c:\Users\akinb\OneDrive\Desktop\Personal Assistant\Knowledge\Tenants\JIWSF", "business_jiwsf", "JIWSF Vault"),
        (r"c:\Users\akinb\OneDrive\Desktop\Personal Assistant\Knowledge\Tenants\Xquisite", "business_xquisite", "Xquisite Vault"),
        (r"c:\Users\akinb\OneDrive\Desktop\Personal Assistant\Knowledge\Tenants\MoneeWise", "business_moneewise", "MoneeWise Vault")
    ]

    for path, namespace, label in sync_targets:
        if os.path.exists(path):
            process_directory(path, namespace, gemini_key, pinecone_key, pinecone_host, label)
        else:
            print(f"Skip: {label} (Path not found: {path})")

if __name__ == "__main__":
    main()
