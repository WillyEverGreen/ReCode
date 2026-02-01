import { connectDB } from '../_lib/mongodb.js';
import { handleCors } from '../_lib/auth.js';
import { getUserId } from '../_lib/userId.js';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import levenshtein from 'fast-levenshtein';

// Import models
import SolutionCache from '../../models/SolutionCache.js';
import UserUsage from '../../models/UserUsage.js';
import User from '../../models/User.js';

// Import Complexity Analysis Engine (for validating/correcting AI output)
import { getCorrectedComplexity } from '../../utils/complexityEngine.js';
import { analyzeAmortizedComplexity } from '../../utils/amortizedDetector.js';
// Import V2 Complexity Engine (for dual complexity analysis with 3,680+ problem ground truth)
import { analyzeComplexityV2 } from '../../utils/complexityEngineV2.js';

// Import Ground Truth Database (for bulletproof validation)
import {
  validateAgainstGroundTruth,
  applyGroundTruthCorrections,
  findGroundTruth,
} from '../../utils/problemGroundTruth.js';

// Qubrid AI Configuration (Qwen3-Coder-30B - fast, reliable)
const AI_API_URL =
  'https://platform.qubrid.com/api/v1/qubridai/chat/completions';
const AI_MODEL = 'Qwen/Qwen3-Coder-30B-A3B-Instruct';
const AI_API_KEY = process.env.QUBRID_API_KEY;

