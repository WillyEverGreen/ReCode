import { connectDB } from "../_lib/mongodb.js";
import { handleCors } from "../_lib/auth.js";
import { Redis } from "@upstash/redis";
import crypto from "crypto";
import levenshtein from "fast-levenshtein";
import jwt from "jsonwebtoken";

// Import models
import SolutionCache from "../../models/SolutionCache.js";
import UserUsage from "../../models/UserUsage.js";

// Qubrid AI Configuration
const QUBRID_API_URL = "https://platform.qubrid.com/api/v1/qubridai/chat/completions";
const QUBRID_MODEL = "Qwen/Qwen3-Coder-30B-A3B-Instruct";

// Lazy-load Redis (for serverless - env vars may not be available at module load)
let redis = null;
function getRedis() {
  if (redis) return redis;
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  console.log("[REDIS DEBUG] URL:", redisUrl ? "✓ Set" : "✗ Missing");
  console.log("[REDIS DEBUG] Token:", redisToken ? "✓ Set" : "✗ Missing");
  if (redisUrl && redisToken) {
    redis = new Redis({ url: redisUrl, token: redisToken });
    console.log("[REDIS DEBUG] Client created");
  } else {
    console.log("[REDIS DEBUG] Missing credentials, Redis disabled");
  }
  return redis;
}

// Common DSA problem name mappings (typos, variations, LC numbers)
const PROBLEM_ALIASES = {
  // LeetCode numbers to names
  'lc1': 'twosum', '1': 'twosum', 'leetcode1': 'twosum',
  'lc15': 'threesum', '15': 'threesum', 'leetcode15': 'threesum',
  'lc121': 'besttimetobuyandsellstock', '121': 'besttimetobuyandsellstock',
  'lc53': 'maximumsubarray', '53': 'maximumsubarray',
  'lc206': 'reverselinkedlist', '206': 'reverselinkedlist',
  'lc20': 'validparentheses', '20': 'validparentheses',
  'lc21': 'mergetwosortedlists', '21': 'mergetwosortedlists',
  'lc56': 'mergeintervals', '56': 'mergeintervals',
  'lc70': 'climbingstairs', '70': 'climbingstairs',
  'lc141': 'linkedlistcycle', '141': 'linkedlistcycle',
  // Common typos and variations
  'validparanthesis': 'validparentheses',
  'validparantheses': 'validparentheses',
  'validparenthesis': 'validparentheses',
  'mergeinterval': 'mergeintervals',
  'twopointer': 'twopointers',
  '2sum': 'twosum',
  '3sum': 'threesum',
  '4sum': 'foursum',
};

// Number words mapping
const NUMBER_WORDS = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
  '10': 'ten'
};

// Normalize question name with smart matching
const normalizeQuestionName = (name) => {
  let normalized = name
    .toLowerCase()
    .trim()
    .replace(/[-_]/g, ' ')      // Replace dashes/underscores with spaces
    .replace(/\s+/g, '')         // Remove all spaces
    .replace(/[^a-z0-9]/g, '');  // Remove special characters
  
  // Remove trailing 's' for plural handling (threesums → threesum)
  if (normalized.endsWith('s') && normalized.length > 3) {
    const singular = normalized.slice(0, -1);
    // Check if singular form exists in our known problems
    if (PROBLEM_ALIASES[singular] || singular.match(/(sum|tree|list|array|stack|queue|graph|node|pointer|interval)$/)) {
      normalized = singular;
    }
  }
  
  // Convert standalone numbers to words (2sum → twosum)
  Object.entries(NUMBER_WORDS).forEach(([num, word]) => {
    // Only replace numbers at the start (2sum) or standalone
    if (normalized.startsWith(num)) {
      normalized = normalized.replace(new RegExp(`^${num}`), word);
    }
  });
  
  // Check for known aliases/typos
  if (PROBLEM_ALIASES[normalized]) {
    normalized = PROBLEM_ALIASES[normalized];
  }
  
  return normalized;
};

// ==================== 2-LEVEL CACHE SYSTEM ====================
// Base Cache: problem:<canonicalId>:<language> -> canonical solution
// Variant Cache: variant:<canonicalId>:<language>:<descHash> -> custom solution

