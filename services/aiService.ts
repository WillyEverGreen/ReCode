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

// ═══════════════════════════════════════════════════════════════════════════════
// FINAL GUARANTEE STACK - 7 LAYERS OF CORRECTNESS
// ═══════════════════════════════════════════════════════════════════════════════

// LAYER 1: Algorithm Equivalence Guard
// Prevents fake "better" approaches with same TC/SC
function isSameAlgorithm(a: any, b: any): boolean {
  if (!a || !b) return false;
  const norm = (s = "") => s.toLowerCase().replace(/\s+/g, "");
  return (
    norm(a.pattern) === norm(b.pattern) &&
    norm(a.timeComplexity) === norm(b.timeComplexity) &&
    norm(a.spaceComplexity) === norm(b.spaceComplexity)
  );
}

// LAYER 2: Amortized Complexity Detector
// Overrides static analysis for amortized patterns
function applyAmortizedOverrides(code: string, detectedTC: string): string {
  const c = code.replace(/\s+/g, "").toLowerCase();

  // Monotonic Stack (each element pushed/popped once)
  if (c.includes("stack") && c.includes("while") && (c.includes("pop()") || c.includes(".pop("))) {
    return "O(n)";
  }

  // Sliding Window (two pointers moving forward)
  if ((c.includes("left++") || c.includes("l++") || c.includes("left+=")) && 
      (c.includes("right++") || c.includes("r++") || c.includes("right+="))) {
    return "O(n)";
  }

  // Union-Find with path compression
  if (c.includes("find(") && c.includes("parent")) {
    return "O(α(n))";
  }

  // BFS/DFS traversal
  if ((c.includes("queue") || c.includes("deque")) && c.includes("while")) {
    return "O(n)";
  }

  return detectedTC;
}

