#!/usr/bin/env node
/**
 * Example: Using azure_openai.js as an imported module
 */

const { getCompletion } = require('./azure_openai');

/**
 * Example function that uses the Azure OpenAI client to analyze
 * a Jira pause request and extract key information.
 */
async function analyzeJiraPauseRequest(description) {
    const prompt = `
    Analyze the following Jira pause request description and extract:
    1. The main reason for the pause
    2. Whether it's related to a regression, CSO, or business restriction
    3. Suggested duration category (< 8 days or > 8 days)
    
    Description:
    ${description}
    
    Provide a brief analysis.
    `;
    
    const result = await getCompletion(prompt, {
        maxOutputTokens: 1000,
        reasoningEffort: "high"
    });
    
    if (result.success) {
        return result.text;
    } else {
        return `Error: ${result.error}`;
    }
}

async function main() {
    console.log("=".repeat(70));
    console.log("  Example: Analyzing a Jira Pause Request");
    console.log("=".repeat(70));
    console.log();
    
    // Example Jira description
    const jiraDescription = `
    Customer noticed an issue in their DEV environment after their AEM 
    was updated. They want to pause updates on Stage and Prod until 
    the issue is resolved. The issue appears to be a regression in the 
    Forms component that breaks form submission. Expected resolution 
    time is 5 days.
    `;
    
    console.log("📋 Jira Description:");
    console.log(jiraDescription);
    console.log();
    console.log("🤖 AI Analysis:");
    console.log("-".repeat(70));
    
    const analysis = await analyzeJiraPauseRequest(jiraDescription);
    console.log(analysis);
    
    console.log();
    console.log("=".repeat(70));
}

// Run example if executed directly
if (require.main === module) {
    main().catch(console.error);
}

// Export for use as module
module.exports = { analyzeJiraPauseRequest };