// Keywords that indicate description changes the problem logic
// NOTE: Only include keywords that change OUTPUT or CONSTRAINTS, not algorithm style
const VARIANT_KEYWORDS = [
  // Output changes - these change WHAT is returned
  'count', 'number of', 'how many', 'return count', 'find count',
  'return index', 'return indices', 'find index',
  'return boolean', 'return true', 'return false', 'check if',
  'print', 'return all', 'return first', 'return last',
  'return pairs', 'return triplets',
  // Constraint changes - these change problem requirements
  'contiguous', 'consecutive', 'adjacent', 'in-place', 'inplace',
  'without extra space', 'constant space', 'o(1) space',
  'sorted', 'unsorted', 'distinct', 'unique', 'duplicates allowed',
  'no duplicates', 'with duplicates',
  // Input structure changes
  'linked list', 'binary tree', 'bst', 'graph', 'matrix',
  'circular', 'doubly linked',
  // Range/limit changes - these change valid inputs
  'at most', 'at least', 'exactly', 'minimum', 'maximum',
  'greater than', 'less than', 'equal to',
  'positive only', 'negative allowed', 'including zero',
];
// EXCLUDED (these are explanation style, not problem changes):
// 'iterative', 'recursive', 'dp', 'greedy', 'brute force', 'optimal',
// 'single pass', 'one pass', 'divide and conquer', 'backtracking'

// Check if description requires a variant (changes algorithm/output)
const descriptionRequiresVariant = (description) => {
  if (!description || description.trim().length < 10) return false;
  
  const descLower = description.toLowerCase();
  
  // Check for variant keywords
  for (const keyword of VARIANT_KEYWORDS) {
    if (descLower.includes(keyword)) {
      console.log("[CACHE] Variant required due to keyword:", keyword);
      return true;
    }
  }
  
  return false;
};

// Create base cache key (canonical solution)
const createBaseCacheKey = (questionName, language) => {
  const canonicalId = normalizeQuestionName(questionName);
  const lang = language.toLowerCase().trim();
  return `problem:${canonicalId}:${lang}`;
};

// Create variant cache key (description-specific)
// FIX 2: Normalize description before hashing to prevent whitespace/punctuation variants
const createVariantCacheKey = (questionName, language, description) => {
  const canonicalId = normalizeQuestionName(questionName);
  const lang = language.toLowerCase().trim();
  // Normalize description: lowercase, single spaces, no special chars
  const normalizedDesc = description
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
  const descHash = crypto.createHash("sha256")
    .update(normalizedDesc)
    .digest("hex")
    .slice(0, 8);
  return `variant:${canonicalId}:${lang}:${descHash}`;
};

// ==================== LAYER 6: SAFE FUZZY MATCH ====================
// Runs ONLY on cache miss as last-resort rescue for typos

// Problem classes for safety guard
const PROBLEM_CLASSES = [
  "sum", "tree", "list", "array", "graph", "interval", 
  "string", "stack", "queue", "matrix", "node", "pointer",
  "path", "subarray", "substring", "palindrome", "permutation",
  "binary", "search", "sort", "merge", "reverse", "rotate"
];

