#!/usr/bin/env python3
"""
Azure OpenAI Responses API - Python Client

Provides a simple function to call Azure OpenAI's Responses API with a prompt
and return the completion response.
"""

import json
import urllib.request
import urllib.error
import ssl
import os
from typing import Dict, Any, Optional
from pathlib import Path

# Load environment variables from .env file
def load_env():
    """Load environment variables from .env file if it exists."""
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ.setdefault(key.strip(), value.strip())

load_env()

# Azure OpenAI Configuration from environment variables
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY", "")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "")
DEFAULT_MODEL = os.getenv("AZURE_OPENAI_MODEL", "gpt-5-mini")

if not AZURE_OPENAI_KEY or not AZURE_OPENAI_ENDPOINT:
    raise ValueError(
        "Missing Azure OpenAI configuration. Please set AZURE_OPENAI_KEY and "
        "AZURE_OPENAI_ENDPOINT in your .env file or environment variables."
    )


def get_completion(
    prompt: str,
    max_output_tokens: int = 500,
    temperature: float = 1.0,
    model: str = DEFAULT_MODEL,
    reasoning_effort: str = "medium",
    disable_ssl_verify: bool = True
) -> Dict[str, Any]:
    """
    Call Azure OpenAI Responses API and return the completion.
    
    Args:
        prompt: The input prompt/question to send to the AI
        max_output_tokens: Maximum tokens for the response (default: 500)
        temperature: Sampling temperature 0.0-2.0 (default: 1.0)
        model: The model to use (default: gpt-5-mini)
        reasoning_effort: Reasoning effort level: low, medium, high (default: medium)
        disable_ssl_verify: Disable SSL verification for corporate environments (default: True)
    
    Returns:
        Dictionary containing:
            - success: Boolean indicating if the call was successful
            - text: The completion text (if successful)
            - full_response: The complete API response
            - error: Error message (if failed)
            - usage: Token usage statistics (if successful)
    """
    
    # Prepare the request payload
    payload = {
        "input": prompt,
        "max_output_tokens": max_output_tokens,
        "model": model,
        "reasoning": {
            "effort": reasoning_effort
        }
    }
    
    # Only add temperature if model supports it (not for gpt-5-mini)
    if "gpt-5-mini" not in model.lower():
        payload["temperature"] = temperature
    
    # Convert payload to JSON bytes
    data = json.dumps(payload).encode('utf-8')
    
    # Create the request
    req = urllib.request.Request(
        AZURE_OPENAI_ENDPOINT,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {AZURE_OPENAI_KEY}"
        },
        method="POST"
    )
    
    # Create SSL context
    ctx = None
    if disable_ssl_verify:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
    
    try:
        # Make the API call
        with urllib.request.urlopen(req, timeout=120, context=ctx) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            # Extract the text from the response
            text = ""
            # Check for output regardless of status (completed or incomplete with text)
            if result.get("output"):
                for output_item in result["output"]:
                    if output_item.get("type") == "message":
                        content = output_item.get("content", [])
                        for content_item in content:
                            if content_item.get("type") == "output_text":
                                text = content_item.get("text", "")
                                break
                        if text:
                            break
            
            return {
                "success": True,
                "text": text,
                "full_response": result,
                "usage": result.get("usage", {}),
                "status": result.get("status"),
                "model": result.get("model")
            }
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        try:
            error_json = json.loads(error_body)
            error_message = error_json.get("error", {}).get("message", error_body)
        except:
            error_message = error_body
            
        return {
            "success": False,
            "error": f"HTTP {e.code}: {error_message}",
            "text": None
        }
        
    except urllib.error.URLError as e:
        return {
            "success": False,
            "error": f"URL Error: {e.reason}",
            "text": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"{type(e).__name__}: {str(e)}",
            "text": None
        }


def main():
    """Example usage of the get_completion function."""
    
    print("=" * 70)
    print("  Azure OpenAI Responses API - Python Client Test")
    print("=" * 70)
    print()
    
    # Example 1: Simple hello world
    print("📝 Example 1: Simple Hello World")
    print("-" * 70)
    result = get_completion("Say 'Hello World' and introduce yourself in one sentence.")
    
    if result["success"]:
        print(f"✅ Status: {result['status']}")
        print(f"📄 Response:\n{result['text']}")
        print(f"📊 Tokens used: {result['usage'].get('total_tokens', 'N/A')}")
    else:
        print(f"❌ Error: {result['error']}")
    
    print()
    
    # Example 2: Reasoning task
    print("📝 Example 2: Reasoning Task")
    print("-" * 70)
    result = get_completion(
        "What is 15% of 240? Show your reasoning.",
        reasoning_effort="high"
    )
    
    if result["success"]:
        print(f"✅ Status: {result['status']}")
        print(f"📄 Response:\n{result['text']}")
        print(f"📊 Tokens used: {result['usage'].get('total_tokens', 'N/A')}")
        reasoning_tokens = result['usage'].get('output_tokens_details', {}).get('reasoning_tokens', 0)
        print(f"🧠 Reasoning tokens: {reasoning_tokens}")
    else:
        print(f"❌ Error: {result['error']}")
    
    print()
    print("=" * 70)


if __name__ == "__main__":
    main()