// LAYER 3: Recursion Tree Analyzer (STRENGTHENED)
// Detects exponential recursion - counts function calls by name
function detectRecursiveExplosion(code: string): boolean {
  // Extract function name (works for Python, JS, Java, C++)
  const fnMatch = code.match(/def\s+(\w+)|function\s+(\w+)|(\w+)\s*=\s*\(|public\s+\w+\s+(\w+)\s*\(/);
  const fnName = fnMatch?.[1] || fnMatch?.[2] || fnMatch?.[3] || fnMatch?.[4];
  
  if (!fnName) return false;
  
  // Count how many times this function calls itself
  const callPattern = new RegExp(`${fnName}\\s*\\(`, 'g');
  const calls = code.match(callPattern) || [];
  
  // If function is defined once and called 2+ more times, it's tree recursion
  // (1 definition + 2+ recursive calls = exponential)
  return calls.length >= 3; // def + 2 calls
}

// LAYER 4: Space Complexity Truth Guard
// Forces O(n) when data structures are clearly used
function detectSpaceUsage(code: string): string | null {
  const c = code.toLowerCase();
  
  // Explicit data structures
  if (c.includes("stack") || c.includes("set(") || c.includes("map(") || 
      c.includes("dict(") || c.includes("{}") || c.includes("hashmap") ||
      c.includes("defaultdict") || c.includes("counter(")) {
    return "O(n)";
  }
  
  // Recursion implies call stack
  if (c.includes("def ") && c.match(/return\s+\w+\s*\(/)) {
    return "O(n)";
  }
  
  return null;
}

// LAYER 6: Pattern → Complexity Hard Map (Final Backstop)
const PATTERN_TC_MAP: Record<string, string> = {
  // Linear patterns - O(n)
  "sliding window": "O(n)",
  "two pointers": "O(n)",
  "monotonic stack": "O(n)",
  "hash map": "O(n)",
  "hash table": "O(n)",
  "prefix sum": "O(n)",
  "kadane": "O(n)",
  "dfs": "O(n)",
  "bfs": "O(n)",
  "linear scan": "O(n)",
  "one pass": "O(n)",
  
  // Log patterns - O(log n)
  "binary search": "O(log n)",
  
  // N log N patterns - O(n log n)
  "merge sort": "O(n log n)",
  "quick sort": "O(n log n)",
  "heap": "O(n log n)",
  "sorting": "O(n log n)",
  
  // Special patterns
  "union find": "O(α(n))",
  
  // Polynomial patterns
  "dynamic programming": "O(n²)",
  "dp": "O(n²)",
};

// Apply pattern-based TC override as final backstop
function applyPatternOverride(pattern: string, detectedTC: string): string {
  const normalizedPattern = pattern.toLowerCase().trim();
  for (const [key, tc] of Object.entries(PATTERN_TC_MAP)) {
    if (normalizedPattern.includes(key)) {
      return tc;
    }
  }
  return detectedTC;
}

// ═══════════════════════════════════════════════════════════════════════════════

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

  // Friendly daily-limit messaging that nudges upgrade
  if (message.includes("Daily limit reached")) {
    return new Error("You've hit today's Free plan limit. Upgrade to Pro to continue using this feature today.");
  }

  if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("rate limit")) {
    return new Error("AI usage limit reached. Please wait a minute and try again, or upgrade to Pro if this keeps happening.");
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
- Return an Array of strings (3-5 test cases).
- CRITICAL: Each test case MUST be VERIFIED by tracing through the code.
- Format: "Input: [actual value] → Output: [expected result]"
- Include: 1 basic case, 1 edge case (empty/single), 1 boundary case
- Example: "Input: nums=[2,7,11,15], target=9 → Output: [0,1]"

coreLogic:
- Return a Nested JSON Object with these keys:
  - "Pattern": Name the pattern.
  - "Trick": 15-second revision trick.
  - "Approach": Array of strings (Step-by-step).
  - "WhyItWorks": Intuition.

edgeCases:
- Return an Array of strings (4-6 edge cases).
- Each must include SPECIFIC input and expected behavior.
- Format: "**[Condition]:** Input: [value] → Output: [result]"
- Example: "**Empty Array:** Input: [] → Output: 0 or throws error"

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

// Request LLM to reconsider complexity analysis (for Add Solution feature)
async function requestLLMReconsideration(
  problemName: string,
  llmTC: string,
  llmSC: string,
  engineTC: string,
  engineSC: string,
  code: string,
  language: string
): Promise<{ finalTC: string; finalSC: string; reasoning: string } | null> {
  const prompt = `You are a complexity analysis expert. Our static code analyzer detected different complexity than your analysis.

PROBLEM: ${problemName}
LANGUAGE: ${language}

CODE:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

COMPLEXITY DISCREPANCY:
- Your Initial Analysis: Time=${llmTC}, Space=${llmSC}
- Engine's Analysis: Time=${engineTC}, Space=${engineSC}

TASK: 
1. Carefully reconsider the code's complexity
2. Provide your FINAL answer with CONCISE reasoning.
3. If overriding, do NOT write a paragraph. Keep it to 1 sentence if possible.

Return your answer in this JSON format:
{
  "finalTimeComplexity": "O(...)",
  "finalSpaceComplexity": "O(...)",
  "reasoning": "EXTREMELY CONCISE (max 20 words). Direct structural justification only. No fluff."
}

Return ONLY valid JSON, no markdown fences.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(QUBRID_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_QUBRID_API_KEY}`
      },
      body: JSON.stringify({
        model: QUBRID_MODEL,
        messages: [
          { role: "system", content: "You are a complexity analysis expert. When reconsidering, be honest about mistakes but also defend correct analysis. Prioritize accuracy over agreement." },
          { role: "user", content: prompt }
        ],
        max_tokens: 400,
        temperature: 0.3,
        stream: false
      }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      console.error("[LLM RECONSIDER] API error:", response.status);
      return null;
    }

    const data = await response.json();
    let text = "";
    
    if (data.content && typeof data.content === "string") {
      text = data.content;
    } else if (data.choices?.[0]?.message?.content) {
      text = data.choices[0].message.content;
    } else {
      console.error("[LLM RECONSIDER] Unknown response format");
      return null;
    }
    
    // Clean markdown fences
    if (text.startsWith("```json")) text = text.slice(7);
    if (text.startsWith("```")) text = text.slice(3);
    if (text.endsWith("```")) text = text.slice(0, -3);
    text = text.trim();
    
    const parsed = JSON.parse(text);
    
    if (!parsed.finalTimeComplexity || !parsed.finalSpaceComplexity || !parsed.reasoning) {
      console.error("[LLM RECONSIDER] Missing required fields");
      return null;
    }
    
    return {
      finalTC: parsed.finalTimeComplexity,
      finalSC: parsed.finalSpaceComplexity,
      reasoning: parsed.reasoning
    };
  } catch (error: any) {
    console.error("[LLM RECONSIDER] Error:", error.message);
    return null;
  }
}

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
        // COMPLEXITY VALIDATION: 7-LAYER GUARANTEE STACK
        // ═══════════════════════════════════════════════════════════════
        try {
          let corrected = getCorrectedComplexity(
            result.timeComplexity,
            result.spaceComplexity,
            data.code,
            data.language || 'python'
          );
          
          // LAYER 2: Apply Amortized Overrides (before engine comparison)
          const amortizedTC = applyAmortizedOverrides(data.code, corrected.timeComplexity);
          if (amortizedTC !== corrected.timeComplexity) {
            console.log(`[LAYER 2] Amortized override: ${corrected.timeComplexity} → ${amortizedTC}`);
            corrected.timeComplexity = amortizedTC;
            corrected.corrected = true;
          }
          
          // LAYER 3: Recursion Explosion Detection
          if (detectRecursiveExplosion(data.code)) {
            console.log(`[LAYER 3] Recursive explosion detected → O(2^n)`);
            corrected.timeComplexity = "O(2^n)";
            corrected.timeComplexityReason = "Tree recursion with multiple recursive calls per invocation";
            corrected.corrected = true;
          }
          
          // LAYER 4: Space Complexity Truth Guard (UNCONDITIONAL)
          const forcedSC = detectSpaceUsage(data.code);
          if (forcedSC && forcedSC !== result.spaceComplexity) {
            console.log(`[LAYER 4] Space truth enforced: ${result.spaceComplexity} → ${forcedSC}`);
            corrected.spaceComplexity = forcedSC;
            corrected.spaceComplexityReason = "Detected auxiliary data structures or recursion stack";
            corrected.corrected = true;
          }
          
          if (corrected.corrected) {
            console.log(`[COMPLEXITY ENGINE] Detected mismatch: TC=${result.timeComplexity} → ${corrected.timeComplexity}, SC=${result.spaceComplexity} → ${corrected.spaceComplexity}`);
            
            // Ask LLM to reconsider with engine's findings
            const reconsideration = await requestLLMReconsideration(
              result.title || 'Code Analysis',
              result.timeComplexity,
              result.spaceComplexity,
              corrected.timeComplexity,
              corrected.spaceComplexity,
              data.code,
              data.language || 'python'
            );
            
            if (reconsideration) {
              const normalizeComplexity = (c: string) => c.replace(/\s+/g, '').toLowerCase();
              
              const llmFinalTC = normalizeComplexity(reconsideration.finalTC);
              const llmFinalSC = normalizeComplexity(reconsideration.finalSC);
              const engineTC = normalizeComplexity(corrected.timeComplexity);
              const engineSC = normalizeComplexity(corrected.spaceComplexity);
              const originalTC = normalizeComplexity(result.timeComplexity);
              const originalSC = normalizeComplexity(result.spaceComplexity);
              
              if (llmFinalTC === originalTC && llmFinalSC === originalSC) {
                // LLM maintains position - TRUST LLM
                console.log(`[LLM RECONSIDER] Trusting LLM's decision: ${reconsideration.finalTC}/${reconsideration.finalSC}`);
                result.timeComplexity = reconsideration.finalTC;
                result.spaceComplexity = reconsideration.finalSC;
                result.timeComplexityReason = reconsideration.reasoning;
                result.spaceComplexityReason = reconsideration.reasoning;
              } else if (llmFinalTC === engineTC && llmFinalSC === engineSC) {
                // LLM agrees with engine
                console.log(`[LLM RECONSIDER] LLM agreed with engine: ${corrected.timeComplexity}/${corrected.spaceComplexity}`);
                result.timeComplexity = corrected.timeComplexity;
                result.spaceComplexity = corrected.spaceComplexity;
                result.timeComplexityReason = reconsideration.reasoning;
                result.spaceComplexityReason = reconsideration.reasoning;
              } else {
                // LLM provides new answer - trust it
                console.log(`[LLM RECONSIDER] LLM provided new analysis: ${reconsideration.finalTC}/${reconsideration.finalSC}`);
                result.timeComplexity = reconsideration.finalTC;
                result.spaceComplexity = reconsideration.finalSC;
                result.timeComplexityReason = reconsideration.reasoning;
                result.spaceComplexityReason = reconsideration.reasoning;
              }
            } else {
              // Failed to get reconsideration - use engine values as fallback
              console.log(`[LLM RECONSIDER] Failed, using engine values`);
              result.timeComplexity = corrected.timeComplexity;
              result.spaceComplexity = corrected.spaceComplexity;
              if (corrected.timeComplexityReason) result.timeComplexityReason = corrected.timeComplexityReason;
              if (corrected.spaceComplexityReason) result.spaceComplexityReason = corrected.spaceComplexityReason;
            }
          } else {
            console.log(`[COMPLEXITY ENGINE] SOURCE=LLM   | Using AI-provided TC/SC without override (TC=${result.timeComplexity}, SC=${result.spaceComplexity})`);
          }
          
          // LAYER 6: Pattern → Complexity Hard Map (FINAL AUTHORITY)
          // This MUST be the absolute last complexity decision
          const coreLogicObj = result.coreLogic as Record<string, any> | undefined;
          if (coreLogicObj && typeof coreLogicObj === 'object' && coreLogicObj.Pattern) {
            const finalTC = applyPatternOverride(coreLogicObj.Pattern, result.timeComplexity);
            if (finalTC !== result.timeComplexity) {
              console.log(`[FINAL OVERRIDE] Pattern enforces ${finalTC}`);
              result.timeComplexity = finalTC;
              result.timeComplexityReason = `Guaranteed by ${coreLogicObj.Pattern} invariant`;
            }
          }
          
        } catch (engineError) {
          console.warn("[COMPLEXITY ENGINE] Error (using AI values):", engineError);
        }
        
        // NOTE: Algorithm Equivalence Guard (Layer 1) is applied in the Get Solution API
        // (api/solution/index.js) since Add Solution analyzes single code snippets,
        // not multiple approaches (bruteForce/better/optimal)


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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Surface backend daily-limit message (429) in a friendly way
      if (response.status === 429 && data?.message) {
        throw new Error(data.message);
      }

      throw new Error(data.error || "Failed to generate solution");
    }
    
    if (data.fromCache) {
      console.log(`[${data.data.tier?.toUpperCase() || "CACHE"} HIT] Solution served from cache`);
    } else {
      console.log("[QUBRID] Fresh solution generated and cached on server");
    }

    // Any successful call (cached or fresh) may change usage; refresh display
    window.dispatchEvent(new Event("usage-updated"));

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
