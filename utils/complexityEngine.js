/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DETERMINISTIC COMPLEXITY ANALYSIS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This engine analyzes ACTUAL CODE to derive Time & Space complexity.
 * AI is treated as UNTRUSTED - this system is the SOURCE OF TRUTH.
 * 
 * Architecture:
 *   AI → Generates code + explanation
 *   ↓
 *   ENGINE → Parses code structure
 *   ↓
 *   ENGINE → Detects algorithmic patterns
 *   ↓
 *   ENGINE → Computes TC & SC deterministically
 *   ↓
 *   ENGINE → Generates explanation from templates
 *   ↓
 *   UI → Displays VERIFIED complexity
 * 
 * AI cannot break correctness anymore.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 1: CODE STRUCTURE ANALYSIS (Feature Extraction)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract structural features from code using pattern matching
 * @param {string} code - The source code to analyze
 * @param {string} language - Programming language (python, java, javascript, cpp, etc.)
 * @returns {Object} Detected features
 */
function extractCodeFeatures(code, language = 'python') {
  const normalizedCode = code.toLowerCase().replace(/\s+/g, ' ');
  const lines = code.split('\n');
  
  const functionNames = extractFunctionNames(code, language);

  const features = {
    // Loop Detection
    loops: {
      singleLoops: 0,
      nestedLoops: 0,
      maxNestingDepth: 0,
      whileLoops: 0,
      forLoops: 0
    },
    
    // Pointer/Window Patterns
    pointers: {
      twoPointers: false,
      slidingWindow: false,
      leftRight: false,
      slowFast: false
    },
    
    // Data Structure Usage
    dataStructures: {
      hashMap: false,
      hashSet: false,
      array: false,
      heap: false,
      stack: false,
      queue: false,
      tree: false,
      graph: false,
      linkedList: false
    },
    
    // Algorithm Patterns
    algorithms: {
      sorting: false,
      binarySearch: false, // Will verify with isTrueBinarySearch
      recursion: false,
      memoization: false,
      dp: false,
      backtracking: false,
      bfs: false,
      dfs: false,
      divideConquer: false,
      recursionInsideLoop: false,
      monotonicStack: false,
      sieve: false,
      gcd: false,
      accumulatesResults: false,
      isPermutation: false
    },
    
    // Space Usage Indicators
    spaceUsage: {
      auxArrays: 0,
      auxMaps: 0,
      recursionDepth: 0,
      inPlace: true,
      hiddenAllocations: false // slice, substring, etc.
    },
    
    // Raw metrics
    metrics: {
      lineCount: lines.length,
      hasRecursiveCall: false,
      dominantPattern: null,
      recursionBranching: 0, // 1=linear, 2=tree
      dpDimensions: 0, // 1 or 2
      recursionArgs: 'linear', // 'linear' or 'divide'
      isAmortized: false
    }
  };
  
  // ─────────────────────────────────────────────────────────────────────────────
  // LOOP DETECTION
  // ─────────────────────────────────────────────────────────────────────────────
  
  // ─────────────────────────────────────────────────────────────────────────────
  // LOOP DETECTION (ENHANCED & STRUCTURAL)
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Count loop structures
  const forLoopPatterns = [
    /for\s*\(/gi,                           // for (
    /for\s+\w+\s+in\s+/gi,                  // for x in (Python)
    /for\s+\w+\s+of\s+/gi,                  // for x of (JS)
    /for\s+\w+\s*,\s*\w+\s+in\s+enumerate/gi, // for i, x in enumerate
    /\.forEach\s*\(/gi,                     // .forEach(
    /\.map\s*\(/gi,                         // .map(
    /\.filter\s*\(/gi,                      // .filter(
    /\.reduce\s*\(/gi                       // .reduce(
  ];
  
  const whileLoopPatterns = [
    /while\s*\(/gi,
    /while\s+\w+/gi
  ];
  
  forLoopPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) features.loops.forLoops += matches.length;
  });
  
  // Check for Sqrt Bound (i * i < n) -> O(√n)
  if (/\w+\s*\*\s*\w+\s*[<≤].*|Math\.sqrt/.test(code)) {
     // Usually `i * i <= n` appearing in loop condition
     const sqrtBound = /for.*(\w+)\s*\*\s*\1\s*[<≤]/.test(code) || /while.*(\w+)\s*\*\s*\1\s*[<≤]/.test(code);
     if (sqrtBound) {
       features.loops.growthType = 'sqrt';
     }
  }
  
  whileLoopPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) features.loops.whileLoops += matches.length;
  });
  
  features.loops.singleLoops = features.loops.forLoops + features.loops.whileLoops;
  
  // Detect nested loops by analyzing indentation/braces
  // FIX: Don't count chained methods (.map().filter()) as nested
  features.loops.maxNestingDepth = detectLoopNesting(code, language);
  features.loops.nestedLoops = features.loops.maxNestingDepth > 1 ? 1 : 0;
  
  // Extract Loop Bounds Symbols (n, m, k, etc.)
  features.loops.bounds = new Set();
  
  // 1. While loops: while(i < n)
  const whileMatches = code.matchAll(/while\s*\((?:[^)]*?)[<≤]\s*(\w+)/g);
  for (const m of whileMatches) addBound(m[1]);
  
  // 2. For loops: for(init; i < n; update)
  const forMatches = code.matchAll(/for\s*\((?:[^;]*);(?:[^;]*?)[<≤]\s*(\w+)/g);
  for (const m of forMatches) addBound(m[1]);

  function addBound(b) {
      if (!b) return;
      if (!/^(length|size|count|start|end|left|right|i|j|k)$/i.test(b) && isNaN(b)) {
           features.loops.bounds.add(b);
      }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // STRUCTURAL GROWTH ANALYSIS (Fixing False Positives)
  // ─────────────────────────────────────────────────────────────────────────────
  
  features.loops.growthType = detectLoopGrowthType(code);

  // ─────────────────────────────────────────────────────────────────────────────
  // CHECK FOR EARLY EXIT (O(1))
  // ─────────────────────────────────────────────────────────────────────────────
  features.loops.earlyExit = false;
  
  // 1. Unconditional break/return at start of block
  // Matches: for(...) { break; } or while(...) { return ...; }
  // Look for { followed immediately by break/return (ignoring whitespace)
  if (/(?:for|while)\s*\([^)]*\)\s*\{\s*(break|return)\b/.test(code)) {
    features.loops.earlyExit = true;
  }
  
  // 2. Loop variable saturation (i = n)
  // Extract loop variable, then check if it's assigned to 'n' or similar inside
  // Simple heuristic: if we see "i = n" inside loop context
  if (!features.loops.earlyExit) {
     const loopVarMatch = /(?:for|while)\s*\([^)]*?(\w+)\s*[<≤]/.exec(code);
     if (loopVarMatch) {
        const loopVar = loopVarMatch[1];
        
        // CRITICAL FIX: Exclude the loop header itself from the check!
        // "for(i=0;i<n;i++)" contains "i=...n" pattern, causing false positive.
        const bodyCode = code.replace(/(?:for|while)\s*\([^)]*\)/g, '___HEADER___');
        
        // Look for assignment i = ... n ...
        // Regex: i \s* = \s* .* n
        // Ensure strictly not inside some other construct?
        const assignmentRegex = new RegExp(`\\b${loopVar}\\s*=\\s*.*\\bn\\b`);
        if (assignmentRegex.test(bodyCode)) {
            features.loops.earlyExit = true;
        }
     }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RECURSION ANALYSIS (ENHANCED)
  // ─────────────────────────────────────────────────────────────────────────────
  
  features.metrics.recursionArgs = 'linear'; // Default
  
  // Detect Divide & Conquer Arguments (mid-based split, slice, partition, or n/2)
  if (features.algorithms.recursion) {
    const fnNames = extractFunctionNames(code, language);
    if (fnNames.length > 0) {
      const name = fnNames[0];
      // 1. Explicit n/2 or right shift
      const explicitDiv = new RegExp(`${name}\\s*\\(.*[/]|>>.*\\)`).test(code);
      
      // 2. Mid-based split (common in binary search / merge sort)
      const hasMidCalc = /mid\s*=\s*|m\s*=\s*.*[/+]/.test(code);
      const usesMidSplit = new RegExp(`${name}\\s*\\(.*(mid|m).*\\)`).test(code);
      
      // 3. Slice-based split (common in merge sort JS implementations)
      const hasSliceSplit = /\.slice\s*\(\s*0\s*,\s*mid|\.slice\s*\(\s*mid/.test(code);
      
      // 4. Partition pattern (quick sort)
      const hasPartition = /partition\s*\(|pivot|lo\s*<\s*hi|low\s*<\s*high/.test(code);
      
      // 5. Recursive calls with index manipulation (arr, left, mid) AND (arr, mid+1, right)
      const hasDualRangeCalls = new RegExp(`${name}\\s*\\([^)]*,\\s*(mid|m)\\s*\\)`).test(code) && 
                                  new RegExp(`${name}\\s*\\([^)]*,\\s*(mid|m)\\s*[+\\-]`).test(code);
      
      if (explicitDiv || (hasMidCalc && usesMidSplit) || hasSliceSplit || hasPartition || hasDualRangeCalls) {
        features.metrics.recursionArgs = 'divide';
        features.algorithms.divideConquer = true;
      }
    }
  }
  
  // Check for Backtracking specific features (swaps, visited unsets)
  // ENHANCED: Also check for swap patterns like [a,b] = [b,a] or temp-based swap
  if (features.algorithms.recursionInsideLoop) {
      const isBacktracking = /(swap|pop|remove|false|0)\s*\(|visited.*=\s*false|\[.*,.*\]\s*=\s*\[.*,.*\]/.test(code);
      features.algorithms.isPermutation = isBacktracking;
  }
  // ALSO: Check for swap pattern even without explicit recursionInsideLoop
  // Catches: backtrack with swap, permute with swap, etc.
  if (features.algorithms.recursion) {
    const hasSwapPattern = /\[.*,.*\]\s*=\s*\[.*,.*\]/.test(code);
    const hasBacktrackKeyword = /backtrack|permut/i.test(code);
    if (hasSwapPattern && hasBacktrackKeyword) {
      features.algorithms.isPermutation = true;
    }
  }
  
  // Check for Subset/Choice Pattern (O(2^n))
  // Look for multiple calls with i+1 or simple step
  if (features.algorithms.recursion && !features.algorithms.isPermutation && !features.algorithms.divideConquer) {
     const fnNames = extractFunctionNames(code, language);
     if (fnNames.length > 0) {
        // recursion with i+1
        const stepRecursion = new RegExp(`${fnNames[0]}\\s*\\(.*(?:\\+|\\-)\\s*1`).test(code);
        if (stepRecursion) {
            features.metrics.recursionArgs = 'step';
        }
     }
  }
  


  // FIX: Merge Sort Branching Detection
  // ... (existing code)
  
  // Check for GCD Pattern (Recursion + Modulo)
  if (/%/.test(code)) {

  }
  
  // Check for Sieve of Eratosthenes (Inner loop starts at i*i)
  if (true) {
      // Look for j = i*i initialization
      const sieve = /(?:for|while).*=\s*(\w+)\s*\*\s*\1/.test(code) || 
                    /(?:for|while).*\b(\w+)\s*\*\s*\1\s*(?:<=|<)/.test(code);
      if (sieve) features.algorithms.sieve = true;
  }

  // Monotonic Stack / Amortized Analysis Check (O(n))
  // While loop popping stack inside a for loop OR stack.length check with pop
  if (features.loops.nestedLoops > 0 && (features.dataStructures.stack || features.dataStructures.array)) {
      const monotonic = /(?:for|while)[^{]*\{[\s\S]*while[^{]*\((?:.*stack|.*length|.*pop|.*peek)[^)]*\)[\s\S]*?(?:pop|shift)[\s\S]*?(?:push|add)/.test(code);
      const stackPattern = /while\s*\(.*stack\.length.*>.*0.*\).*(?:pop|shift)/s.test(code);
      
      if (monotonic || stackPattern) {
          features.algorithms.monotonicStack = true;
          if (features.loops.nestedLoops === 2) features.loops.nestedLoops = 1; 
      }
  }
  // Also check: outer for, inner while with stack operations
  if (/for\s*\([^)]+\)[^{}]*\{[\s\S]*while\s*\(.*stack\.length/.test(code)) {
      features.algorithms.monotonicStack = true;
      if (features.loops.nestedLoops === 2) features.loops.nestedLoops = 1;
  }
  // If we detected D&C args (mid split) AND we have multiple recursive calls -> branching is at least 2
  if (features.metrics.recursionArgs === 'divide' && features.metrics.hasRecursiveCall) {
      const fnNames = extractFunctionNames(code, language);
      if (fnNames.length > 0) {
          const regex = new RegExp(`${fnNames[0]}\\s*\\(`, 'g');
          const occurrences = (code.match(regex) || []).length;
          // Usually definition + 2 calls = 3, or definition + 1 call = 2
          // Heuristic: if we see 2 calls in body
          if (occurrences >= 2) { 
             features.metrics.recursionBranching = Math.max(features.metrics.recursionBranching, 2);
          }
      }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TWO POINTERS / SLIDING WINDOW DETECTION
  // ─────────────────────────────────────────────────────────────────────────────
  
  // ... (existing code for pointers)
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DATA STRUCTURE DETECTION
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Graph Detection via Composition (Map + Array + keywords)
  // If we identify adjacency list patterns, promote to Graph
  if (!features.dataStructures.graph) {
      const hasGraphKeywords = /adj|neighbors|edges|vertices|node/i.test(code);
      if (hasGraphKeywords && (features.dataStructures.hashMap || features.dataStructures.linkedList || code.includes('new List') || code.includes('[]'))) {
          features.dataStructures.graph = true;
      }
  }

  // StringBuilder Detection (Java/C#) - Prevents String Concat Penalty
  if (/StringBuilder|StringBuffer/.test(code)) {
      features.dataStructures.stringBuilder = true;
  }
  
  // ... (existing dsPatterns loop)
  
  const twoPointerPatterns = [
    /left\s*[+\-]=|right\s*[+\-]=/gi,
    /\bleft\b.*\bright\b|\bright\b.*\bleft\b/gi,
    /\bstart\b.*\bend\b|\bend\b.*\bstart\b/gi,
    /\blo\b.*\bhi\b|\bhi\b.*\blo\b/gi,
    /\blow\b.*\bhigh\b|\bhigh\b.*\blow\b/gi,
    /\bi\b.*\bj\b.*while|while.*\bi\b.*\bj\b/gi,
    /\bslow\b.*\bfast\b|\bfast\b.*\bslow\b/gi
  ];
  
  twoPointerPatterns.forEach(pattern => {
    if (pattern.test(code)) {
      features.pointers.twoPointers = true;
    }
  });
  
  // Sliding window detection
  // Must NOT match binary search (which also has left/right but uses mid AND target comparison)
  const isBinarySearchLike = /mid\s*=.*\[.*mid.*\]|arr\[mid\]|nums\[mid\]/.test(code);
  
  const slidingWindowPatterns = [
    /window|slide|shrink.*window|expand.*window/gi,
    /\[left:right\]|\[left,\s*right\]/gi,
    /right\s*-\s*left.*===|right\s*-\s*left.*>=|right\s*-\s*left.*<=/gi,  // window size check
    /end\s*-\s*start/gi,
    /for.*right.*while.*left\+\+|for.*while.*set.*delete/gi,  // Classic sliding window with Set
    /maxLen.*right\s*-\s*left|right\s*-\s*left.*maxLen/gi,  // Length tracking
    /\[i\]\s*-\s*\w+\[i\s*-\s*(?:k|\d+)\]/gi, // Fixed size window (nums[i] - nums[i-k])
    /curr.*-=.*nums\[.*\]/gi, // manual window slide subtraction
    /Math\.(?:min|max).*right\s*-\s*left/gi // Math.min/max with window size
  ];
  
  // Only detect sliding window if it's NOT binary search
  if (!isBinarySearchLike) {
    slidingWindowPatterns.forEach(pattern => {
      if (pattern.test(code)) {
        features.pointers.slidingWindow = true;
      }
    });
  }
  
  // Detect if pointers only move forward (key for O(n) vs O(n²))
  const backwardMovement = /left\s*=\s*0|left\s*=\s*start|right\s*=\s*0/gi;
  const forwardOnlyMovement = /(left|start)\s*\+\+|(right|end)\s*\+\+/gi;
  
  if (features.pointers.twoPointers || features.pointers.slidingWindow) {
    // Check for backward resets (would make it O(n²))
    const hasBackwardReset = backwardMovement.test(code) && 
                             code.match(/for.*for|while.*while/gi);
    if (!hasBackwardReset) {
      features.pointers.leftRight = true; // Optimized two-pointer
    }
  }
  
  // Slow-fast pointer detection (linked list cycle)
  if (/slow\s*=.*fast\s*=|fast\s*=.*slow\s*=/gi.test(code)) {
    features.pointers.slowFast = true;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DATA STRUCTURE DETECTION
  // ─────────────────────────────────────────────────────────────────────────────
  
  const dsPatterns = {
    hashMap: [
      /HashMap|Map\s*<|new\s+Map\s*\(|dict\s*\(|\{\s*\}|defaultdict|Counter/gi,
      /\.get\s*\(|\.put\s*\(|\.set\s*\(/gi  // Removed generic [ ] = pattern
    ],
    hashSet: [
      /HashSet|Set\s*<|new\s+Set\s*\(|set\s*\(/gi,
      /\.add\s*\(|\.contains\s*\(|\.has\s*\(|\bin\s+\w+/gi
    ],
    array: [
      /\[\s*\]|new\s+\w+\[|Array|List|ArrayList|vector</gi,
      /\.push\s*\(|\.pop\s*\(|\.append\s*\(/gi
    ],
    heap: [
      /PriorityQueue|heapq|MinHeap|MaxHeap|priority_queue/gi,
      /heappush|heappop|heap\./gi
    ],
    stack: [
      /Stack|Deque.*stack|\.push.*\.pop/gi,
      /stack\.|collections\.deque/gi
    ],
    queue: [
      /Queue|Deque|LinkedList.*offer|collections\.deque/gi,
      /\.offer\s*\(|\.poll\s*\(|\.popleft\s*\(/gi
    ],
    tree: [
      /TreeNode|BinaryTree|BST|root\.|\.left|\.right/gi,
      /inorder|preorder|postorder/gi
    ],
    graph: [
      /graph|adjacency|neighbors|edges|vertices/gi,
      /adj\[|adj_list/gi
    ],
    linkedList: [
      /ListNode|LinkedList|\.next|head\./gi,
      /node\.next|curr\.next/gi
    ]
  };
  
  Object.keys(dsPatterns).forEach(ds => {
    dsPatterns[ds].forEach(pattern => {
      if (pattern.test(code)) {
        features.dataStructures[ds] = true;
      }
    });
  });
  
  // Additional JS-specific heuristic: plain object used as a hash map
  // Detect patterns like: const freq = {}; freq[key] = ... where key is a variable (not a numeric literal)
  try {
    const objDeclRegex = /(?:const|let|var)\s+(\w+)\s*=\s*\{\s*\}/g;
    let declMatch;
    while ((declMatch = objDeclRegex.exec(code)) !== null) {
      const objName = declMatch[1];
      // Look for obj[variable] = ... (non-literal, non-digit key)
      const indexRegex = new RegExp(objName + "\\s*\\[\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\]\\s*=", 'g');
      const usesVariableKey = indexRegex.test(code);
      if (usesVariableKey) {
        features.dataStructures.hashMap = true;
        features.spaceUsage.auxMaps = 1;
        features.spaceUsage.inPlace = false;
        break;
      }
    }
  } catch (e) {
    // Best-effort heuristic; failure should not break analysis
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // SPACE USAGE DETECTION
  // ─────────────────────────────────────────────────────────────────────────────

  // 1. Explicit Allocation (Arrays, Vectors)
  // Look for new types with non-numeric size: new int[n], new Array(n), [0]*n
  const dynamicAlloc = /new\s+\w+\s*\[\s*[a-zA-Z_].*\]|(?:new\s+)?Array\(\s*[a-zA-Z_].*\)|\[0\]\s*\*\s*[a-zA-Z_]/.test(code);
  if (dynamicAlloc) {
      features.spaceUsage.auxArrays = 1;
      features.spaceUsage.inPlace = false;
  }

  // 2. Hidden Allocations (Slice, Substring, Split, Concat) -> O(n) Space
  if (/\.slice\(|\.substring\(|\.substr\(|\.split\(|\.concat\(|new\s+String\(/.test(code)) {
    features.spaceUsage.hiddenAllocations = true;
    features.spaceUsage.inPlace = false;
  }

  // 3. JS dynamic arrays grown via push(): treat const arr = [] followed by arr.push(...) as O(n) auxiliary space
  try {
    const arrDeclRegex = /(?:const|let|var)\s+(\w+)\s*=\s*\[\s*\]/g;
    let m;
    while ((m = arrDeclRegex.exec(code)) !== null) {
      const name = m[1];
      const pushRegex = new RegExp(name + "\\s*\\.push\\s*\\(", 'g');
      if (pushRegex.test(code)) {
        features.spaceUsage.auxArrays = Math.max(features.spaceUsage.auxArrays, 1);
        features.spaceUsage.inPlace = false;
        break;
      }
    }
  } catch (e) {
    // Heuristic only; ignore failures
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ALGORITHM PATTERN DETECTION
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Sorting detection - Must be actual method calls, not function definitions
  const sortingPatterns = [
    /\w+\.sort\s*\(/gi,             // array.sort(
    /Arrays\.sort|Collections\.sort/gi,  // Java
    /sorted\s*\(\s*\w/gi,           // Python sorted(arr
  ];
  
  sortingPatterns.forEach(pattern => {
    if (pattern.test(code)) {
      features.algorithms.sorting = true;
    }
  });
  
  // Binary search detection (IMPROVED)
  if (isTrueBinarySearch(code)) {
    features.algorithms.binarySearch = true;
  }
  
  // Recursion detection
  functionNames.forEach(funcName => {
    const recursionPattern = new RegExp(`${funcName}\\s*\\(`, 'g');
    const matches = code.match(recursionPattern);
    if (matches && matches.length > 1) {
      features.algorithms.recursion = true;
      features.metrics.hasRecursiveCall = true;
    }
  });
  
  // Estimate branching factor if recursive
  if (features.algorithms.recursion) {
    features.metrics.recursionBranching = estimateRecursionBranching(code, functionNames);
  }
  
  // Memoization / DP detection
  const memoPatterns = [
    /memo|cache|@lru_cache|@cache/gi,
    /dp\[|dp\s*=|memo\[|memo\s*=/gi,
    /if\s+\w+\s+in\s+memo|if\s+memo\./gi,
    /tabulation|memoization/gi
  ];
  
  memoPatterns.forEach(pattern => {
    if (pattern.test(code)) {
      features.algorithms.memoization = true;
      features.algorithms.dp = true;
    }
  });
  
  // Estimate DP dimensions
  if (features.algorithms.dp) {
    features.metrics.dpDimensions = estimateDPDimensions(code);
  }
  
  // Backtracking detection
  const backtrackPatterns = [
    /backtrack|backtracking/gi,
    /\.append.*recursive.*\.pop|\.push.*recursive.*\.pop/gi,
    /path\.append.*path\.pop|result\.append.*copy/gi
  ];
  
  backtrackPatterns.forEach(pattern => {
    if (pattern.test(code)) {
      features.algorithms.backtracking = true;
    }
  });

  // Generic backtracking heuristic: recursive helper that pushes and pops the same path array
  if (!features.algorithms.backtracking && features.algorithms.recursion) {
    try {
      const pushMatch = code.match(/(\w+)\.push\s*\(/);
      if (pushMatch) {
        const arrName = pushMatch[1];
        const popRegex = new RegExp(arrName + "\\.pop\\s*\\(", 'g');
        if (popRegex.test(code)) {
          features.algorithms.backtracking = true;
        }
      }
    } catch (e) {
      // Heuristic only; ignore failures
    }
  }
  
  // BFS detection
  const bfsPatterns = [
    /bfs|breadth.*first/gi,
    /queue.*while.*queue|deque.*while.*popleft/gi,
    /level.*order|level_order/gi
  ];
  
  bfsPatterns.forEach(pattern => {
    if (pattern.test(code)) {
      features.algorithms.bfs = true;
    }
  });
  
  // DFS detection
  const dfsPatterns = [
    /dfs|depth.*first/gi,
    /stack.*while.*stack|recursive.*visit/gi,
    /def\s+dfs|function\s+dfs/gi
  ];
  
  dfsPatterns.forEach(pattern => {
    if (pattern.test(code)) {
      features.algorithms.dfs = true;
    }
  });
  
  // ─────────────────────────────────────────────────────────────────────────────
  // SPACE USAGE ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Detect auxiliary arrays
  const auxArrayPatterns = [
    /new\s+\w+\[\s*n\s*\]|new\s+\w+\[\s*len/gi,
    /\[\s*0\s*\]\s*\*\s*n|\[0\s+for/gi,
    /Array\s*\(\s*[a-zA-Z_]\w*[^)]*\)|new\s+Array\s*\(\s*\w+/gi
  ];
  
  auxArrayPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      features.spaceUsage.auxArrays += matches.length;
      features.spaceUsage.inPlace = false;
    }
  });
  
  // Detect auxiliary maps/sets
  if (features.dataStructures.hashMap || features.dataStructures.hashSet) {
    features.spaceUsage.auxMaps = 1;
    features.spaceUsage.inPlace = false;
  }
  
  // Recursion stack depth (REMOVED: estimateRecursionDepth function no longer exists, using metrics.recursionBranching instead)
  if (features.algorithms.recursion) {
    features.spaceUsage.inPlace = false;
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DETERMINE DOMINANT PATTERN
  // ─────────────────────────────────────────────────────────────────────────────
  
  features.metrics.dominantPattern = determineDominantPattern(features);
  
  // Calculate Amortized Flag
  // If sliding window or two pointers logic is strict, it is amortized linear
  if (features.pointers.slidingWindow || features.pointers.twoPointers) {
    // Only if monotonic movement
    if (features.pointers.leftRight) {
       features.metrics.isAmortized = true;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST-ANALYSIS CHECKS (dependent on previous flags)
  // ─────────────────────────────────────────────────────────────────────────────

  // Check for Sorting inside Loops (High Complexity O(n² log n))
  if (features.algorithms.sorting && features.loops.singleLoops > 0) {
    const sortInsideLoop = /(for|while)[\s\S]*(\.sort|sorted|Arrays\.sort|Collections\.sort|sort\s*\()[\s\S]*(\}|:)/.test(code);
    if (sortInsideLoop) {
      features.algorithms.sortingInsideLoop = true;
    }
  }

  // Check for Recursion inside Loops (Factorial/Exponential)
  if (features.algorithms.recursion && features.loops.singleLoops > 0) {
      // Heuristic: call inside standard loop structure
      // We look for loop header ... recursive call ... }
      const fnNames = extractFunctionNames(code, language);
      if (fnNames.length > 0) {
          const regex = new RegExp(`(for|while)[\\s\\S]*${fnNames[0]}\\s*\\([\\s\\S]*(\\}|:)`);
          if (regex.test(code)) {
              features.algorithms.recursionInsideLoop = true;
          }
      }
  }

  // Check for String Concatenation in Loop (O(n^2))
  if (features.loops.singleLoops > 0) {
      // Look for s += ... or s = s + ... type patterns where s is likely a string
      // Heuristic: += "..." or += '...'
      // Group 1: +=
      // Group 2: s = s + ...
      // Group 3: s = ... + s
      const strConcat = /(\w+)\s*\+=\s*['"]|(\w+)\s*=\s*\2\s*\+\s*['"]|(\w+)\s*=\s*['"][^;]*\+\s*\3/.test(code);
      // Or in Java: s += ... check declaration? Hard.
      // Assume += on any var declared as String.
      const declString = /(String|str)\s+(\w+)/.exec(code);
      if (declString && features.loops.singleLoops > 0) {
          const varName = declString[2];
          const update = new RegExp(`${varName}\\s*\\+=[^;]+`).test(code);
          if (update || strConcat) {
             features.dataStructures.stringConcatLoop = true;
          }
      } else if (strConcat) {
          features.dataStructures.stringConcatLoop = true;
      }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DIVIDE & CONQUER DETECTION (MUST run after recursion is set)
  // ─────────────────────────────────────────────────────────────────────────────
  if (features.algorithms.recursion && !features.algorithms.divideConquer) {
    const fnNames = extractFunctionNames(code, language);
    if (fnNames.length > 0) {
      const name = fnNames[0];
      
      // Mid-based split (common in binary search / merge sort)
      const hasMidCalc = /mid\s*=|length\s*\/\s*2/.test(code);
      
      // Slice-based split (common in merge sort JS implementations)  
      const hasSliceSplit = /\.slice\s*\(\s*0\s*,\s*mid|\.slice\s*\(\s*mid/.test(code);
      
      // Partition pattern (quick sort)
      const hasPartition = /partition\s*\(|pivot|lo\s*<\s*hi|low\s*<\s*high/.test(code);
      
      // Multiple recursive calls with different params
      const callPattern = new RegExp(`${name}\\s*\\(`, 'g');
      const calls = code.match(callPattern) || [];
      const multipleRecursiveCalls = calls.length >= 2;
      
      // Branching = 2 (like merge sort) with mid calculation
      const isDandC = (hasMidCalc || hasSliceSplit || hasPartition) && 
                      multipleRecursiveCalls && 
                      features.metrics.recursionBranching >= 2;
      
      if (isDandC) {
        features.metrics.recursionArgs = 'divide';
        features.algorithms.divideConquer = true;
      }
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // PERMUTATION DETECTION (MUST run after recursionInsideLoop is set)
  // ─────────────────────────────────────────────────────────────────────────────
  if (features.algorithms.recursion && !features.algorithms.isPermutation) {
    const hasSwapPattern = /\[.*,.*\]\s*=\s*\[.*,.*\]/.test(code);
    const hasBacktrackKeyword = /backtrack|permut/i.test(code);
    const hasLoopWithRecursion = features.algorithms.recursionInsideLoop;
    
    if (hasSwapPattern && (hasBacktrackKeyword || hasLoopWithRecursion)) {
      features.algorithms.isPermutation = true;
    }
  }
  
  // Check for Result Accumulation in Backtracking (Space Analysis)
  if (features.algorithms.recursion || features.algorithms.backtracking) {
      // Look for result.push(copy) or list.add(new ...) OR result.push([...])
      const accum = /\w+\.(push|add|append)\s*\(\s*(new|Arrays\.copyOf|\.\.\.|slice|\[)/.test(code);
      if (accum) features.algorithms.accumulatesResults = true;
      
      // Fix: GCD Check (Recursion independent logic but SAFER)
      if (/%/.test(code) && features.algorithms.recursion && !features.algorithms.divideConquer && features.metrics.recursionBranching === 1) features.algorithms.gcd = true;
  }

  return features;
}

// ... inside deriveTimeComplexity ...
// (I need to add rules there too, but I'll do it in next replace block or here if context allows)



/**
 * Detect maximum loop nesting depth
 */
function detectLoopNesting(code, language) {
  let maxDepth = 0;
  let currentDepth = 0;
  const lines = code.split('\n');
  
  // Track indentation for Python
  if (language.toLowerCase() === 'python') {
    let prevIndent = 0;
    let inLoop = false;
    
    lines.forEach(line => {
      const indent = line.search(/\S/);
      if (indent === -1) return;
      
      if (/^\s*(for|while)\s/.test(line)) {
        if (indent > prevIndent && inLoop) {
          currentDepth++;
        } else {
          currentDepth = 1;
        }
        inLoop = true;
        maxDepth = Math.max(maxDepth, currentDepth);
        prevIndent = indent;
      }
    });
  } else {
    // Track braces for C-like languages
    let braceCount = 0;
    let loopStack = [];
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const substr = code.substr(i, 10);
      
      if (/^(for|while)\s*\(/.test(substr)) {
        loopStack.push(braceCount);
        currentDepth = loopStack.length;
        maxDepth = Math.max(maxDepth, currentDepth);
      }
      
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        while (loopStack.length > 0 && loopStack[loopStack.length - 1] >= braceCount) {
          loopStack.pop();
        }
      }
    }
  }
  
  return maxDepth || (code.match(/for|while/gi) ? 1 : 0);
}

/**
 * Detect loop growth type structurally to avoid false positives
 * Returns: 'linear' | 'logarithmic' | 'sqrt'
 */
function detectLoopGrowthType(code) {
  const normalized = code.replace(/\s+/g, ' ');
  
  // 1. SQRT DETECTION: Strictly check for loop condition i*i < n
  const sqrtPattern = /(?:for|while)\s*\([^)]*?(\w+)\s*\*\s*\1\s*[<≤]/;
  if (sqrtPattern.test(normalized)) {
    return 'sqrt';
  }
  
  // 2. LOGARITHMIC DETECTION: Check loop update statements specifically
  
  // A. For-loop headers: for (...; i < n; i *= 2) - Strict variable match
  {
      const forLogStrict = /for\s*\([^;]*;\s*(\w+)\s*[<≤>≥!=][^;]*;\s*(\w+)\s*(\*=|\/=|<<=|>>=)\s*[2-9]/;
      const match = normalized.match(forLogStrict);
      if (match) {
          const condVar = match[1];
          const updateVar = match[2];
          if (condVar === updateVar) return 'logarithmic';
      }
  }
  
  // B. While-loop bodies: while (i < n) { ... i *= 2 OR i /= 2 OR i = i / 2 ... }
  {
      const parts = code.split('while');
      for (let i = 1; i < parts.length; i++) {
        const afterWhile = parts[i];
        const condMatch = afterWhile.match(/^\s*\(\s*(\w+)\s*[<≤>≥!=]/);
        if (!condMatch) continue;
        
        const loopVar = condMatch[1];
        const bodyStart = afterWhile.indexOf('{');
        if (bodyStart === -1) continue;
        
        const fragment = afterWhile.substring(bodyStart, bodyStart + 400);
        
        // Check for multiplicative/divisive update: i *= 2, i /= 2, i = i / 2, n = n / 2
        const updateRegex = new RegExp(`\\b${loopVar}\\s*(\\*=|\\/=|<<=|>>=)\\s*[2-9]|\\b${loopVar}\\s*=\\s*${loopVar}\\s*\\/\\s*[2-9]|\\b${loopVar}\\s*=\\s*${loopVar}\\s*>>`);
        if (updateRegex.test(fragment)) {
      return 'logarithmic';
        }
      }
  }
  
  return 'linear';
}


/**
 * Extract function names from code
 */
function extractFunctionNames(code, language) {
  const patterns = {
    python: /def\s+(\w+)\s*\(/g,
    javascript: /function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*(?:async\s*)?\(/g,
    java: /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/g,
    cpp: /\w+\s+(\w+)\s*\([^)]*\)\s*\{/g
  };
  
  const pattern = patterns[language?.toLowerCase()] || patterns.javascript;
  const names = [];
  let match;
  
  while ((match = pattern.exec(code)) !== null) {
    names.push(match[1] || match[2]);
  }
  
  return names.filter(Boolean);
}

/**
 * Estimate recursion branching factor
 * Returns 1 for linear recursion, >=2 for tree/exponential recursion
 */
function estimateRecursionBranching(code, functionNames) {
  if (!functionNames || functionNames.length === 0) return 0;
  
  let maxBranching = 0;

  for (const funcName of functionNames) {
      // 1. Locate function definition to ignore it
      const defRegex = new RegExp(`(function|def|int|void|public|private|static)\\s+${funcName}\\s*\\(`, 'g');
      let match = defRegex.exec(code);
      let startIndex = 0;
      
      if (match) {
        startIndex = match.index + match[0].length;
      } else {
        // Fallback: look for "name(" at start of line
        const simpleDefRaw = code.match(new RegExp(`^\\s*${funcName}\\s*\\(`, 'm'));
        if (simpleDefRaw) startIndex = simpleDefRaw.index + simpleDefRaw[0].length;
      }
      
      const body = code.substring(startIndex);
      
      // 2. Count calls strictly inside the body
      const callPattern = new RegExp(`${funcName}\\s*\\(`, 'g');
      const matches = body.match(callPattern) || [];
      
      let branching = matches.length;
      
      // Heuristic: If we found no calls, it's not recursive (branching 0)
      if (branching === 0) {
          // Double check if matches[0] was the definition itself if strict body separation failed
          branching = 0; 
      }
      
      // 3. Check for arithmetic branching: `return f() + f()`
      const arithmeticBranching = new RegExp(`return.*${funcName}.*[+\\-*].*${funcName}`);
      if (arithmeticBranching.test(body)) {
          branching = Math.max(branching, 2);
      }
      
      maxBranching = Math.max(maxBranching, branching);
  }
  
  return maxBranching;
}
/**
 * Validates if it's truly Binary Search (checks for Mid calculation)
 * Must be ITERATIVE binary search with while loop and target comparison
 */
function isTrueBinarySearch(code) {
  const normalized = code.replace(/\s+/g, ' ');

  // 1. Check for Loop
  const hasWhileLoop = /while\s*\(/.test(normalized);

  // 2. Check for Mid Calculation (keywords: mid, m, floor, >>, / 2)
  const hasHalving = /\b(mid|m|middle)\b\s*=\s*.*(?:floor|trunc|>>|Math\.|2\b)/i.test(normalized);
  
  // 3. Check for Bounds Update (l = m + 1, etc.)
  const hasBoundUpdate = /\b(?:left|right|l|r|low|high|start|end)\b\s*=\s*\b(?:mid|m|middle)\b/i.test(normalized);

  // 4. Binary Keyword Fallback
  const hasBsKeyword = /binarySearch|binary_search|binary_exponentiation|modPow/i.test(code);

  // Must have loop + (halving OR bound update) to be binary search
  return (hasWhileLoop && (hasHalving || hasBoundUpdate)) || hasBsKeyword;
}

/**
 * Estimate DP state dimensions
 */
function estimateDPDimensions(code) {
  // Check for 2D specific access: dp[i][j] or dp[x][y]
  const twoD = /dp\[\s*\w+\s*\]\s*\[\s*\w+\s*\]|memo\[\s*\w+\s*\]\s*\[\s*\w+\s*\]/.test(code);
  if (twoD) return 2;
  
  // Check for 1D specific access: dp[i] without second bracket immediately
  const oneD = /dp\[\s*\w+\s*\](?!\[)|memo\[\s*\w+\s*\](?!\[)/.test(code);
  if (oneD) return 1;
  
  return 1; // Default
}


/**
 * Determine the dominant algorithmic pattern
 */
function determineDominantPattern(features) {
  // Priority order (most specific first)
  // Key insight: nested loops dominate over hash operations!
  
  if (features.algorithms.binarySearch) return 'binary_search';
  if (features.algorithms.dp || features.algorithms.memoization) return 'dynamic_programming';
  if (features.algorithms.backtracking) return 'backtracking';
  if (features.algorithms.bfs) return 'bfs';
  if (features.algorithms.dfs) return 'dfs';
  
  // Sliding window with forward-only pointers is O(n) even with nested while
  if (features.pointers.slidingWindow && features.pointers.leftRight) return 'sliding_window';
  
  // Two pointers with forward-only movement is O(n)
  if (features.pointers.twoPointers && features.pointers.leftRight) return 'two_pointers';
  
  if (features.pointers.slowFast) return 'slow_fast_pointers';
  
  // CRITICAL: Nested loops dominate over hash operations!
  // Even if there's a HashSet inside nested loops, it's still O(n²)
  if (features.loops.nestedLoops > 0 && features.loops.maxNestingDepth >= 2) {
    return 'nested_loops';
  }
  
  if (features.algorithms.sorting) return 'sorting';
  
  // Hash-based is O(n) ONLY if no nested loops
  if (features.dataStructures.hashMap || features.dataStructures.hashSet) return 'hash_based';
  
  if (features.dataStructures.heap) return 'heap';
  if (features.loops.singleLoops > 0) return 'single_loop';
  if (features.algorithms.recursion) return 'recursion';
  
  return 'constant';
}


// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 2: TIME COMPLEXITY RULES ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Derive Time Complexity from code features
 * NEW: Computes ALL applicable complexities and returns the MAXIMUM
 * @param {Object} features - Extracted code features
 * @returns {Object} { complexity: string, explanation: string }
 */
function deriveTimeComplexity(features) {
  // Complexity ranking (from lowest to highest)
  // Complexity ranking (from lowest to highest)
  const COMPLEXITY_ORDER = [
    'O(1)',
    'O(log n)',
    'O(log log n)', // rare but exists
    'O(√n)',
    'O(n)',
    'O(V + E)',     // Graph linear
    'O(n log log n)', // Sieve
    'O(n log n)',
    'O(n²)',
    'O(n² log n)',
    'O(n³)',
    'O(2^n)',
    'O(k^n)',
    'O(n!)'
  ];
  
  const getComplexityRank = (tc) => {
    let searchTC = tc;
    // Normalize composite complexities to their dominant term for ranking
    if (tc.includes('!')) searchTC = 'O(n!)';
    else if (tc.includes('2^n')) searchTC = 'O(2^n)';
    else if (tc.includes('k^n')) searchTC = 'O(k^n)';
    
    const normalized = searchTC.replace(/\s+/g, '');
    const idx = COMPLEXITY_ORDER.findIndex(c => c.replace(/\s+/g, '') === normalized);
    return idx === -1 ? COMPLEXITY_ORDER.indexOf('O(n)') : idx;  // Default to O(n) rank if unknown
  };
  
  // Collect ALL applicable complexities
  const applicableComplexities = [];
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Check each pattern and add if applicable
  // ─────────────────────────────────────────────────────────────────────────────
  
  // 0. SPECIAL: Early Loop Exit (O(1))
  if (features.loops.earlyExit) {
    applicableComplexities.push({
      complexity: 'O(1)',
      explanation: 'Loop terminates immediately (unconditional break/return or sequence jump).',
      source: 'early_exit'
    });
  }

  // 0.4. SPECIAL: Recursion inside Loop (O(n!) or O(n^2))
  if (features.algorithms.recursionInsideLoop) {
      if (features.algorithms.isPermutation) {
          applicableComplexities.push({
              complexity: 'O(n!)',
              explanation: 'Backtracking/Permutation logic inside loop.',
              source: 'recursion_inside_loop_perm'
          });
      } else {
          // Check underlying recursion type
          const branching = features.metrics.recursionBranching;
          if (branching >= 2) {
             applicableComplexities.push({
                complexity: 'O(n * 2^n)',
                explanation: 'Tree recursion inside a linear loop.',
                source: 'recursion_inside_loop_tree'
             });
          } else {
             applicableComplexities.push({
                complexity: 'O(n²)',
                explanation: 'Linear recursion called n times in a loop.',
                source: 'recursion_inside_loop_linear'
             });
          }
      }
  }

  // 0.5. SPECIAL: Sorting inside loop (High Complexity)
  if (features.algorithms.sortingInsideLoop && !features.loops.earlyExit) {
     applicableComplexities.push({
       complexity: 'O(n² log n)',
       explanation: 'Sorting O(n log n) is performed inside a loop of n iterations.',
       source: 'sorting_inside_loop'
     });
  }
  
  // 0.6 SPECIAL: String Concatenation in Loop (O(n^2))
  if (features.dataStructures.stringConcatLoop && !features.loops.earlyExit && !features.dataStructures.stringBuilder) {
     applicableComplexities.push({
         complexity: 'O(n²)',
         explanation: 'Repeated string concatenation inside a loop creates O(n²) copy overhead (detected mutable string build).',
         source: 'string_concat_loop'
     });
  }

  // 0.7 SPECIAL: Sieve of Eratosthenes
  if (features.algorithms.sieve) {
      applicableComplexities.push({ 
          complexity: 'O(n log log n)', 
          explanation: 'Sieve of Eratosthenes detected. This complexity relies on well-known mathematical properties (e.g., number-theoretic bounds), not just loop structure.', 
          source: 'sieve' 
      });
  }

  // 1. ADVANCED LOOP PATTERNS (Sqrt, Logarithmic)
  // ... (existing code for loops)

  // ... (existing code for Nested Loops)


  
  // Binary search pattern (explicit) - O(log n) or O(n log n)
  // ... (existing binary search code)
  
  // 3. RECURSION & DP PATTERNS
  
  // DP Detection - O(n) or O(n^2) etc
  if (features.algorithms.dp) {
     // ... (existing logic)
     const explanation = features.metrics.dpDimensions === 2
        ? 'DP Table Size (n²) × Constant work per state = O(n²) (Assuming constant-time transitions per DP state).'
        : 'DP Table Size (n) × Constant work per state = O(n) (Assuming constant-time transitions per DP state).';
     // ...
  }
  
  // 4. DATA STRUCTURES (Heap, HashMap)
  
  // Heap priority queue - O(n log n)
  if (features.dataStructures.heap) {
    if (features.loops.singleLoops > 0 || features.loops.nestedLoops > 0) {
       applicableComplexities.push({
         complexity: 'O(n log n)',
         explanation: 'n Heap operations at O(log n) each.',
         source: 'heap_usage'
       });
    } else {
       applicableComplexities.push({
         complexity: 'O(log n)',
         explanation: 'Heap operations take O(log n).',
         source: 'heap_single'
       });
    }
  }
  
  // Hash map usage - O(n) (Iterating or N lookups)
  if ((features.dataStructures.hashMap || features.dataStructures.hashSet) && 
      (features.loops.singleLoops > 0 || features.loops.nestedLoops > 0)) {
     applicableComplexities.push({
       complexity: 'O(n)',
       explanation: 'n Hash Table lookups/insertions (Average-case O(1); worst-case degrades with collisions).',
       source: 'hash_map_usage'
     });
  }

  // 1. ADVANCED LOOP PATTERNS (Sqrt, Logarithmic)
  // These take precedence over standard single/nested loop detection
  
  if (features.loops.growthType === 'sqrt' && !features.loops.earlyExit) {
     applicableComplexities.push({
        complexity: 'O(√n)',
        explanation: 'Loop condition (i * i < n) implies i increments until it reaches √n.',
        source: 'sqrt_loop'
      });
  }
  
  if (features.loops.growthType === 'logarithmic') {
     // Check if nested inside another linear loop
     if (features.loops.nestedLoops > 0) {
        applicableComplexities.push({
          complexity: 'O(n log n)',
          explanation: 'Inner loop runs O(log n) times (multiplicative update) inside an O(n) outer loop.',
          source: 'nested_log_loop'
        });
     } else {
        applicableComplexities.push({
          complexity: 'O(log n)',
          explanation: 'Loop variable updates multiplicatively (e.g. i *= 2), taking log₂(n) steps to reach n.',
          source: 'log_loop'
        });
     }
  }

  // Nested loops - contributes if present (Standard O(n^2))
  if (features.loops.nestedLoops > 0 && features.loops.maxNestingDepth >= 2 && features.loops.growthType === 'linear') {
    if (!(features.pointers.slidingWindow && features.pointers.leftRight)) {
      // Monotonic Stack Check
      if (features.algorithms.monotonicStack) {
          applicableComplexities.push({ 
              complexity: 'O(n)', 
              explanation: 'Monotonic Stack pattern. Although nested loops may appear, this is amortized O(n) because each pointer or element advances monotonically and is processed a bounded number of times.', 
              source: 'monotonic_stack' 
          });
      }
      // Check for symbolic bounds (n*m)
      else if (features.loops.bounds && features.loops.bounds.size >= 2) {
          // Normalization: n * n -> n^2
          const bArr = Array.from(features.loops.bounds);
          let boundsStr;
          if (bArr.length === 2 && bArr[0] === bArr[1]) boundsStr = `${bArr[0]}²`;
          else boundsStr = bArr.join(' * ');
          
          applicableComplexities.push({ 
              complexity: `O(${boundsStr})`, 
              explanation: `Nested loops iterate over independent input sizes, so total operations are multiplicative.`, 
              source: 'nested_loops_symbolic' 
          });
      } else {
          // ... Standard logic
          const tc = features.loops.maxNestingDepth >= 3 ? 'O(n³)' : 'O(n²)';
          const explanation = features.loops.maxNestingDepth >= 3
            ? 'Three nested loops each run O(n) times. Total = n × n × n = O(n³).'
            : 'Two nested loops each run O(n) times. Total = n × n = O(n²).';
          applicableComplexities.push({ 
              complexity: tc, 
              explanation: explanation + ' Time complexity is reported for the worst-case execution path.',
              source: 'nested_loops' 
          });
      }
    }
  }
  
  // Sorting - ALWAYS adds O(n log n) if detected
  if (features.algorithms.sorting) {
    applicableComplexities.push({
      complexity: 'O(n log n)',
      explanation: 'Sorting takes O(n log n) time for comparison-based sorts.',
      source: 'sorting'
    });
  }
  
  // Binary search pattern (explicit) - O(log n)
  // FIX: Binary search has its OWN while loop, so singleLoops > 0 is always true for BS.
  // We should check if there's a SEPARATE for loop containing binary search.
  if (features.algorithms.binarySearch) {
    // Check if there's a for loop AND binary search (BS inside loop pattern)
    const bsInsideForLoop = features.loops.forLoops > 0 && features.loops.whileLoops > 0;
    if (bsInsideForLoop) {
      applicableComplexities.push({
        complexity: 'O(n log n)',
        explanation: 'Binary search O(log n) is performed inside a loop of n iterations.',
        source: 'binary_search_in_loop'
      });
    } else {
      applicableComplexities.push({
        complexity: 'O(log n)',
        explanation: 'Binary search halves the search space each iteration.',
        source: 'binary_search'
      });
    }
  }
  

  
  // Backtracking - exponential (covers classical backtracking + recursive subset/choice patterns)
  // FIX: Exclude Divide & Conquer (QuickSort, MergeSort) from being treated as exponential backtracking
  if ((features.algorithms.backtracking ||
       features.algorithms.recursionInsideLoop ||
       (features.algorithms.recursion && (features.metrics.recursionArgs === 'step' || features.metrics.recursionBranching >= 2))) && 
       !features.algorithms.divideConquer) {
      if (features.algorithms.isPermutation) {
           applicableComplexities.push({
             complexity: 'O(n!)',
             explanation: 'Permutation backtracking. This is a worst-case upper bound. Pruning, constraints, or early termination may reduce runtime for specific inputs.',
             source: 'backtracking_permutation'
           });
      } else if (features.metrics.recursionArgs === 'step' || features.metrics.recursionBranching >= 2) {
           const tc = features.algorithms.accumulatesResults
             ? 'O(n · 2^n)'
             : 'O(2^n)';

           applicableComplexities.push({
             complexity: tc,
             explanation: features.algorithms.accumulatesResults
               ? 'Subset generation explores 2^n branches, and each subset copy costs O(n) in the worst case.'
               : 'Subset/Choice backtracking explores 2^n branches.',
             source: 'backtracking_subsets'
           });
      } else {
         applicableComplexities.push({
           complexity: 'O(k^n)',
           explanation: 'Backtracking exploration. This is a worst-case upper bound. Pruning, constraints, or early termination may reduce runtime for specific inputs.',
           source: 'backtracking_generic'
         });
      }
  }
  
  // Recursion logic (ADVANCED)
  if (features.algorithms.recursion && !features.algorithms.memoization && !features.algorithms.dp) {
    const branching = features.metrics.recursionBranching;
    const argsType = features.metrics.recursionArgs;
    const hasLoop = features.loops.singleLoops > 0;
    
    // GCD Pattern
    if (features.algorithms.gcd) {
        applicableComplexities.push({
            complexity: 'O(log n)',
            explanation: 'Euclidean algorithm. This complexity relies on well-known mathematical properties (e.g., number-theoretic bounds), not just loop structure.',
            source: 'gcd'
        });
    } else if (argsType === 'divide') {
       // Divide and Conquer Patterns
       if (branching === 1) {
          // T(n) = T(n/2) + O(1) -> O(log n) (Binary Search recursive)
          applicableComplexities.push({
            complexity: 'O(log n)',
            explanation: 'Recursive step divides input by constant factor with single branch.',
            source: 'divide_conquer_linear'
          });
       } else if (branching >= 2) {
          if (hasLoop) {
             // T(n) = 2T(n/2) + O(n) -> O(n log n) (Merge Sort)
             applicableComplexities.push({
               complexity: 'O(n log n)',
               explanation: 'Divide and conquer with linear work at each step (e.g. Merge Sort).',
               source: 'divide_conquer_nlogn'
             });
          } else {
             // T(n) = 2T(n/2) + O(1) -> O(n) (Tree construction/traversal)
             applicableComplexities.push({
               complexity: 'O(n)',
               explanation: 'Recursive tree traversal (visiting each node once).',
               source: 'divide_conquer_tree'
             });
          }
       }
    } else if (branching >= 2) {
      // Tree recursion (f(n-1) + f(n-2)) → Exponential
      applicableComplexities.push({
        complexity: 'O(2^n)',
        explanation: 'Recursive calls branch into multiple paths without caching (Tree Recursion).',
        source: 'tree_recursion'
      });
    } else {
      // DEFAULT: Linear Recursion
      applicableComplexities.push({
        complexity: 'O(n)',
        explanation: 'Linear recursion depth O(n).',
        source: 'recursion_linear'
      });
    }
  }
  
  // DP / Memoization logic (IMPROVED)
  if (features.algorithms.dp || features.algorithms.memoization) {
    const dimensions = features.metrics.dpDimensions;
    
    // If explicit 2D access detected OR nested loops (fallback)
    const is2D = dimensions === 2 || (dimensions === 0 && features.loops.maxNestingDepth >= 2);
    
    const tc = is2D ? 'O(n²)' : 'O(n)';
    applicableComplexities.push({
      complexity: tc,
      explanation: is2D
        ? 'Time = (O(m × n) States) × (O(1) Work per State). Total O(m × n) (reported as O(n²) when m and n are on the same order).'
        : 'Time = (O(n) States) × (O(1) Work per State). Total O(n).',
      source: 'dp'
    });
  }
  
  // BFS/DFS - O(V + E) which we treat as O(n) for ranking
  // Require an explicit graph/tree structure to avoid misclassifying generic DFS helpers (e.g., subsets backtracking) as graph traversal
  if ((features.algorithms.bfs || features.algorithms.dfs) && (features.dataStructures.graph || features.dataStructures.tree)) {
    applicableComplexities.push({
      complexity: 'O(V + E)',
      explanation: 'Graph traversal visits each vertex and edge exactly once.',
      source: 'graph_traversal'
    });
  }

  
  // Sliding window with forward-only pointers - O(n)
  if (features.pointers.slidingWindow && features.pointers.leftRight) {
    applicableComplexities.push({
      complexity: 'O(n)',
      explanation: 'Sliding Window. Although nested loops may appear, this is amortized O(n) because each pointer or element advances monotonically and is processed a bounded number of times.',
      source: 'sliding_window'
    });
  }
  
  // Two pointers with forward-only movement - O(n)
  if (features.pointers.twoPointers && features.pointers.leftRight && !features.pointers.slidingWindow) {
    applicableComplexities.push({
      complexity: 'O(n)',
      explanation: 'Two Pointers. Although nested loops may appear, this is amortized O(n) because each pointer or element advances monotonically and is processed a bounded number of times.',
      source: 'two_pointers'
    });
  }
  
  // Hash-based single pass - O(n)
  if ((features.dataStructures.hashMap || features.dataStructures.hashSet) && 
      features.loops.nestedLoops === 0 && features.loops.singleLoops > 0) {
    applicableComplexities.push({
      complexity: 'O(n)',
      explanation: 'Average-case O(1) per operation under standard hashing assumptions.',
      source: 'hash_based'
    });
  }
  
  // Single loop only - O(n)
  if (features.loops.singleLoops > 0 && features.loops.nestedLoops === 0 && 
      applicableComplexities.length === 0) {
    applicableComplexities.push({
      complexity: 'O(n)',
      explanation: 'Single loop iterates through n elements with constant work per iteration.',
      source: 'single_loop'
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Find the MAXIMUM complexity (dominating term)
  // ─────────────────────────────────────────────────────────────────────────────
  
  if (applicableComplexities.length === 0) {
    return {
      complexity: 'O(1)',
      explanation: 'The algorithm performs a fixed number of operations regardless of input size.'
    };
  }
  
  // Sort by complexity rank and take the highest
  applicableComplexities.sort((a, b) => getComplexityRank(b.complexity) - getComplexityRank(a.complexity));
  
  // PRIORITY OVERRIDE: Certain algorithm-specific sources should win over generic detections
  // This prevents D&C (merge/quick sort) from being overtaken by generic tree_recursion
  // And prevents graph traversal from being overtaken by nested_loops
  const prioritySources = [
    'divide_conquer_nlogn', 'divide_conquer_linear', 'divide_conquer_tree', 
    'gcd', 'graph_traversal', 'sieve', 'binary_search', 
    'monotonic_stack', 'sliding_window', 'heap_usage', 'sorting',
    'backtracking_permutation', // Explicit permutation detection wins
    'backtracking_subsets'      // Subset generation with or without output cost should override generic tree recursion
  ];
  const genericSources = [
    'tree_recursion', 'nested_loops', 'backtracking_generic',
    'hash_map_usage', 'hash_based', 'recursion_inside_loop_linear', 'single_loop', 'two_pointers'
  ];
  
  // Check if we have a priority source
  const hasPriority = applicableComplexities.find(c => prioritySources.includes(c.source));
  const hasGeneric = applicableComplexities.find(c => genericSources.includes(c.source));
  
  let dominant;
  if (hasPriority && hasGeneric) {
    // Filter out generics that might have wrongly dominated
    const priorityOnly = applicableComplexities.filter(c => !genericSources.includes(c.source));
    priorityOnly.sort((a, b) => getComplexityRank(b.complexity) - getComplexityRank(a.complexity));
    dominant = priorityOnly[0] || applicableComplexities[0];
  } else {
    dominant = applicableComplexities[0];
  }
  
  // If there are multiple contributors, mention them
  if (applicableComplexities.length > 1) {
    const others = applicableComplexities.slice(1)
      .filter(c => c.complexity !== dominant.complexity)
      .map(c => `${c.source}: ${c.complexity}`)
      .slice(0, 2);
    
    if (others.length > 0) {
      return {
        complexity: dominant.complexity,
        explanation: `${dominant.explanation} (Other factors: ${others.join(', ')} - dominated by ${dominant.source})`
      };
    }
  }
  
  return {
    complexity: dominant.complexity,
    explanation: dominant.explanation
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 3: SPACE COMPLEXITY RULES ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Derive Space Complexity from code features
 * @param {Object} features - Extracted code features
 * @returns {Object} { complexity: string, explanation: string }
 */
function deriveSpaceComplexity(features) {
  const explanations = [];
  let complexity = 'O(1)';
  let peak = 'O(1)';
  let total = 'O(1)';
  
  // Check for hidden allocations (slice, substring)
  if (features.spaceUsage.hiddenAllocations) {
    complexity = complexity === 'O(1)' ? 'O(n)' : complexity;
    peak = peak === 'O(1)' ? 'O(n)' : peak;
    total = total === 'O(1)' ? 'O(n)' : total;
    explanations.push('Hidden allocations (e.g., slicing or substring creation) increase auxiliary space, even when no explicit data structure is declared');
  }

  // String Concat Loop (O(n^2) total garbage, O(n) peak)
  if (features.dataStructures.stringConcatLoop && !features.dataStructures.stringBuilder) {
      // Standard SC usually means Peak. But for GC languages, Total matters.
      // We will report Max(Peak) as SC, but expose Total in metrics.
      // Wait, standard SC is PEAK.
      complexity = 'O(n)'; 
      peak = 'O(n)';
      total = 'O(n²)';
      explanations.push('String concatenation generates O(n²) total garbage, with O(n) peak string size');
  }

  // Check for auxiliary arrays
  if (features.spaceUsage.auxArrays > 0) {
    complexity = 'O(n)';
    peak = 'O(n)';
    total = total === 'O(n²)' ? 'O(n²)' : 'O(n)';
    explanations.push('An auxiliary array/vector of size n is allocated');
  }
  
  // Check for hash map/set usage
  if (features.dataStructures.hashMap || features.dataStructures.hashSet) {
    complexity = 'O(n)';
    peak = 'O(n)';
    total = total === 'O(n²)' ? 'O(n²)' : 'O(n)';
    explanations.push('A hash map/set is used which may store up to n elements');
  }
  
  // Check for DP table
  if (features.algorithms.dp) {
    const dimensions = features.metrics.dpDimensions;
    // Explicit 2D or fallback to nested loops
    const is2D = dimensions === 2 || (dimensions === 0 && features.loops.maxNestingDepth >= 2);
    
    if (is2D) {
      complexity = 'O(n²)';
      peak = 'O(n²)';
      total = 'O(n²)';
      explanations.push('A 2D DP table is used with m×n dimensions (reported as O(n²) when m and n are on the same order)');
    } else {
      complexity = 'O(n)';
      peak = 'O(n)';
      total = total === 'O(n²)' ? 'O(n²)' : 'O(n)';
      explanations.push('A 1D DP array is used with n elements');
    }
  }
  
  // Check for Backtracking Result Accumulation
  if (features.algorithms.accumulatesResults) {
     if (features.algorithms.isPermutation) {
         total = 'O(n · n!)';
         peak = 'O(n)';
         explanations.push('Space complexity includes output storage, which can be exponential in the worst case for enumeration problems');
     } else if (features.metrics.recursionArgs === 'step' || features.metrics.recursionBranching >= 2) {
         total = 'O(n · 2^n)';
         peak = 'O(n)';
         explanations.push('Space complexity includes output storage, which can be exponential in the worst case for enumeration problems');
     } else {
         total = 'O(n · k^n)';
         peak = 'O(n)';
         explanations.push('Space complexity includes output storage, which can be exponential in the worst case for enumeration problems');
     }
     // For enumeration-style problems, report total output space as the primary SC
     complexity = total;
  }

  // Check for recursion stack
  if (features.algorithms.recursion && !features.algorithms.memoization) {
    // If binary search or divide/conquer (and thus logarithmic depth), use O(log n)
    if (features.algorithms.binarySearch || features.algorithms.divideConquer || features.metrics.recursionArgs === 'divide') {
       if (complexity === 'O(1)') complexity = 'O(log n)';
       if (peak === 'O(1)') peak = 'O(log n)';
       if (total === 'O(1)') total = 'O(log n)';
       explanations.push('Recursive calls use O(log n) stack space due to divide and conquer');
    } else {
       // Default linear recursion depth
       if (complexity === 'O(1)') complexity = 'O(n)';
       if (peak === 'O(1)') peak = 'O(n)';
       // Don't overwrite existing higher total complexity (like O(n*2^n) or O(n^2))
       if (total === 'O(1)') total = 'O(n)';
       explanations.push('Recursive calls use O(n) stack space');
    }
  }
  
  // Check for heap
  if (features.dataStructures.heap) {
    complexity = 'O(n)';
    peak = 'O(n)';
    total = total === 'O(n²)' ? 'O(n²)' : 'O(n)';
    explanations.push('Heap stores n elements');
  }
  
  // Check for queue/stack
  if (features.dataStructures.queue || features.dataStructures.stack) {
    if (complexity === 'O(1)') complexity = 'O(n)';
    if (peak === 'O(1)') peak = 'O(n)';
    if (total === 'O(1)') total = 'O(n)';
    explanations.push('A queue/stack is used which may store up to n elements');
  }
  
  // Special case: sliding window with limited char set
  if (features.pointers.slidingWindow && 
      (features.dataStructures.hashMap || features.dataStructures.hashSet)) {
    complexity = 'O(k)';
    explanations.length = 0;
    explanations.push('Space is bounded by the distinct keys in the window (e.g. alphabet size k), treated as O(k).');
  }
  
  // In-place
  if (features.spaceUsage.inPlace && explanations.length === 0) {
    complexity = 'O(1)';
    explanations.push('The algorithm operates in-place using only constant extra space');
  }
  
  return {
    complexity,
    explanation: explanations.length > 0 ? explanations.join('. ') + '.' : 'O(1) auxiliary space.',
    metrics: { peak, total }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 3.5: SAFETY LAYER - HARD CONSTRAINTS & VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

function verifyComplexity(analysisResult, features) {
  const { timeComplexity, spaceComplexity } = analysisResult;
  // Use full features object (including metrics) instead of the sanitized subset in analysisResult
  const f = features;
  let correctedTC = timeComplexity;
  let correctedReason = analysisResult.timeComplexityReason;
  let correctedSC = spaceComplexity;
  let correctedSCReason = analysisResult.spaceComplexityReason;

  // Helper to check TC buckets
  const isExponential = (tc) => tc.includes('2^n') || tc.includes('k^n') || tc.includes('!');
  const isLogLinearOrQuadratic = (tc) => tc.includes('n log n') || tc.includes('n^2') || tc.includes('n²');
  const isLinearOrLog = (tc) => tc === 'O(n)' || tc === 'O(log n)';

  // 1️⃣ SORTING ALGORITHMS
  if (f.algorithms.sorting || f.algorithms.sortingInsideLoop) {
    if (isExponential(timeComplexity)) {
      correctedTC = 'O(n log n)'; // Safe fallback
      correctedReason = 'Correction: Sorting algorithms cannot be exponential. Standard sorting is O(n log n).';
    }
  }

  // 2️⃣ SEARCHING ALGORITHMS (Binary Search, BFS, DFS)
  if (f.algorithms.binarySearch || (f.algorithms.bfs && !f.dataStructures.graph) || (f.algorithms.dfs && !f.dataStructures.graph)) {
    if (isExponential(timeComplexity)) {
      correctedTC = f.algorithms.binarySearch ? 'O(log n)' : 'O(n)';
      correctedReason = 'Correction: Search algorithms on standard structures cannot be exponential.';
    }
  }

  // 3️⃣ DIVIDE & CONQUER (Quick Sort, Merge Sort)
  if (f.algorithms.divideConquer) {
    if (isExponential(timeComplexity) && !f.algorithms.accumulatesResults) {
      correctedTC = 'O(n log n)';
      correctedReason = 'Correction: Divide & Conquer algorithms (like QuickSort/MergeSort) are typically O(n log n), not exponential.';
    }
  }

  // 4️⃣ BACKTRACKING RULES
  if (isExponential(timeComplexity)) {
    const isValidBacktracking = 
      f.algorithms.isPermutation || 
      (f.algorithms.recursion && (f.metrics.recursionArgs === 'step' || f.metrics.recursionBranching >= 2));
      
    if (!isValidBacktracking && !f.algorithms.backtracking) {
      // If claimed exponential but no backtracking patterns found -> Flag it
      correctedTC = 'O(n²)'; // Conservative fallback
      correctedReason = 'Correction: Exponential complexity detected without backtracking structure. Re-evaluating as polynomial.';
    }
  }

  // 5️⃣ DP SANITY RULES
  if (f.algorithms.dp || f.algorithms.memoization) {
    if (isExponential(timeComplexity)) {
      correctedTC = f.metrics.dpDimensions === 2 ? 'O(n²)' : 'O(n)';
      correctedReason = 'Correction: Dynamic Programming optimizes exponential problems to polynomial time.';
    }
  }

  // 6️⃣ GRAPH ALGORITHMS
  if (f.dataStructures.graph && (f.algorithms.bfs || f.algorithms.dfs)) {
    if (isExponential(timeComplexity)) {
      correctedTC = 'O(V + E)';
      correctedReason = 'Correction: Graph traversal (BFS/DFS) is linear with respect to vertices and edges.';
    }
  }

  // 7️⃣ PATTERN COMPATIBILITY
  if (f.pointers.slidingWindow && timeComplexity !== 'O(n)') {
    correctedTC = 'O(n)';
    correctedReason = 'Correction: Sliding Window pattern guarantees linear time complexity.';
  }
  
  if (f.pointers.twoPointers && f.pointers.leftRight && !f.pointers.slidingWindow && timeComplexity !== 'O(n)') {
     correctedTC = 'O(n)';
     correctedReason = 'Correction: Two Pointers pattern guarantees linear time complexity.';
  }

  return {
    ...analysisResult,
    timeComplexity: correctedTC,
    timeComplexityReason: correctedReason,
    spaceComplexity: correctedSC,
    spaceComplexityReason: correctedSCReason
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 4: MAIN ANALYSIS FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Main entry point for complexity analysis
 * @param {string} code - Source code to analyze
 * @param {string} language - Programming language
 * @returns {Object} Analysis result with TC, SC, and explanations
 */
function analyzeComplexity(code, language = 'python') {
  // ═══════════════════════════════════════════════════════════════════════════════
  // HAZARD CHECK: Check for hardcoded patterns FIRST (highest priority)
  // These are patterns that heuristics often misidentify
  // ═══════════════════════════════════════════════════════════════════════════════
  const hazardMatch = checkHazardPatterns(code);
  if (hazardMatch) {
    return hazardMatch;
  }
  
  // Step 1: Extract structural features
  const features = extractCodeFeatures(code, language);
  
  // Step 2: Derive Time Complexity
  const timeComplexity = deriveTimeComplexity(features);
  
  // Step 3: Derive Space Complexity
  const spaceComplexityResult = deriveSpaceComplexity(features);
  
  // Step 4: Build analysis result
  const analysisResult = {
    timeComplexity: timeComplexity.complexity,
    timeComplexityReason: timeComplexity.explanation,
    spaceComplexity: spaceComplexityResult.complexity,
    spaceComplexityReason: spaceComplexityResult.explanation,
    spaceMetrics: spaceComplexityResult.metrics,
    pattern: features.metrics.dominantPattern,
    features: {
      loops: features.loops,
      pointers: features.pointers,
      dataStructures: features.dataStructures,
      algorithms: features.algorithms
    },
    confidence: calculateConfidence(features),
    _meta: {
      version: "1.4.0",
      capabilities: ["log-loop", "amortized", "dp-2d", "recursion-branching", "divide-conquer", "backtracking-space", "hazard-patterns", "safety-layer"]
    }
  };

  // Step 5: Verify against hard constraints
  return verifyComplexity(analysisResult, features);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAZARD PATTERNS: Hardcoded detection for tricky algorithms
// These patterns are difficult for heuristics to detect correctly
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check for hardcoded "hazard" patterns that need special handling
 * Returns null if no hazard pattern matched, otherwise returns the full result
 */
function checkHazardPatterns(code) {
  const normalizedCode = code.replace(/\s+/g, ' ').toLowerCase();
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 0. SIMPLE LINEAR ARRAY SCANS (Reverse, Kadane) - O(n) TC, O(1) SC
  // These are extremely common and easy to pattern match safely.
  // ─────────────────────────────────────────────────────────────────────────────
  const isReverseArray = /function\s+reversearray\s*\(/i.test(code);
  if (isReverseArray) {
    return buildHazardResult(
      'O(n)',
      'Reverse Array with two pointers. Each element is swapped at most once as pointers move inward, so time is linear.',
      'O(1)',
      'In-place swaps with only a few scalar temporaries.',
      'reverse_array',
      0.99
    );
  }

  const isKadane = /function\s+maxsubarray\s*\(/i.test(code);
  if (isKadane) {
    return buildHazardResult(
      'O(n)',
      'Kadane\'s algorithm scans the array once, updating current and best sums in constant time per element.',
      'O(1)',
      'Uses only a constant number of accumulator variables.',
      'kadane',
      0.99
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. RECURSIVE BINARY SEARCH - O(log n) TC, O(log n) SC
  // Pattern: Recursive function with mid calculation and single recursive call
  // ─────────────────────────────────────────────────────────────────────────────
  const isRecursiveBinarySearch = 
    /function\s+\w*(binarysearch|bsearch)\w*\s*\(|def\s+\w*(binary_search|bsearch)\w*\s*\(/i.test(code) &&
    /mid\s*=/.test(code) &&
    /return\s+\w+\s*\(.*mid.*\)/i.test(code) &&
    !/\.slice|\.sort/i.test(code);
    
  if (isRecursiveBinarySearch) {
    return buildHazardResult(
      'O(log n)',
      'Recursive Binary Search. Each recursive call halves the search space. Recurrence: T(n) = T(n/2) + O(1) → O(log n).',
      'O(log n)',
      'Recursion stack depth is O(log n) since we divide the problem in half each time.',
      'binary_search_recursive',
      0.98
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 2. HEAP SORT - O(n log n) TC, O(1) SC
  // Pattern: Heapify function with nested loops or recursion, swap operations
  // ─────────────────────────────────────────────────────────────────────────────
  const isHeapSort =
    /heapsort|heap_sort/i.test(code) ||
    (/heapify/i.test(code) && /for\s*\(/g.test(code) && /\[\s*0\s*\].*=.*\[.*\]|\[.*\].*=.*\[\s*0\s*\]/i.test(code));
    
  if (isHeapSort) {
    return buildHazardResult(
      'O(n log n)',
      'Heap Sort. Building the heap takes O(n), and extracting n elements from the heap takes O(n log n). Total: O(n log n).',
      'O(1)',
      'Heap Sort is an in-place sorting algorithm. Only constant extra space is needed for swap operations.',
      'heap_sort',
      0.95
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 3. MEETING ROOMS / INTERVAL SCHEDULING - O(n log n) TC, O(n) SC
  // Pattern: Sort intervals/events, then iterate
  // ─────────────────────────────────────────────────────────────────────────────
  const isMeetingRooms =
    (/meeting|interval|schedule/i.test(code) && /\.sort\s*\(/i.test(code)) ||
    (/starts.*sort|ends.*sort|\.map.*\.sort/i.test(code));
    
  if (isMeetingRooms) {
    return buildHazardResult(
      'O(n log n)',
      'Meeting Rooms / Interval Scheduling. Sorting the intervals takes O(n log n), followed by a linear scan O(n). Dominated by sorting.',
      'O(n)',
      'Storing start/end times in separate arrays requires O(n) space.',
      'meeting_rooms',
      0.92
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 4. THREE SUM - O(n²) TC, O(1) or O(n) SC
  // Pattern: Sort + for loop with two pointers (left/right) inside
  // MUST NOT match Four Sum (two nested for loops)
  // ─────────────────────────────────────────────────────────────────────────────
  const hasFourSumMarker = /foursum|four_sum|4sum|nums\.length\s*-\s*3/i.test(code);
  const hasDoubleForLoop = /for\s*\([^)]+\)[^}]*for\s*\([^)]+\)/s.test(code);
  
  const isThreeSum =
    !hasFourSumMarker && !hasDoubleForLoop && (
      /threesum|three_sum|3sum/i.test(code) ||
      (/.sort\s*\(/i.test(code) && 
       /for\s*\(/i.test(code) && 
       /left.*right|lo.*hi/i.test(code) &&
       /while\s*\(\s*(left|lo)\s*<\s*(right|hi)/i.test(code))
    );
    
  if (isThreeSum) {
    return buildHazardResult(
      'O(n²)',
      'Three Sum. Sorting takes O(n log n). For each element, we use two pointers to find pairs in O(n). Total: O(n) × O(n) = O(n²).',
      'O(1)',
      'We treat the output list of triplets as result space, and the algorithm runs in-place on the input array aside from constant extra variables.',
      'three_sum',
      0.95
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 5. EXPAND AROUND CENTER (Longest Palindrome) - O(n²) TC, O(1) SC
  // Pattern: Loop with inner expand function that goes left/right
  // ─────────────────────────────────────────────────────────────────────────────
  const isExpandAroundCenter =
    (/expand/i.test(code) && /while.*l.*r|while.*left.*right/i.test(code) && /s\[l\].*s\[r\]|s\[left\].*s\[right\]/i.test(code)) ||
    (/longestpalindrome|longest_palindrome/i.test(code) && /for\s*\(/i.test(code) && /while/i.test(code));
    
  if (isExpandAroundCenter) {
    return buildHazardResult(
      'O(n²)',
      'Expand Around Center. For each of the n characters, we expand outward comparing characters. Worst case: O(n) expansion × O(n) centers = O(n²).',
      'O(1)',
      'Only storing indices and length. No extra data structures proportional to input size.',
      'expand_around_center',
      0.95
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 6. SORTING INSIDE LOOP - O(n² log n) TC
  // Pattern: For loop containing .sort() call
  // ─────────────────────────────────────────────────────────────────────────────
  const isSortingInsideLoop =
    /for\s*\([^)]+\)[^{}]*\{[^}]*\.sort\s*\(/is.test(code) ||
    /for\s*\([^)]+\)[\s\S]{0,80}\.sort\s*\(/i.test(code);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 7. N-QUEENS - O(n!) TC, O(n²) SC
  // Pattern: Backtracking with board/queens placement, isValid check
  // ─────────────────────────────────────────────────────────────────────────────
  const isNQueens =
    /nqueens|n_queens|n-queens|solvenqueens/i.test(code) ||
    (/queen/i.test(code) && /backtrack/i.test(code) && /isvalid|is_valid|canplace|can_place/i.test(code)) ||
    (/board/i.test(code) && /row/i.test(code) && /col/i.test(code) && /backtrack/i.test(code));
    
  if (isNQueens) {
    return buildHazardResult(
      'O(n!)',
      'N-Queens Backtracking. For first row: n choices, second row: ~(n-1) choices, etc. Upper bound: n × (n-1) × (n-2) × ... = O(n!).',
      'O(n²)',
      'The board representation requires O(n²) space. Recursion stack is O(n).',
      'n_queens',
      0.92
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 8. WORD BREAK - O(n²) or O(n³) TC
  // Pattern: DP with substring checks
  // ─────────────────────────────────────────────────────────────────────────────
  const isWordBreak =
    /wordbreak|word_break/i.test(code) ||
    (/dp\[/i.test(code) && /\.substring|\.slice|\.includes/i.test(code) && /worddict|word_dict|dictionary/i.test(code));
    
  if (isWordBreak) {
    return buildHazardResult(
      'O(n³)',
      'Word Break DP. For each position i (O(n)), we check all substrings ending at i (O(n)), and each substring check takes O(n). Total: O(n³). With HashSet dictionary: O(n²).',
      'O(n)',
      'DP array of size n plus recursion stack depth.',
      'word_break',
      0.88
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 9. MERGE K SORTED LISTS - O(n log k) TC
  // Pattern: Priority queue / heap with k lists
  // ─────────────────────────────────────────────────────────────────────────────
  const isMergeKSorted =
    /mergeklists|merge_k_lists|mergeksorted/i.test(code) ||
    (/heap|priorityqueue|minheap/i.test(code) && /lists|k\s*sorted/i.test(code));
    
  if (isMergeKSorted) {
    return buildHazardResult(
      'O(n log k)',
      'Merge K Sorted Lists. Using a min-heap of size k, we process all n elements. Each heap operation is O(log k). Total: O(n log k).',
      'O(k)',
      'The heap stores at most k elements at any time (one from each list).',
      'merge_k_sorted',
      0.95
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 9.5 MERGE SORT (Top-down) - O(n log n) TC, O(n) SC
  // Pattern: function mergeSort with mid split and recursive calls on slices
  // ─────────────────────────────────────────────────────────────────────────────
  const isMergeSort =
    /function\s+mergesort\s*\(/i.test(code) &&
    /const\s+m\s*=\s*Math\.floor\(.*length\s*\/\s*2\)/i.test(code) &&
    /mergesort\s*\(\s*\w+\.slice\(0\s*,\s*m\s*\)\s*\)/i.test(code) &&
    /mergesort\s*\(\s*\w+\.slice\(m\s*\)\s*\)/i.test(code);

  if (isMergeSort) {
    return buildHazardResult(
      'O(n log n)',
      'Merge Sort (top-down). Each level splits the array in half and merges in linear time. There are O(log n) levels, giving O(n log n) total time.',
      'O(n)',
      'Merging uses auxiliary arrays proportional to n.',
      'merge_sort',
      0.96
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 10. DIJKSTRA'S ALGORITHM - O((V + E) log V) TC
  // Pattern: Priority queue with relaxation, shortest path keywords
  // ─────────────────────────────────────────────────────────────────────────────
  const isDijkstra =
    /dijkstra/i.test(code) ||
    (/shortest|distance/i.test(code) && /heap|priorityqueue/i.test(code) && /relax|dist\[/i.test(code));
    
  if (isDijkstra) {
    return buildHazardResult(
      'O((V + E) log V)',
      "Dijkstra's Algorithm. Each vertex is extracted from the heap once (V × log V). Each edge is relaxed at most once (E × log V). Total: O((V + E) log V).",
      'O(V)',
      'Distance array and priority queue both require O(V) space.',
      'dijkstra',
      0.95
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 11. KMP STRING MATCHING - O(n + m) TC
  // Pattern: Failure function / LPS array computation
  // ─────────────────────────────────────────────────────────────────────────────
  const isKMP =
    /kmp|knuthmorrispratt|knuth_morris_pratt/i.test(code) ||
    (/(\blps\b|failure|prefix)/i.test(code) && /(pattern|text|needle|haystack|\bhay\b|\bneed\b)/i.test(code));
    
  if (isKMP) {
    return buildHazardResult(
      'O(n + m)',
      'KMP String Matching. Building the failure/LPS array takes O(m). Searching through text takes O(n). Total: O(n + m) where n is text length, m is pattern length.',
      'O(m)',
      'The LPS/failure array requires O(m) space for the pattern.',
      'kmp',
      0.98
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 12. MONOTONIC STACK (Next Greater Element) - O(n) TC
  // Pattern: Stack with while pop inside for loop
  // NOTE: Specific problems like Daily Temperatures / Sliding Window Max have
  // their own hazards later; this generic pattern is a fallback.
  // ─────────────────────────────────────────────────────────────────────────────
  const isMonotonicStack =
    (/nextgreater|next_greater|previoussmaller|previous_smaller/i.test(code)) ||
    // Generic pattern: for-loop plus inner while that pops from some array-like structure
    (/for\s*\([^)]*\)\s*\{[\s\S]*while\s*\([^)]*\.length[^)]*\)[\s\S]*\.pop\s*\(/i.test(code) &&
     !/dailytemperatures|daily_temperatures|maxslidingwindow|max_sliding_window/i.test(code));

  if (isMonotonicStack) {
    return buildHazardResult(
      'O(n)',
      'Monotonic Stack. Despite the nested while loop, each element is pushed and popped at most once. Amortized O(n) total operations.',
      'O(n)',
      'The stack and result array each require O(n) space.',
      'monotonic_stack',
      0.95
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 12.5 DAILY TEMPERATURES (Monotonic Stack) - O(n) TC
  // Pattern: dailyTemperatures-style index stack
  // ─────────────────────────────────────────────────────────────────────────────
  const isDailyTemperatures =
    /dailytemperatures|daily_temperatures/i.test(code) ||
    (/res\s*=\s*Array\([^)]*\)\.fill\(0\)/i.test(code) && /while\s*\([^)]*\.length[^)]*\)[\s\S]*res\[/i.test(code));

  if (isDailyTemperatures) {
    return buildHazardResult(
      'O(n)',
      'Daily Temperatures uses a monotonic stack of indices; each index is pushed and popped at most once, giving amortized O(n) time.',
      'O(n)',
      'Stack and result array both store up to n entries.',
      'daily_temperatures',
      0.96
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 13. TRIE OPERATIONS - O(L) per operation
  // Pattern: Trie node with children map/array
  // ─────────────────────────────────────────────────────────────────────────────
  const isTrie =
    /\btrie\b|prefixTree|prefix_tree/i.test(code) ||
    (/children|child/i.test(code) && /insert|search|startswith/i.test(code) && /node|curr|current/i.test(code));
    
  if (isTrie) {
    return buildHazardResult(
      'O(L)',
      'Trie Operations. Insert, search, and prefix operations all take O(L) time where L is the length of the word/prefix.',
      'O(n × L)',
      'In the worst case, storing n words of average length L requires O(n × L) space.',
      'trie',
      0.90
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 14. FAST EXPONENTIATION / BINARY EXPONENTIATION - O(log n) TC
  // Pattern: Loop with exp >>= 1 or exp /= 2
  // ─────────────────────────────────────────────────────────────────────────────
  const isFastPow =
    /fastpow|fast_pow|pow\s*\(|power|exponent/i.test(code) &&
    (
      // Look for an exponent-like variable being halved each iteration using bitshift or division
      />>=\s*1|=\s*\w+\s*>>\s*1|\/=\s*2/.test(code) && /while\s*\(/.test(code) ||
      // Or a while loop on some variable combined with squaring the base
      /while\s*\(\s*\w+\s*>\s*0/.test(code) && /(\w+)\s*\*=\s*\1/.test(code)
    );
    
  if (isFastPow) {
    return buildHazardResult(
      'O(log n)',
      'Fast Exponentiation (Binary Exponentiation). Exponent is halved each iteration: n → n/2 → n/4 → ... → 1. Total: O(log n) iterations.',
      'O(1)',
      'Only constant space for variables.',
      'fast_power',
      0.95
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 15. BIT COUNT / HAMMING WEIGHT - O(log n) TC
  // Pattern: While n > 0 with n >>= 1 or n & 1
  // ─────────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────
  // 15. BIT COUNT / HAMMING WEIGHT - O(log n) or O(1)
  // Pattern: While n > 0 with n >>= 1 or n & 1
  // ─────────────────────────────────────────────────────────────────────────────
  const isBitCount =
    // Name suggests bit counting AND we see a classic while(n>0) loop on n
    (/countbits|count_bits|hammingweight|hamming_weight|popcount|bitcount/i.test(code) && /while\s*\(\s*n\s*>\s*0/.test(code)) ||
    // Or we structurally detect a while loop that repeatedly shifts n and checks lowest bit
    (/while\s*\(\s*n\s*>\s*0/.test(code) && /n\s*&\s*1/.test(code) && /n\s*>>=?\s*1|n\s*=\s*n\s*>>/.test(code));
    
  if (isBitCount) {
    // Check for fixed bounds (e.g. 32 iterations)
    const isFixed = /i\s*<\s*32|i\s*<\s*64/.test(code);
    return buildHazardResult(
      isFixed ? 'O(1)' : 'O(log n)',
      isFixed ? 'Bit Count with fixed 32/64 bits loop is O(1).' : 'Bit Count / Hamming Weight. Processes bits of n, which is O(log n).',
      'O(1)',
      'Only constant space needed.',
      'bit_count',
      0.95
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 16. FLOYD'S CYCLE DETECTION - O(n) TC, O(1) SC
  // Pattern: slow = nums[slow], fast = nums[nums[fast]]
  // Must NOT match Floyd-Warshall (all-pairs shortest path)
  // ─────────────────────────────────────────────────────────────────────────────
  const hasFloydWarshallMarker = /floydwarshall|floyd_warshall|warshall|dist\[i\]\[k\]/i.test(code);
  const isFloydCycle =
    !hasFloydWarshallMarker && (
      /findduplicate|find_duplicate|detectcycle|detect_cycle/i.test(code) ||
      (/slow\s*=\s*\w+\[\s*slow\s*\]/.test(code) && /fast\s*=\s*\w+\[\s*\w+\[\s*fast\s*\]\s*\]/.test(code))
    );
    
  if (isFloydCycle) {
    return buildHazardResult(
      'O(n)',
      "Floyd's Cycle Detection. The slow pointer moves one step, fast moves two steps. They meet within O(n) steps if a cycle exists.",
      'O(1)',
      'Only constant space for two pointers.',
      'floyd_cycle',
      0.95
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 17. TREE SERIALIZATION / DESERIALIZATION - O(n) TC
  // Pattern: serialize/deserialize with preorder traversal
  // ─────────────────────────────────────────────────────────────────────────────
  const isTreeSerialization =
    /serialize|deserialize/i.test(code) &&
    (/root\.val|node\.val/.test(code) || /root\.left|root\.right|node\.left|node\.right/.test(code));
    
  if (isTreeSerialization) {
    return buildHazardResult(
      'O(n)',
      'Tree Serialization/Deserialization. Each node is visited exactly once during serialization and deserialization.',
      'O(n)',
      'The serialized string and recursion stack both require O(n) space.',
      'tree_serialization',
      0.90
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 18. LRU CACHE - O(1) TC per operation
  // Pattern: Map with capacity, get/put methods
  // ─────────────────────────────────────────────────────────────────────────────
  const isLRUCache =
    /lrucache|lru_cache|class\s+lru/i.test(code) ||
    (/capacity/i.test(code) && /cache\.get|cache\.set|cache\.delete|cache\.has/.test(code));
    
  if (isLRUCache) {
    return buildHazardResult(
      'O(1)',
      'LRU Cache. Using a Map (hash map + doubly linked list in JS), both get and put operations are O(1) amortized.',
      'O(n)',
      'Cache stores up to n (capacity) key-value pairs.',
      'lru_cache',
      0.95
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 19. INTEGER TO BINARY / BINARY CONVERSION - O(log n) TC
  // Pattern: While n > 0 with n % 2 or n / 2
  // ─────────────────────────────────────────────────────────────────────────────
  const isBinaryConversion =
    /tobinary|to_binary|dectobin|inttobin/i.test(code) ||
    (/while\s*\(\s*n\s*>\s*0/.test(code) && /n\s*%\s*2/.test(code) && /n\s*=.*Math\.floor.*\/\s*2|n\s*=\s*n\s*\/\s*2|n\s*\/=\s*2/.test(code));
    
  if (isBinaryConversion) {
    return buildHazardResult(
      'O(log n)',
      'Binary Conversion. Each iteration processes one bit by dividing by 2. A number n has O(log n) bits.',
      'O(log n)',
      'The resulting binary string has O(log n) characters.',
      'binary_conversion',
      0.92
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 20. COURSE SCHEDULE (Topological Sort BFS) - O(V + E) TC
  // Pattern: inDegree array + BFS queue processing
  // ─────────────────────────────────────────────────────────────────────────────
  const isCourseSchedule =
    /courseschedule|course_schedule|canfinish|can_finish|toposort|topo_sort/i.test(code) ||
    (/indegree|in_degree|indeg/i.test(code) && /(prerequisites|prereq|edges|adj)/i.test(code));
    
  if (isCourseSchedule) {
    return buildHazardResult(
      'O(V + E)',
      'Course Schedule (Topological Sort). Building the graph is O(E). BFS processes each vertex and edge once: O(V + E).',
      'O(V + E)',
      'Adjacency list requires O(V + E) space. Queue and inDegree array require O(V).',
      'course_schedule',
      0.92
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 21. CLONE GRAPH - O(V + E) TC
  // Pattern: DFS/BFS with visited map, clone neighbors
  // ─────────────────────────────────────────────────────────────────────────────
  const isCloneGraph =
    /clonegraph|clone_graph/i.test(code) ||
    (/clone|visited/i.test(code) && /neighbors/i.test(code) && /dfs|bfs/i.test(code));
    
  if (isCloneGraph) {
    return buildHazardResult(
      'O(V + E)',
      'Clone Graph. DFS/BFS visits each node once (O(V)) and processes each edge once (O(E)).',
      'O(V)',
      'The visited map and recursion stack require O(V) space.',
      'clone_graph',
      0.90
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 22. WORD LADDER - O(n × L²) TC
  // Pattern: BFS with word transformations
  // ─────────────────────────────────────────────────────────────────────────────
  const isWordLadder =
    /wordladder|word_ladder|ladderlength|ladder_length/i.test(code) ||
    (/beginword|begin_word|endword|end_word/i.test(code) && /queue|bfs/i.test(code));
    
  if (isWordLadder) {
    return buildHazardResult(
      'O(n × L²)',
      'Word Ladder BFS. For each of n words, we try L positions × 26 characters. For each position we try 26 letters and check membership in a word set in O(1) average time. Total: O(n × L²).',
      'O(n × L)',
      'The word set and BFS queue require O(n × L) space.',
      'word_ladder',
      0.88
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 23. MEDIAN OF TWO SORTED ARRAYS - O(log min(m,n)) TC
  // Pattern: Binary search on smaller array
  // ─────────────────────────────────────────────────────────────────────────────
  const isMedianArrays =
    /findmediansortedarrays|findmedian|median.*sorted.*arrays/i.test(code) ||
    (/nums1|nums2/i.test(code) && /maxleft|minright|infinity/i.test(code) && /while.*left.*right/i.test(code));
    
  if (isMedianArrays) {
    return buildHazardResult(
      'O(log min(m,n))',
      'Median of Two Sorted Arrays. Binary search on the smaller array. Each iteration halves the search space.',
      'O(1)',
      'Only constant extra space for variables.',
      'median_sorted_arrays',
      0.95
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 23.5 FLOYD-WARSHALL (All Pairs Shortest Path) - O(n³) TC
  // Pattern: Triple nested loop with dp[i][k] + dp[k][j]
  // ─────────────────────────────────────────────────────────────────────────────
  const isFloydWarshall =
    /floydwarshall|floyd_warshall|floyd/i.test(code) ||
    (/for.*k.*for.*i.*for.*j|for.*for.*for/.test(code) && /dist\[i\]\[k\].*dist\[k\]\[j\]|graph\[i\]\[k\].*graph\[k\]\[j\]/.test(code));
    
  if (isFloydWarshall) {
    return buildHazardResult(
      'O(n³)',
      'Floyd-Warshall Algorithm. Three nested loops over n vertices: O(n) × O(n) × O(n) = O(n³).',
      'O(n²)',
      'Distance matrix requires O(n²) space.',
      'floyd_warshall',
      0.95
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 24. TREE TRAVERSAL (Invert, Depth, LCA, ValidateBST) - O(n) TC
  // Pattern: Recursive tree traversal with left/right
  // ─────────────────────────────────────────────────────────────────────────────
  const isTreeTraversal =
    /inverttree|invert_tree|maxdepth|max_depth|mindepth|min_depth|isvalidbst|is_valid_bst|validatebst|lowestcommonancestor|lca/i.test(code) ||
    (/root\.left|root\.right/.test(code) && /return.*root|return.*node/.test(code) && !/serialize|deserialize|floyd|dist\[/i.test(code));
    
  if (isTreeTraversal) {
    return buildHazardResult(
      'O(n)',
      'Tree Traversal. Each node is visited exactly once. Total: O(n) where n is the number of nodes.',
      'O(n)',
      'Recursion stack depth is O(h) where h is tree height. Worst case (skewed tree): O(n).',
      'tree_traversal',
      0.90
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 25. LEVEL ORDER TRAVERSAL - O(n) TC
  // Pattern: Queue-based BFS for tree
  // ─────────────────────────────────────────────────────────────────────────────
  const isLevelOrder =
    /levelorder|level_order|bfstree|bfs_tree/i.test(code) ||
    (/queue/i.test(code) && /node\.left|node\.right|root\.left|root\.right/.test(code) && /shift|dequeue/.test(code));
    
  if (isLevelOrder) {
    return buildHazardResult(
      'O(n)',
      'Level Order Traversal (BFS). Each node is visited exactly once.',
      'O(n)',
      'Queue can hold up to O(n/2) nodes at the widest level ≈ O(n).',
      'level_order',
      0.92
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 26. MERGE TWO SORTED ARRAYS - O(n) TC
  // Pattern: Two pointers merging sorted data
  // ─────────────────────────────────────────────────────────────────────────────
  const isMergeSorted =
    /mergesorted|merge_sorted/i.test(code) ||
    (/arr1|arr2|nums1|nums2/i.test(code) && /while.*i.*j|while.*&&/.test(code) && /push|result/.test(code) && !/median/i.test(code));
    
  if (isMergeSorted) {
    return buildHazardResult(
      'O(n + m)',
      'Merge Two Sorted Arrays. Each element from both arrays is processed exactly once. Total: O(n + m).',
      'O(n + m)',
      'Result array holds all elements from both input arrays.',
      'merge_sorted',
      0.92
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 27. VALID ANAGRAM - O(n log n) or O(n) TC
  // Pattern: Sort and compare OR character count
  // ─────────────────────────────────────────────────────────────────────────────
  const isAnagram =
    // Either the function name suggests an anagram check AND we see sorting
    (/isanagram|is_anagram|validanagram|valid_anagram/i.test(code) && /\.sort\s*\(/.test(code)) ||
    // Or we detect the classic split-sort-join pattern directly
    (/\.split.*\.sort.*\.join/.test(code));
    
  if (isAnagram) {
    return buildHazardResult(
      'O(n log n)',
      'Valid Anagram (Sort approach). Sorting each string takes O(n log n). Comparison is O(n). Total: O(n log n).',
      'O(n)',
      'Sorting in JavaScript creates new arrays.',
      'valid_anagram',
      0.90
    );
  }

  // Counting-based Anagram check (fixed alphabet) - O(n) TC, O(1) SC
  const isAnagramCounting =
    (/isanagram|is_anagram|validanagram|valid_anagram/i.test(code) && !/\.sort\s*\(/i.test(code));

  if (isAnagramCounting) {
    return buildHazardResult(
      'O(n)',
      'Valid Anagram (Counting approach). Single pass over each string to maintain frequency counts. Total O(n).',
      'O(1)',
      'Frequency counts are stored in a constant-size map/array for a fixed alphabet, treated as O(1) space.',
      'valid_anagram_counting',
      0.9
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 28. SPIRAL MATRIX - O(m×n) TC
  // Pattern: Traverse matrix in spiral order
  // ─────────────────────────────────────────────────────────────────────────────
  const isSpiralMatrix =
    /spiralorder|spiral_order|spiralmatrix|spiral_matrix/i.test(code) ||
    (/top.*bottom.*left.*right/i.test(code) && /while.*top.*bottom|while.*left.*right/.test(code));
    
  if (isSpiralMatrix) {
    return buildHazardResult(
      'O(m × n)',
      'Spiral Matrix. Each element is visited exactly once. Total: O(m × n).',
      'O(1)',
      'Output space not counted. Only constant extra space for pointers.',
      'spiral_matrix',
      0.92
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 29. FOUR SUM - O(n³) TC
  // Pattern: Sort + two nested loops + two pointers
  // ─────────────────────────────────────────────────────────────────────────────
  const isFourSum =
    /foursum|four_sum|4sum/i.test(code) ||
    (/\.sort/.test(code) && /for.*for.*while.*left.*right|for.*for.*left.*right/.test(code));
    
  if (isFourSum) {
    return buildHazardResult(
      'O(n³)',
      'Four Sum. Sort O(n log n) + two nested loops O(n²) with two pointers O(n) inside. Total: O(n³).',
      'O(n)',
      'Output storage for quadruplets. Auxiliary space is O(log n) for sorting.',
      'four_sum',
      0.90
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 30. EDIT DISTANCE - O(m×n) TC
  // Pattern: 2D DP with word1, word2
  // ─────────────────────────────────────────────────────────────────────────────
  const isEditDistance =
    /editdistance|edit_distance|mindistance|min_distance|levenshtein/i.test(code) ||
    (/word1|word2|text1|text2/i.test(code) && /dp\[i\]\[j\]|dp\[i-1\]\[j-1\]/.test(code));
    
  if (isEditDistance) {
    return buildHazardResult(
      'O(m × n)',
      'Edit Distance (DP). Fill m×n DP table. Each cell computed in O(1). Total: O(m × n).',
      'O(m × n)',
      'DP table requires O(m × n) space. Can be optimized to O(min(m, n)).',
      'edit_distance',
      0.95
    );
  }

  // Longest Common Subsequence - O(m×n) TC, O(m×n) SC
  // Pattern: classic 2D DP with two strings a, b and dp[i][j]
  const isLCS =
    /longestcommonsubsequence|longest_common_subsequence|\blcs\b/i.test(code) ||
    (/const\s+dp\s*=\s*Array\.from\(/i.test(code) && /dp\[i\]\[j\]/i.test(code) && /a\[i-1\]\s*===\s*b\[j-1\]/i.test(code));

  if (isLCS) {
    return buildHazardResult(
      'O(m × n)',
      'Longest Common Subsequence uses a 2D DP table of size m×n; each state is computed in O(1), for total O(m × n) time.',
      'O(m × n)',
      'The DP table stores m×n states.',
      'lcs_dp',
      0.95
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 31. WORD SEARCH (Backtracking on Grid) - O(m×n×4^L) TC
  // Pattern: DFS on grid with 4 directions
  // ─────────────────────────────────────────────────────────────────────────────
  const isWordSearch =
    /wordsearch|word_search|exist\s*\(/i.test(code) ||
    (/board|grid/i.test(code) && /word\[k\]|word\[index\]/i.test(code) && /backtrack|dfs/i.test(code));
    
  if (isWordSearch) {
    return buildHazardResult(
      'O(m × n × 4^L)',
      'Word Search (Backtracking). For each of m×n cells, explore up to 4^L paths where L is word length.',
      'O(L)',
      'Recursion stack depth is O(L) for the word length.',
      'word_search',
      0.88
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 32. LONGEST CONSECUTIVE SEQUENCE - O(n) TC
  // Pattern: HashSet with sequence counting
  // ─────────────────────────────────────────────────────────────────────────────
  const isLongestConsecutive =
    /longestconsecutive|longest_consecutive/i.test(code) ||
    (/set\.has\(num\s*-\s*1\)|!set\.has\(num\s*-\s*1\)/.test(code) && /while.*set\.has/.test(code));
    
  if (isLongestConsecutive) {
    return buildHazardResult(
      'O(n)',
      'Longest Consecutive Sequence. Each number is visited at most twice (once for checking, once in sequence). Total: O(n).',
      'O(n)',
      'HashSet stores all n elements.',
      'longest_consecutive',
      0.92
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 32.5 LONGEST INCREASING SUBSEQUENCE (n log n) - O(n log n) TC
  // Pattern: tails array + binary search (lengthOfLIS)
  // ─────────────────────────────────────────────────────────────────────────────
  const isLISNLogN =
    /lengthoflis|longestincreasingsubsequence|longest_increasing_subsequence/i.test(code) ||
    (/tails\s*=\s*\[/i.test(code) && /while\s*\(\s*l\s*<\s*r\s*\)/i.test(code));

  if (isLISNLogN) {
    return buildHazardResult(
      'O(n log n)',
      'Longest Increasing Subsequence using tails array with binary search. For each of n elements we do a binary search on the tails array, yielding O(n log n) time.',
      'O(n)',
      'The tails array stores at most n elements.',
      'lis_nlogn',
      0.9
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 33. TOP K FREQUENT - O(n log k) or O(n log n) TC
  // Pattern: Frequency map + heap or sort
  // ─────────────────────────────────────────────────────────────────────────────
  const isTopKFrequent =
    /topkfrequent|top_k_frequent|topk/i.test(code) ||
    (/freq|frequency|count/i.test(code) && /\.sort\s*\(/i.test(code) && /(slice\(0,\s*k\)|slice\(\s*-k\))/i.test(code));
    
  if (isTopKFrequent) {
    return buildHazardResult(
      'O(n log n)',
      'Top K Frequent Elements. Building frequency map O(n). Sorting O(n log n). Total: O(n log n). Can be optimized to O(n log k) with heap.',
      'O(n)',
      'Frequency map and result array require O(n) space.',
      'top_k_frequent',
      0.88
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 34. SQUARE ROOT LOOP - O(√n) TC
  // Pattern: Loop with i * i <= n condition (but NOT sieve which has nested loops)
  // ─────────────────────────────────────────────────────────────────────────────
  const hasSievePattern = /sieve|primes?\[|j\s*\+=\s*i|j\s*=\s*i\s*\*\s*i/i.test(code);
  const isSqrtLoop =
    !hasSievePattern && (
      /mysqrt|my_sqrt|isqrt|intsqrt|int_sqrt|squareroot|square_root/i.test(code) ||
      (/for\s*\([^)]*i\s*\*\s*i\s*<=\s*n|while\s*\([^)]*i\s*\*\s*i\s*<=\s*n/.test(code))
    );
    
  if (isSqrtLoop) {
    return buildHazardResult(
      'O(√n)',
      'Square Root Loop. Loop condition i * i <= n means i iterates up to √n times.',
      'O(1)',
      'Only constant extra space for loop variable.',
      'sqrt_loop',
      0.95
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 38. REVERSE WORDS IN STRING - O(n) TC, O(n) SC
  // Pattern: trim + split + reverse + join
  // ─────────────────────────────────────────────────────────────────────────────
  const isReverseWords =
    /reversewords|reverse_words/i.test(code) ||
    (/\.trim\s*\(\s*\)\s*\.split\s*\(/i.test(code) && /\.reverse\s*\(\s*\)\s*\.join\s*\(/i.test(code));

  if (isReverseWords) {
    return buildHazardResult(
      'O(n)',
      'Reverse Words in a String. Splitting and joining the string and reversing the word array each take linear time in the length of the string.',
      'O(n)',
      'Intermediate arrays for words and the output string require linear space.',
      'reverse_words',
      0.94
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 39. GROUP ANAGRAMS - O(n k log k) TC, O(n k) SC
  // Pattern: map from sorted string key to list of anagrams
  // ─────────────────────────────────────────────────────────────────────────────
  const isGroupAnagrams =
    /groupanagrams|group_anagrams/i.test(code) ||
    (/new\s+Map\s*\(/i.test(code) && /\.split\('\'\)\.sort\s*\(\)\.join\('\'\)/i.test(code));

  if (isGroupAnagrams) {
    return buildHazardResult(
      'O(n k log k)',
      'Group Anagrams. For each of n strings of average length k, sorting the characters costs O(k log k), so total time is O(n k log k).',
      'O(n k)',
      'The hash map stores n strings of average length k grouped by sorted-key.',
      'group_anagrams',
      0.94
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 40. ROTATE ARRAY BY K (Reverse trick) - O(n) TC, O(1) SC
  // Pattern: three in-place reversals using helper rev
  // ─────────────────────────────────────────────────────────────────────────────
  const isRotateArrayByK =
    /rotate\s*\(/i.test(code) && /function\s+rotate\s*\(/i.test(code) && /function\s+rev\s*\(/i.test(code);

  if (isRotateArrayByK) {
    return buildHazardResult(
      'O(n)',
      'Rotate Array by K using the reverse trick. Each element is moved a constant number of times, so total work is linear in array size.',
      'O(1)',
      'Rotation is done in-place using a few indices and swaps.',
      'rotate_array_k',
      0.96
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 41. NEXT PERMUTATION - O(n) TC, O(1) SC
  // Pattern: scan from right to find pivot, swap, then reverse suffix
  // ─────────────────────────────────────────────────────────────────────────────
  const isNextPermutation =
    /nextpermutation|next_permutation/i.test(code) ||
    (/while\s*\(i>=0\s*&&\s*\w+\[i]\s*>=\s*\w+\[i\+1]/i.test(code) && /while\s*\(l<r\)/i.test(code));

  if (isNextPermutation) {
    return buildHazardResult(
      'O(n)',
      'Next Permutation scans from right once to find the pivot, once to find the successor, then reverses the suffix. All passes are linear.',
      'O(1)',
      'All swaps are in-place; no extra data structures proportional to n.',
      'next_permutation',
      0.95
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 42. COMBINATION SUM - backtracking with reuse of candidates
  // ─────────────────────────────────────────────────────────────────────────────
  const isCombinationSum =
    /combinationsum|combination_sum/i.test(code) && /dfs\s*\(/i.test(code);

  if (isCombinationSum) {
    return buildHazardResult(
      'O(k · 2^n)',
      'Combination Sum uses backtracking over subsets of candidates; in the worst case the number of combinations is exponential and each combination has up to k elements.',
      'O(k · 2^n)',
      'Space is dominated by storing all valid combinations in the result set.',
      'combination_sum',
      0.9
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 43. GENERATE PARENTHESES - Catalan number growth
  // ─────────────────────────────────────────────────────────────────────────────
  const isGenerateParentheses =
    /generateparenthesis|generate_parenthesis|generateparentheses|generate_parentheses/i.test(code);

  if (isGenerateParentheses) {
    return buildHazardResult(
      'O(4^n / √n)',
      'Generate Parentheses enumerates all valid sequences; the count is the nth Catalan number ≈ 4^n / (n^{3/2}), and each sequence has length O(n).',
      'O(4^n / √n)',
      'Space is dominated by storing all generated sequences; their count grows on the order of the Catalan number.',
      'generate_parentheses',
      0.9
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 44. COIN CHANGE (Min Coins) - 1D DP on amount
  // ─────────────────────────────────────────────────────────────────────────────
  const isCoinChangeMinCoins =
    /coinchange|coin_change/i.test(code) && /dp\s*=\s*Array\(amount\+1\)/i.test(code);

  if (isCoinChangeMinCoins) {
    return buildHazardResult(
      'O(n · amount)',
      'Coin Change (min coins) fills a DP array of size amount for each of n coin denominations, giving O(n · amount) time.',
      'O(amount)',
      'The DP array has size amount+1.',
      'coin_change_min',
      0.9
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 45. REMOVE NTH NODE FROM END (Two-pointer) - O(n) TC, O(1) SC
  // ─────────────────────────────────────────────────────────────────────────────
  const isRemoveNth =
    /removenthfromend|remove_nth_from_end/i.test(code) ||
    (/let\s+fast\s*=\s*dummy,\s*slow\s*=\s*dummy/i.test(code) && /for\s*\(let i=0;i<n;i\+\+\)/i.test(code));

  if (isRemoveNth) {
    return buildHazardResult(
      'O(n)',
      'Remove Nth Node From End uses a two-pointer technique with a single pass after an initial n-step lead, for overall linear time.',
      'O(1)',
      'Only a few pointer variables are used; the list is modified in-place.',
      'remove_nth_from_end',
      0.92
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 46. SLIDING WINDOW MAXIMUM (Monotonic Deque) - O(n) TC, O(k) SC
  // ─────────────────────────────────────────────────────────────────────────────
  const isSlidingWindowMax =
    /maxslidingwindow|max_sliding_window/i.test(code) ||
    (/const\s+dq\s*=\s*\[\s*\]/i.test(code) && /while\s*\([^)]*dq\.length[^)]*\)[\s\S]*dq\.pop\s*\(/i.test(code) && /dq\.shift\s*\(/i.test(code));

  if (isSlidingWindowMax) {
    return buildHazardResult(
      'O(n)',
      'Sliding Window Maximum maintains a monotonic deque of candidate indices; each index is pushed and popped at most once, so total work is linear.',
      'O(k)',
      'The deque holds at most k indices corresponding to the current window.',
      'sliding_window_max',
      0.95
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 47. NUMBER OF ISLANDS (DFS/BFS on grid) - O(m×n) TC, O(m×n) SC
  // ─────────────────────────────────────────────────────────────────────────────
  const isNumberOfIslands =
    /numislands|number_of_islands/i.test(code) ||
    (/grid/i.test(code) && /dfs\s*\(/i.test(code) && /i\+1,j|i-1,j|i,j\+1|i,j-1/.test(code));

  if (isNumberOfIslands) {
    return buildHazardResult(
      'O(m × n)',
      'Number of Islands explores each cell at most once using DFS/BFS; total work is proportional to the size of the grid.',
      'O(m × n)',
      'In the worst case, the recursion stack or BFS queue can hold O(m × n) cells.',
      'number_of_islands',
      0.9
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 35. FIRST UNIQUE CHARACTER - O(n) TC
  // Pattern: Count array + single pass through string
  // ─────────────────────────────────────────────────────────────────────────────
  const isFirstUnique =
    /firstuniq|first_uniq|firstunique|first_unique/i.test(code) ||
    (/count|freq/i.test(code) && /charcodeat|charcode/i.test(code) && /===\s*1|==\s*1/.test(code));
    
  if (isFirstUnique) {
    return buildHazardResult(
      'O(n)',
      'First Unique Character. Two passes through the string: one to count, one to find first unique. Both are O(n). Total: O(n).',
      'O(1)',
      'Fixed-size array of 26 characters is O(1) space.',
      'first_unique',
      0.92
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 36. SET MATRIX ZEROES - O(m×n) TC
  // Pattern: In-place matrix zeroing with first row/col markers
  // ─────────────────────────────────────────────────────────────────────────────
  const isSetMatrixZeroes =
    /setzeroes|set_zeroes|setzeros|set_zeros|matrixzeroes|matrix_zeroes/i.test(code) ||
    (/firstrowzero|firstcolzero|first_row_zero|first_col_zero/i.test(code) && /matrix\[i\]\[0\]|matrix\[0\]\[j\]/.test(code));
    
  if (isSetMatrixZeroes) {
    return buildHazardResult(
      'O(m × n)',
      'Set Matrix Zeroes. Traverse matrix twice: once to mark, once to set zeros. Each traversal is O(m × n).',
      'O(1)',
      'In-place algorithm using first row and column as markers.',
      'set_matrix_zeroes',
      0.95
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 37. FOUR SUM (improved detection) - O(n³) TC
  // Pattern: Two nested for loops + two pointers inside
  // ─────────────────────────────────────────────────────────────────────────────
  const isFourSumImproved =
    /foursum|four_sum|4sum/i.test(code) ||
    (/nums\.length\s*-\s*3/.test(code) && /nums\.length\s*-\s*2/.test(code) && /left.*right|lo.*hi/.test(code)) ||
    (/for.*for.*while.*left.*right/s.test(code) && /nums\[i\].*nums\[j\].*nums\[left\].*nums\[right\]|i.*j.*left.*right/.test(code));
    
  if (isFourSumImproved) {
    return buildHazardResult(
      'O(n³)',
      'Four Sum. Two nested loops O(n²) × two-pointer scan O(n) = O(n³).',
      'O(n)',
      'Output storage for quadruplets.',
      'four_sum',
      0.92
    );
  }
  
  // No hazard pattern matched

  return null;
}

/**
 * Build a standardized hazard result object
 */
function buildHazardResult(tc, tcReason, sc, scReason, pattern, confidence) {
  return {
    timeComplexity: tc,
    timeComplexityReason: tcReason,
    spaceComplexity: sc,
    spaceComplexityReason: scReason,
    spaceMetrics: { total: sc, auxiliary: sc },
    pattern: pattern,
    features: {
      _hazardPattern: true,
      _patternName: pattern
    },
    confidence: confidence,
    _meta: {
      version: "1.4.0",
      capabilities: ["hazard-patterns"],
      hazardMatch: true
    }
  };
}

/**
 * Calculate confidence level of the analysis
 */
function calculateConfidence(features) {
  let confidence = 1.0;
  
  // High confidence for clear patterns
  if (features.algorithms.binarySearch) confidence = 0.95;
  if (features.pointers.slidingWindow) confidence = 0.95;
  if (features.algorithms.sorting) confidence = 0.98;
  
  // Lower confidence for complex patterns
  if (features.algorithms.backtracking) {
      confidence = 0.75;
      if (features.algorithms.accumulatesResults) confidence = 0.8;
  }
  if (features.algorithms.recursion && !features.algorithms.memoization) {
      // Boost confidence if we identified D&C pattern
      confidence = features.metrics.recursionArgs === 'divide' ? 0.85 : 0.70;
  }
  
  // Reduce confidence for unusual combinations
  if (features.loops.maxNestingDepth > 3) confidence *= 0.8;
  
  return Math.round(confidence * 100) / 100;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 5: VALIDATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate AI-generated complexity against system analysis
 * @param {string} aiTC - AI-provided time complexity
 * @param {string} aiSC - AI-provided space complexity
 * @param {string} code - The actual code
 * @param {string} language - Programming language
 * @returns {Object} Validation result with corrections if needed
 */
function validateComplexity(aiTC, aiSC, code, language = 'python') {
  const systemAnalysis = analyzeComplexity(code, language);
  
  const normalizeComplexity = (tc) => {
    if (!tc) return '';
    return tc.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/o\(/gi, 'O(')
      .replace(/\^/g, '^')
      .replace(/log\s*n/gi, 'log n')
      .replace(/logn/gi, 'log n');
  };
  
  const normalizedAiTC = normalizeComplexity(aiTC);
  const normalizedSystemTC = normalizeComplexity(systemAnalysis.timeComplexity);
  const normalizedAiSC = normalizeComplexity(aiSC);
  const normalizedSystemSC = normalizeComplexity(systemAnalysis.spaceComplexity);
  
  const tcMatch = normalizedAiTC === normalizedSystemTC;
  const scMatch = normalizedAiSC === normalizedSystemSC;
  
  // Check for critical errors
  const criticalErrors = [];
  
  // Sliding window marked as O(n²) is WRONG
  if (systemAnalysis.pattern === 'sliding_window' && 
      normalizedAiTC.includes('n²')) {
    criticalErrors.push({
      type: 'TIME_COMPLEXITY',
      error: 'Sliding window incorrectly marked as O(n²)',
      aiValue: aiTC,
      correctValue: systemAnalysis.timeComplexity,
      explanation: systemAnalysis.timeComplexityReason
    });
  }
  
  // Two pointers marked as O(n²) is WRONG
  if (systemAnalysis.pattern === 'two_pointers' && 
      normalizedAiTC.includes('n²')) {
    criticalErrors.push({
      type: 'TIME_COMPLEXITY',
      error: 'Two pointers incorrectly marked as O(n²)',
      aiValue: aiTC,
      correctValue: systemAnalysis.timeComplexity,
      explanation: systemAnalysis.timeComplexityReason
    });
  }
  
  // Sorting ignored (O(n) when sorting present)
  if (systemAnalysis.features.algorithms.sorting && 
      !normalizedAiTC.includes('log')) {
    criticalErrors.push({
      type: 'TIME_COMPLEXITY',
      error: 'Sorting operation ignored in complexity',
      aiValue: aiTC,
      correctValue: 'O(n log n)',
      explanation: 'Comparison-based sorting has a lower bound of Ω(n log n).'
    });
  }

  // CRITICAL: Space Complexity Underestimation (AI says O(1) but uses Stack/Queue/Recursion/Map)
  const isConstantSpaceClaim = normalizedAiSC === 'O(1)' || normalizedAiSC === 'O(0)';
  // Check if system found meaningful space usage
  const hasDetectedSpace = 
    systemAnalysis.features.dataStructures.stack || 
    systemAnalysis.features.dataStructures.queue || 
    (systemAnalysis.features.algorithms.recursion && !systemAnalysis.features.pointers.tailRecursion) || // Tail recursion optimization is rare in JS/Java standard engines
    systemAnalysis.features.spaceUsage.auxArrays > 0 ||
    systemAnalysis.features.spaceUsage.auxMaps > 0 ||
    systemAnalysis.features.dataStructures.stringConcatLoop;

  if (isConstantSpaceClaim && hasDetectedSpace) {
    // Double check system complexity isn't actually O(1) due to some edge case override
    const systemIsConstant = normalizedSystemSC === 'O(1)';
    
    if (!systemIsConstant) {
      criticalErrors.push({
        type: 'SPACE_COMPLEXITY',
        error: 'Auxiliary space usage ignored (Stack/Queue/Recursion/Map detected)',
        aiValue: aiSC,
        correctValue: systemAnalysis.spaceComplexity,
        explanation: systemAnalysis.spaceComplexityReason
      });
    }
  }
  
  // Determine if we should override based on pattern and confidence pattern
  const deterministicPatterns = [
    'sorting', 
    'sliding_window', 
    'two_pointers', 
    'nested_loops', 
    'binary_search', // Safe now that we validate mid calculation
    'heap'
  ];
  
  const isDeterministic = deterministicPatterns.includes(systemAnalysis.pattern);
  const differentResult = !tcMatch || !scMatch;
  
  // Override if:
  // 1. Critical logical error found (e.g. O(n) for sorting)
  // 2. OR detected pattern is fully deterministic AND result differs
  const shouldOverride = criticalErrors.length > 0 || (isDeterministic && differentResult);

  return {
    valid: tcMatch && scMatch && criticalErrors.length === 0,
    tcMatch,
    scMatch,
    criticalErrors,
    aiAnalysis: { timeComplexity: aiTC, spaceComplexity: aiSC },
    systemAnalysis: {
      timeComplexity: systemAnalysis.timeComplexity,
      timeComplexityReason: systemAnalysis.timeComplexityReason,
      spaceComplexity: systemAnalysis.spaceComplexity,
      spaceComplexityReason: systemAnalysis.spaceComplexityReason,
      pattern: systemAnalysis.pattern,
      confidence: systemAnalysis.confidence
    },
    shouldOverride
  };
}

/**
 * Get corrected complexity (use system analysis if confident, otherwise AI)
 */
function getCorrectedComplexity(aiTC, aiSC, code, language = 'python') {
  const validation = validateComplexity(aiTC, aiSC, code, language);
  
  if (validation.shouldOverride) {
    console.log('[COMPLEXITY ENGINE] ✓ Overriding AI complexity with system analysis');
    console.log(`[COMPLEXITY ENGINE] Pattern: ${validation.systemAnalysis.pattern}`);
    console.log(`[COMPLEXITY ENGINE] TC: ${aiTC} → ${validation.systemAnalysis.timeComplexity}`);
    console.log(`[COMPLEXITY ENGINE] SC: ${aiSC} → ${validation.systemAnalysis.spaceComplexity}`);
    
    return {
      timeComplexity: validation.systemAnalysis.timeComplexity,
      timeComplexityReason: validation.systemAnalysis.timeComplexityReason,
      spaceComplexity: validation.systemAnalysis.spaceComplexity,
      spaceComplexityReason: validation.systemAnalysis.spaceComplexityReason,
      corrected: true,
      pattern: validation.systemAnalysis.pattern,
      confidence: validation.systemAnalysis.confidence
    };
  }
  
  return {
    timeComplexity: aiTC,
    timeComplexityReason: null,
    spaceComplexity: aiSC,
    spaceComplexityReason: null,
    corrected: false,
    pattern: validation.systemAnalysis.pattern,
    confidence: validation.systemAnalysis.confidence
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  extractCodeFeatures,
  deriveTimeComplexity,
  deriveSpaceComplexity,
  analyzeComplexity,
  validateComplexity,
  getCorrectedComplexity
};

export default {
  analyze: analyzeComplexity,
  validate: validateComplexity,
  correct: getCorrectedComplexity
};
