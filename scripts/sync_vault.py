import os
import sys
import json
import requests
import hashlib

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

def sync_vault(vault_path, pxi_env_path):
    env = load_env(pxi_env_path)
    gemini_key = env.get('VITE_GEMINI_API_KEY')
    pinecone_key = env.get('VITE_PINECONE_API_KEY')
    pinecone_host = env.get('VITE_PINECONE_URL') # Added as VITE_PINECONE_URL in .env.local

    if not all([gemini_key, pinecone_key, pinecone_host]):
        print("Error: Missing credentials in .env.local")
        return

    print(f"Starting sync for vault: {vault_path}")
    
    # Subfolders to sync
    knowledge_path = os.path.join(vault_path, "Knowledge")
    if not os.path.exists(knowledge_path):
        print(f"Knowledge folder not found at {knowledge_path}")
        return

    for root, dirs, files in os.walk(knowledge_path):
        namespace = "personal_brain" # Standard namespace for Mnemosyne
        
        for file in files:
            if file.endswith(".md"):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, vault_path)
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                if not content.strip():
                    continue

                print(f"Syncing {rel_path}...")
                
                # Generate stable ID
                vector_id = hashlib.md5(rel_path.encode()).hexdigest()
                
                # Get Embedding
                values = get_embedding(content, gemini_key)
                if not values:
                    continue

                # Prepare Metadata
                metadata = {
                    "path": rel_path,
                    "filename": file,
                    "content": content[:1000], # Store snippet for quick retrieval
                    "type": "distilled_knowledge"
                }

                # Upsert
                success = upsert_to_pinecone(pinecone_host, pinecone_key, vector_id, values, metadata, namespace)
                if success:
                    print(f"Successfully synced {rel_path}")

if __name__ == "__main__":
    # Default paths
    vault_default = r"c:\Users\akinb\OneDrive\Desktop\Personal Assistant"
    pxi_env_default = r"c:\Users\akinb\pxi-os-core\.env.local"
    
    sync_vault(vault_default, pxi_env_default)
