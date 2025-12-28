/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *                       AMORTIZED COMPLEXITY DETECTOR
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Detects patterns where naive loop analysis would incorrectly flag O(n²)
 * but actual amortized complexity is O(n).
 * 
 * Common patterns:
 * - Monotonic Stack (each element pushed/popped once)
 * - Two Pointers / Sliding Window (both pointers move forward at most n times)
 * - BFS/DFS traversal (each node visited once)
 * - Queue-based processing (each element enqueued/dequeued once)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Extract amortization-relevant features from code
 * @param {string} code - Source code to analyze
 * @param {string} language - Programming language
 * @returns {Object} Feature counts for amortized analysis
 */
export function extractAmortizedFeatures(code, language = 'python') {
  const normalizedCode = code.toLowerCase();
  const lines = code.split('\n');
  
  const features = {
    // Stack operations
    stackPush: 0,
    stackPop: 0,
    
    // Queue operations
    queueEnqueue: 0,
    queueDequeue: 0,
    
    // Two pointer / sliding window
    leftPointerMoves: 0,
    rightPointerMoves: 0,
    pointerReset: false,
    
    // Set/Map single-pass patterns
    hashSetAdd: 0,
    hashSetRemove: 0,
    
    // Monotonic stack/queue indicators
    whileStackNotEmpty: false,
    whileQueueNotEmpty: false,
    
    // General traversal indicators
    hasOuterLoop: false,
    hasInnerWhile: false
  };
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();
    
    // Stack operations
    if (lowerLine.includes('stack.push') || lowerLine.includes('.append(') || 
        lowerLine.includes('stack.add') || lowerLine.includes('push(')) {
      features.stackPush++;
    }
    if (lowerLine.includes('stack.pop') || lowerLine.includes('.pop()')) {
      features.stackPop++;
    }
    
    // Queue operations
    if (lowerLine.includes('queue.push') || lowerLine.includes('queue.add') || 
        lowerLine.includes('enqueue') || lowerLine.includes('.offer(') ||
        lowerLine.includes('deque.append')) {
      features.queueEnqueue++;
    }
    if (lowerLine.includes('queue.pop') || lowerLine.includes('dequeue') || 
        lowerLine.includes('.poll()') || lowerLine.includes('popleft')) {
      features.queueDequeue++;
    }
    
    // Two pointer movements
    if (/left\s*\+\+|left\s*\+=\s*1|l\s*\+\+|l\s*\+=\s*1|start\s*\+\+/.test(lowerLine)) {
      features.leftPointerMoves++;
    }
    if (/right\s*\+\+|right\s*\+=\s*1|r\s*\+\+|r\s*\+=\s*1|end\s*\+\+/.test(lowerLine)) {
      features.rightPointerMoves++;
    }
    
    // Pointer reset (indicates nested loop, NOT amortized)
    if (/left\s*=\s*0|right\s*=\s*0|l\s*=\s*0|r\s*=\s*0|start\s*=\s*0/.test(lowerLine) && 
        !lowerLine.includes('//') && !lowerLine.startsWith('#')) {
      // Only flag if it's inside a loop (not initialization)
      if (features.hasOuterLoop) {
        features.pointerReset = true;
      }
    }
    
    // Hash set operations
    if (lowerLine.includes('.add(') || lowerLine.includes('set.add')) {
      features.hashSetAdd++;
    }
    if (lowerLine.includes('.remove(') || lowerLine.includes('.discard(') || 
        lowerLine.includes('set.delete')) {
      features.hashSetRemove++;
    }
    
    // While loops on stack/queue (monotonic pattern)
    if (/while\s*\(\s*(!?\s*stack\.isempty|stack\.length|stack\.size|len\(stack\))/.test(lowerLine) ||
        /while\s*(stack|stk)\s*(and)?/.test(lowerLine) ||
        /while\s*stack\s*:/.test(lowerLine)) {
      features.whileStackNotEmpty = true;
    }
    if (/while\s*\(\s*(!?\s*queue\.isempty|queue\.length|queue\.size|len\(queue\))/.test(lowerLine) ||
        /while\s*(queue|q)\s*(and)?/.test(lowerLine)) {
      features.whileQueueNotEmpty = true;
    }
    
    // Loop detection
    if (/^\s*(for|while)\s*[\(:]/.test(lowerLine)) {
      if (features.hasOuterLoop) {
        features.hasInnerWhile = true;
      } else {
        features.hasOuterLoop = true;
      }
    }
  }
  
  return features;
}

/**
 * Detect if code exhibits amortized O(n) pattern despite nested structures
 * @param {Object} features - Features extracted from extractAmortizedFeatures()
 * @returns {Object|null} Amortized analysis result or null if not applicable
 */
export function detectAmortizedPattern(features) {
  // ═══════════════════════════════════════════════════════════════════════════
  // Pattern 1: Monotonic Stack
  // Each element is pushed and popped at most once → O(n) amortized
  // ═══════════════════════════════════════════════════════════════════════════
  if (
    features.stackPush > 0 &&
    features.stackPop > 0 &&
    features.whileStackNotEmpty &&
    !features.pointerReset
  ) {
    return {
      amortized: true,
      pattern: "MONOTONIC_STACK",
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
      reason: "Each element is pushed and popped at most once (amortized O(n))"
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Pattern 2: Queue-based BFS / Level-order traversal
  // Each element is enqueued and dequeued once → O(n) amortized
  // ═══════════════════════════════════════════════════════════════════════════
  if (
    features.queueEnqueue > 0 &&
    features.queueDequeue > 0 &&
    features.whileQueueNotEmpty
  ) {
    return {
      amortized: true,
      pattern: "QUEUE_TRAVERSAL",
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
      reason: "Each element is enqueued and dequeued once (BFS/level-order traversal)"
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Pattern 3: Two Pointers / Sliding Window
  // Both pointers move forward at most n times total → O(n) amortized
  // ═══════════════════════════════════════════════════════════════════════════
  if (
    features.leftPointerMoves > 0 &&
    features.rightPointerMoves > 0 &&
    !features.pointerReset
  ) {
    return {
      amortized: true,
      pattern: "TWO_POINTERS",
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      reason: "Both pointers move forward at most n times total (sliding window/two pointers)"
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Pattern 4: Sliding Window with Hash Set
  // Elements added/removed from set as window slides → O(n) amortized
  // ═══════════════════════════════════════════════════════════════════════════
  if (
    features.hashSetAdd > 0 &&
    features.hashSetRemove > 0 &&
    features.hasOuterLoop &&
    features.hasInnerWhile &&
    !features.pointerReset
  ) {
    return {
      amortized: true,
      pattern: "SLIDING_WINDOW_HASHSET",
      timeComplexity: "O(n)",
      spaceComplexity: "O(k)",
      reason: "Sliding window with hash set - each element added/removed at most once"
    };
  }

  // No amortized pattern detected
  return null;
}

/**
 * Main entry point: Analyze code for amortized complexity
 * @param {string} code - Source code to analyze
 * @param {string} language - Programming language
 * @returns {Object|null} Amortized analysis or null
 */
export function analyzeAmortizedComplexity(code, language = 'python') {
  const features = extractAmortizedFeatures(code, language);
  return detectAmortizedPattern(features);
}
