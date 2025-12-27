import { SubmissionData, AIAnalysisResult, SolutionResult } from "../types";

// Import Complexity Analysis Engine (for validating/correcting AI output)
// @ts-ignore - JS module
import { getCorrectedComplexity } from "../utils/complexityEngine.js";

// In-flight request guard (only for analyzeSubmission - backend handles solution)
let analyzeInFlight = false;

// API base URL - empty in production for Vercel serverless (relative /api routes)
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Qubrid AI API Configuration
const QUBRID_API_URL = "https://platform.qubrid.com/api/v1/qubridai/chat/completions";
const QUBRID_MODEL = "Qwen/Qwen3-Coder-30B-A3B-Instruct";


// Helper function to increment usage counter and trigger UI refresh
const incrementUsage = async (type: 'addSolution') => {
  try {
    const token = localStorage.getItem("token");
    await fetch(`${API_BASE_URL}/api/usage/increment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ type })
    });
    console.log(`[USAGE] Incremented ${type} counter`);
    
    // Dispatch event to refresh UsageDisplay component
    window.dispatchEvent(new Event("usage-updated"));
  } catch (e) {
    // Non-blocking - usage tracking shouldn't break the feature
    console.error("[USAGE] Failed to increment:", e);
  }
};

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


improvementMarkdown:
- **CRITICAL:** Analyze code critically for improvements
- **DO NOT** say "stellar" or "excellent" unless code is TRULY optimal
- **CHECK:**
  1. Time Complexity: Can it be reduced?
  2. Space Complexity: Can it be reduced?
  3. Code quality: Readability, edge cases, best practices
- **IF IMPROVEMENTS:** Provide detailed optimization suggestions with code
- **IF PERFECT:** Return empty string (don't praise unnecessarily)

RULES:
- Infer problem title and language from code.
- Use **Bold** for key terms to make them scannable.
- Keep descriptions concise but informative.
- BE CRITICAL: Only praise if truly optimal in time AND space complexity.`;
};

export const analyzeSubmission = async (
  data: SubmissionData
): Promise<AIAnalysisResult> => {

  // ==================== INPUT LIMITS (prevent abuse) ====================
  const LIMITS = {
    code: 10000,        // Max 10,000 chars (~300-400 lines of code)
    problemUrl: 500     // Max 500 chars for URL
  };
  
  if (!data.code || data.code.trim().length === 0) {
    throw new Error("Code is required for analysis.");
  }
  
  if (data.code.length > LIMITS.code) {
    throw new Error(`Code too long. Maximum ${LIMITS.code} characters allowed (yours: ${data.code.length}).`);
  }
  
  if (data.problemUrl && data.problemUrl.length > LIMITS.problemUrl) {
    throw new Error(`Problem URL too long. Maximum ${LIMITS.problemUrl} characters allowed.`);
  }

  // FIX: Check cache BEFORE in-flight guard (fixes race condition)
  const cacheKey = createCacheKey(data.code + (data.problemUrl || ""));
  const cached = analysisCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("[CACHE HIT] Returning cached analysis result");
    return cached.value;
  }

  // Check usage limit BEFORE making expensive API call
  // In development, we skip this check entirely.
  if (!import.meta.env.DEV && !import.meta.env.VITE_IGNORE_USAGE_LIMITS) {
    try {
      const token = localStorage.getItem("token");
      const usageRes = await fetch(`${API_BASE_URL}/api/usage`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        if (usageData.addSolution?.left === 0) {
          throw new Error(`Daily limit reached (${usageData.addSolution.limit}/day). Try again tomorrow or upgrade to Pro!`);
        }
      }
    } catch (limitError) {
      // If it's our limit error, rethrow. Otherwise continue (usage check failed)
      if (limitError instanceof Error && limitError.message.includes("Daily limit")) {
        throw limitError;
      }
      console.warn("[USAGE] Could not check limit:", limitError);
    }
  } else {
    console.log("[USAGE] Skipping usage limit check in development mode");
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

    // Retry up to 3 times for empty responses (known Qwen3-Coder issue)
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[QUBRID] Attempt ${attempt}/${MAX_RETRIES}...`);
      
      // Add 30s timeout to prevent hung requests
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
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
                content: "You are a DSA revision assistant. Return concise, structured JSON only. Do not include any text outside the JSON."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            max_tokens: 6000,
            temperature: 0.5 + (attempt * 0.1),  // Slightly vary temperature on retries
            stream: false
          }),
          signal: controller.signal
        }).finally(() => clearTimeout(timeout));

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[QUBRID] API error response:", response.status, errorData);
          throw new Error(errorData.error?.message || `Qubrid API error: ${response.status}`);
        }

        const responseJson = await response.json();
        console.log("[QUBRID DEBUG] Full response:", JSON.stringify(responseJson).slice(0, 500));
        
        // Handle BOTH response formats:
        // 1. Qubrid format: { content: "...", metrics: {...}, model: "..." }
        // 2. OpenAI format: { choices: [{ message: { content: "..." } }] }
        let text = "";
        
        if (responseJson.content && typeof responseJson.content === "string") {
          // Qubrid's direct format
          console.log("[QUBRID] Using Qubrid direct format (content at root)");
          text = responseJson.content;
        } else if (responseJson.choices?.[0]?.message?.content) {
          // OpenAI-compatible format
          console.log("[QUBRID] Using OpenAI-compatible format (choices array)");
          text = responseJson.choices[0].message.content;
        } else {
          console.error("[QUBRID] Unknown response structure:", responseJson);
          throw new Error("Unknown API response format");
        }
        
        console.log("[QUBRID DEBUG] Raw response length:", text.length);
        
        // Clean up markdown code fences from JSON response
        if (text.startsWith("```json")) text = text.slice(7);
        if (text.startsWith("```")) text = text.slice(3);
        if (text.endsWith("```")) text = text.slice(0, -3);
        text = text.trim();

        if (!text || text.length < 50) {
          console.warn(`[QUBRID] Attempt ${attempt}: Empty or too short response, retrying...`);
          lastError = new Error("Empty response");
          continue;  // Retry
        }

        // Parse JSON with error recovery
        let result: AIAnalysisResult;
        try {
          result = JSON.parse(text) as AIAnalysisResult;
        } catch (parseError) {
          console.error("[QUBRID] JSON parse error, trying recovery:", text.slice(0, 200));
          const lastBrace = text.lastIndexOf("}");
          if (lastBrace > 0) {
            try {
              result = JSON.parse(text.slice(0, lastBrace + 1)) as AIAnalysisResult;
              console.log("[QUBRID] Recovered from truncated JSON");
            } catch {
              lastError = new Error("Failed to parse response");
              continue;  // Retry
            }
          } else {
            lastError = new Error("Invalid JSON response");
            continue;  // Retry
          }
        }
        
        // Clean up improvementMarkdown code blocks if needed
        if (result.improvementMarkdown) {
          result.improvementMarkdown = result.improvementMarkdown.replace(/```typescript\s*```typescript/g, '```typescript');
          result.improvementMarkdown = result.improvementMarkdown.replace(/```\s*```/g, '```');
        }

        // ═══════════════════════════════════════════════════════════════
        // COMPLEXITY ENGINE: Validate/correct AI-generated TC & SC
        // Also log whether final TC/SC came from AI or engine
        // ═══════════════════════════════════════════════════════════════
        try {
          const corrected = getCorrectedComplexity(
            result.timeComplexity,
            result.spaceComplexity,
            data.code,
            data.language || 'python'
          );
          
          if (corrected.corrected) {
            console.log(`[COMPLEXITY ENGINE] SOURCE=ENGINE | Corrected TC: ${result.timeComplexity} → ${corrected.timeComplexity}`);
            console.log(`[COMPLEXITY ENGINE] SOURCE=ENGINE | Corrected SC: ${result.spaceComplexity} → ${corrected.spaceComplexity}`);
            result.timeComplexity = corrected.timeComplexity;
            result.spaceComplexity = corrected.spaceComplexity;
            if (corrected.timeComplexityReason) {
              result.timeComplexityReason = corrected.timeComplexityReason;
            }
            if (corrected.spaceComplexityReason) {
              result.spaceComplexityReason = corrected.spaceComplexityReason;
            }
          } else {
            console.log(`[COMPLEXITY ENGINE] SOURCE=LLM   | Using AI-provided TC/SC without override (TC=${result.timeComplexity}, SC=${result.spaceComplexity})`);
          }
        } catch (engineError) {
          console.warn("[COMPLEXITY ENGINE] Error (using AI values):", engineError);
        }

        // Cache the result
        analysisCache.set(cacheKey, { value: result, timestamp: Date.now() });
        console.log("[CACHE STORE] Cached analysis result");
        
        // Increment usage counter (non-blocking)
        incrementUsage('addSolution');
        
        return result;

        
      } catch (attemptError) {
        console.error(`[QUBRID] Attempt ${attempt} failed:`, attemptError);
        lastError = attemptError instanceof Error ? attemptError : new Error(String(attemptError));
        
        if (attempt < MAX_RETRIES) {
          // Wait 1s before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // All retries exhausted
    throw lastError || new Error("All retries failed. Please try again later.");
    
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
    // Get token for authentication
    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
      "Content-Type": "application/json"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Call backend API (has multi-tier cache: Redis → MongoDB → Memory → AI)
    const response = await fetch(`${API_BASE_URL}/api/solution`, {
      method: "POST",
      headers,
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
      // Trigger usage display refresh for non-cached (AI-generated) responses
      window.dispatchEvent(new Event("usage-updated"));
    }

    // Include fromCache and tier in the returned result for UI display
    return {
      ...data.data,
      fromCache: data.fromCache,
      tier: data.data.tier
    } as SolutionResult;
  } catch (error) {
    console.error("Solution API Error:", error);
    throw mapQubridError(error);
  }
};
