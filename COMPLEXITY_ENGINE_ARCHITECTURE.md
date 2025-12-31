# 🔬 COMPLEXITY ENGINE ARCHITECTURE v3.0
## Complete Systematic Documentation

---

## 📊 EXECUTION FLOW (Order of Operations)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USER SUBMITS QUESTION                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 0: AI GENERATION (Qubrid/OpenAI)                              │
│ • Generates brute, better, optimal approaches                        │
│ • Provides initial TC/SC (may be wrong!)                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 1: INDEX-SENSITIVE CORRECTNESS GUARD                          │
│ File: api/solution/index.js (lines 49-94)                           │
│ Purpose: Detect value-based HashMap bugs in monotonic stack probs   │
│ Problems: Next Greater Element, Stock Span, Daily Temperatures      │
│ Priority: WARNING ONLY (doesn't change TC/SC)                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 2: GROUND TRUTH DATABASE (369+ verified problems)             │
│ File: utils/groundTruthDatabase.json                                │
│ File: utils/problemGroundTruth.js                                   │
│ Purpose: If problem found in database, FORCE correct TC/SC          │
│ Priority: HIGH - Overrides AI for KNOWN problems                    │
│ Contains: QuickSort, MergeSort, Preorder, Two Sum, etc.             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 3: V2 DUAL COMPLEXITY ENGINE (3,680+ problem database)        │
│ File: utils/complexityEngineV2.js                                   │
│ Purpose: Provide average + worst case complexities                  │
│ Features:                                                           │
│   • Title matching against mega ground truth                        │
│   • Code fingerprint matching                                       │
│   • Pattern detection (QuickSort, MergeSort, Sliding Window)        │
│   • Data structure detection (HashMap, Stack, Heap)                 │
│ Priority: MEDIUM - Only overrides OPTIMAL approach (100% confidence)│
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 4: V1 DETERMINISTIC COMPLEXITY ENGINE                         │
│ File: utils/complexityEngine.js                                     │
│ Purpose: Validate/correct TC/SC by analyzing code patterns          │
│ Features:                                                           │
│   • Loop nesting depth analysis                                     │
│   • Recursion detection                                             │
│   • Data structure detection                                        │
│ Priority: MEDIUM - Used when ground truth not available             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 5: AMORTIZED COMPLEXITY DETECTOR                              │
│ File: utils/amortizedDetector.js                                    │
│ Purpose: Detect O(1) amortized operations (monotonic stack, etc.)   │
│ Priority: HIGH - Can override engine if pattern detected            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 6: RECONCILIATION (Evidence-Based Resolution)                 │
│ File: api/solution/index.js (lines 1205-1300)                       │
│ Purpose: When AI and Engine disagree, request LLM to provide        │
│          EVIDENCE (code line quotes) to justify its answer          │
│ Priority: FINAL ARBITER - Only accepts claims with proof            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 7: NUCLEAR FINAL CONSISTENCY CHECK                            │
│ File: api/solution/index.js (lines 1037-1050)                       │
│ Purpose: ABSOLUTE FINAL GATE - Forces ground truth for verified     │
│          problems regardless of what previous layers decided        │
│ Priority: NUCLEAR - Cannot be overridden                            │
└─────────────────────────────────────────────────────────────────────┘

```

---

## 🎯 DECISION MATRIX: Which Layer Wins?

| Scenario | Winner Layer | Reason |
|----------|--------------|--------|
| Problem in Ground Truth DB | LAYER 2 | Verified human-curated data |
| Problem in V2 Mega Database (100% confidence) | LAYER 3 | Title/fingerprint match |
| QuickSort/MergeSort detected in code | LAYER 3 | Pattern detection |
| V1 Engine detects nested loops | LAYER 4 | Heuristic analysis |
| Amortized pattern detected | LAYER 5 | Special case handling |
| AI provides evidence for different TC | LAYER 6 | Evidence-based override |
| Ground truth exists but AI was used | LAYER 7 | Nuclear override |

---

## 📁 FILE INVENTORY

| File | Purpose | Problems Covered |
|------|---------|------------------|
| `utils/groundTruthDatabase.json` | 369+ Striver problems | Arrays, DP, Trees, Graphs |
| `utils/mergedGroundTruth.json` | 3,680+ merged problems | LeetCode + Striver + Extras |
| `utils/complexityEngineV2.js` | Pattern detection + DB lookup | All problems |
| `utils/complexityEngine.js` | Loop/recursion analysis | All problems |
| `utils/amortizedDetector.js` | Amortized O(1) detection | Monotonic stack, Union-Find |
| `utils/problemGroundTruth.js` | DB validation/correction | Known problems |

---

## 🔧 PATTERN DETECTION (V2 Engine)

The V2 engine can automatically detect these patterns from code:

| Pattern | Time Complexity | Space Complexity |
|---------|-----------------|------------------|
| Binary Search | O(log n) | O(1) |
| Sliding Window | O(n) | O(n) |
| Two Pointers | O(n) | O(1) |
| QuickSort | O(n log n) avg / O(n²) worst | O(log n) avg / O(n) worst |
| MergeSort | O(n log n) | O(n) |
| HeapSort | O(n log n) | O(1) |
| DFS/BFS | O(V + E) | O(V) |
| DP (1D) | O(n) | O(n) |
| DP (2D) | O(n²) | O(n²) |
| Backtracking (Subsets) | O(2^n) | O(n) |
| Backtracking (Permutations) | O(n!) | O(n) |

---

## ✅ CURRENT STATE SUMMARY

1. **Ground Truth Layer**: ✓ Working (369+ problems + QuickSort/MergeSort/HeapSort added)
2. **V2 Engine**: ✓ Working (pattern detection for sorting algorithms)
3. **V1 Engine**: ✓ Working (loop analysis)
4. **Amortized Detector**: ✓ Working (monotonic stack detection)
5. **Reconciliation**: ✓ Working (evidence-based resolution)
6. **UI**: ✓ Simple Time/Space boxes (no experimental cards)

---

## 🚀 RECOMMENDED IMPROVEMENTS

1. **Add more sorting algorithms to Ground Truth**:
   - Bubble Sort: O(n²) / O(1)
   - Insertion Sort: O(n²) / O(1)
   - Selection Sort: O(n²) / O(1)
   - Counting Sort: O(n + k) / O(k)
   - Radix Sort: O(d * n) / O(n)

2. **Improve Pattern Detection**:
   - Add "divide" + "conquer" keyword detection
   - Add "heap" + "heapify" keyword detection

3. **Strengthen V2 Override Logic**:
   - Currently only overrides OPTIMAL approach
   - Consider overriding ALL approaches if ground truth found

---

*Last Updated: 2025-12-31*
*Version: 3.0*
