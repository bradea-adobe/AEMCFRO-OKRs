#!/usr/bin/env node
/**
 * Azure OpenAI Responses API - JavaScript/Node.js Client
 * 
 * Provides a simple function to call Azure OpenAI's Responses API with a prompt
 * and return the completion response.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#') && line.includes('=')) {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=').trim();
                if (!process.env[key.trim()]) {
                    process.env[key.trim()] = value;
                }
            }
        });
    }
}

loadEnv();

// Azure OpenAI Configuration from environment variables
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY || "";
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || "";
const DEFAULT_MODEL = process.env.AZURE_OPENAI_MODEL || "gpt-5-mini";

if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT) {
    throw new Error(
        "Missing Azure OpenAI configuration. Please set AZURE_OPENAI_KEY and " +
        "AZURE_OPENAI_ENDPOINT in your .env file or environment variables."
    );
}

/**
 * Call Azure OpenAI Responses API and return the completion.
 * 
 * @param {string} prompt - The input prompt/question to send to the AI
 * @param {Object} options - Optional configuration
 * @param {number} options.maxOutputTokens - Maximum tokens for the response (default: 500)
 * @param {number} options.temperature - Sampling temperature 0.0-2.0 (default: 1.0)
 * @param {string} options.model - The model to use (default: gpt-5-mini)
 * @param {string} options.reasoningEffort - Reasoning effort: low, medium, high (default: medium)
 * @param {boolean} options.disableSslVerify - Disable SSL verification for corporate environments (default: true)
 * @returns {Promise<Object>} Result object with success, text, full_response, usage, or error
 */
async function getCompletion(prompt, options = {}) {
    const {
        maxOutputTokens = 500,
        temperature = 1.0,
        model = DEFAULT_MODEL,
        reasoningEffort = "medium",
        disableSslVerify = true
    } = options;

    // Prepare the request payload
    const payload = {
        input: prompt,
        max_output_tokens: maxOutputTokens,
        model: model,
        reasoning: {
            effort: reasoningEffort
        }
    };
    
    // Only add temperature if model supports it (not for gpt-5-mini)
    if (!model.toLowerCase().includes("gpt-5-mini")) {
        payload.temperature = temperature;
    }

    const payloadString = JSON.stringify(payload);

    // Parse the endpoint URL
    const url = new URL(AZURE_OPENAI_ENDPOINT);

    // Prepare request options
    const requestOptions = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AZURE_OPENAI_KEY}`,
            'Content-Length': Buffer.byteLength(payloadString)
        },
        rejectUnauthorized: !disableSslVerify
    };

    return new Promise((resolve, reject) => {
        const req = https.request(requestOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);

                    // Check for HTTP errors
                    if (res.statusCode !== 200) {
                        const errorMessage = result.error?.message || data;
                        resolve({
                            success: false,
                            error: `HTTP ${res.statusCode}: ${errorMessage}`,
                            text: null
                        });
                        return;
                    }

                    // Extract the text from the response
                    let text = "";
                    if (result.status === "completed" && result.output) {
                        for (const outputItem of result.output) {
                            if (outputItem.type === "message") {
                                const content = outputItem.content || [];
                                for (const contentItem of content) {
                                    if (contentItem.type === "output_text") {
                                        text = contentItem.text || "";
                                        break;
                                    }
                                }
                                if (text) break;
                            }
                        }
                    }

                    resolve({
                        success: true,
                        text: text,
                        full_response: result,
                        usage: result.usage || {},
                        status: result.status,
                        model: result.model
                    });

                } catch (error) {
                    resolve({
                        success: false,
                        error: `Parse error: ${error.message}`,
                        text: null
                    });
                }
            });
        });

        req.on('error', (error) => {
            resolve({
                success: false,
                error: `Request error: ${error.message}`,
                text: null
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                success: false,
                error: 'Request timeout after 30 seconds',
                text: null
            });
        });

        req.setTimeout(30000);
        req.write(payloadString);
        req.end();
    });
}

/**
 * Example usage of the getCompletion function
 */
async function main() {
    console.log("=".repeat(70));
    console.log("  Azure OpenAI Responses API - JavaScript Client Test");
    console.log("=".repeat(70));
    console.log();

    // Example 1: Simple hello world
    console.log("📝 Example 1: Simple Hello World");
    console.log("-".repeat(70));
    let result = await getCompletion("Say 'Hello World' and introduce yourself in one sentence.");

    if (result.success) {
        console.log(`✅ Status: ${result.status}`);
        console.log(`📄 Response:\n${result.text}`);
        console.log(`📊 Tokens used: ${result.usage.total_tokens || 'N/A'}`);
    } else {
        console.log(`❌ Error: ${result.error}`);
    }

    console.log();

    // Example 2: Reasoning task
    console.log("📝 Example 2: Reasoning Task");
    console.log("-".repeat(70));
    result = await getCompletion(
        "What is 15% of 240? Show your reasoning.",
        { reasoningEffort: "high" }
    );

    if (result.success) {
        console.log(`✅ Status: ${result.status}`);
        console.log(`📄 Response:\n${result.text}`);
        console.log(`📊 Tokens used: ${result.usage.total_tokens || 'N/A'}`);
        const reasoningTokens = result.usage.output_tokens_details?.reasoning_tokens || 0;
        console.log(`🧠 Reasoning tokens: ${reasoningTokens}`);
    } else {
        console.log(`❌ Error: ${result.error}`);
    }

    console.log();
    console.log("=".repeat(70));
}

// Export the function for use as a module
module.exports = { getCompletion };

// Run examples if executed directly
if (require.main === module) {
    main().catch(console.error);
}