// Safe fuzzy match function - only returns match if ALL safety rules pass
async function fuzzyCanonicalMatch(input, redis) {
  if (!redis || !input || input.length < 3) return null;
  
  try {
    // Get all known canonical IDs
    const keys = await redis.smembers("problem:canonical-ids");
    if (!keys || keys.length === 0) return null;
    
    let best = null;
    let bestDist = Infinity;
    let matchCount = 0;
    
    for (const key of keys) {
      const d = levenshtein.get(input, key);
      if (d <= 2) {  // Only consider close matches
        matchCount++;
        if (d < bestDist) {
          bestDist = d;
          best = key;
        }
      }
    }
    
    // SAFETY RULE 1: Edit distance must be <= 2
    if (bestDist > 2) {
      console.log("[FUZZY] ✗ Edit distance too high:", bestDist);
      return null;
    }
    
    // SAFETY RULE 2: Only ONE candidate should match (no ambiguity)
    if (matchCount > 1) {
      console.log("[FUZZY] ✗ Ambiguous match, multiple candidates:", matchCount);
      return null;
    }
    
    // SAFETY RULE 3: Length difference must be <= 30%
    const lenDiff = Math.abs(input.length - best.length) / best.length;
    if (lenDiff > 0.3) {
      console.log("[FUZZY] ✗ Length difference too high:", (lenDiff * 100).toFixed(1) + "%");
      return null;
    }
    
    // SAFETY RULE 4: Same problem class (prevents wrong redirects)
    const sameClass = PROBLEM_CLASSES.some(
      cls => input.endsWith(cls) && best.endsWith(cls)
    );
    if (!sameClass) {
      console.log("[FUZZY] ✗ Different problem class");
      return null;
    }
    
    console.log("[FUZZY] ✓ Safe redirect:", input, "→", best, "(edit distance:", bestDist + ")");
    return best;
    
  } catch (e) {
    console.error("[FUZZY] Error:", e.message);
    return null;
  }
}

// Save canonical ID to Redis set (with size limit to prevent unbounded growth)
// FIX 5: Limit canonical ID set size
async function saveCanonicalId(canonicalId, redis) {
  if (!redis || !canonicalId) return;
  try {
    await redis.sadd("problem:canonical-ids", canonicalId);
    // Limit set size to 5000 entries (oldest entries auto-removed)
    const size = await redis.scard("problem:canonical-ids");
    if (size > 5000) {
      await redis.spop("problem:canonical-ids");
    }
    console.log("[REDIS] Saved canonical ID:", canonicalId);
  } catch (e) {
    // FIX 3: Redis should never break request
    console.error("[REDIS] Error saving canonical ID:", e.message);
  }
}

