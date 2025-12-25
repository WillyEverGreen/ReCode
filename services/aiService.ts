import { SubmissionData, AIAnalysisResult, SolutionResult } from "../types";

// In-flight request guard (only for analyzeSubmission - backend handles solution)
let analyzeInFlight = false;

// API base URL - empty in production for Vercel serverless (relative /api routes)
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Qubrid AI API Configuration
const QUBRID_API_URL = "https://platform.qubrid.com/api/v1/qubridai/chat/completions";
const QUBRID_MODEL = "Qwen/Qwen3-Coder-30B-A3B-Instruct";

// ============================================
// RESPONSE CACHING
// ============================================
type CacheEntry<T> = { value: T; timestamp: number };
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (longer for LC problems)

const analysisCache = new Map<string, CacheEntry<AIAnalysisResult>>();

// Stable hash-based cache key (fixes JSON.stringify fragility)
const createCacheKey = (input: string): string => {
  // Simple hash using btoa (browser-compatible)
  try {
    return btoa(encodeURIComponent(input)).slice(0, 64);
  } catch {
    // Fallback for very long strings
    return input.slice(0, 100).replace(/\s+/g, "_");
  }
};

// Intelligent error mapper for user-friendly messages
const mapQubridError = (error: any): Error => {
  const message = error?.message || "";

  if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("rate limit")) {
    return new Error("AI usage limit reached. Please wait a minute and try again.");
  }

  if (message.includes("JSON") || message.includes("parse")) {
    return new Error("AI returned an invalid response. Please retry.");
  }

  if (message.includes("network") || message.includes("fetch") || message.includes("ENOTFOUND") || message.includes("Failed to fetch")) {
    return new Error("Network error while contacting the AI service.");
  }

  if (message.includes("API_KEY") || message.includes("API Key") || message.includes("401") || message.includes("Unauthorized")) {
    return new Error("API key is missing or invalid. Please check your configuration.");
  }

  if (message.includes("404") || message.includes("not found")) {
    return new Error("AI model not found. Please check the model name.");
  }

  return new Error("Something went wrong while processing. Please try again.");
};

// IMPROVED PROMPT: Concise, token-efficient, structured
const generatePrompt = (data: SubmissionData): string => {
  return `You are a DSA revision assistant.
Convert the user's solution into structured, highly readable revision notes.

INPUT
Problem URL: ${data.problemUrl || "N/A"}

USER CODE:
${data.code}

OUTPUT
Return a JSON object with these fields. Use Markdown formatting for better readability.

problemOverview:
- 2–3 lines explaining the problem goal clearly.

testCases:
- Return an Array of strings.
- Format: "Input: \`...\` → Output: \`...\`" (No bullets)

coreLogic:
- Return a Nested JSON Object with these keys:
  - "Pattern": Name the pattern.
  - "Trick": 15-second revision trick.
  - "Approach": Array of strings (Step-by-step).
  - "WhyItWorks": Intuition.

edgeCases:
- Return an Array of strings (No bullets).
- Format: "**Condition:** Result/Behavior" (e.g., "**Empty Input:** Returns 0")

syntaxNotes:
- Return an Array of strings (No bullets).
- Format: "\`Code snippet\`: Explanation"

improvementMarkdown:
- Possible improvements (if any).
- Final polished code (only if improvement exists).

RULES:
- Infer problem title and language from code.
- Use **Bold** for key terms to make them scannable.
- Keep descriptions concise but informative.`;
};

export const analyzeSubmission = async (
  data: SubmissionData
): Promise<AIAnalysisResult> => {

  // FIX: Check cache BEFORE in-flight guard (fixes race condition)
  const cacheKey = createCacheKey(data.code + (data.problemUrl || ""));
  const cached = analysisCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("[CACHE HIT] Returning cached analysis result");
    return cached.value;
  }

  // Now check in-flight guard
  if (analyzeInFlight) {
    throw new Error("Analysis already in progress. Please wait.");
  }

  if (!import.meta.env.VITE_QUBRID_API_KEY) {
    throw new Error("API Key is missing. Set VITE_QUBRID_API_KEY in your environment.");
  }

  analyzeInFlight = true;

  try {
    // Build the prompt with JSON output instructions
    const prompt = generatePrompt(data) + `

OUTPUT FORMAT (JSON):
{
  "title": "Inferred Problem Title",
  "language": "Inferred Language",
  "dsaCategory": "Primary DSA Category",
  "pattern": "Core Pattern used",
  "timeComplexity": "O(...)",
  "timeComplexityReason": "Brief reason",
  "spaceComplexity": "O(...)",
  "spaceComplexityReason": "Brief reason",
  "revisionNotes": ["5-7 quick revision bullets"],
  "problemOverview": "2-3 line summary",
  "testCases": "Formatted test cases",
  "coreLogic": "Pattern, Trick, Approach, Reasoning",
  "edgeCases": "6 edge cases",
  "syntaxNotes": "6 syntax bullets",
  "improvementMarkdown": "Improvements + polished code"
}

Return ONLY valid JSON, no markdown fences.`;

    // Call Qubrid API (OpenAI-compatible format)
    const response = await fetch(QUBRID_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_QUBRID_API_KEY}`
      },
      body: JSON.stringify({
        model: QUBRID_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a DSA revision assistant. Return concise, structured JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4096,
        temperature: 0.7,
        stream: false  // IMPORTANT: Disable streaming to get JSON response
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Qubrid API error: ${response.status}`);
    }

    const responseJson = await response.json();
    let text = responseJson.choices?.[0]?.message?.content || "";

    console.log("[QUBRID DEBUG] Raw response type:", typeof text);
    
    // Clean up markdown code fences from JSON response
    if (text.startsWith("```json")) text = text.slice(7);
    if (text.startsWith("```")) text = text.slice(3);
    if (text.endsWith("```")) text = text.slice(0, -3);
    text = text.trim();

    if (!text) {
      throw new Error("No response generated from Qubrid. Check console for details.");
    }

    const result = JSON.parse(text) as AIAnalysisResult;
    
    // Clean up improvementMarkdown code blocks if needed
    if (result.improvementMarkdown) {
      // Remove any double-wrapped backticks if they appear
      result.improvementMarkdown = result.improvementMarkdown.replace(/```typescript\s*```typescript/g, '```typescript');
      result.improvementMarkdown = result.improvementMarkdown.replace(/```\s*```/g, '```');
    }

    // Cache the result
    analysisCache.set(cacheKey, { value: result, timestamp: Date.now() });
    console.log("[CACHE STORE] Cached analysis result");
    
    return result;
  } catch (error) {
    console.error("Qubrid API Error:", error);
    throw mapQubridError(error);
  } finally {
    analyzeInFlight = false;
  }
};

// Generate solution for a problem - Uses backend API with multi-tier caching
// Note: No frontend in-flight guard needed - backend handles deduplication
export const generateSolution = async (
  questionName: string,
  language: string,
  problemDescription?: string
): Promise<SolutionResult> => {

  try {
    // Call backend API (has multi-tier cache: Redis → MongoDB → Memory → AI)
    const response = await fetch(`${API_BASE_URL}/api/solution`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionName, language, problemDescription }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate solution");
    }

    const data = await response.json();
    
    if (data.fromCache) {
      console.log(`[${data.data.tier?.toUpperCase() || "CACHE"} HIT] Solution served from cache`);
    } else {
      console.log("[QUBRID] Fresh solution generated and cached on server");
    }

    return data.data as SolutionResult;
  } catch (error) {
    console.error("Solution API Error:", error);
    throw mapQubridError(error);
  }
};
