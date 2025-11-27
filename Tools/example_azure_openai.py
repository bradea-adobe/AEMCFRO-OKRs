#!/usr/bin/env python3
"""
Example: Using azure_openai.py as an imported module
"""

from azure_openai import get_completion

def analyze_jira_pause_request(description: str) -> str:
    """
    Example function that uses the Azure OpenAI client to analyze
    a Jira pause request and extract key information.
    """
    
    prompt = f"""
    Analyze the following Jira pause request description and extract:
    1. The main reason for the pause
    2. Whether it's related to a regression, CSO, or business restriction
    3. Suggested duration category (< 8 days or > 8 days)
    
    Description:
    {description}
    
    Provide a brief analysis.
    """
    
    result = get_completion(
        prompt=prompt,
        max_output_tokens=1000,
        reasoning_effort="high"
    )
    
    if result["success"]:
        return result["text"]
    else:
        return f"Error: {result['error']}"


def main():
    print("=" * 70)
    print("  Example: Analyzing a Jira Pause Request")
    print("=" * 70)
    print()
    
    # Example Jira description
    jira_description = """
    Customer noticed an issue in their DEV environment after their AEM 
    was updated. They want to pause updates on Stage and Prod until 
    the issue is resolved. The issue appears to be a regression in the 
    Forms component that breaks form submission. Expected resolution 
    time is 5 days.
    """
    
    print("📋 Jira Description:")
    print(jira_description)
    print()
    print("🤖 AI Analysis:")
    print("-" * 70)
    
    analysis = analyze_jira_pause_request(jira_description)
    print(analysis)
    
    print()
    print("=" * 70)


if __name__ == "__main__":
    main()