// Generate from Qubrid
async function generateFromQubrid(questionName, language, problemDescription) {
  const prompt = `You are a DSA problem solver. Solve this problem with multiple approaches.

PROBLEM: ${questionName}
LANGUAGE: ${language}
${problemDescription ? `DESCRIPTION: ${problemDescription}` : "If problem name is ambiguous, state your interpretation before solving."}

TASK: Provide Brute Force, Better (if exists), and Optimal solutions.

CRITICAL RULES:
- BRUTE FORCE = OPTIMAL only if they have the EXACT SAME time complexity (e.g., both O(n)). 
- If brute force is O(n²) and a better O(n) or O(n log n) solution exists, they are DIFFERENT.
- When brute ≠ optimal, the "note" field should be null.
- When brute = optimal, copy the brute force content to optimal and explain in "note" why no better solution exists.
- If no intermediate "better" approach exists between brute and optimal, set better to null.
- Code must be clean ${language} without markdown fences.
- Add minimal inline comments in code.
- Be comprehensive but concise.
- DO NOT say "brute force is optimal" if you then provide a different optimal solution with better complexity.

REQUIRED JSON OUTPUT:
{
  "problemStatement": "2-3 sentence problem explanation",
  "difficulty": "Easy|Medium|Hard",
  "bruteForce": {
    "name": "Approach name",
    "intuition": "3-4 sentences explaining why this works",
    "steps": ["Step 1...", "Step 2...", "...6-8 detailed steps"],
    "code": "Clean ${language} code with comments",
    "timeComplexity": "O(...)",
    "timeComplexityReason": "2-3 sentences",
    "spaceComplexity": "O(...)",
    "spaceComplexityReason": "2-3 sentences"
  },
  "better": null | same structure,
  "optimal": same structure as bruteForce,
  "note": "ONLY set if brute=optimal with same complexity, else null",
  "edgeCases": ["5-6 specific edge cases with brief explanations"],
  "dsaCategory": "Arrays & Hashing | Trees | Graphs | DP | etc.",
  "pattern": "Two Pointers | Sliding Window | BFS | Monotonic Stack | etc.",
  "keyInsights": ["5-6 key insights including pattern recognition and common mistakes"]
}`;

  // FIX 4: Add 30s timeout to prevent hung requests
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(QUBRID_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.QUBRID_API_KEY}`
    },
    body: JSON.stringify({
      model: QUBRID_MODEL,
      messages: [
        { role: "system", content: "You are an expert DSA tutor. Provide comprehensive, educational solutions. Always output valid JSON only. Be logically consistent - if brute force and optimal have different complexities, they are NOT the same." },
        { role: "user", content: prompt }
      ],
      max_tokens: 6000,
      temperature: 0.7,
      stream: false
    }),
    signal: controller.signal
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Qubrid API error: ${response.status} - ${errorText.slice(0, 100)}`);
  }

  const data = await response.json();
  
  // Handle BOTH response formats:
  // 1. Qubrid format: { content: "...", metrics: {...}, model: "..." }
  // 2. OpenAI format: { choices: [{ message: { content: "..." } }] }
  let text = "";
  
  if (data.content && typeof data.content === "string") {
    // Qubrid's direct format
    console.log("[AI] Using Qubrid direct format (content at root)");
    text = data.content;
  } else if (data.choices?.[0]?.message?.content) {
    // OpenAI-compatible format
    console.log("[AI] Using OpenAI-compatible format (choices array)");
    text = data.choices[0].message.content;
  } else {
    console.error("[AI] Unknown response structure:", JSON.stringify(data).slice(0, 500));
    throw new Error("Unknown API response format");
  }
  
  // Log raw response for debugging
  console.log("[AI] Raw response length:", text.length);
  
  // Check for empty response
  if (!text || text.length < 100) {
    console.error("[AI] Empty or too short response:", text.slice(0, 200));
    throw new Error("AI returned empty or severely truncated response. Please try again.");
  }

  // Clean markdown fences
  if (text.startsWith("```json")) text = text.slice(7);
  if (text.startsWith("```")) text = text.slice(3);
  if (text.endsWith("```")) text = text.slice(0, -3);
  text = text.trim();
  
  // Try to parse JSON with error handling
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (parseError) {
    console.error("[AI] JSON parse error. Response snippet:", text.slice(0, 500));
    // Try to fix common JSON issues
    try {
      // Sometimes response is truncated, try to find last complete object
      const lastBrace = text.lastIndexOf("}");
      if (lastBrace > 0) {
        const fixedText = text.slice(0, lastBrace + 1);
        parsed = JSON.parse(fixedText);
        console.log("[AI] Recovered from truncated JSON");
      } else {
        throw parseError;
      }
    } catch {
      throw new Error(`Failed to parse AI response: ${parseError.message}. Response may be truncated.`);
    }
  }

  // ==================== VALIDATION: Fix contradictions ====================
  // If brute force and optimal have DIFFERENT time complexities, clear the note
  const bruteTC = parsed.bruteForce?.timeComplexity?.toLowerCase() || "";
  const optimalTC = parsed.optimal?.timeComplexity?.toLowerCase() || "";
  
  // Extract the complexity (e.g., "O(n²)" -> "n²", "O(n)" -> "n")
  const extractComplexity = (tc) => tc.replace(/o\(|\)/gi, "").trim();
  const bruteC = extractComplexity(bruteTC);
  const optimalC = extractComplexity(optimalTC);
  
  // If complexities are different, ensure note is null (they're not the same)
  if (bruteC !== optimalC && parsed.note) {
    console.log(`[VALIDATION] Clearing contradictory note. Brute: ${bruteTC}, Optimal: ${optimalTC}`);
    parsed.note = null;
  }
  
  // If complexities are same but note says they're different, also fix
  if (bruteC === optimalC && !parsed.note) {
    parsed.note = `The brute force solution is already optimal with ${bruteTC} time complexity.`;
  }

  // Clean code fields
  const cleanCode = (code) => {
    if (!code) return code;
    return code.replace(/^```\w*\n?/gm, '').replace(/\n?```$/gm, '').trim();
  };

  if (parsed.bruteForce?.code) parsed.bruteForce.code = cleanCode(parsed.bruteForce.code);
  if (parsed.better?.code) parsed.better.code = cleanCode(parsed.better.code);
  if (parsed.optimal?.code) parsed.optimal.code = cleanCode(parsed.optimal.code);


  return parsed;
}