// Lazy-load Redis (for serverless - env vars may not be available at module load)
let redis = null;
function getRedis() {
  if (redis) return redis;
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  console.log('[REDIS DEBUG] URL:', redisUrl ? '✓ Set' : '✗ Missing');
  console.log('[REDIS DEBUG] Token:', redisToken ? '✓ Set' : '✗ Missing');
  if (redisUrl && redisToken) {
    redis = new Redis({ url: redisUrl, token: redisToken });
    console.log('[REDIS DEBUG] Client created');
  } else {
    console.log('[REDIS DEBUG] Missing credentials, Redis disabled');
  }
  return redis;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DYNAMIC BETTER APPROACH NOTE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Generates an algorithmically mature explanation for why no intermediate approach exists.
 * Analyzes the complexity gap and provides educational context about the space-time tradeoff.
 */
function generateDynamicBetterNote(bruteForce, optimal) {
  const bruteTC = bruteForce?.timeComplexity || '';
  const bruteSC = bruteForce?.spaceComplexity || '';
  const optimalTC = optimal?.timeComplexity || '';
  const optimalSC = optimal?.spaceComplexity || '';

  // Normalize complexity strings for comparison
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const bruteTCNorm = normalize(bruteTC);
  const optimalTCNorm = normalize(optimalTC);

  // Pattern 1: O(n²) → O(n) with hash map (most common)
  if (bruteTCNorm.includes('n2') && optimalTCNorm === 'on') {
    return 'Trading space for speed: O(n²) nested loops can only be improved to O(n) by using extra space (hash map/set). No O(n log n) middle ground exists without fundamentally changing the algorithm.';
  }

  // Pattern 2: O(n log n) → O(n) (sorting to linear)
  if (bruteTCNorm.includes('nlogn') && optimalTCNorm === 'on') {
    return 'The jump from O(n log n) sorting to O(n) single-pass is direct. Any comparison-based approach requires at least O(n log n) time, while hash-based solutions achieve O(n) by trading space.';
  }

  // Pattern 3: O(2^n) → O(n) (exponential to linear, like DP)
  if (bruteTCNorm.includes('2n') && optimalTCNorm === 'on') {
    return 'Exponential brute force can only be optimized to polynomial time by caching subproblems (dynamic programming/memoization). The transition from O(2^n) to O(n) is direct - no meaningful intermediate exists.';
  }

  // Pattern 4: O(n²) → O(n log n) (rare but possible)
  if (bruteTCNorm.includes('n2') && optimalTCNorm.includes('nlogn')) {
    return 'Improving from O(n²) to O(n log n) typically involves sorting or divide-and-conquer. This jump is direct - partial optimizations still require examining all pairs.';
  }

  // Pattern 5: Same time complexity, different space
  if (
    bruteTCNorm === optimalTCNorm &&
    normalize(bruteTC) !== normalize(optimalSC)
  ) {
    return 'Both approaches share the same time complexity, but differ in space usage. The optimal solution demonstrates a clever space optimization technique.';
  }

  // Generic fallback (educational default)
  return `Direct optimization from ${bruteTC} to ${optimalTC}. No intermediate approach provides a meaningful learning step - the algorithmic leap requires a fundamentally different data structure or technique.`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INDEX-SENSITIVE CORRECTNESS GUARD
// Detects when value-based HashMap is incorrectly used for index-sensitive problems
// These problems MUST use index-based monotonic stack to handle duplicates correctly
// ═══════════════════════════════════════════════════════════════════════════════
function isIndexSensitiveBug(code, problemName) {
  const c = code.toLowerCase();
  const problem = (problemName || '').toLowerCase();

  // Problems where position/index matters (fails with value-based mapping on duplicates)
  const indexSensitiveProblems = [
    'next greater',
    'previous greater',
    'next smaller',
    'previous smaller',
    'stock span',
    'daily temperatures',
    'largest rectangle',
    'trapping rain',
  ];

  const isIndexSensitive = indexSensitiveProblems.some((p) =>
    problem.includes(p)
  );
  if (!isIndexSensitive) return false;

  // Detect value-based mapping (WRONG for these problems)
  const usesValueMap =
    c.includes('map<integer, integer>') ||
    c.includes('hashmap<integer') ||
    c.includes('map.put(nums[i]') ||
    c.includes('map.put(stack.pop()') ||
    c.includes('dict[num]') ||
    c.includes('map[num]') ||
    (c.includes('hashmap') && !c.includes('push(i)'));

  // Detect correct index-based stack (RIGHT for these problems)
  const usesIndexStack =
    c.includes('stack.push(i)') ||
    c.includes('push(i)') ||
    c.includes('append(i)') ||
    c.includes('stack.push(index') ||
    c.includes('nums[stack') ||
    c.includes('temperatures[stack');

  // BUG: Uses value-based mapping WITHOUT index-based stack
  return usesValueMap && !usesIndexStack;
}

// Generate warning message for index-sensitive bug
function getIndexSensitiveWarning() {
  return '⚠️ This solution may fail when duplicate values exist. For correctness, use an index-based monotonic stack where the stack stores indices, not values.';
}

// Common DSA problem name mappings (typos, variations, LC numbers)
const PROBLEM_ALIASES = {
  // LeetCode numbers to names
  lc1: 'twosum',
  1: 'twosum',
  leetcode1: 'twosum',
  lc15: 'threesum',
  15: 'threesum',
  leetcode15: 'threesum',
  lc121: 'besttimetobuyandsellstock',
  121: 'besttimetobuyandsellstock',
  lc53: 'maximumsubarray',
  53: 'maximumsubarray',
  lc206: 'reverselinkedlist',
  206: 'reverselinkedlist',
  lc20: 'validparentheses',
  20: 'validparentheses',
  lc21: 'mergetwosortedlists',
  21: 'mergetwosortedlists',
  lc56: 'mergeintervals',
  56: 'mergeintervals',
  lc70: 'climbingstairs',
  70: 'climbingstairs',
  lc141: 'linkedlistcycle',
  141: 'linkedlistcycle',
  // Common typos and variations
  validparanthesis: 'validparentheses',
  validparantheses: 'validparentheses',
  validparenthesis: 'validparentheses',
  mergeinterval: 'mergeintervals',
  twopointer: 'twopointers',
  '2sum': 'twosum',
  '3sum': 'threesum',
  '4sum': 'foursum',
};

// Number words mapping
const NUMBER_WORDS = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
};

// Normalize question name with smart matching
const normalizeQuestionName = (name) => {
  let normalized = name
    .toLowerCase()
    .trim()
    .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/[^a-z0-9]/g, ''); // Remove special characters

  // Remove trailing 's' for plural handling (threesums → threesum)
  if (normalized.endsWith('s') && normalized.length > 3) {
    const singular = normalized.slice(0, -1);
    // Check if singular form exists in our known problems
    if (
      PROBLEM_ALIASES[singular] ||
      singular.match(
        /(sum|tree|list|array|stack|queue|graph|node|pointer|interval)$/
      )
    ) {
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
  'count',
  'number of',
  'how many',
  'return count',
  'find count',
  'return index',
  'return indices',
  'find index',
  'return boolean',
  'return true',
  'return false',
  'check if',
  'print',
  'return all',
  'return first',
  'return last',
  'return pairs',
  'return triplets',
  // Constraint changes - these change problem requirements
  'contiguous',
  'consecutive',
  'adjacent',
  'in-place',
  'inplace',
  'without extra space',
  'constant space',
  'o(1) space',
  'sorted',
  'unsorted',
  'distinct',
  'unique',
  'duplicates allowed',
  'no duplicates',
  'with duplicates',
  // Input structure changes
  'linked list',
  'binary tree',
  'bst',
  'graph',
  'matrix',
  'circular',
  'doubly linked',
  // Range/limit changes - these change valid inputs
  'at most',
  'at least',
  'exactly',
  'minimum',
  'maximum',
  'greater than',
  'less than',
  'equal to',
  'positive only',
  'negative allowed',
  'including zero',
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
      console.log('[CACHE] Variant required due to keyword:', keyword);
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
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
  const descHash = crypto
    .createHash('sha256')
    .update(normalizedDesc)
    .digest('hex')
    .slice(0, 8);
  return `variant:${canonicalId}:${lang}:${descHash}`;
};

// ==================== LAYER 6: SAFE FUZZY MATCH ====================
// Runs ONLY on cache miss as last-resort rescue for typos

// Problem classes for safety guard
const PROBLEM_CLASSES = [
  'sum',
  'tree',
  'list',
  'array',
  'graph',
  'interval',
  'string',
  'stack',
  'queue',
  'matrix',
  'node',
  'pointer',
  'path',
  'subarray',
  'substring',
  'palindrome',
  'permutation',
  'binary',
  'search',
  'sort',
  'merge',
  'reverse',
  'rotate',
];

// Safe fuzzy match function - only returns match if ALL safety rules pass
async function fuzzyCanonicalMatch(input, redis) {
  if (!redis || !input || input.length < 3) return null;

  try {
    // Get all known canonical IDs
    const keys = await redis.smembers('problem:canonical-ids');
    if (!keys || keys.length === 0) return null;

    let best = null;
    let bestDist = Infinity;
    let matchCount = 0;

    for (const key of keys) {
      const d = levenshtein.get(input, key);
      if (d <= 2) {
        // Only consider close matches
        matchCount++;
        if (d < bestDist) {
          bestDist = d;
          best = key;
        }
      }
    }

    // SAFETY RULE 1: Edit distance must be <= 2
    if (bestDist > 2) {
      console.log('[FUZZY] ✗ Edit distance too high:', bestDist);
      return null;
    }

    // SAFETY RULE 2: Only ONE candidate should match (no ambiguity)
    if (matchCount > 1) {
      console.log(
        '[FUZZY] ✗ Ambiguous match, multiple candidates:',
        matchCount
      );
      return null;
    }

    // SAFETY RULE 3: Length difference must be <= 30%
    const lenDiff = Math.abs(input.length - best.length) / best.length;
    if (lenDiff > 0.3) {
      console.log(
        '[FUZZY] ✗ Length difference too high:',
        (lenDiff * 100).toFixed(1) + '%'
      );
      return null;
    }

    // SAFETY RULE 4: Same problem class (prevents wrong redirects)
    const sameClass = PROBLEM_CLASSES.some(
      (cls) => input.endsWith(cls) && best.endsWith(cls)
    );
    if (!sameClass) {
      console.log('[FUZZY] ✗ Different problem class');
      return null;
    }

    console.log(
      '[FUZZY] ✓ Safe redirect:',
      input,
      '→',
      best,
      '(edit distance:',
      bestDist + ')'
    );
    return best;
  } catch (e) {
    console.error('[FUZZY] Error:', e.message);
    return null;
  }
}

// Save canonical ID to Redis set (with size limit to prevent unbounded growth)
// FIX 5: Limit canonical ID set size
async function saveCanonicalId(canonicalId, redis) {
  if (!redis || !canonicalId) return;
  try {
    await redis.sadd('problem:canonical-ids', canonicalId);
    // Limit set size to 5000 entries (oldest entries auto-removed)
    const size = await redis.scard('problem:canonical-ids');
    if (size > 5000) {
      await redis.spop('problem:canonical-ids');
    }
    console.log('[REDIS] Saved canonical ID:', canonicalId);
  } catch (e) {
    // FIX 3: Redis should never break request
    console.error('[REDIS] Error saving canonical ID:', e.message);
  }
}

// Generate solution using AI
async function generateFromQubrid(
  questionName,
  language,
  problemDescription,
  temperature = 0.3
) {
  // ═══════════════════════════════════════════════════════════════
  // STEP 2.5: FETCH TARGET COMPLEXITY (GUIDANCE INJECTION)
  // ═══════════════════════════════════════════════════════════════
  let complexityGuidance = '';
  try {
    // Check Layer 2 Database (369 verified problems with Brute/Better/Optimal)
    const layer2Data = findGroundTruth(questionName);

    if (layer2Data) {
      console.log(
        `[PROMPT INJECTION] Found Layer 2 Ground Truth for: ${layer2Data.patterns[0]}`
      );

      let guidanceParts = ['IMPORTANT CONSTRAINTS:'];

      if (layer2Data.bruteForce) {
        guidanceParts.push(
          `- Brute Force Approach: Target Time ${layer2Data.bruteForce.tc}, Space ${layer2Data.bruteForce.sc} (${layer2Data.bruteForce.algorithm})`
        );
      }

      if (layer2Data.better) {
        guidanceParts.push(
          `- Better Approach: Target Time ${layer2Data.better.tc}, Space ${layer2Data.better.sc} (${layer2Data.better.algorithm})`
        );
      } else if (layer2Data.hasOptimizationLadder === false) {
        guidanceParts.push(
          `- NO Better Approach: This problem does not have an intermediate optimization.`
        );
      }

      if (layer2Data.optimal) {
        guidanceParts.push(
          `- Optimal Approach: Target Time ${layer2Data.optimal.tc}, Space ${layer2Data.optimal.sc} (${layer2Data.optimal.algorithm})`
        );
      }

      guidanceParts.push(
        'Structure your solution to STRICTLY follow this optimization ladder.'
      );
      guidanceParts.push(
        "You MUST provide ALL 3 approaches (Brute, Better, Optimal) if they are listed above. Do NOT skip 'Better'."
      );
      complexityGuidance = guidanceParts.join('\n');
    } else {
      // Fallback to Layer 3 (V2 Mega DB - 3,680+ problems, Optimal only)
      const v2Meta = analyzeComplexityV2('', language, questionName);

      if (v2Meta && v2Meta.source && v2Meta.source.includes('ground-truth')) {
        console.log(
          `[PROMPT INJECTION] Found V2 Ground Truth (Optimal only): ${v2Meta.worstCase.time}`
        );
        complexityGuidance = `
IMPORTANT CONSTRAINT:
This problem is known to have an optimal solution with:
- Time Complexity: ${v2Meta.worstCase.time}
- Space Complexity: ${v2Meta.worstCase.space}

You MUST ensure your 'optimal' approach achieves these specific complexities.
`;
      }
    }
  } catch (err) {
    console.warn(
      '[PROMPT INJECTION] Failed to look up ground truth:',
      err.message
    );
  }

  const prompt = `You are a DSA problem solver. Solve this problem with ALL possible approaches.
${complexityGuidance}

PROBLEM: ${questionName}
LANGUAGE: ${language}
${problemDescription ? `DESCRIPTION: ${problemDescription}` : 'If problem name is ambiguous, state your interpretation before solving.'}

TASK: Provide Brute Force, Better (if exists), and Optimal solutions with DISTINCT implementations.

═══════════════════════════════════════════════════════════════
🚨 ABSOLUTE REQUIREMENTS (MUST FOLLOW OR RESPONSE IS INVALID):
═══════════════════════════════════════════════════════════════

1. **NEVER DUPLICATE CODE** (CRITICAL - WILL BE VALIDATED): 
   - Each approach MUST have COMPLETELY DIFFERENT code
   - Don't just rename variables - use DIFFERENT algorithm/data structure
   - Example: Brute (nested loops) ≠ Better (sorting) ≠ Optimal (hash map)
   - ❌ INVALID: Same logic with different variable names
   - ❌ INVALID: 90% same code with 1 line different
   - ✅ VALID: fundamentally different approach/algorithm
   - If you can't find truly DIFFERENT code, set that approach to null

2. **PROVIDE ALL POSSIBLE APPROACHES**:
   - If 3 distinct approaches exist, provide all 3
   - Set "better" to null ONLY if no middle ground exists
   - Never skip an approach just because it's "not interesting"

3. **PROBLEM CORRECTNESS (CRITICAL)**:
   - Pay extreme attention to specific constraints like "Distinct", "Unique", "At Most K", "Repeating".
   - Example 1: "Longest Substring with At Most Two Distinct Characters" is DIFFERENT from "Longest Substring Without Repeating Characters".
   - Example 2: "Permutation" is DIFFERENT from "Combination".
   - Solve EXACTLY the problem requested. Do not hallucinate a more popular variant.

═══════════════════════════════════════════════════════════════
📋 WHEN TO USE "complexityNote" FIELD:
═══════════════════════════════════════════════════════════════

✅ **Include complexityNote for BRUTE FORCE when:**
   - Better approach is null (explain why jump is direct to optimal)
   - Brute = Optimal (explain why brute is already optimal)

✅ **Include complexityNote for OPTIMAL when:**
   - Better approach is null (explain why no middle ground)
   - Brute = Optimal (explain why no better solution exists)

❌ **Skip complexityNote when:**
   - All 3 approaches exist (brute, better, optimal all provided)
   - No need to explain missing approaches

EXAMPLES:
- **All 3 exist (Two Sum):** No complexityNote needed
- **Better is null:** complexityNote in brute: "No O(n log n) option exists. Jump from O(n²) to O(n) is direct via hash map."
- **Brute = Optimal:** complexityNote in both: "Linear scan is already optimal for unsorted data."

═══════════════════════════════════════════════════════════════
🎯 WHEN TO SET "better" TO null:
═══════════════════════════════════════════════════════════════

SET TO NULL when:
✅ Brute force IS optimal (both O(n), no improvement possible)
✅ Direct jump with no middle (O(n²) → O(n), no O(n log n) exists)
✅ Problem has only 2 distinct algorithmic approaches
✅ BOTH time AND space complexity are identical between brute and optimal

KEEP IT (provide better) when:
❌ You can show sorting (O(n log n)) between O(n²) and O(n)
❌ You can show DP (O(n²)) between O(2^n) and O(n log n)
❌ You can show different data structure (heap, BST, etc.)
❌ **CRITICAL:** Time complexity same but space improves (e.g., O(n) time: O(n) space → O(1) space)

🚨 MANDATORY RULE - SPACE COMPLEXITY IMPROVEMENT:
If time complexity stays the same BUT space complexity improves, you MUST include a "better" approach.
Example: Fibonacci - Brute O(n)/O(n), Better O(n)/O(1), Optimal same as Better
This is a REQUIRED educational pattern - DO NOT skip it!


═══════════════════════════════════════════════════════════════
📐 APPROACH DEFINITIONS:
═══════════════════════════════════════════════════════════════

**Brute Force**: The most naive solution
- Use: Basic loops, recursion without memoization
- No preprocessing, no clever tricks
- Typically: O(n²), O(n³), O(2^n) or worse

**Better**: Intermediate optimization (if exists)
- Use: Sorting, two pointers, basic DP, heaps, BST
- Examples: O(n²) → O(n log n), O(2^n) → O(n²)
- Must be DISTINCTLY different from brute AND optimal

**Optimal**: Best known solution
- Use: Hash maps, optimized DP, greedy, advanced algorithms
- Lowest possible time/space complexity
- Must be DISTINCTLY different from better

═══════════════════════════════════════════════════════════════
📊 EDGE CASE COVERAGE:
═══════════════════════════════════════════════════════════════

Your prompt must handle these scenarios:

**Scenario 1: Three distinct approaches exist (COMMON)**
- Example: Two Sum, 3Sum, Longest Substring
- Result: Provide brute, better, optimal (all different)
- complexityNote: Not needed (all 3 exist)

**Scenario 2: Only 2 approaches exist (COMMON)**
- Example: Valid Parentheses, Reverse Linked List
- Result: Provide brute, optimal (better = null)
- complexityNote: In brute/optimal explaining why no middle ground

**Scenario 3: Brute IS optimal (RARE)**
- Example: Linear search in unsorted array
- Result: Provide brute, optimal (same TC but different code style)
- complexityNote: In both explaining why they're the same complexity
- note: "Brute force is optimal for this problem"

**Scenario 3.5: Same Time, Different Space (TIE-BREAKER)**
- If two approaches have the **same time complexity** but **different space complexity**:
- The approach with **better (lower) space complexity** MUST be labeled as **"optimal"**.
- The other one becomes **"better"** (or remains "bruteForce" if it's the naive version).
- Example: Two O(n²) approaches where one is O(1) space and the other is O(n) space → O(1) space must be **optimal**.

**Scenario 4: Multiple "better" approaches possible (CHOOSE ONE)**
- Example: Could use sorting OR heap
- Result: Pick the MOST EDUCATIONAL middle approach
- complexityNote: Not needed if all 3 provided

═══════════════════════════════════════════════════════════════
⚠️ INSIGHTS & EXPLANATIONS GUIDELINES:
═══════════════════════════════════════════════════════════════
1. Do NOT suggest optimizations (e.g., "Sort neighbors") if your code does not implement them.
2. Insights must match the provided solutions EXACTLY.
3. For Brute Force == Optimal (e.g., DFS on small grid):
   - Label Brute Force as "Standard Approach"
   - Label Optimal as "Same Approach (Optimal)"
   - Do NOT invent a fake "Brute Force" that is worse than standard DFS for exponential problems.
4. For Grid Problems:
   - Always check for empty grid edge cases: 'if (grid.length == 0) return 0;'
   - Avoid Bitmask DP unless grid size is guaranteed extremely small (< 20 cells).
   - Prefer standard Backtracking for cyclic grid paths.
5. **Naming Accuracy**:
   - Do NOT use specific algorithm names (like "Quickselect", "KMP", "Manacher") unless the code ACTUALLY implements that specific algorithm.
   - For Tree/BST problems, use names like "Inorder Traversal", "Iterative Approach", "DFS", "BFS".
   - "Quickselect" applies to Arrays, not Trees. Do not use array algorithm names for tree problems.
   - **DP Accuracy**:
     - Do NOT call Top-Down Recursion+Memoization "1D DP". Label it "Top-Down DP" or "Memoization".
     - "1D DP" or "Bottom-Up" implies Iterative Loop.
     - For Coin Change/Knapsack: Brute Force is O(k^n) or Exponential, NOT O(2^n). O(2^n) implies binary choice, but coins have k choices.

═══════════════════════════════════════════════════════════════
📝 REQUIRED JSON OUTPUT:
═══════════════════════════════════════════════════════════════

{
  "problemStatement": "2-3 sentence problem explanation",
  "difficulty": "Easy|Medium|Hard",
  "bruteForce": {
    "name": "Descriptive name (e.g., Nested Loops, Recursive Backtracking)",
    "intuition": "3-4 sentences explaining the naive thought process",
    "steps": ["Step 1...", "Step 2...", "...6-8 detailed algorithmic steps"],
    "complexityNote": "ONLY if better=null OR brute=optimal. 1-2 sentences explaining why.",
    "code": "Clean ${language} code - MUST differ from better/optimal",
    "timeComplexity": "O(...)",
    "timeComplexityReason": "2-3 sentences",
    "spaceComplexity": "O(...)",
    "spaceComplexityReason": "2-3 sentences"
  },
  "better": null | {
    "name": "Descriptive name (e.g., Sorting + Two Pointers, DP Memoization)",
    "intuition": "3-4 sentences",
    "steps": ["...6-8 steps"],
    "code": "COMPLETELY DIFFERENT code - different algorithm/data structure",
    "timeComplexity": "O(...)",
    "timeComplexityReason": "...",
    "spaceComplexity": "O(...)",
    "spaceComplexityReason": "..."
  },
  "optimal": {
    "name": "Descriptive name (e.g., Hash Map, Kadane's Algorithm)",
    "intuition": "3-4 sentences",
    "steps": ["...6-8 steps"],
    "complexityNote": "ONLY if better=null OR brute=optimal. 1-2 sentences.",
    "code": "MUST BE DIFFERENT from brute/better",
    "timeComplexity": "O(...)",
    "timeComplexityReason": "...",
    "spaceComplexity": "O(...)",
    "spaceComplexityReason": "..."
  },
  "note": "Set ONLY if brute=optimal (same TC/SC). Explain why no improvement exists. Else null.",
  "edgeCases": [
    "**Constraint Check:** Input: (e.g., min/max value) → Output: ...",
    "**Corner Case:** Input: ... → Output: ...",
    "Include 4-6 edge cases. STRICTLY RESPECT problem constraints (e.g., if constraint says 1 <= n, do NOT include 'Empty Input')."
  ],
  "testCases": [
    "Input: s='ADOBECODEBANC', t='ABC' → Output: 'BANC'",
    "Input: s='a', t='a' → Output: 'a'",
    "Include 3-5 test cases with VERIFIED input/output"
  ],
  "dsaCategory": "Arrays & Hashing | Trees | Graphs | DP | Greedy | etc.",
  "pattern": "Two Pointers | Sliding Window | BFS/DFS | Monotonic Stack | etc.",
  "keyInsights": ["5-6 key takeaways, common mistakes, pattern recognition tips"]
}

═══════════════════════════════════════════════════════════════
✅ FINAL VALIDATION CHECKLIST (BEFORE RESPONDING):
═══════════════════════════════════════════════════════════════

- [ ] All approaches have DIFFERENT code (not just variable renames)
- [ ] If 3 distinct approaches exist, all 3 are provided
- [ ] If better is null, complexityNote explains why in brute/optimal
- [ ] If brute=optimal, complexityNote in both + "note" field set
- [ ] timeComplexity values match the actual code implementation
- [ ] If two approaches share SAME time complexity, the one with LOWER space complexity is labeled **optimal**, the other **better** (or brute)
- [ ] No contradictions (e.g., saying same TC but providing different code without reason)
- [ ] Code is clean ${language} without markdown fences
- [ ] Each approach uses different algorithm or data structure
- [ ] testCases: Each test case has VERIFIED input/output traced through the optimal code
- [ ] edgeCases: Each edge case has SPECIFIC input and expected output`;

  // Timeout for DeepSeek R1 70B (larger model needs more time)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            "You are an expert DSA tutor. Your goal is to teach students by showing them MULTIPLE solution approaches whenever possible. Always aim to provide THREE solutions (Brute Force, Better, Optimal) to help students understand the progression of optimizations. Be educational, comprehensive, and logically consistent. Always output valid JSON only. If brute force and optimal have different complexities, they are NOT the same - show the intermediate 'better' approach if one exists.",
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 6000,
      temperature: temperature, // Use parameter (default 0.8, retry with 0.3)
      stream: false,
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `AI API error: ${response.status} - ${errorText.slice(0, 100)}`
    );
  }

  const data = await response.json();

  // Handle BOTH response formats:
  // 1. Qubrid format: { content: "...", metrics: {...}, model: "..." }
  // 2. OpenAI format: { choices: [{ message: { content: "..." } }] }
  let text = '';

  if (data.content && typeof data.content === 'string') {
    // Qubrid's direct format
    console.log('[AI] Using Qubrid direct format (content at root)');
    text = data.content;
  } else if (data.choices?.[0]?.message?.content) {
    // OpenAI-compatible format
    console.log('[AI] Using OpenAI-compatible format (choices array)');
    text = data.choices[0].message.content;
  } else {
    console.error(
      '[AI] Unknown response structure:',
      JSON.stringify(data).slice(0, 500)
    );
    throw new Error('Unknown API response format');
  }

  // Log raw response for debugging
  console.log('[AI] Raw response length:', text.length);

  // Check for empty response
  if (!text || text.length < 100) {
    console.error('[AI] Empty or too short response:', text.slice(0, 200));
    throw new Error(
      'AI returned empty or severely truncated response. Please try again.'
    );
  }

  // Clean markdown fences
  if (text.startsWith('```json')) text = text.slice(7);
  if (text.startsWith('```')) text = text.slice(3);
  if (text.endsWith('```')) text = text.slice(0, -3);
  text = text.trim();

  // Try to parse JSON with error handling
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (parseError) {
    console.error(
      '[AI] JSON parse error. Response snippet:',
      text.slice(0, 500)
    );
    // Try to fix common JSON issues
    try {
      // Sometimes response is truncated, try to find last complete object
      const lastBrace = text.lastIndexOf('}');
      if (lastBrace > 0) {
        const fixedText = text.slice(0, lastBrace + 1);
        parsed = JSON.parse(fixedText);
        console.log('[AI] Recovered from truncated JSON');
      } else {
        throw parseError;
      }
    } catch {
      throw new Error(
        `Failed to parse AI response: ${parseError.message}. Response may be truncated.`
      );
    }
  }

  // ==================== COMPREHENSIVE VALIDATION ====================
  // Fixes 4 critical gaps to ensure production-grade quality

  const extractComplexity = (c) => c.replace(/o\(|\)/gi, '').trim();

  // Extract all complexities
  const bruteTC = parsed.bruteForce?.timeComplexity?.toLowerCase() || '';
  const bruteSC = parsed.bruteForce?.spaceComplexity?.toLowerCase() || '';
  const betterTC = parsed.better?.timeComplexity?.toLowerCase() || '';
  const betterSC = parsed.better?.spaceComplexity?.toLowerCase() || '';
  const optimalTC = parsed.optimal?.timeComplexity?.toLowerCase() || '';
  const optimalSC = parsed.optimal?.spaceComplexity?.toLowerCase() || '';

  const bruteTC_clean = extractComplexity(bruteTC);
  const bruteSC_clean = extractComplexity(bruteSC);
  const betterTC_clean = extractComplexity(betterTC);
  const betterSC_clean = extractComplexity(betterSC);
  const optimalTC_clean = extractComplexity(optimalTC);
  const optimalSC_clean = extractComplexity(optimalSC);

  // ═══════════════════════════════════════════════════════════════
  // GAP 1 FIX: Remove "better" if TC AND SC same as optimal (FALSE BETTER)
  // ═══════════════════════════════════════════════════════════════
  if (
    parsed.better &&
    betterTC_clean === optimalTC_clean &&
    betterSC_clean === optimalSC_clean
  ) {
    console.log(
      `[VALIDATION] ❌ Removing false 'better': TC=${betterTC}, SC=${betterSC} same as optimal`
    );
    parsed.better = null;
  }

  // ═══════════════════════════════════════════════════════════════
  // GAP 2 FIX: If brute = optimal (TC AND SC), enforce same code or reject
  // ═══════════════════════════════════════════════════════════════
  if (bruteTC_clean === optimalTC_clean && bruteSC_clean === optimalSC_clean) {
    console.log(
      `[VALIDATION] ℹ️  Brute = Optimal detected: TC=${bruteTC}, SC=${bruteSC}`
    );

    // Check if codes are actually different
    const bruteCode = (parsed.bruteForce?.code || '').replace(/\s+/g, '');
    const optimalCode = (parsed.optimal?.code || '').replace(/\s+/g, '');
    const codeSimilarity =
      bruteCode.length > 0 && optimalCode.length > 0
        ? bruteCode === optimalCode
          ? 1.0
          : 0.0 // Simple exact match for now
        : 0;

    if (codeSimilarity < 0.8 && bruteCode !== optimalCode) {
      // Different code but same complexity - pedagogically confusing
      console.log(
        `[VALIDATION] ⚠️  Brute=Optimal but different code. Enforcing consistency.`
      );
      // Use brute code as the canonical one
      parsed.optimal.code = parsed.bruteForce.code;
    }

    // Ensure note and better are set correctly
    if (!parsed.note) {
      parsed.note = `The brute force approach is already optimal with ${bruteTC} time and ${bruteSC} space complexity. No improvement is possible.`;
    }
    parsed.better = null;
  }

  // ═══════════════════════════════════════════════════════════════
  // BASIC VALIDATION: Fix contradictions
  // ═══════════════════════════════════════════════════════════════

  // If TC different, ensure note is null (they're not the same)
  if (bruteTC_clean !== optimalTC_clean && parsed.note) {
    console.log(
      `[VALIDATION] Clearing contradictory note. Brute: ${bruteTC}, Optimal: ${optimalTC}`
    );
    parsed.note = null;
  }

  // ═══════════════════════════════════════════════════════════════
  // GAP 4 FIX: Hard rejection of INVALID responses
  // ═══════════════════════════════════════════════════════════════
  const validationErrors = [];

  // Check 1: Required fields exist
  if (!parsed.bruteForce || !parsed.optimal) {
    validationErrors.push(
      'Missing required approaches (bruteForce or optimal)'
    );
  }

  // Check 2: All approaches have code
  if (parsed.bruteForce && !parsed.bruteForce.code) {
    validationErrors.push('Brute force missing code');
  }
  if (parsed.better && !parsed.better.code) {
    validationErrors.push('Better approach missing code');
  }
  if (parsed.optimal && !parsed.optimal.code) {
    validationErrors.push('Optimal approach missing code');
  }

  // Check 3: Detect duplicate code (GAP 4 - prevent caching bad responses)
  const codes = [
    parsed.bruteForce?.code,
    parsed.better?.code,
    parsed.optimal?.code,
  ].filter(Boolean);

  const normalizedCodes = codes.map((c) => c.replace(/\s+/g, '').toLowerCase());
  const uniqueCodes = new Set(normalizedCodes);

  // If brute ≠ optimal but codes are identical, that's a problem
  if (
    bruteTC_clean !== optimalTC_clean &&
    normalizedCodes.length > 1 &&
    uniqueCodes.size < normalizedCodes.length
  ) {
    validationErrors.push(
      'Duplicate code detected across different complexity approaches'
    );
  }

  // Check 4: Time complexity must be valid
  const validTCs = [bruteTC, betterTC, optimalTC].filter(Boolean);
  for (const tc of validTCs) {
    if (!tc.includes('o(') && !tc.includes('O(')) {
      validationErrors.push(`Invalid time complexity format: ${tc}`);
    }
  }

  // Check 5: Code length sanity check (prevent empty or trivial code)
  if (parsed.bruteForce?.code && parsed.bruteForce.code.length < 20) {
    validationErrors.push('Brute force code suspiciously short (< 20 chars)');
  }
  if (parsed.optimal?.code && parsed.optimal.code.length < 20) {
    validationErrors.push('Optimal code suspiciously short (< 20 chars)');
  }

  // ═══════════════════════════════════════════════════════════════
  // REJECT if validation fails (GAP 4)
  // ═══════════════════════════════════════════════════════════════
  if (validationErrors.length > 0) {
    console.error('[VALIDATION] ❌ INVALID AI RESPONSE:');
    validationErrors.forEach((err) => console.error(`  - ${err}`));
    throw new Error(
      `Invalid AI response detected. Validation failed:\n${validationErrors.join('\n')}\n\n` +
        `This prevents low-quality responses from being cached. Please retry the request.`
    );
  }

  console.log('[VALIDATION] ✅ All checks passed');

  // ═══════════════════════════════════════════════════════════════
  // Clean code fields
  // ═══════════════════════════════════════════════════════════════
  const cleanCode = (code) => {
    if (!code) return code;
    return code
      .replace(/^```\w*\n?/gm, '')
      .replace(/\n?```$/gm, '')
      .trim();
  };

  if (parsed.bruteForce?.code)
    parsed.bruteForce.code = cleanCode(parsed.bruteForce.code);
  if (parsed.better?.code) parsed.better.code = cleanCode(parsed.better.code);
  if (parsed.optimal?.code)
    parsed.optimal.code = cleanCode(parsed.optimal.code);

  // ═══════════════════════════════════════════════════════════════
  // ULTIMATE COMPLEXITY VALIDATOR
  // Combines ALL validation layers into one bulletproof system
  // ═══════════════════════════════════════════════════════════════
  try {
    // Import ultimate validator (dynamic import for compatibility)
    const { default: validateComplexity } =
      await import('../../utils/ultimateValidator.js');

    // Prepare code object for validation
    const codeForValidation = {
      bruteForce: parsed.bruteForce?.code,
      better: parsed.better?.code,
      optimal: parsed.optimal?.code,
    };

    // Run ultimate validation
    const validationResult = await validateComplexity(
      questionName,
      parsed,
      codeForValidation,
      language
    );

    // Apply validated solution
    if (validationResult.validated) {
      console.log('[ULTIMATE VALIDATOR] ✅ Validation complete');
      console.log(`[ULTIMATE VALIDATOR] Source: ${validationResult.source}`);
      console.log(
        `[ULTIMATE VALIDATOR] Confidence: ${(validationResult.confidence * 100).toFixed(1)}%`
      );

      // Log corrections
      if (validationResult.corrections.length > 0) {
        console.log('[ULTIMATE VALIDATOR] Applied corrections:');
        validationResult.corrections.forEach((corr) => {
          console.log(`  - ${corr.approach}: ${corr.reason}`);
        });
      }

      // Use validated solution
      parsed = validationResult.solution;
    }
  } catch (validatorError) {
    console.warn(
      '[ULTIMATE VALIDATOR] ⚠️ Error (falling back to individual layers):',
      validatorError.message
    );

    // Fallback to individual validation layers if ultimate validator fails
    // This ensures the system never breaks

    // ═══════════════════════════════════════════════════════════════
    // FALLBACK LAYER 1: Problem-Specific Fixes
    // ═══════════════════════════════════════════════════════════════
    // Anagram fix removed (superseded by Ground Truth)

    // ═══════════════════════════════════════════════════════════════
    // FALLBACK LAYER 2: Ground Truth Database
    // ═══════════════════════════════════════════════════════════════
    try {
      const groundTruthValidation = validateAgainstGroundTruth(
        questionName,
        parsed
      );

      if (groundTruthValidation.found) {
        console.log('[GROUND TRUTH] ✓ Found verified entry for:', questionName);

        // ALWAYS apply ground truth corrections to ensure note field is updated
        // Even if TC/SC matches, the note might be wrong
        console.log('[GROUND TRUTH] Applying ground truth data...');

        if (groundTruthValidation.needsCorrection) {
          groundTruthValidation.corrections.forEach((corr) => {
            console.log(
              `  [${corr.approach}] ${corr.field}: "${corr.aiValue}" → "${corr.correctValue}"`
            );
            console.log(`  Reason: ${corr.reason}`);
          });
        }

        // Apply corrections (this will update note field even if TC/SC is correct)
        parsed = applyGroundTruthCorrections(
          parsed,
          groundTruthValidation.groundTruth
        );

        console.log('[GROUND TRUTH] ✓ Ground truth applied successfully');
      } else {
        console.log(
          '[GROUND TRUTH] No entry found, using other validation layers'
        );
      }
    } catch (groundTruthError) {
      console.warn(
        '[GROUND TRUTH] ⚠️ Validation error (continuing):',
        groundTruthError.message
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // LAYER 4.5: V2 DUAL COMPLEXITY ANALYSIS (3,680 PROBLEM DATABASE)
  // Enriches AI output with average + worst case for time and space
  // ═══════════════════════════════════════════════════════════════
  try {
    console.log(
      '[COMPLEXITY ENGINE V2] Analyzing dual complexity (avg + worst case)...'
    );

    // Analyze each approach with V2 engine
    const approaches = ['bruteForce', 'better', 'optimal'];

    for (const approachKey of approaches) {
      const approach = parsed[approachKey];
      if (!approach || !approach.code) continue;

      // Pass questionName to all approaches so the engine knows the "Baseline Complexity"
      // but the engine itself will handle whether to force-override or just use it as a hint.
      const v2Analysis = analyzeComplexityV2(
        approach.code,
        language,
        questionName
      );

      if (v2Analysis && v2Analysis.confidence >= 70) {
        // Add dual complexity data to approach
        approach.complexityAnalysis = {
          averageCase: {
            time: v2Analysis.averageCase.time,
            space: v2Analysis.averageCase.space,
            explanation: v2Analysis.averageCase.explanation,
          },
          worstCase: {
            time: v2Analysis.worstCase.time,
            space: v2Analysis.worstCase.space,
            explanation: v2Analysis.worstCase.explanation,
          },
          confidence: v2Analysis.confidence,
          source: v2Analysis.source,
          patterns: v2Analysis.patterns,
          dataStructures: v2Analysis.dataStructures,
        };

        console.log(`[COMPLEXITY ENGINE V2] ${approachKey}:`);
        console.log(
          `  Average: TC=${v2Analysis.averageCase.time}, SC=${v2Analysis.averageCase.space}`
        );
        console.log(
          `  Worst:   TC=${v2Analysis.worstCase.time}, SC=${v2Analysis.worstCase.space}`
        );
        console.log(
          `  Source: ${v2Analysis.source}, Confidence: ${v2Analysis.confidence}%`
        );

        // If V2 found ground truth match (100% confidence), update main complexity fields
        // LOGIC UPDATE: We DO NOT blindly apply optimal complexity just because the title matches.
        // We only override if:
        // 1. It's a fingerprint match (We know this exact code snippet is correct)
        // 2. OR the engine performed a "pattern" analysis (not just a DB lookup) and is confident.

        const isFingerprintMatch =
          v2Analysis.source && v2Analysis.source.includes('fingerprint');
        const isPatternMatch =
          v2Analysis.source &&
          (v2Analysis.source.includes('heuristic') ||
            v2Analysis.source.includes('pattern'));

        // Only override if we really know the CODE matches the complexity
        if (v2Analysis.confidence === 100 && isFingerprintMatch) {
          console.log(
            `[COMPLEXITY ENGINE V2] 🎯 Fingerprint match! Updating ${approachKey} complexity`
          );
          approach.timeComplexity = v2Analysis.worstCase.time;
          approach.spaceComplexity = v2Analysis.worstCase.space;
        } else if (isPatternMatch && v2Analysis.confidence >= 90) {
          console.log(
            `[COMPLEXITY ENGINE V2] 🔍 Pattern Verified! Updating ${approachKey} complexity (Confidence: ${v2Analysis.confidence}%)`
          );
          // For pattern matches, we trust the engine's analysis of THIS code
          approach.timeComplexity = v2Analysis.worstCase.time;
          approach.spaceComplexity = v2Analysis.worstCase.space;
          approach.complexitySource = 'V2_PATTERN';
        }
      }
    }

    console.log('[COMPLEXITY ENGINE V2] ✓ Dual complexity analysis complete');
  } catch (v2Error) {
    console.warn(
      '[COMPLEXITY ENGINE V2] ⚠️ V2 engine error (continuing with fallback):',
      v2Error.message
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // LAYER 5: DETERMINISTIC COMPLEXITY CORRECTION
  // Validate AI-generated TC/SC against actual code analysis
  // ═══════════════════════════════════════════════════════════════
  try {
    console.log(
      '[COMPLEXITY ENGINE] Validating AI-generated complexity values...'
    );

    // Correct bruteForce complexity
    if (
      parsed.bruteForce?.code &&
      parsed.bruteForce.complexitySource !== 'V2_PATTERN'
    ) {
      const corrected = getCorrectedComplexity(
        parsed.bruteForce.timeComplexity,
        parsed.bruteForce.spaceComplexity,
        parsed.bruteForce.code,
        language
      );
      if (corrected.corrected) {
        console.log(
          `[COMPLEXITY ENGINE] ⚡ FORCE OVERRIDE | Brute Force: AI=${parsed.bruteForce.timeComplexity} -> Engine=${corrected.timeComplexity}`
        );
        parsed.bruteForce.timeComplexity = corrected.timeComplexity;
        parsed.bruteForce.spaceComplexity = corrected.spaceComplexity;
        parsed.bruteForce.complexitySource = 'ENGINE_OVERRIDE';
      } else {
        console.log(
          `[COMPLEXITY ENGINE] MATCH | Brute Force: ${parsed.bruteForce.timeComplexity}`
        );
      }
    } else if (parsed.bruteForce?.complexitySource === 'V2_PATTERN') {
      console.log(
        `[COMPLEXITY ENGINE] SKIPPING V1 | Brute Force already verified by V2 Pattern: ${parsed.bruteForce.timeComplexity}`
      );
    }

    // Correct better complexity
    if (
      parsed.better?.code &&
      parsed.better.complexitySource !== 'V2_PATTERN'
    ) {
      const corrected = getCorrectedComplexity(
        parsed.better.timeComplexity,
        parsed.better.spaceComplexity,
        parsed.better.code,
        language
      );
      if (corrected.corrected) {
        console.log(
          `[COMPLEXITY ENGINE] ⚡ FORCE OVERRIDE | Better: AI=${parsed.better.timeComplexity} -> Engine=${corrected.timeComplexity}`
        );
        parsed.better.timeComplexity = corrected.timeComplexity;
        parsed.better.spaceComplexity = corrected.spaceComplexity;
        parsed.better.complexitySource = 'ENGINE_OVERRIDE';
      } else {
        console.log(
          `[COMPLEXITY ENGINE] MATCH | Better: ${parsed.better.timeComplexity}`
        );
      }
    }

    // Correct optimal complexity
    if (
      parsed.optimal?.code &&
      parsed.optimal.complexitySource !== 'V2_PATTERN'
    ) {
      const corrected = getCorrectedComplexity(
        parsed.optimal.timeComplexity,
        parsed.optimal.spaceComplexity,
        parsed.optimal.code,
        language
      );
      if (corrected.corrected) {
        console.log(
          `[COMPLEXITY ENGINE] ⚡ FORCE OVERRIDE | Optimal: AI=${parsed.optimal.timeComplexity} -> Engine=${corrected.timeComplexity}`
        );
        parsed.optimal.timeComplexity = corrected.timeComplexity;
        parsed.optimal.spaceComplexity = corrected.spaceComplexity;
        parsed.optimal.complexitySource = 'ENGINE_OVERRIDE';
      } else {
        console.log(
          `[COMPLEXITY ENGINE] MATCH | Optimal: ${parsed.optimal.timeComplexity}`
        );
      }

      // Add detected pattern to response
      if (corrected.pattern) {
        parsed.detectedPattern = corrected.pattern;
      }
    }

    console.log('[COMPLEXITY ENGINE] ✓ Complexity validation complete');
  } catch (engineError) {
    // Don't fail the request if engine fails, just log
    console.warn(
      '[COMPLEXITY ENGINE] ⚠️ Engine error (using AI values):',
      engineError.message
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LAYER 1: Algorithm Equivalence Guard (AFTER all complexity reconciliation)
  // Removes fake 'better' approaches that are identical to optimal
  // ═══════════════════════════════════════════════════════════════════════════════
  const isSameAlgorithm = (a, b) => {
    if (!a || !b) return false;
    const norm = (s = '') => s.toLowerCase().replace(/\s+/g, '');
    return (
      norm(a.name) === norm(b.name) ||
      (norm(a.timeComplexity) === norm(b.timeComplexity) &&
        norm(a.spaceComplexity) === norm(b.spaceComplexity))
    );
  };

  if (
    parsed.better &&
    parsed.optimal &&
    isSameAlgorithm(parsed.better, parsed.optimal)
  ) {
    console.log("[LAYER 1] Removing fake 'better' (same algorithm as optimal)");
    parsed.better = null;
    // Dynamic note will be generated below
  }

  // Auto-generate dynamic "why no better exists" note
  if (!parsed.better && parsed.bruteForce && parsed.optimal && !parsed.note) {
    parsed.note = generateDynamicBetterNote(parsed.bruteForce, parsed.optimal);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // INDEX-SENSITIVE CORRECTNESS CHECK
  // Adds warning if optimal uses value-based mapping for index-sensitive problems
  // ═══════════════════════════════════════════════════════════════════════════════
  if (
    parsed.optimal?.code &&
    isIndexSensitiveBug(parsed.optimal.code, questionName)
  ) {
    console.warn(
      '[INDEX-SENSITIVE] ⚠️ Detected value-based mapping for index-sensitive problem'
    );
    parsed.optimal.correctnessWarning = getIndexSensitiveWarning();
  }
  if (
    parsed.better?.code &&
    isIndexSensitiveBug(parsed.better.code, questionName)
  ) {
    console.warn(
      '[INDEX-SENSITIVE] ⚠️ Detected value-based mapping in better approach'
    );
    parsed.better.correctnessWarning = getIndexSensitiveWarning();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LAYER 6: NUCLEAR FINAL CONSISTENCY CHECK (Ground Truth Override)
  // Guarantees that verified problems ALWAYS match ground truth, no exceptions.
  // ═══════════════════════════════════════════════════════════════════════════════
  try {
    const finalGroundTruthcheck = validateAgainstGroundTruth(
      questionName,
      parsed
    );
    if (finalGroundTruthcheck.found && finalGroundTruthcheck.groundTruth) {
      console.log(
        '[FINAL CHECK] Force-applying ground truth to guarantee consistency...'
      );
      parsed = applyGroundTruthCorrections(
        parsed,
        finalGroundTruthcheck.groundTruth
      );

      // Explicitly check for AI failure to generate correct Brute Force code
      if (
        finalGroundTruthcheck.groundTruth.bruteForce.algorithm
          .toLowerCase()
          .includes('sort')
      ) {
        const code = (parsed.bruteForce.code || '').toLowerCase();
        if (
          !code.includes('sort') &&
          (code.includes('validanagram') ||
            code.includes('frequency') ||
            code.includes('hash') ||
            code.includes('new int['))
        ) {
          parsed.bruteForce.codeNote =
            'Note: The standard brute force approach uses Sorting (O(n log n)). The AI generated an optimized implementation here, but for interview purposes, start with Sorting.';
        }
      }
    }
  } catch (e) {
    console.error('[FINAL CHECK] Error:', e.message);
  }

  return parsed;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *                    COMPLEXITY RECONCILIATION SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * CORRECTNESS CONTRACT (NON-NEGOTIABLE):
 * 1. ENGINE is the source of truth
 * 2. LLM may assist but NEVER override without structural proof
 * 3. Confidence is irrelevant. Evidence is mandatory.
 * 4. If uncertain, system absorbs uncertainty — user never sees it.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Request LLM to reconsider complexity analysis WITH EVIDENCE REQUIREMENT
async function requestComplexityReconsideration(
  questionName,
  approachName,
  llmTC,
  llmSC,
  engineTC,
  engineSC,
  code,
  language
) {
  const prompt = `You are a complexity analysis expert. Our deterministic code analyzer detected different complexity than your analysis.

PROBLEM: ${questionName}
APPROACH: ${approachName}
LANGUAGE: ${language}

CODE:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

COMPLEXITY DISCREPANCY:
- Your Initial Analysis: Time=${llmTC}, Space=${llmSC}
- Engine's Analysis: Time=${engineTC}, Space=${engineSC}

TASK:
1. Identify the EXACT code construct causing this complexity.
2. Quote the line(s) or describe the structure (loop, recursion, call).
3. If no such construct exists, explicitly state: "The engine analysis is correct."

Return JSON:
{
  "finalTimeComplexity": "O(...)",
  "finalSpaceComplexity": "O(...)",
  "evidence": "Quoted line(s) or structural explanation. Write 'NO_EVIDENCE' if none.",
  "reasoning": "1-2 sentence justification."
}

Return ONLY valid JSON, no markdown fences.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a meticulous algorithm expert. Your designated role is to generate 100% accurate, compile-ready code and mathematically verified edge cases. \n\nCRITICAL RULES:\n1. Verify EVERY edge case example manually. Do not hallucinate outputs.\n2. For interval problems, explicitely check overlaps. (e.g., [-1,4] and [2,3] MUST merge to [-1,4]).\n3. Code must handle empty inputs and nulls.\n4. Provide purely factual complexity analysis.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1500,
        temperature: 0.1,
        stream: false,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      console.error('[LLM RECONSIDER] API error:', response.status);
      return null;
    }

    const data = await response.json();
    let text = '';

    if (data.content && typeof data.content === 'string') {
      text = data.content;
    } else if (data.choices?.[0]?.message?.content) {
      text = data.choices[0].message.content;
    } else {
      console.error('[LLM RECONSIDER] Unknown response format');
      return null;
    }

    // Clean markdown fences
    if (text.startsWith('```json')) text = text.slice(7);
    if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);
    text = text.trim();

    const parsed = JSON.parse(text);

    // Validate response has required fields (including NEW evidence field)
    if (!parsed.finalTimeComplexity || !parsed.finalSpaceComplexity) {
      console.error('[LLM RECONSIDER] Missing required fields in response');
      return null;
    }

    return {
      finalTC: parsed.finalTimeComplexity,
      finalSC: parsed.finalSpaceComplexity,
      evidence: parsed.evidence || 'NO_EVIDENCE',
      reasoning: parsed.reasoning || '',
    };
  } catch (error) {
    console.error('[LLM RECONSIDER] Error:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Apply engine values (source of truth)
// ═══════════════════════════════════════════════════════════════════════════════
function applyEngine(approach, corrected, state) {
  approach.timeComplexity = corrected.timeComplexity;
  approach.spaceComplexity = corrected.spaceComplexity;
  approach.timeComplexityReason =
    corrected.timeComplexityReason || approach.timeComplexityReason;
  approach.spaceComplexityReason =
    corrected.spaceComplexityReason || approach.spaceComplexityReason;
  approach.complexitySource = 'ENGINE';
  approach.resolutionState = state;
  approach.complexityMismatchNote = null;
  console.log(
    `[RECONCILE] Applied ENGINE (${state}): ${corrected.timeComplexity}/${corrected.spaceComplexity}`
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Apply LLM override (ONLY with evidence)
// ═══════════════════════════════════════════════════════════════════════════════
function applyLLMOverride(approach, tc, sc, reasoning, evidence) {
  approach.timeComplexity = tc;
  approach.spaceComplexity = sc;
  approach.timeComplexityReason = reasoning;
  approach.spaceComplexityReason = reasoning;
  approach.complexitySource = 'LLM_OVERRIDE';
  approach.resolutionState = 'VERIFIED_LLM_OVERRIDE';
  approach.overrideEvidence = evidence;
  approach.complexityMismatchNote = null;
  console.log(`[RECONCILE] Applied LLM_OVERRIDE with evidence: ${tc}/${sc}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN RECONCILIATION FUNCTION (Evidence-Based Resolution)
// ═══════════════════════════════════════════════════════════════════════════════
async function reconcileComplexity(
  approach,
  approachName,
  questionName,
  language,
  corrected
) {
  const llmOriginalTC = approach.timeComplexity;
  const llmOriginalSC = approach.spaceComplexity;

  // First check for amortized patterns (engine might miss these)
  const amortized = analyzeAmortizedComplexity(approach.code, language);
  if (amortized) {
    console.log(
      `[AMORTIZED] Detected ${amortized.pattern} for ${approachName}`
    );
    approach.timeComplexity = amortized.timeComplexity;
    approach.spaceComplexity = amortized.spaceComplexity;
    approach.timeComplexityReason = amortized.reason;
    approach.spaceComplexityReason = amortized.reason;
    approach.complexitySource = 'AMORTIZED_ENGINE';
    approach.resolutionState = 'VERIFIED_AMORTIZED';
    return;
  }

  const reconsider = await requestComplexityReconsideration(
    questionName,
    approachName,
    llmOriginalTC,
    llmOriginalSC,
    corrected.timeComplexity,
    corrected.spaceComplexity,
    approach.code,
    language
  );

  // 🚨 RULE 1: If reconsideration failed → ENGINE WINS
  if (!reconsider) {
    applyEngine(approach, corrected, 'ENGINE_FALLBACK');
    return;
  }

  const normalize = (x) => (x || '').replace(/\s+/g, '').toLowerCase();

  const llmFinalTC = normalize(reconsider.finalTC);
  const llmFinalSC = normalize(reconsider.finalSC);
  const engineTC = normalize(corrected.timeComplexity);
  const engineSC = normalize(corrected.spaceComplexity);

  // Check if LLM provided real evidence
  const hasEvidence =
    reconsider.evidence &&
    reconsider.evidence !== 'NO_EVIDENCE' &&
    reconsider.evidence.length > 10 &&
    !reconsider.evidence.toLowerCase().includes('engine analysis is correct');

  // 🚨 RULE 2: LLM cannot override WITHOUT evidence
  if (!hasEvidence) {
    console.log(`[RECONCILE] No evidence from LLM, using ENGINE`);
    applyEngine(approach, corrected, 'VERIFIED_ENGINE');
    return;
  }

  // 🚨 RULE 3: If LLM agrees with engine → ENGINE
  if (llmFinalTC === engineTC && llmFinalSC === engineSC) {
    applyEngine(approach, corrected, 'VERIFIED_ENGINE');
    return;
  }

  // 🚨 RULE 4: LLM override ONLY WITH evidence
  applyLLMOverride(
    approach,
    reconsider.finalTC,
    reconsider.finalSC,
    reconsider.reasoning,
    reconsider.evidence
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAFE-TO-SHOW GATE: Protects users from seeing unresolved ambiguity
// ═══════════════════════════════════════════════════════════════════════════════
function isSafeToShow(solution) {
  const approaches = ['bruteForce', 'better', 'optimal'];
  let warnings = [];

  for (const key of approaches) {
    const a = solution[key];
    if (!a) continue;

    // ❌ Never show unresolved ambiguity - THIS IS THE ONLY HARD BLOCK
    if (a.resolutionState === 'AMBIGUOUS') {
      console.warn(`[SAFE-TO-SHOW] ❌ BLOCKING: Ambiguous state for ${key}`);
      return false;
    }

    // ⚠️ Log warning but DON'T BLOCK: O(n) with nested loop mention
    // This can happen with amortized analysis (e.g., monotonic stack)
    if (
      a.timeComplexity === 'O(n)' &&
      a.timeComplexityReason?.toLowerCase().includes('nested loop')
    ) {
      warnings.push(`${key}: O(n) with nested loop reason (may be amortized)`);
    }

    // ⚠️ Log warning but DON'T BLOCK: O(1) space with data structure mention
    // Only truly concerning if it's O(1), not O(k) or O(n)
    if (
      a.spaceComplexity === 'O(1)' &&
      (a.spaceComplexityReason?.toLowerCase().includes('creates') ||
        a.spaceComplexityReason?.toLowerCase().includes('allocates'))
    ) {
      warnings.push(`${key}: O(1) space but reason mentions allocation`);
    }
  }

  // Log all warnings but don't block
  if (warnings.length > 0) {
    console.warn(
      `[SAFE-TO-SHOW] ⚠️ Warnings (not blocking): ${warnings.join(', ')}`
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TEST CASE VALIDATION (warnings only, never block)
  // ═══════════════════════════════════════════════════════════════════════════════

  if (solution.testCases && Array.isArray(solution.testCases)) {
    for (const tc of solution.testCases) {
      if (typeof tc === 'object') {
        const input = tc.input?.toLowerCase() || '';
        const output = tc.output?.toLowerCase() || '';
        if (input.includes('...') || output.includes('...')) {
          console.warn(
            `[SAFE-TO-SHOW] ⚠️ Placeholder in testCase (not blocking)`
          );
        }
      }
    }
  }

  return true;
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { questionName, language, problemDescription } = req.body;

    if (!questionName || !language) {
      return res
        .status(400)
        .json({ error: 'questionName and language are required' });
    }

    // ==================== INPUT LIMITS (prevent abuse) ====================
    const LIMITS = {
      questionName: 200, // Max 200 chars for problem name
      language: 50, // Max 50 chars for language
      problemDescription: 1000, // Max 1000 chars for description
    };

    if (questionName.length > LIMITS.questionName) {
      return res.status(400).json({
        error: `Question name too long. Maximum ${LIMITS.questionName} characters allowed.`,
      });
    }

    if (language.length > LIMITS.language) {
      return res.status(400).json({
        error: `Language too long. Maximum ${LIMITS.language} characters allowed.`,
      });
    }

    if (
      problemDescription &&
      problemDescription.length > LIMITS.problemDescription
    ) {
      return res.status(400).json({
        error: `Description too long. Maximum ${LIMITS.problemDescription} characters allowed.`,
      });
    }

    // FIX 7: Prevent prompt injection via description
    const FORBIDDEN_KEYWORDS = [
      'ignore previous',
      'override',
      'system prompt',
      'forget instructions',
    ];
    if (
      problemDescription &&
      FORBIDDEN_KEYWORDS.some((k) =>
        problemDescription.toLowerCase().includes(k)
      )
    ) {
      return res
        .status(400)
        .json({ error: 'Invalid description content detected.' });
    }

    const normalizedName = normalizeQuestionName(questionName);
    const normalizedLang = language.toLowerCase().trim();
    const redisClient = getRedis();

    // Determine if this is a variant request
    const isVariant = descriptionRequiresVariant(problemDescription);
    const baseCacheKey = createBaseCacheKey(questionName, language);
    const variantCacheKey = isVariant
      ? createVariantCacheKey(questionName, language, problemDescription)
      : null;

    console.log(
      '[CACHE] Strategy:',
      isVariant ? 'VARIANT' : 'BASE',
      '| Base key:',
      baseCacheKey
    );
    if (variantCacheKey) console.log('[CACHE] Variant key:', variantCacheKey);

    // Determine environment + user once (used for both cache hits and AI calls)
    const isDevEnv =
      process.env.NODE_ENV !== 'production' ||
      process.env.IGNORE_USAGE_LIMITS === 'true';
    const userId = await getUserId(req);
    console.log('[SOLUTION API] User ID:', userId);

    // Fetch user plan and role for usage limits
    let userPlan = 'trial';
    let userRole = 'user';
    if (!userId.startsWith('anon_')) {
      try {
        const user = await User.findById(userId);
        if (user) {
          userPlan = user.plan || 'trial';
          userRole = user.role || 'user';
          console.log(
            `[SOLUTION API] User: ${user.username}, Plan: ${userPlan}, Role: ${userRole}`
          );
        }
      } catch (err) {
        console.warn(
          `[SOLUTION API] Could not fetch user details: ${err.message}`
        );
      }
    }

    // ==================== STEP 1: Check Variant Cache (if applicable) ====================
    if (isVariant && redisClient) {
      try {
        const variantCached = await redisClient.get(variantCacheKey);
        if (variantCached) {
          console.log('[REDIS] ✓ VARIANT HIT!');
          const data =
            typeof variantCached === 'string'
              ? JSON.parse(variantCached)
              : variantCached;
          // Count usage even when served from cache (both getSolution + variant)
          try {
            await UserUsage.incrementUsage(userId, 'getSolution');
            await UserUsage.incrementUsage(userId, 'variant');
          } catch (usageError) {
            console.error(
              '[USAGE] Failed to increment on variant cache hit:',
              usageError.message
            );
          }
          return res.json({
            success: true,
            fromCache: true,
            data: { ...data, tier: 'cached' },
          });
        }
        console.log('[REDIS] ✗ Variant MISS');
      } catch (e) {
        console.error('[REDIS] Variant read error:', e.message);
      }
    }

    // ==================== STEP 2: Check Base Cache (Redis) ====================
    if (redisClient) {
      try {
        const baseCached = await redisClient.get(baseCacheKey);
        if (baseCached) {
          console.log('[REDIS] ✓ BASE HIT!');
          const data =
            typeof baseCached === 'string'
              ? JSON.parse(baseCached)
              : baseCached;

          // Update MongoDB hit count (match documents with isVariant: false OR no isVariant field)
          try {
            const updateResult = await SolutionCache.findOneAndUpdate(
              {
                questionName: normalizedName,
                language: normalizedLang,
                $or: [{ isVariant: false }, { isVariant: { $exists: false } }],
              },
              { $inc: { hitCount: 1 } },
              { new: true }
            );
            if (updateResult) {
              console.log('[MONGO] Hit count updated:', updateResult.hitCount);
            } else {
              console.log('[MONGO] No matching document to update hit count');
            }
          } catch (e) {
            console.error('[MONGO] Hit count update error:', e.message);
          }
          // Count usage even when served from base Redis cache
          try {
            await UserUsage.incrementUsage(userId, 'getSolution');
          } catch (usageError) {
            console.error(
              '[USAGE] Failed to increment on base Redis cache hit:',
              usageError.message
            );
          }

          return res.json({
            success: true,
            fromCache: true,
            data: { ...data, tier: 'cached' },
          });
        }
        console.log('[REDIS] ✗ Base MISS');
      } catch (e) {
        console.error('[REDIS] Base read error:', e.message);
      }
    }

    // ==================== STEP 3: Check Base Cache (MongoDB) ====================
    console.log('[MONGO] Looking for base:', {
      questionName: normalizedName,
      language: normalizedLang,
    });

    const mongoCached = await SolutionCache.findOne({
      questionName: normalizedName,
      language: normalizedLang,
      isVariant: { $ne: true }, // Only base solutions
    });

    if (mongoCached) {
      console.log('[MONGO] ✓ BASE HIT! hitCount:', mongoCached.hitCount);
      // Backfill Redis base cache
      if (redisClient) {
        redisClient.set(baseCacheKey, JSON.stringify(mongoCached.solution), {
          ex: 7 * 24 * 60 * 60,
        });
      }
      await SolutionCache.findByIdAndUpdate(mongoCached._id, {
        $inc: { hitCount: 1 },
      });
      // Count usage even when served from base Mongo cache
      try {
        await UserUsage.incrementUsage(userId, 'getSolution');
      } catch (usageError) {
        console.error(
          '[USAGE] Failed to increment on base Mongo cache hit:',
          usageError.message
        );
      }
      return res.json({
        success: true,
        fromCache: true,
        data: {
          ...mongoCached.solution,
          tier: 'cached',
          hits: mongoCached.hitCount + 1,
        },
      });
    }
    console.log('[MONGO] ✗ Base MISS');

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
            console.log(
              '[FUZZY] ✓ Serving from Redis fuzzy match:',
              fuzzyMatch
            );
            const data =
              typeof fuzzyCached === 'string'
                ? JSON.parse(fuzzyCached)
                : fuzzyCached;
            // Count usage even when served from fuzzy Redis cache
            try {
              await UserUsage.incrementUsage(userId, 'getSolution');
            } catch (usageError) {
              console.error(
                '[USAGE] Failed to increment on fuzzy Redis cache hit:',
                usageError.message
              );
            }
            return res.json({
              success: true,
              fromCache: true,
              data: {
                ...data,
                tier: 'cached',
                fuzzyFrom: normalizedName,
                fuzzyTo: fuzzyMatch,
              },
            });
          }

          // Redis miss - try MongoDB fallback for fuzzy match
          const mongoFuzzy = await SolutionCache.findOne({
            questionName: fuzzyMatch,
            language: normalizedLang,
            isVariant: { $ne: true },
          });

          if (mongoFuzzy) {
            console.log(
              '[FUZZY] ✓ Serving from MongoDB fuzzy match:',
              fuzzyMatch
            );
            // Backfill Redis (best effort - FIX 3)
            redisClient
              .set(fuzzyBaseKey, JSON.stringify(mongoFuzzy.solution), {
                ex: 7 * 24 * 60 * 60,
              })
              .catch(() => {});
            await SolutionCache.findByIdAndUpdate(mongoFuzzy._id, {
              $inc: { hitCount: 1 },
            });
            // Count usage even when served from fuzzy Mongo cache
            try {
              await UserUsage.incrementUsage(userId, 'getSolution');
            } catch (usageError) {
              console.error(
                '[USAGE] Failed to increment on fuzzy Mongo cache hit:',
                usageError.message
              );
            }
            return res.json({
              success: true,
              fromCache: true,
              data: {
                ...mongoFuzzy.solution,
                tier: 'cached',
                fuzzyFrom: normalizedName,
                fuzzyTo: fuzzyMatch,
              },
            });
          }

          // FIX 6: Fuzzy match found but no cache
          // Production: DO NOT generate AI, suggest instead (safety)
          // Development: allow falling through to AI generation
          console.log('[FUZZY] Match found but no cache:', fuzzyMatch);
          const isDevEnv =
            process.env.NODE_ENV !== 'production' ||
            process.env.IGNORE_USAGE_LIMITS === 'true';
          if (!isDevEnv) {
            console.log(
              '[FUZZY] Production mode → not generating AI, returning 404 suggestion'
            );
            return res.status(404).json({
              error: 'Problem not found in cache',
              suggestion: fuzzyMatch,
              message: `Did you mean '${fuzzyMatch}'? Try searching with the correct name.`,
            });
          } else {
            console.log(
              '[FUZZY] Dev mode → ignoring cache-only restriction, allowing AI generation to proceed'
            );
          }
        } catch (e) {
          console.error('[FUZZY] Read error:', e.message);
        }
      }
    }

    // ==================== STEP 5: Check Daily Limit (before AI call) ====================
    // For development, we skip strict daily limit enforcement to allow free experimentation.

    if (!isDevEnv) {
      // Check if user can make this request (applies to AI calls; cache hits are already counted above)
      const canContinue = await UserUsage.canMakeRequest(
        userId,
        'getSolution',
        userPlan,
        userRole
      );
      if (!canContinue) {
        const usage = await UserUsage.getTodayUsage(userId, userPlan, userRole);
        return res.status(429).json({
          error: 'Daily limit reached',
          message: `You've used all ${usage.getSolutionLimit} Get Solution requests for today. ${userPlan === 'trial' ? 'Upgrade to Pro for 10x more!' : 'Resets at midnight UTC.'}`,
          usage: {
            used: usage.getSolutionUsed,
            limit: usage.getSolutionLimit,
            resetsAt: getNextMidnight(),
          },
          userPlan,
        });
      }

      // Check variant limit separately (variants are more expensive)
      if (isVariant) {
        const canMakeVariant = await UserUsage.canMakeRequest(
          userId,
          'variant',
          userPlan,
          userRole
        );
        if (!canMakeVariant) {
          const usage = await UserUsage.getTodayUsage(
            userId,
            userPlan,
            userRole
          );
          return res.status(429).json({
            error: 'Variant limit reached',
            message: `You've used your ${usage.variantLimit} custom variant requests for today. ${userPlan === 'trial' ? 'Upgrade to Pro for more!' : 'Resets at midnight UTC.'}`,
            usage: {
              variantUsed: usage.variantUsed,
              variantLimit: usage.variantLimit,
              resetsAt: getNextMidnight(),
            },
            userPlan,
          });
        }
      }
    } else {
      console.log(
        '[USAGE] Skipping getSolution/variant daily limits in development mode'
      );
    }

    // FIX 9: Prevent same user spamming same question (10s lock)
    if (redisClient) {
      try {
        const lockKey = `lock:${userId}:${baseCacheKey}`;
        const locked = await redisClient.set(lockKey, '1', {
          nx: true,
          ex: 10,
        });
        if (!locked) {
          return res.status(429).json({
            error:
              'Please wait a few seconds before retrying the same question.',
          });
        }
      } catch (e) {
        // FIX 3: Redis failure shouldn't block request
        console.error('[REDIS] Lock error:', e.message);
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // STEP 6: Generate Fresh Solution (with automatic retry)
    // ══════════════════════════════════════════════════════════════════
    console.log('[AI] Generating fresh solution...');

    let solution;
    try {
      // First attempt with creative temperature (0.8)
      solution = await generateFromQubrid(
        questionName,
        language,
        problemDescription,
        0.8
      );
    } catch (firstError) {
      // Validation failed - retry once with conservative temperature (0.3)
      console.warn(
        '[AI] ⚠️  First attempt failed, retrying with temperature=0.3...'
      );
      console.warn('[AI] Error:', firstError.message);

      try {
        // Second attempt with deterministic temperature (0.3)
        solution = await generateFromQubrid(
          questionName,
          language,
          problemDescription,
          0.3
        );
        console.log('[AI] ✅ Retry successful!');
      } catch (secondError) {
        // Both attempts failed - show error to user
        console.error('[AI] ❌ Both attempts failed');
        throw new Error(
          `Failed to generate valid solution after 2 attempts. ` +
            `Please try again or rephrase your question. Error: ${secondError.message}`
        );
      }
    }

    // FIX 8: Add metadata to solution for traceability
    solution._meta = {
      model: AI_MODEL,
      generatedAt: new Date().toISOString(),
      isVariant,
      questionName: normalizedName,
    };

    // Increment usage count (for successful AI calls)
    await UserUsage.incrementUsage(userId, 'getSolution');

    // Also increment variant count if this was a variant request
    if (isVariant) {
      await UserUsage.incrementUsage(userId, 'variant');
    }

    // ==================== STEP 7: Save to Caches ====================
    // FIX 1: Only save to base cache for NON-variant requests (variants pollute base cache)
    if (!isVariant && redisClient) {
      redisClient
        .set(baseCacheKey, JSON.stringify(solution), { ex: 7 * 24 * 60 * 60 })
        .then(() => console.log('[REDIS] ✓ Saved to base cache'))
        .catch((e) => console.error('[REDIS] Base write error:', e.message));

      // Save canonical ID for fuzzy matching
      saveCanonicalId(normalizedName, redisClient);
    }

    // FIX 1: Only save base to MongoDB for NON-variant requests
    if (!isVariant) {
      await SolutionCache.findOneAndUpdate(
        {
          questionName: normalizedName,
          language: normalizedLang,
          isVariant: false,
        },
        {
          $set: { solution, originalName: questionName, isVariant: false },
          $setOnInsert: { hitCount: 0, createdAt: new Date() },
        },
        { upsert: true }
      );
      console.log('[MONGO] ✓ Saved to base cache');
    }

    // If variant was requested, save ONLY to variant cache (not base)
    if (isVariant && redisClient && variantCacheKey) {
      redisClient
        .set(variantCacheKey, JSON.stringify(solution), {
          ex: 3 * 24 * 60 * 60,
        })
        .then(() => console.log('[REDIS] ✓ Saved to variant cache'))
        .catch((e) => console.error('[REDIS] Variant write error:', e.message));
    }

    // 🚨 SAFE-TO-SHOW GATE: Protect users from contradictory analysis
    if (!isSafeToShow(solution)) {
      console.error(
        '[SAFE-TO-SHOW] ❌ Solution failed safety check, returning error'
      );
      return res.status(500).json({
        error: 'Could not confidently analyze this problem. Please retry.',
        retryable: true,
      });
    }

    // Final consistency check for progression notes
    if (
      solution.note &&
      solution.note.toLowerCase().includes('three approaches')
    ) {
      const approachCount = [
        solution.bruteForce,
        solution.better,
        solution.optimal,
      ].filter(Boolean).length;
      if (approachCount < 3) {
        console.log(
          `[POST-PROCESS] Fixing misaligned progression note (${approachCount} approaches found)`
        );
        solution.note =
          approachCount === 2 && solution.bruteForce && solution.optimal
            ? generateDynamicBetterNote(solution.bruteForce, solution.optimal)
            : 'This problem has a single optimized solution approach.';
      }
    }

    return res.json({
      success: true,
      fromCache: false,
      data: { ...solution, tier: 'fresh' },
    });
  } catch (error) {
    console.error('Solution API Error:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to generate solution' });
  }
}