// Helper to get next midnight for rate limit reset
function getNextMidnight() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    const { questionName, language, problemDescription } = req.body;

    if (!questionName || !language) {
      return res.status(400).json({ error: "questionName and language are required" });
    }

    // ==================== INPUT LIMITS (prevent abuse) ====================
    const LIMITS = {
      questionName: 200,      // Max 200 chars for problem name
      language: 50,           // Max 50 chars for language
      problemDescription: 1000 // Max 1000 chars for description
    };
    
    if (questionName.length > LIMITS.questionName) {
      return res.status(400).json({ 
        error: `Question name too long. Maximum ${LIMITS.questionName} characters allowed.` 
      });
    }
    
    if (language.length > LIMITS.language) {
      return res.status(400).json({ 
        error: `Language too long. Maximum ${LIMITS.language} characters allowed.` 
      });
    }
    
    if (problemDescription && problemDescription.length > LIMITS.problemDescription) {
      return res.status(400).json({ 
        error: `Description too long. Maximum ${LIMITS.problemDescription} characters allowed.` 
      });
    }
    
    // FIX 7: Prevent prompt injection via description
    const FORBIDDEN_KEYWORDS = ["ignore previous", "override", "system prompt", "forget instructions"];
    if (problemDescription && FORBIDDEN_KEYWORDS.some(k => problemDescription.toLowerCase().includes(k))) {
      return res.status(400).json({ error: "Invalid description content detected." });
    }

    const normalizedName = normalizeQuestionName(questionName);
    const normalizedLang = language.toLowerCase().trim();
    const redisClient = getRedis();
    
    // Determine if this is a variant request
    const isVariant = descriptionRequiresVariant(problemDescription);
    const baseCacheKey = createBaseCacheKey(questionName, language);
    const variantCacheKey = isVariant ? createVariantCacheKey(questionName, language, problemDescription) : null;
    
    console.log("[CACHE] Strategy:", isVariant ? "VARIANT" : "BASE", "| Base key:", baseCacheKey);
    if (variantCacheKey) console.log("[CACHE] Variant key:", variantCacheKey);

    // ==================== STEP 1: Check Variant Cache (if applicable) ====================
    if (isVariant && redisClient) {
      try {
        const variantCached = await redisClient.get(variantCacheKey);
        if (variantCached) {
          console.log("[REDIS] ✓ VARIANT HIT!");
          const data = typeof variantCached === "string" ? JSON.parse(variantCached) : variantCached;
          return res.json({ success: true, fromCache: true, data: { ...data, tier: "cached" } });
        }
        console.log("[REDIS] ✗ Variant MISS");
      } catch (e) {
        console.error("[REDIS] Variant read error:", e.message);
      }
    }

    // ==================== STEP 2: Check Base Cache (Redis) ====================
    if (redisClient) {
      try {
        const baseCached = await redisClient.get(baseCacheKey);
        if (baseCached) {
          console.log("[REDIS] ✓ BASE HIT!");
          const data = typeof baseCached === "string" ? JSON.parse(baseCached) : baseCached;
          
          // Update MongoDB hit count (match documents with isVariant: false OR no isVariant field)
          try {
            const updateResult = await SolutionCache.findOneAndUpdate(
              { 
                questionName: normalizedName, 
                language: normalizedLang, 
                $or: [{ isVariant: false }, { isVariant: { $exists: false } }]
              },
              { $inc: { hitCount: 1 } },
              { new: true }
            );
            if (updateResult) {
              console.log("[MONGO] Hit count updated:", updateResult.hitCount);
            } else {
              console.log("[MONGO] No matching document to update hit count");
            }
          } catch (e) {
            console.error("[MONGO] Hit count update error:", e.message);
          }
          
          return res.json({ success: true, fromCache: true, data: { ...data, tier: "cached" } });
        }
        console.log("[REDIS] ✗ Base MISS");
      } catch (e) {
        console.error("[REDIS] Base read error:", e.message);
      }
    }

    // ==================== STEP 3: Check Base Cache (MongoDB) ====================
    console.log("[MONGO] Looking for base:", { questionName: normalizedName, language: normalizedLang });
    
    const mongoCached = await SolutionCache.findOne({
      questionName: normalizedName,
      language: normalizedLang,
      isVariant: { $ne: true }  // Only base solutions
    });
    
    if (mongoCached) {
      console.log("[MONGO] ✓ BASE HIT! hitCount:", mongoCached.hitCount);
      // Backfill Redis base cache
      if (redisClient) {
        redisClient.set(baseCacheKey, JSON.stringify(mongoCached.solution), { ex: 7 * 24 * 60 * 60 });
      }
      await SolutionCache.findByIdAndUpdate(mongoCached._id, { $inc: { hitCount: 1 } });
      return res.json({ 
        success: true, 
        fromCache: true, 
        data: { ...mongoCached.solution, tier: "cached", hits: mongoCached.hitCount + 1 } 
      });
    }
    console.log("[MONGO] ✗ Base MISS");

    // ==================== STEP 4: SAFE FUZZY MATCH (Layer 6) ====================
    // Last-resort rescue for typos - runs ONLY on complete cache miss
    if (redisClient) {
      const fuzzyMatch = await fuzzyCanonicalMatch(normalizedName, redisClient);
      if (fuzzyMatch && fuzzyMatch !== normalizedName) {
        // Try to serve from the fuzzy-matched canonical ID
        const fuzzyBaseKey = `problem:${fuzzyMatch}:${normalizedLang}`;
        try {
          // Try Redis first
          const fuzzyCached = await redisClient.get(fuzzyBaseKey);
          if (fuzzyCached) {
            console.log("[FUZZY] ✓ Serving from Redis fuzzy match:", fuzzyMatch);
            const data = typeof fuzzyCached === "string" ? JSON.parse(fuzzyCached) : fuzzyCached;
            return res.json({ 
              success: true, 
              fromCache: true, 
              data: { ...data, tier: "cached", fuzzyFrom: normalizedName, fuzzyTo: fuzzyMatch } 
            });
          }
          
          // Redis miss - try MongoDB fallback for fuzzy match
          const mongoFuzzy = await SolutionCache.findOne({
            questionName: fuzzyMatch,
            language: normalizedLang,
            isVariant: { $ne: true }
          });
          
          if (mongoFuzzy) {
            console.log("[FUZZY] ✓ Serving from MongoDB fuzzy match:", fuzzyMatch);
            // Backfill Redis (best effort - FIX 3)
            redisClient.set(fuzzyBaseKey, JSON.stringify(mongoFuzzy.solution), { ex: 7 * 24 * 60 * 60 }).catch(() => {});
            await SolutionCache.findByIdAndUpdate(mongoFuzzy._id, { $inc: { hitCount: 1 } });
            return res.json({
              success: true,
              fromCache: true,
              data: { ...mongoFuzzy.solution, tier: "cached", fuzzyFrom: normalizedName, fuzzyTo: fuzzyMatch }
            });
          }
          
          // FIX 6: Fuzzy match found but no cache - DO NOT generate AI, suggest instead
          console.log("[FUZZY] Match found but no cache, not generating AI:", fuzzyMatch);
          return res.status(404).json({
            error: "Problem not found in cache",
            suggestion: fuzzyMatch,
            message: `Did you mean '${fuzzyMatch}'? Try searching with the correct name.`
          });
        } catch (e) {
          console.error("[FUZZY] Read error:", e.message);
        }
      }
    }

    // ==================== STEP 5: Check Daily Limit (before AI call) ====================
    // Get user ID from token or use anonymous ID
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
        userId = decoded.userId;
      } catch (e) {
        // Invalid token - treat as anonymous
      }
    }
    
    // For anonymous users, use IP + User-Agent for better uniqueness
    // This prevents collision behind proxies/NAT/college networks
    if (!userId) {
      const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anonymous';
      const userAgent = req.headers['user-agent'] || '';
      const uniqueStr = clientIp + userAgent;
      userId = `anon_${Buffer.from(uniqueStr).toString('base64').slice(0, 30)}`;
    }
    
    // Check if user can make this request (cache hits don't count, only AI calls)
    const canContinue = await UserUsage.canMakeRequest(userId, 'getSolution');
    if (!canContinue) {
      const usage = await UserUsage.getTodayUsage(userId);
      return res.status(429).json({ 
        error: "Daily limit reached", 
        message: `You've used all ${usage.getSolutionLimit} Get Solution requests for today. Upgrade to Pro for unlimited access!`,
        usage: {
          used: usage.getSolutionUsed,
          limit: usage.getSolutionLimit,
          resetsAt: getNextMidnight()
        }
      });
    }
    
    // Check variant limit separately (variants are more expensive)
    if (isVariant) {
      const canMakeVariant = await UserUsage.canMakeRequest(userId, 'variant');
      if (!canMakeVariant) {
        const usage = await UserUsage.getTodayUsage(userId);
        return res.status(429).json({ 
          error: "Variant limit reached", 
          message: `You've used your ${usage.variantLimit} custom variant request for today. Try without custom description or upgrade to Pro!`,
          usage: {
            variantUsed: usage.variantUsed,
            variantLimit: usage.variantLimit,
            resetsAt: getNextMidnight()
          }
        });
      }
    }

    // FIX 9: Prevent same user spamming same question (10s lock)
    if (redisClient) {
      try {
        const lockKey = `lock:${userId}:${baseCacheKey}`;
        const locked = await redisClient.set(lockKey, "1", { nx: true, ex: 10 });
        if (!locked) {
          return res.status(429).json({ error: "Please wait a few seconds before retrying the same question." });
        }
      } catch (e) {
        // FIX 3: Redis failure shouldn't block request
        console.error("[REDIS] Lock error:", e.message);
      }
    }

    // ==================== STEP 6: Generate Fresh Solution ====================
    console.log("[AI] Generating fresh solution...");
    const solution = await generateFromQubrid(questionName, language, problemDescription);
    
    // FIX 8: Add metadata to solution for traceability
    solution._meta = {
      model: QUBRID_MODEL,
      generatedAt: new Date().toISOString(),
      isVariant,
      questionName: normalizedName
    };
    
    // Increment usage count (only for successful AI calls)
    await UserUsage.incrementUsage(userId, 'getSolution');
    
    // Also increment variant count if this was a variant request
    if (isVariant) {
      await UserUsage.incrementUsage(userId, 'variant');
    }

    // ==================== STEP 7: Save to Caches ====================
    // FIX 1: Only save to base cache for NON-variant requests (variants pollute base cache)
    if (!isVariant && redisClient) {
      redisClient.set(baseCacheKey, JSON.stringify(solution), { ex: 7 * 24 * 60 * 60 })
        .then(() => console.log("[REDIS] ✓ Saved to base cache"))
        .catch(e => console.error("[REDIS] Base write error:", e.message));
      
      // Save canonical ID for fuzzy matching
      saveCanonicalId(normalizedName, redisClient);
    }
    
    // FIX 1: Only save base to MongoDB for NON-variant requests
    if (!isVariant) {
      await SolutionCache.findOneAndUpdate(
        { questionName: normalizedName, language: normalizedLang, isVariant: false },
        { 
          $set: { solution, originalName: questionName, isVariant: false }, 
          $setOnInsert: { hitCount: 0, createdAt: new Date() } 
        },
        { upsert: true }
      );
      console.log("[MONGO] ✓ Saved to base cache");
    }

    // If variant was requested, save ONLY to variant cache (not base)
    if (isVariant && redisClient && variantCacheKey) {
      redisClient.set(variantCacheKey, JSON.stringify(solution), { ex: 3 * 24 * 60 * 60 })
        .then(() => console.log("[REDIS] ✓ Saved to variant cache"))
        .catch(e => console.error("[REDIS] Variant write error:", e.message));
    }

    return res.json({ 
      success: true, 
      fromCache: false, 
      data: { ...solution, tier: "fresh" } 
    });
    
  } catch (error) {
    console.error("Solution API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate solution" });
  }
}
