/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROBLEM GROUND TRUTH DATABASE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This file contains verified complexity data from Striver's A2Z DSA Sheet
 * and other authoritative sources. It serves as the FINAL AUTHORITY for
 * complexity validation when AI and complexity engine disagree.
 *
 * Source: https://github.com/arindal1/SDE-DSA-SD-Prep
 *
 * Each entry defines:
 * - Problem name patterns (for matching)
 * - Brute force approach (TC, SC, algorithm)
 * - Better approach (if exists)
 * - Optimal approach (TC, SC, algorithm)
 * - Notes about why certain approaches exist/don't exist
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export const PROBLEM_GROUND_TRUTH = {
  // ═══════════════════════════════════════════════════════════════════════════════
  // ARRAYS & HASHING
  // ═══════════════════════════════════════════════════════════════════════════════

  twosum: {
    patterns: ['two sum', '2sum', 'twosum', 'two-sum'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'Nested loops checking all pairs',
      name: 'Nested Loops',
    },
    better: null, // Direct jump from O(n²) to O(n)
    optimal: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Hash map for complement lookup',
      name: 'Hash Map One-Pass',
    },
    note: 'No intermediate approach exists. Direct jump from O(n²) brute force to O(n) hash map.',
  },

  anagram: {
    patterns: ['anagram', 'valid anagram', 'check anagram', 'is anagram'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(n)',
      algorithm: 'Nested loops to match characters',
      name: 'Nested Loop Matching',
    },
    better: {
      tc: 'O(n log n)',
      sc: 'O(n)',
      algorithm: 'Sort both strings and compare',
      name: 'Sorting',
      scReason:
        'O(n) space is required to convert immutable Strings into sortable Character Arrays.',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Hash map / Frequency array',
      name: 'Frequency Counter',
    },
    note: 'Sorting improves matching to O(n log n). Frequency counting is optimal O(n).',
  },

  majorityelement: {
    patterns: ['majority element', 'majority', 'moore voting', 'boyer moore'],
    bruteForce: {
      tc: 'O(n log n)',
      sc: 'O(1)',
      algorithm: 'Sort and check middle element',
      name: 'Sorting',
    },
    better: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Hash map frequency counting',
      name: 'Hash Map Counting',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Boyer-Moore Voting Algorithm',
      name: 'Boyer-Moore Voting',
    },
    note: 'Better approach uses O(n) space for hash map. Optimal achieves O(1) space with Boyer-Moore.',
  },

  maxsubarraysum: {
    patterns: [
      'maximum subarray',
      'max subarray sum',
      'kadane',
      'kadanes algorithm',
    ],
    bruteForce: {
      tc: 'O(n³)',
      sc: 'O(1)',
      algorithm: 'Triple nested loop checking all subarrays',
      name: 'Triple Loop',
    },
    better: {
      tc: 'O(n²)',
      sc: 'O(n)',
      algorithm: 'Prefix sum optimization',
      name: 'Prefix Sum',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: "Kadane's Algorithm",
      name: "Kadane's Algorithm",
    },
    note: 'Classic example of 3 distinct approaches with clear progression.',
  },

  threesum: {
    patterns: ['three sum', '3sum', 'threesum', 'three-sum'],
    bruteForce: {
      tc: 'O(n³)',
      sc: 'O(1)',
      algorithm: 'Triple nested loop checking all triplets',
      name: 'Triple Nested Loop',
    },
    better: {
      tc: 'O(n²)',
      sc: 'O(n)',
      algorithm: 'Sort + two pointers for each element',
      name: 'Sort + Two Pointers',
    },
    optimal: {
      tc: 'O(n²)',
      sc: 'O(1)', // excluding output space
      algorithm: 'Sort + optimized two pointers with deduplication',
      name: 'Optimized Two Pointers',
    },
    note: 'Better and optimal have same TC but optimal has better space complexity.',
  },

  longestconsecutivesequence: {
    patterns: [
      'longest consecutive',
      'consecutive sequence',
      'longest consecutive sequence',
    ],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'For each element, search for consecutive elements',
      name: 'Linear Search',
    },
    better: {
      tc: 'O(n log n)',
      sc: 'O(1)',
      algorithm: 'Sort and find longest consecutive run',
      name: 'Sorting',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Hash set for O(1) lookups',
      name: 'Hash Set',
    },
    note: 'All three approaches exist with clear progression.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // TWO POINTERS / SLIDING WINDOW
  // ═══════════════════════════════════════════════════════════════════════════════

  containerwithmostwater: {
    patterns: ['container with most water', 'container water', 'most water'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'Check all pairs of lines',
      name: 'Nested Loops',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Two pointers from both ends',
      name: 'Two Pointers',
    },
    note: 'No intermediate approach. Two pointers is the optimal solution.',
  },

  trappingrainwater: {
    patterns: ['trapping rain water', 'trap rain water', 'rain water'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'For each position, find max left and right',
      name: 'Brute Force',
    },
    better: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Precompute max left and right arrays',
      name: 'Prefix/Suffix Arrays',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Two pointers with running max',
      name: 'Two Pointers',
    },
    note: 'Better uses O(n) space. Optimal achieves O(1) space with two pointers.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // BINARY SEARCH
  // ═══════════════════════════════════════════════════════════════════════════════

  binarysearch: {
    patterns: ['binary search', 'search in sorted array'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Linear search',
      name: 'Linear Search',
    },
    better: null,
    optimal: {
      tc: 'O(log n)',
      sc: 'O(1)',
      algorithm: 'Binary search on sorted array',
      name: 'Binary Search',
    },
    note: 'Direct jump from O(n) to O(log n). No intermediate approach.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // LINKED LISTS
  // ═══════════════════════════════════════════════════════════════════════════════

  reverselinkedlist: {
    patterns: ['reverse linked list', 'reverse list'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Use stack or recursion',
      name: 'Stack/Recursion',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Iterative pointer reversal',
      name: 'Iterative In-Place',
    },
    note: 'Same time complexity but optimal has O(1) space vs O(n).',
  },

  linkedlistcycle: {
    patterns: ['linked list cycle', 'detect cycle', 'cycle detection'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Hash set to track visited nodes',
      name: 'Hash Set',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: "Floyd's Cycle Detection (slow-fast pointers)",
      name: "Floyd's Algorithm",
    },
    note: 'Same time complexity but optimal achieves O(1) space.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SORTING
  // ═══════════════════════════════════════════════════════════════════════════════

  mergeintervals: {
    patterns: [
      'merge intervals',
      'merge overlapping intervals',
      'overlapping intervals',
    ],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(n)',
      algorithm: 'Compare each interval with all others',
      name: 'Brute Force Comparison',
    },
    better: null,
    optimal: {
      tc: 'O(n log n)',
      sc: 'O(n)',
      algorithm: 'Sort by start time, then merge',
      name: 'Sort and Merge',
    },
    note: 'Sorting is required, making O(n log n) optimal.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // DYNAMIC PROGRAMMING
  // ═══════════════════════════════════════════════════════════════════════════════

  climbingstairs: {
    patterns: ['climbing stairs', 'climb stairs', 'staircase'],
    bruteForce: {
      tc: 'O(2^n)',
      sc: 'O(n)',
      algorithm: 'Recursive tree exploration',
      name: 'Recursion',
    },
    better: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Memoization or DP array',
      name: 'Dynamic Programming',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Fibonacci-style two variables',
      name: 'Space-Optimized DP',
    },
    note: 'Classic DP problem with space optimization possible.',
  },

  longestcommonsubsequence: {
    patterns: ['longest common subsequence', 'lcs'],
    bruteForce: {
      tc: 'O(2^n)',
      sc: 'O(n)',
      algorithm: 'Recursive exploration of all subsequences',
      name: 'Recursion',
    },
    better: {
      tc: 'O(n*m)',
      sc: 'O(n*m)',
      algorithm: '2D DP table',
      name: '2D DP',
    },
    optimal: {
      tc: 'O(n*m)',
      sc: 'O(min(n,m))',
      algorithm: 'Space-optimized DP with rolling array',
      name: 'Space-Optimized DP',
    },
    note: 'Same time complexity but optimal uses less space.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // STRINGS
  // ═══════════════════════════════════════════════════════════════════════════════

  longestsubstringwithoutrepeating: {
    patterns: [
      'longest substring without repeating',
      'longest substring',
      'no repeating characters',
    ],
    bruteForce: {
      tc: 'O(n³)',
      sc: 'O(min(n,m))', // m = charset size
      algorithm: 'Check all substrings for uniqueness',
      name: 'Brute Force',
    },
    better: {
      tc: 'O(n²)',
      sc: 'O(min(n,m))',
      algorithm: 'Optimized substring checking with set',
      name: 'Optimized Brute Force',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(min(n,m))',
      algorithm: 'Sliding window with hash set',
      name: 'Sliding Window',
    },
    note: 'All three approaches exist with clear progression.',
  },

  validparentheses: {
    patterns: [
      'valid parentheses',
      'balanced parentheses',
      'parentheses matching',
    ],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Stack-based matching',
      name: 'Stack',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Stack-based matching (same as brute)',
      name: 'Stack',
    },
    note: 'Stack is already optimal. Brute and optimal are the same.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // TREES
  // ═══════════════════════════════════════════════════════════════════════════════

  maximumdepthbinarytree: {
    patterns: ['maximum depth', 'max depth', 'height of tree', 'tree height'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(h)', // h = height
      algorithm: 'Recursive DFS',
      name: 'Recursion',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(w)', // w = max width (for BFS queue)
      algorithm: 'BFS level-order traversal',
      name: 'BFS',
    },
    note: 'Both are O(n) time. BFS uses O(w) space vs recursion O(h).',
  },

  validatebst: {
    patterns: ['validate bst', 'valid bst', 'is valid bst'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(h)',
      algorithm: 'For each node, check all descendants',
      name: 'Brute Force',
    },
    better: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Inorder traversal to array, check sorted',
      name: 'Inorder Traversal',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(h)',
      algorithm: 'Recursive with min/max bounds',
      name: 'Range Validation',
    },
    note: 'Better uses O(n) space. Optimal achieves O(h) space.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ARRAYS - ADDITIONAL PROBLEMS
  // ═══════════════════════════════════════════════════════════════════════════════

  largestelement: {
    patterns: ['largest element', 'find largest', 'maximum element'],
    bruteForce: {
      tc: 'O(n log n)',
      sc: 'O(1)',
      algorithm: 'Sort and return last element',
      name: 'Sorting',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Single pass to find maximum',
      name: 'Linear Scan',
    },
    note: 'Sorting is overkill. Linear scan is optimal.',
  },

  secondlargest: {
    patterns: ['second largest', 'second max', 'second maximum'],
    bruteForce: {
      tc: 'O(n log n)',
      sc: 'O(1)',
      algorithm: 'Sort and return second last',
      name: 'Sorting',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Track first and second max in one pass',
      name: 'Two Variables',
    },
    note: 'Can find both max and second max in single pass.',
  },

  removeduplicates: {
    patterns: ['remove duplicates', 'unique elements', 'remove duplicate'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Use hash set to track unique elements',
      name: 'Hash Set',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Two pointers for in-place removal (sorted array)',
      name: 'Two Pointers',
    },
    note: 'For sorted arrays, two pointers achieve O(1) space.',
  },

  missingnumber: {
    patterns: ['missing number', 'find missing', 'missing element'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Hash set to find missing',
      name: 'Hash Set',
    },
    better: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Sum formula: n*(n+1)/2 - sum(array)',
      name: 'Math Formula',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'XOR all numbers and array elements',
      name: 'XOR',
    },
    note: 'XOR avoids overflow issues of sum formula.',
  },

  movezeros: {
    patterns: ['move zeros', 'move zeroes', 'shift zeros'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Create new array with non-zeros then zeros',
      name: 'Extra Array',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Two pointers for in-place swapping',
      name: 'Two Pointers',
    },
    note: 'In-place solution with two pointers.',
  },

  sort012: {
    patterns: ['sort 012', 'sort colors', 'dutch national flag'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Count 0s, 1s, 2s and rewrite array',
      name: 'Counting Sort',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Dutch National Flag (three pointers)',
      name: 'Dutch National Flag',
    },
    note: 'Both are O(n) but DNF is single-pass.',
  },

  buysellstock: {
    patterns: ['buy sell stock', 'stock profit', 'best time to buy'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'Check all pairs of buy/sell days',
      name: 'Nested Loops',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Track minimum price and max profit',
      name: 'One Pass',
    },
    note: 'Single pass tracking min and max profit.',
  },

  nextpermutation: {
    patterns: ['next permutation', 'next lexicographic'],
    bruteForce: {
      tc: 'O(n!)',
      sc: 'O(n)',
      algorithm: 'Generate all permutations and find next',
      name: 'Generate All',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Find pivot, swap, reverse suffix',
      name: 'In-Place Algorithm',
    },
    note: 'Clever in-place algorithm avoids generating all.',
  },

  leadersinarray: {
    patterns: ['leaders in array', 'leaders', 'rightmost greater'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'For each element, check all elements to right',
      name: 'Nested Loops',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Traverse from right, track max',
      name: 'Right to Left',
    },
    note: 'Traverse from right to avoid nested loops.',
  },

  setmatrixzeros: {
    patterns: ['set matrix zeros', 'matrix zeros', 'zero matrix'],
    bruteForce: {
      tc: 'O(m*n)',
      sc: 'O(m*n)',
      algorithm: 'Copy matrix, mark zeros',
      name: 'Extra Matrix',
    },
    better: {
      tc: 'O(m*n)',
      sc: 'O(m+n)',
      algorithm: 'Use row and column arrays',
      name: 'Row/Col Arrays',
    },
    optimal: {
      tc: 'O(m*n)',
      sc: 'O(1)',
      algorithm: 'Use first row/column as markers',
      name: 'In-Place Markers',
    },
    note: 'All have same TC but space reduces from O(mn) to O(1).',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // BINARY SEARCH - ADDITIONAL
  // ═══════════════════════════════════════════════════════════════════════════════

  searchinsertposition: {
    patterns: ['search insert position', 'insert position'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Linear search for position',
      name: 'Linear Search',
    },
    better: null,
    optimal: {
      tc: 'O(log n)',
      sc: 'O(1)',
      algorithm: 'Binary search for position',
      name: 'Binary Search',
    },
    note: 'Binary search on sorted array.',
  },

  firstlastoccurrence: {
    patterns: ['first last occurrence', 'first and last position'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Linear scan to find first and last',
      name: 'Linear Search',
    },
    better: null,
    optimal: {
      tc: 'O(log n)',
      sc: 'O(1)',
      algorithm: 'Two binary searches (lower and upper bound)',
      name: 'Binary Search',
    },
    note: 'Use binary search twice for first and last.',
  },

  searchrotatedarray: {
    patterns: ['search rotated', 'rotated sorted array'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Linear search',
      name: 'Linear Search',
    },
    better: null,
    optimal: {
      tc: 'O(log n)',
      sc: 'O(1)',
      algorithm: 'Modified binary search',
      name: 'Binary Search',
    },
    note: 'Modified binary search handles rotation.',
  },

  findminimumrotated: {
    patterns: ['find minimum rotated', 'minimum in rotated'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Linear scan',
      name: 'Linear Search',
    },
    better: null,
    optimal: {
      tc: 'O(log n)',
      sc: 'O(1)',
      algorithm: 'Binary search for inflection point',
      name: 'Binary Search',
    },
    note: 'Find rotation point using binary search.',
  },

  singleelementsorted: {
    patterns: ['single element sorted', 'single element in sorted'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Linear search or XOR',
      name: 'Linear/XOR',
    },
    better: null,
    optimal: {
      tc: 'O(log n)',
      sc: 'O(1)',
      algorithm: 'Binary search on even/odd indices',
      name: 'Binary Search',
    },
    note: 'Binary search using parity of indices.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // LINKED LISTS - ADDITIONAL
  // ═══════════════════════════════════════════════════════════════════════════════

  middlelinkedlist: {
    patterns: ['middle linked list', 'middle of list', 'find middle'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Count length, then traverse to middle',
      name: 'Two Pass',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Slow-fast pointers (one pass)',
      name: 'Slow-Fast Pointers',
    },
    note: 'Same TC but optimal is single pass.',
  },

  palindromelinkedlist: {
    patterns: ['palindrome linked list', 'palindrome list'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Copy to array and check palindrome',
      name: 'Array Copy',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Find middle, reverse second half, compare',
      name: 'In-Place',
    },
    note: 'In-place solution with O(1) space.',
  },

  removenthfromend: {
    patterns: ['remove nth from end', 'remove nth node'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Count length, then remove',
      name: 'Two Pass',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Two pointers with n gap (one pass)',
      name: 'Two Pointers',
    },
    note: 'Single pass with two pointers.',
  },

  mergetwolist: {
    patterns: ['merge two lists', 'merge sorted lists'],
    bruteForce: {
      tc: 'O(m+n)',
      sc: 'O(m+n)',
      algorithm: 'Create new list',
      name: 'New List',
    },
    better: null,
    optimal: {
      tc: 'O(m+n)',
      sc: 'O(1)',
      algorithm: 'In-place merging',
      name: 'In-Place',
    },
    note: 'In-place merging saves space.',
  },

  addtwonumbers: {
    patterns: ['add two numbers', 'add linked lists'],
    bruteForce: {
      tc: 'O(max(m,n))',
      sc: 'O(max(m,n))',
      algorithm: 'Traverse both lists with carry',
      name: 'Standard Addition',
    },
    better: null,
    optimal: {
      tc: 'O(max(m,n))',
      sc: 'O(max(m,n))',
      algorithm: 'Same as brute (already optimal)',
      name: 'Standard Addition',
    },
    note: 'Brute force is already optimal.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // STACKS & QUEUES
  // ═══════════════════════════════════════════════════════════════════════════════

  nextgreaterelement: {
    patterns: ['next greater element', 'next greater'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'For each element, search right',
      name: 'Nested Loops',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Monotonic stack',
      name: 'Monotonic Stack',
    },
    note: 'Monotonic stack reduces from O(n²) to O(n).',
  },

  largestrectangle: {
    patterns: ['largest rectangle', 'largest rectangle histogram'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'For each bar, expand left and right',
      name: 'Expand from Each',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Monotonic stack',
      name: 'Monotonic Stack',
    },
    note: 'Stack maintains increasing heights.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // TWO POINTERS - ADDITIONAL
  // ═══════════════════════════════════════════════════════════════════════════════

  foursum: {
    patterns: ['four sum', '4sum', 'foursum'],
    bruteForce: {
      tc: 'O(n⁴)',
      sc: 'O(1)',
      algorithm: 'Four nested loops',
      name: 'Quad Nested Loop',
    },
    better: {
      tc: 'O(n³)',
      sc: 'O(n)',
      algorithm: 'Sort + three pointers with hash map',
      name: 'Sort + Hash',
    },
    optimal: {
      tc: 'O(n³)',
      sc: 'O(1)',
      algorithm: 'Sort + three pointers',
      name: 'Three Pointers',
    },
    note: 'Better and optimal have same TC but optimal uses less space.',
  },

  longestrepeatingchar: {
    patterns: ['longest repeating character', 'character replacement'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'Check all substrings',
      name: 'Brute Force',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Sliding window with character count',
      name: 'Sliding Window',
    },
    note: 'Sliding window with O(26) = O(1) space.',
  },

  minimumwindowsubstring: {
    patterns: ['minimum window substring', 'smallest window'],
    bruteForce: {
      tc: 'O(n*m)',
      sc: 'O(m)',
      algorithm: 'Check all substrings',
      name: 'Brute Force',
    },
    better: null,
    optimal: {
      tc: 'O(n+m)',
      sc: 'O(m)',
      algorithm: 'Sliding window with hash map',
      name: 'Sliding Window',
    },
    note: 'Sliding window reduces from O(n*m) to O(n+m).',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // DYNAMIC PROGRAMMING - ADDITIONAL
  // ═══════════════════════════════════════════════════════════════════════════════

  houserobber: {
    patterns: ['house robber', 'rob houses'],
    bruteForce: {
      tc: 'O(2^n)',
      sc: 'O(n)',
      algorithm: 'Recursion exploring all choices',
      name: 'Recursion',
    },
    better: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'DP array',
      name: 'DP Array',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Two variables tracking prev states',
      name: 'Space-Optimized DP',
    },
    note: 'Classic space optimization from O(n) to O(1).',
  },

  coinchange: {
    patterns: ['coin change', 'minimum coins'],
    bruteForce: {
      tc: 'O(2^n)',
      sc: 'O(n)',
      algorithm: 'Recursion trying all combinations',
      name: 'Recursion',
    },
    better: {
      tc: 'O(n*amount)',
      sc: 'O(n*amount)',
      algorithm: '2D DP table',
      name: '2D DP',
    },
    optimal: {
      tc: 'O(n*amount)',
      sc: 'O(amount)',
      algorithm: '1D DP array',
      name: '1D DP',
    },
    note: 'Space optimization from O(n*amount) to O(amount).',
  },

  longestincreasingsubsequence: {
    patterns: ['longest increasing subsequence', 'lis'],
    bruteForce: {
      tc: 'O(2^n)',
      sc: 'O(n)',
      algorithm: 'Generate all subsequences',
      name: 'Recursion',
    },
    better: {
      tc: 'O(n²)',
      sc: 'O(n)',
      algorithm: 'DP with nested loops',
      name: 'DP',
    },
    optimal: {
      tc: 'O(n log n)',
      sc: 'O(n)',
      algorithm: 'Binary search with patience sorting',
      name: 'Binary Search',
    },
    note: 'Binary search optimization reduces from O(n²) to O(n log n).',
  },

  editdistance: {
    patterns: ['edit distance', 'levenshtein distance'],
    bruteForce: {
      tc: 'O(3^n)',
      sc: 'O(n)',
      algorithm: 'Recursion with 3 choices per step',
      name: 'Recursion',
    },
    better: {
      tc: 'O(n*m)',
      sc: 'O(n*m)',
      algorithm: '2D DP table',
      name: '2D DP',
    },
    optimal: {
      tc: 'O(n*m)',
      sc: 'O(min(n,m))',
      algorithm: 'Space-optimized DP with rolling array',
      name: 'Space-Optimized DP',
    },
    note: 'Space optimization using only two rows.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // MATH & NUMBER THEORY (TRICKY!)
  // ═══════════════════════════════════════════════════════════════════════════════

  powxn: {
    patterns: ['pow x n', 'power', 'exponentiation', 'power function'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Multiply x by itself n times',
      name: 'Iterative Multiplication',
    },
    better: null,
    optimal: {
      tc: 'O(log n)',
      sc: 'O(log n)', // or O(1) iterative
      algorithm: 'Binary exponentiation (divide and conquer)',
      name: 'Fast Exponentiation',
    },
    note: 'Binary exponentiation reduces from O(n) to O(log n).',
  },

  sqrt: {
    patterns: ['square root', 'sqrt', 'find sqrt'],
    bruteForce: {
      tc: 'O(√n)',
      sc: 'O(1)',
      algorithm: 'Linear search from 1 to √n',
      name: 'Linear Search',
    },
    better: null,
    optimal: {
      tc: 'O(log n)',
      sc: 'O(1)',
      algorithm: 'Binary search on answer',
      name: 'Binary Search',
    },
    note: 'Binary search on answer space is optimal.',
  },

  primenumber: {
    patterns: ['prime number', 'check prime', 'is prime'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Check divisibility from 2 to n-1',
      name: 'Trial Division',
    },
    better: {
      tc: 'O(√n)',
      sc: 'O(1)',
      algorithm: 'Check divisibility from 2 to √n',
      name: 'Optimized Trial Division',
    },
    optimal: {
      tc: 'O(√n)',
      sc: 'O(1)',
      algorithm: 'Check 2, 3, then 6k±1 pattern',
      name: 'Optimized Pattern Check',
    },
    note: 'Cannot do better than O(√n) for single number primality.',
  },

  sieveoferatosthenes: {
    patterns: [
      'sieve of eratosthenes',
      'sieve',
      'all primes',
      'primes up to n',
    ],
    bruteForce: {
      tc: 'O(n² log log n)',
      sc: 'O(1)',
      algorithm: 'Check each number individually',
      name: 'Individual Checks',
    },
    better: null,
    optimal: {
      tc: 'O(n log log n)',
      sc: 'O(n)',
      algorithm: 'Sieve of Eratosthenes',
      name: 'Sieve',
    },
    note: 'Sieve is optimal for finding all primes up to n.',
  },

  gcd: {
    patterns: ['gcd', 'greatest common divisor', 'euclidean algorithm'],
    bruteForce: {
      tc: 'O(min(a,b))',
      sc: 'O(1)',
      algorithm: 'Check all numbers from min down to 1',
      name: 'Linear Search',
    },
    better: null,
    optimal: {
      tc: 'O(log(min(a,b)))',
      sc: 'O(1)',
      algorithm: 'Euclidean algorithm',
      name: 'Euclidean',
    },
    note: 'Euclidean algorithm is optimal for GCD.',
  },

  fibonacci: {
    patterns: ['fibonacci', 'fib', 'fibonacci number'],
    bruteForce: {
      tc: 'O(2^n)',
      sc: 'O(n)',
      algorithm: 'Naive recursion',
      name: 'Recursion',
    },
    better: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Memoization or DP',
      name: 'DP',
    },
    optimal: {
      tc: 'O(log n)',
      sc: 'O(1)',
      algorithm: 'Matrix exponentiation',
      name: 'Matrix Exponentiation',
    },
    note: 'Matrix exponentiation achieves O(log n) for nth Fibonacci.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // GRAPH ALGORITHMS (COMPETITIVE PROGRAMMING)
  // ═══════════════════════════════════════════════════════════════════════════════

  pathwithmaximumgold: {
    patterns: ['path with maximum gold', 'maximum gold', 'gold mine path'],
    hasOptimizationLadder: false,
    bruteForce: {
      tc: 'O(k * 3^k)',
      sc: 'O(k)',
      algorithm: 'Standard Backtracking',
      name: 'Backtracking',
      tcReason: 'Time is O(k * 3^k). Standard DFS checks all valid paths.',
      scReason: 'Space is O(k) for recursion stack.',
    },
    better: null,
    optimal: {
      tc: 'O(k * 3^k)',
      sc: 'O(k)',
      algorithm: 'Standard Backtracking',
      name: 'Backtracking',
      tcReason: 'Time is O(k * 3^k). Same as standard approach.',
      scReason: 'Space is O(k) for recursion stack.',
    },
    note: 'Standard backtracking is the only optimal approach. No efficient DP exists.',
  },

  morristraversal: {
    patterns: ['morris traversal', 'morris inorder', 'threaded tree'],
    hasOptimizationLadder: false,
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(h)',
      algorithm: 'Recursive or stack-based inorder traversal',
      name: 'Standard Inorder',
      scReason: 'Recursion uses O(h) stack space.',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Morris traversal using threaded binary tree',
      name: 'Morris Traversal',
      scReason: 'Threaded binary tree uses O(1) auxiliary space.',
    },
    note: 'All inorder traversals take O(n) time. Morris reduces auxiliary space from O(h) to O(1).',
  },

  wordsearch: {
    patterns: ['word search', 'word search i', 'find word in grid'],
    bruteForce: {
      tc: 'O(N * 3^L)',
      sc: 'O(L)',
      algorithm: 'DFS Backtracking from each cell',
      name: 'Backtracking',
      tcReason:
        'N cells * 3^L checks (branching factor 3) where L is word length.',
    },
    better: null,
    optimal: {
      tc: 'O(N * 3^L)',
      sc: 'O(L)',
      algorithm: 'Backtracking with Pruning',
      name: 'Backtracking',
    },
    note: 'Standard backtracking is the only correct approach. Pruning helps but complexity remains exponential.',
  },

  uniquepathsiii: {
    patterns: [
      'unique paths iii',
      'unique paths 3',
      'walk over every empty square',
    ],
    bruteForce: {
      tc: 'O(3^N)',
      sc: 'O(N)',
      algorithm: 'DFS Backtracking',
      name: 'Backtracking',
      tcReason: 'Must visit every 0-cell exactly once. Branching factor 3.',
    },
    better: null,
    optimal: {
      tc: 'O(3^N)',
      sc: 'O(N)',
      algorithm: 'DFS Backtracking',
      name: 'Backtracking',
    },
    note: 'Must verify all non-obstacle cells are visited. Backtracking is required.',
  },

  dijkstra: {
    patterns: ['dijkstra', 'shortest path', 'single source shortest path'],
    bruteForce: {
      tc: 'O(V²)',
      sc: 'O(V)',
      algorithm: 'Linear search for minimum distance',
      name: 'Array-based Dijkstra',
    },
    better: null,
    optimal: {
      tc: 'O((V + E) log V)',
      sc: 'O(V)',
      algorithm: 'Priority queue (min heap)',
      name: 'Heap-based Dijkstra',
    },
    note: 'Heap optimization reduces from O(V²) to O((V+E) log V).',
  },

  bellmanford: {
    patterns: ['bellman ford', 'bellman-ford', 'negative weights'],
    bruteForce: {
      tc: 'O(V * E)',
      sc: 'O(V)',
      algorithm: 'Relax all edges V-1 times',
      name: 'Standard Bellman-Ford',
    },
    better: null,
    optimal: {
      tc: 'O(V * E)',
      sc: 'O(V)',
      algorithm: 'Same (already optimal for negative weights)',
      name: 'Bellman-Ford',
    },
    note: 'Bellman-Ford is already optimal for graphs with negative weights.',
  },

  floydwarshall: {
    patterns: ['floyd warshall', 'floyd-warshall', 'all pairs shortest path'],
    bruteForce: {
      tc: 'O(V³)',
      sc: 'O(V²)',
      algorithm: 'Dynamic programming with 3 nested loops',
      name: 'Floyd-Warshall',
    },
    better: null,
    optimal: {
      tc: 'O(V³)',
      sc: 'O(V²)',
      algorithm: 'Same (already optimal for dense graphs)',
      name: 'Floyd-Warshall',
    },
    note: 'Floyd-Warshall is already optimal for all-pairs shortest path.',
  },

  kruskal: {
    patterns: ['kruskal', 'minimum spanning tree', 'mst'],
    bruteForce: {
      tc: 'O(E²)',
      sc: 'O(V)',
      algorithm: 'Sort edges, check cycles naively',
      name: 'Naive Kruskal',
    },
    better: null,
    optimal: {
      tc: 'O(E log E)',
      sc: 'O(V)',
      algorithm: 'Sort edges + Union-Find',
      name: 'Kruskal with Union-Find',
    },
    note: 'Union-Find makes cycle detection O(α(V)) amortized.',
  },

  topologicalsort: {
    patterns: ['topological sort', 'topo sort', 'dag ordering'],
    bruteForce: {
      tc: 'O(V + E)',
      sc: 'O(V)',
      algorithm: 'DFS-based topological sort',
      name: 'DFS',
    },
    better: null,
    optimal: {
      tc: 'O(V + E)',
      sc: 'O(V)',
      algorithm: "Kahn's algorithm (BFS)",
      name: "Kahn's Algorithm",
    },
    note: "Both DFS and Kahn's are O(V+E), already optimal.",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADVANCED DATA STRUCTURES (TRICKY COMPLEXITY)
  // ═══════════════════════════════════════════════════════════════════════════════

  lrucache: {
    patterns: ['lru cache', 'lru', 'least recently used'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Array with linear search',
      name: 'Array-based',
    },
    better: null,
    optimal: {
      tc: 'O(1)',
      sc: 'O(n)',
      algorithm: 'Hash map + doubly linked list',
      name: 'HashMap + DLL',
    },
    note: 'Hash map + DLL achieves O(1) for get and put.',
  },

  medianfinder: {
    patterns: [
      'median finder',
      'find median',
      'running median',
      'median from data stream',
    ],
    bruteForce: {
      tc: 'O(n log n)',
      sc: 'O(n)',
      algorithm: 'Sort array on each query',
      name: 'Sort on Query',
    },
    better: null,
    optimal: {
      tc: 'O(log n)',
      sc: 'O(n)',
      algorithm: 'Two heaps (max heap + min heap)',
      name: 'Two Heaps',
    },
    note: 'Two heaps maintain median in O(log n) per operation.',
  },

  segmenttree: {
    patterns: ['segment tree', 'range query', 'range sum'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Iterate range for each query',
      name: 'Linear Scan',
    },
    better: {
      tc: 'O(√n)',
      sc: 'O(√n)',
      algorithm: 'Square root decomposition',
      name: 'Sqrt Decomposition',
    },
    optimal: {
      tc: 'O(log n)',
      sc: 'O(n)',
      algorithm: 'Segment tree or Fenwick tree',
      name: 'Segment Tree',
    },
    note: 'Segment tree achieves O(log n) for range queries and updates.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // BIT MANIPULATION (CONFUSING COMPLEXITY)
  // ═══════════════════════════════════════════════════════════════════════════════

  singlenumber: {
    patterns: ['single number', 'find single', 'unique number'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Hash set to track seen numbers',
      name: 'Hash Set',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'XOR all numbers',
      name: 'XOR',
    },
    note: 'XOR achieves O(1) space vs O(n) for hash set.',
  },

  countingbits: {
    patterns: ['counting bits', 'count bits', 'hamming weight'],
    bruteForce: {
      tc: 'O(n log n)',
      sc: 'O(1)',
      algorithm: 'Check each bit for each number',
      name: 'Bit Checking',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'DP: bits[i] = bits[i>>1] + (i&1)',
      name: 'DP',
    },
    note: 'DP reduces from O(n log n) to O(n).',
  },

  reversebits: {
    patterns: ['reverse bits', 'bit reversal'],
    bruteForce: {
      tc: 'O(log n)',
      sc: 'O(1)',
      algorithm: 'Extract and reverse each bit',
      name: 'Bit Manipulation',
    },
    better: null,
    optimal: {
      tc: 'O(1)',
      sc: 'O(1)',
      algorithm: 'Divide and conquer with masks',
      name: 'Mask-based',
    },
    note: 'For 32-bit integers, O(log n) = O(1).',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // GREEDY ALGORITHMS (TRICKY PROOFS)
  // ═══════════════════════════════════════════════════════════════════════════════

  jumpgame: {
    patterns: ['jump game', 'can jump', 'jump to end'],
    bruteForce: {
      tc: 'O(2^n)',
      sc: 'O(n)',
      algorithm: 'Try all possible jumps recursively',
      name: 'Recursion',
    },
    better: {
      tc: 'O(n²)',
      sc: 'O(n)',
      algorithm: 'DP checking reachability',
      name: 'DP',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Greedy: track max reachable',
      name: 'Greedy',
    },
    note: 'Greedy works because we only need to know if end is reachable.',
  },

  gasstation: {
    patterns: ['gas station', 'circular tour'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'Try each station as start',
      name: 'Try All Starts',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Greedy: single pass tracking surplus',
      name: 'Greedy',
    },
    note: 'Greedy works: if total gas ≥ total cost, solution exists.',
  },

  partitionlabels: {
    patterns: ['partition labels', 'partition string'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'For each position, scan ahead',
      name: 'Nested Scan',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Greedy: track last occurrence',
      name: 'Greedy',
    },
    note: 'Precompute last occurrence, then greedy partition.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADVANCED DP (CONFUSING STATE TRANSITIONS)
  // ═══════════════════════════════════════════════════════════════════════════════

  knapsack01: {
    patterns: ['0 1 knapsack', '01 knapsack', 'knapsack'],
    bruteForce: {
      tc: 'O(2^n)',
      sc: 'O(n)',
      algorithm: 'Try all subsets',
      name: 'Recursion',
    },
    better: {
      tc: 'O(n * W)',
      sc: 'O(n * W)',
      algorithm: '2D DP table',
      name: '2D DP',
    },
    optimal: {
      tc: 'O(n * W)',
      sc: 'O(W)',
      algorithm: 'Space-optimized DP',
      name: '1D DP',
    },
    note: 'Space optimization from O(n*W) to O(W).',
  },

  longestpalindromicsubstring: {
    patterns: ['longest palindromic substring', 'longest palindrome'],
    bruteForce: {
      tc: 'O(n³)',
      sc: 'O(1)',
      algorithm: 'Check all substrings',
      name: 'Brute Force',
    },
    better: {
      tc: 'O(n²)',
      sc: 'O(n²)',
      algorithm: 'DP table',
      name: 'DP',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: "Manacher's algorithm",
      name: "Manacher's",
    },
    note: "Manacher's algorithm achieves linear time.",
  },

  regularexpressionmatching: {
    patterns: ['regular expression', 'regex matching', 'wildcard matching'],
    bruteForce: {
      tc: 'O(2^(n+m))',
      sc: 'O(n+m)',
      algorithm: 'Backtracking',
      name: 'Backtracking',
    },
    better: null,
    optimal: {
      tc: 'O(n*m)',
      sc: 'O(n*m)',
      algorithm: '2D DP',
      name: 'DP',
    },
    note: 'DP reduces exponential to polynomial time.',
  },

  wordbreak: {
    patterns: ['word break', 'word break problem'],
    bruteForce: {
      tc: 'O(2^n)',
      sc: 'O(n)',
      algorithm: 'Try all partitions',
      name: 'Recursion',
    },
    better: {
      tc: 'O(n² * m)',
      sc: 'O(n)',
      algorithm: 'DP with string comparison',
      name: 'DP',
    },
    optimal: {
      tc: 'O(n²)',
      sc: 'O(n)',
      algorithm: 'DP with trie or hash set',
      name: 'DP + Hash',
    },
    note: 'Trie or hash set makes word lookup O(1) amortized.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SPECIAL CASES (AI OFTEN GETS WRONG)
  // ═══════════════════════════════════════════════════════════════════════════════

  productarrayexceptself: {
    patterns: ['product except self', 'product array'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'For each position, multiply all others',
      name: 'Nested Loops',
    },
    better: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Prefix and suffix product arrays',
      name: 'Prefix/Suffix',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Single output array with two passes',
      name: 'Space-Optimized',
    },
    note: "Output array doesn't count toward space complexity.",
  },

  rotatearray: {
    patterns: ['rotate array', 'array rotation'],
    bruteForce: {
      tc: 'O(n*k)',
      sc: 'O(1)',
      algorithm: 'Rotate one position k times',
      name: 'One by One',
    },
    better: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Use extra array',
      name: 'Extra Array',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Reverse algorithm (3 reversals)',
      name: 'Reversal',
    },
    note: 'Reverse entire, then reverse first k, then reverse rest.',
  },

  findduplicatenumber: {
    patterns: ['find duplicate', 'duplicate number', 'find the duplicate'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'Compare all pairs',
      name: 'Nested Loops',
    },
    better: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Hash set',
      name: 'Hash Set',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: "Floyd's cycle detection (treat as linked list)",
      name: "Floyd's Algorithm",
    },
    note: 'Treat array as linked list where arr[i] points to arr[arr[i]].',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADVANCED TREES (COMMONLY MISSED)
  // ═══════════════════════════════════════════════════════════════════════════════

  lowestcommonancestor: {
    patterns: ['lowest common ancestor', 'lca', 'common ancestor'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Store path to both nodes, find intersection',
      name: 'Path Storage',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(h)',
      algorithm: 'Recursive DFS',
      name: 'Recursive',
    },
    note: 'Both are O(n) time but optimal uses O(h) space vs O(n).',
  },

  serializedeserialize: {
    patterns: ['serialize deserialize', 'serialize tree', 'deserialize tree'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Level-order traversal with markers',
      name: 'BFS Serialization',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Preorder with null markers',
      name: 'DFS Serialization',
    },
    note: 'Both are O(n), choice depends on implementation preference.',
  },

  binarytreecameras: {
    patterns: ['binary tree cameras', 'camera placement', 'minimum cameras'],
    bruteForce: {
      tc: 'O(2^n)',
      sc: 'O(n)',
      algorithm: 'Try all camera placements',
      name: 'Backtracking',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(h)',
      algorithm: 'Greedy DFS with states',
      name: 'Greedy DFS',
    },
    note: 'Greedy works: place cameras from bottom up.',
  },

  verticalordertraversal: {
    patterns: ['vertical order', 'vertical traversal'],
    bruteForce: {
      tc: 'O(n log n)',
      sc: 'O(n)',
      algorithm: 'BFS with coordinate tracking and sorting',
      name: 'BFS + Sort',
    },
    better: null,
    optimal: {
      tc: 'O(n log n)',
      sc: 'O(n)',
      algorithm: 'DFS with map and sorting',
      name: 'DFS + Map',
    },
    note: 'Sorting is required, making O(n log n) optimal.',
  },

  morristraversal: {
    patterns: ['morris traversal', 'morris inorder', 'threaded tree'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(h)',
      algorithm: 'Recursive or stack-based inorder',
      name: 'Standard Inorder',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Morris traversal (threading)',
      name: 'Morris',
    },
    note: 'Morris achieves O(1) space by temporarily modifying tree.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADVANCED GRAPHS (RARE ALGORITHMS)
  // ═══════════════════════════════════════════════════════════════════════════════

  tarjanscc: {
    patterns: ['tarjan', 'strongly connected components', 'scc'],
    bruteForce: {
      tc: 'O(V * (V + E))',
      sc: 'O(V)',
      algorithm: 'DFS from each vertex',
      name: 'Naive DFS',
    },
    better: null,
    optimal: {
      tc: 'O(V + E)',
      sc: 'O(V)',
      algorithm: "Tarjan's algorithm (single DFS)",
      name: "Tarjan's",
    },
    note: "Tarjan's uses low-link values for single-pass SCC.",
  },

  articulationpoints: {
    patterns: ['articulation points', 'cut vertices', 'critical nodes'],
    bruteForce: {
      tc: 'O(V * (V + E))',
      sc: 'O(V)',
      algorithm: 'Remove each vertex and check connectivity',
      name: 'Brute Force',
    },
    better: null,
    optimal: {
      tc: 'O(V + E)',
      sc: 'O(V)',
      algorithm: 'DFS with discovery and low times',
      name: 'DFS',
    },
    note: 'Single DFS pass with low-link values.',
  },

  bridges: {
    patterns: ['bridges', 'critical edges', 'critical connections'],
    bruteForce: {
      tc: 'O(E * (V + E))',
      sc: 'O(V)',
      algorithm: 'Remove each edge and check connectivity',
      name: 'Brute Force',
    },
    better: null,
    optimal: {
      tc: 'O(V + E)',
      sc: 'O(V)',
      algorithm: 'DFS with discovery and low times',
      name: 'DFS',
    },
    note: 'Same as articulation points but for edges.',
  },

  bipartitegraph: {
    patterns: ['bipartite', 'is bipartite', 'two coloring'],
    bruteForce: {
      tc: 'O(V + E)',
      sc: 'O(V)',
      algorithm: 'BFS/DFS with coloring',
      name: 'Graph Coloring',
    },
    better: null,
    optimal: {
      tc: 'O(V + E)',
      sc: 'O(V)',
      algorithm: 'Same (already optimal)',
      name: 'BFS/DFS',
    },
    note: 'Graph coloring is already optimal for bipartite check.',
  },

  euleriancircuit: {
    patterns: ['eulerian circuit', 'eulerian path', 'hierholzer'],
    bruteForce: {
      tc: 'O(E!)',
      sc: 'O(E)',
      algorithm: 'Try all edge orderings',
      name: 'Backtracking',
    },
    better: null,
    optimal: {
      tc: 'O(E)',
      sc: 'O(E)',
      algorithm: "Hierholzer's algorithm",
      name: "Hierholzer's",
    },
    note: "Hierholzer's finds Eulerian path in linear time.",
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADVANCED STRINGS (TRICKY PATTERNS)
  // ═══════════════════════════════════════════════════════════════════════════════

  kmp: {
    patterns: [
      'kmp',
      'knuth morris pratt',
      'pattern matching',
      'string matching',
    ],
    bruteForce: {
      tc: 'O(n*m)',
      sc: 'O(1)',
      algorithm: 'Naive pattern matching',
      name: 'Brute Force',
    },
    better: null,
    optimal: {
      tc: 'O(n+m)',
      sc: 'O(m)',
      algorithm: 'KMP with LPS array',
      name: 'KMP',
    },
    note: 'KMP uses LPS (Longest Prefix Suffix) for O(n+m).',
  },

  rabinkarp: {
    patterns: ['rabin karp', 'rabin-karp', 'rolling hash'],
    bruteForce: {
      tc: 'O(n*m)',
      sc: 'O(1)',
      algorithm: 'Naive pattern matching',
      name: 'Brute Force',
    },
    better: null,
    optimal: {
      tc: 'O(n+m)',
      sc: 'O(1)',
      algorithm: 'Rabin-Karp with rolling hash',
      name: 'Rabin-Karp',
    },
    note: 'Rolling hash achieves O(n+m) average case.',
  },

  zfunction: {
    patterns: ['z function', 'z algorithm', 'z array'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(n)',
      algorithm: 'Compute Z-array naively',
      name: 'Naive',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Z-algorithm with optimization',
      name: 'Z-Algorithm',
    },
    note: 'Z-algorithm computes longest substring match in O(n).',
  },

  suffixarray: {
    patterns: ['suffix array', 'suffix tree'],
    bruteForce: {
      tc: 'O(n² log n)',
      sc: 'O(n)',
      algorithm: 'Sort all suffixes',
      name: 'Naive Sort',
    },
    better: {
      tc: 'O(n log² n)',
      sc: 'O(n)',
      algorithm: 'Prefix doubling',
      name: 'Prefix Doubling',
    },
    optimal: {
      tc: 'O(n log n)',
      sc: 'O(n)',
      algorithm: 'Optimized prefix doubling',
      name: 'Optimized',
    },
    note: 'Suffix array construction can be done in O(n log n).',
  },

  'aho corasick': {
    patterns: ['aho corasick', 'aho-corasick', 'multiple pattern matching'],
    bruteForce: {
      tc: 'O(n*m*k)',
      sc: 'O(1)',
      algorithm: 'Match each pattern separately',
      name: 'Brute Force',
    },
    better: null,
    optimal: {
      tc: 'O(n + m + z)',
      sc: 'O(m)',
      algorithm: 'Aho-Corasick automaton',
      name: 'Aho-Corasick',
    },
    note: 'Aho-Corasick matches multiple patterns in single pass.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // INTERVAL PROBLEMS (COMMONLY CONFUSED)
  // ═══════════════════════════════════════════════════════════════════════════════

  insertinterval: {
    patterns: ['insert interval', 'add interval'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(n)',
      algorithm: 'Insert and merge all overlapping',
      name: 'Brute Force',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Single pass with three phases',
      name: 'Linear Scan',
    },
    note: 'Three phases: before, merge, after.',
  },

  nonoverlappingintervals: {
    patterns: ['non overlapping intervals', 'erase overlap intervals'],
    bruteForce: {
      tc: 'O(2^n)',
      sc: 'O(n)',
      algorithm: 'Try all removal combinations',
      name: 'Backtracking',
    },
    better: null,
    optimal: {
      tc: 'O(n log n)',
      sc: 'O(1)',
      algorithm: 'Greedy: sort by end time',
      name: 'Greedy',
    },
    note: 'Greedy works: keep intervals with earliest end time.',
  },

  meetingrooms: {
    patterns: ['meeting rooms', 'can attend meetings'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'Check all pairs for overlap',
      name: 'Brute Force',
    },
    better: null,
    optimal: {
      tc: 'O(n log n)',
      sc: 'O(1)',
      algorithm: 'Sort and check adjacent',
      name: 'Sort',
    },
    note: 'Sort by start time, check adjacent intervals.',
  },

  meetingroomsii: {
    patterns: ['meeting rooms ii', 'minimum meeting rooms'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(n)',
      algorithm: 'Simulate room allocation',
      name: 'Simulation',
    },
    better: {
      tc: 'O(n log n)',
      sc: 'O(n)',
      algorithm: 'Min heap for end times',
      name: 'Min Heap',
    },
    optimal: {
      tc: 'O(n log n)',
      sc: 'O(n)',
      algorithm: 'Chronological ordering (sweep line)',
      name: 'Sweep Line',
    },
    note: 'Both better and optimal are O(n log n), different approaches.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADVANCED DP (ULTRA TRICKY)
  // ═══════════════════════════════════════════════════════════════════════════════

  longestincreasingpath: {
    patterns: ['longest increasing path', 'lip matrix'],
    bruteForce: {
      tc: 'O(2^(m*n))',
      sc: 'O(m*n)',
      algorithm: 'DFS from each cell',
      name: 'Naive DFS',
    },
    better: null,
    optimal: {
      tc: 'O(m*n)',
      sc: 'O(m*n)',
      algorithm: 'DFS with memoization',
      name: 'DP + DFS',
    },
    note: 'Memoization prevents recomputation.',
  },

  burstballoons: {
    patterns: ['burst balloons', 'balloon burst'],
    bruteForce: {
      tc: 'O(n!)',
      sc: 'O(n)',
      algorithm: 'Try all burst orders',
      name: 'Backtracking',
    },
    better: null,
    optimal: {
      tc: 'O(n³)',
      sc: 'O(n²)',
      algorithm: 'Interval DP',
      name: 'Interval DP',
    },
    note: 'Think backwards: which balloon to burst last.',
  },

  stonesgame: {
    patterns: ['stones game', 'stone game'],
    bruteForce: {
      tc: 'O(2^n)',
      sc: 'O(n)',
      algorithm: 'Minimax recursion',
      name: 'Minimax',
    },
    better: {
      tc: 'O(n²)',
      sc: 'O(n²)',
      algorithm: '2D DP',
      name: '2D DP',
    },
    optimal: {
      tc: 'O(n²)',
      sc: 'O(n)',
      algorithm: 'Space-optimized DP',
      name: '1D DP',
    },
    note: 'Game theory DP with space optimization.',
  },

  distinctsubsequences: {
    patterns: ['distinct subsequences', 'number of subsequences'],
    bruteForce: {
      tc: 'O(2^n)',
      sc: 'O(n)',
      algorithm: 'Generate all subsequences',
      name: 'Backtracking',
    },
    better: {
      tc: 'O(n*m)',
      sc: 'O(n*m)',
      algorithm: '2D DP',
      name: '2D DP',
    },
    optimal: {
      tc: 'O(n*m)',
      sc: 'O(m)',
      algorithm: 'Space-optimized DP',
      name: '1D DP',
    },
    note: 'Classic DP with space optimization.',
  },

  interleavingstring: {
    patterns: ['interleaving string', 'is interleave'],
    bruteForce: {
      tc: 'O(2^(n+m))',
      sc: 'O(n+m)',
      algorithm: 'Backtracking',
      name: 'Backtracking',
    },
    better: {
      tc: 'O(n*m)',
      sc: 'O(n*m)',
      algorithm: '2D DP',
      name: '2D DP',
    },
    optimal: {
      tc: 'O(n*m)',
      sc: 'O(m)',
      algorithm: 'Space-optimized DP',
      name: '1D DP',
    },
    note: 'DP with rolling array optimization.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // MONOTONIC STACK/QUEUE (TRICKY PATTERNS)
  // ═══════════════════════════════════════════════════════════════════════════════

  maximalrectangle: {
    patterns: ['maximal rectangle', 'largest rectangle matrix'],
    bruteForce: {
      tc: 'O(m²*n²)',
      sc: 'O(1)',
      algorithm: 'Check all rectangles',
      name: 'Brute Force',
    },
    better: {
      tc: 'O(m*n²)',
      sc: 'O(n)',
      algorithm: 'Histogram for each row',
      name: 'Histogram',
    },
    optimal: {
      tc: 'O(m*n)',
      sc: 'O(n)',
      algorithm: 'Monotonic stack for each row',
      name: 'Monotonic Stack',
    },
    note: 'Treat each row as base of histogram.',
  },

  sumofsubarrayminimums: {
    patterns: ['sum of subarray minimums', 'subarray min sum'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'Find min for each subarray',
      name: 'Brute Force',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Monotonic stack with contribution',
      name: 'Monotonic Stack',
    },
    note: 'Calculate contribution of each element as minimum.',
  },

  sumofsubarrayranges: {
    patterns: ['sum of subarray ranges', 'subarray range sum'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'Find range for each subarray',
      name: 'Brute Force',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Two monotonic stacks (max and min)',
      name: 'Monotonic Stack',
    },
    note: 'Sum of max minus sum of min.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADVANCED BIT MANIPULATION (RARE)
  // ═══════════════════════════════════════════════════════════════════════════════

  singlenumberii: {
    patterns: [
      'single number ii',
      'single number 2',
      'appears once others thrice',
    ],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Hash map counting',
      name: 'Hash Map',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Bit manipulation with ones/twos',
      name: 'Bit Magic',
    },
    note: 'Track bits appearing 1, 2, or 3 times.',
  },

  singlenumberiii: {
    patterns: ['single number iii', 'single number 3', 'two unique numbers'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Hash set',
      name: 'Hash Set',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'XOR with bit partitioning',
      name: 'XOR Partition',
    },
    note: 'XOR all, then partition by differing bit.',
  },

  maximumxor: {
    patterns: ['maximum xor', 'max xor', 'xor maximum'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(1)',
      algorithm: 'Check all pairs',
      name: 'Brute Force',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Trie of binary representations',
      name: 'Binary Trie',
    },
    note: 'Trie allows greedy bit selection.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SLIDING WINDOW (ADVANCED)
  // ═══════════════════════════════════════════════════════════════════════════════

  subarraywithkdifferent: {
    patterns: ['subarray k different', 'k distinct integers'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(k)',
      algorithm: 'Check all subarrays',
      name: 'Brute Force',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(k)',
      algorithm: 'Sliding window: atMost(k) - atMost(k-1)',
      name: 'Sliding Window',
    },
    note: 'Trick: exactly k = atMost(k) - atMost(k-1).',
  },

  longestsubstringkdistinct: {
    patterns: ['longest substring k distinct', 'k distinct characters'],
    bruteForce: {
      tc: 'O(n²)',
      sc: 'O(k)',
      algorithm: 'Check all substrings',
      name: 'Brute Force',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(k)',
      algorithm: 'Sliding window with hash map',
      name: 'Sliding Window',
    },
    note: 'Expand right, contract left when k exceeded.',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SPECIAL ALGORITHMS (RARE BUT IMPORTANT)
  // ═══════════════════════════════════════════════════════════════════════════════

  reservoirsampling: {
    patterns: ['reservoir sampling', 'random sample stream'],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Store all, then random select',
      name: 'Store All',
    },
    better: null,
    optimal: {
      tc: 'O(n)',
      sc: 'O(k)',
      algorithm: 'Reservoir sampling algorithm',
      name: 'Reservoir',
    },
    note: 'Sample k items from stream of unknown size.',
  },

  kthsmallestbst: {
    patterns: [
      'kth smallest element in a bst',
      'kth smallest bst',
      'kth smallest in bst',
    ],
    bruteForce: {
      tc: 'O(n)',
      sc: 'O(n)',
      algorithm: 'Inorder Traversal to Array',
      name: 'Inorder Array',
    },
    better: null,
    optimal: {
      tc: 'O(n)', // Worst case visit all nodes
      sc: 'O(h)',
      algorithm: 'Iterative Inorder Traversal',
      name: 'Iterative Inorder',
    },
    note: 'Inorder traversal finds elements in sorted order. O(h) space is optimal.',
  },

  quickselect: {
    patterns: [
      'quick select',
      'kth largest element in an array',
      'kth smallest element in an array',
    ],
    bruteForce: {
      tc: 'O(n log n)',
      sc: 'O(1)',
      algorithm: 'Sort and return kth',
      name: 'Sort',
    },
    better: {
      tc: 'O(n log k)',
      sc: 'O(k)',
      algorithm: 'Min/Max heap',
      name: 'Heap',
    },
    optimal: {
      tc: 'O(n)',
      sc: 'O(1)',
      algorithm: 'Quickselect (average case)',
      name: 'Quickselect',
    },
    note: 'Quickselect is O(n) average, O(n²) worst case.',
  },

  medianoftwosortedarrays: {
    patterns: ['median two sorted', 'median of two arrays'],
    bruteForce: {
      tc: 'O(m+n)',
      sc: 'O(m+n)',
      algorithm: 'Merge and find median',
      name: 'Merge',
    },
    better: {
      tc: 'O(m+n)',
      sc: 'O(1)',
      algorithm: 'Two pointers without merge',
      name: 'Two Pointers',
    },
    optimal: {
      tc: 'O(log(min(m,n)))',
      sc: 'O(1)',
      algorithm: 'Binary search on smaller array',
      name: 'Binary Search',
    },
    note: 'Binary search finds partition in O(log(min(m,n))).',
  },

  coinchange: {
    patterns: ['coin change', 'minimum coins', 'fewest coins'],
    bruteForce: {
      tc: 'Exponential (k^amount)',
      sc: 'O(amount)',
      algorithm: 'Recursion (Brute Force)',
      name: 'Recursion',
    },
    better: null,
    optimal: {
      tc: 'O(n * amount)',
      sc: 'O(amount)',
      algorithm: 'DP (Top-Down or Bottom-Up)',
      name: 'Dynamic Programming',
    },
    note: 'Brute force is exponential. DP reduces it to pseudo-polynomial O(n*amount).',
  },
};

/**
 * Normalize problem name for matching
 */
function normalizeProblemName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[-_\s]+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Find ground truth for a problem
 * @param {string} problemName - The problem name to look up
 * @returns {Object|null} Ground truth data or null if not found
 */
export function findGroundTruth(problemName) {
  const normalized = normalizeProblemName(problemName);

  // Direct key match
  if (PROBLEM_GROUND_TRUTH[normalized]) {
    return PROBLEM_GROUND_TRUTH[normalized];
  }

  // Pattern matching
  for (const [key, data] of Object.entries(PROBLEM_GROUND_TRUTH)) {
    if (data.patterns) {
      for (const pattern of data.patterns) {
        const normalizedPattern = normalizeProblemName(pattern);
        if (
          normalized.includes(normalizedPattern) ||
          normalizedPattern.includes(normalized)
        ) {
          return data;
        }
      }
    }
  }

  return null;
}

/**
 * Validate AI-generated solution against ground truth
 * @param {string} problemName - Problem name
 * @param {Object} aiSolution - AI-generated solution with bruteForce, better, optimal
 * @returns {Object} Validation result with corrections
 */
export function validateAgainstGroundTruth(problemName, aiSolution) {
  const groundTruth = findGroundTruth(problemName);

  if (!groundTruth) {
    return {
      found: false,
      corrections: [],
      validated: false,
    };
  }

  const corrections = [];
  let needsCorrection = false;

  // Validate brute force
  if (aiSolution.bruteForce && groundTruth.bruteForce) {
    const aiTC = normalizeProblemName(
      aiSolution.bruteForce.timeComplexity || ''
    );
    const truthTC = normalizeProblemName(groundTruth.bruteForce.tc);

    if (aiTC !== truthTC) {
      corrections.push({
        approach: 'bruteForce',
        field: 'timeComplexity',
        aiValue: aiSolution.bruteForce.timeComplexity,
        correctValue: groundTruth.bruteForce.tc,
        reason: `Ground truth from Striver's sheet: ${groundTruth.bruteForce.algorithm}`,
      });
      needsCorrection = true;
    }
  }

  // Validate better approach existence
  if (
    (groundTruth.better === null ||
      groundTruth.hasOptimizationLadder === false) &&
    aiSolution.better !== null
  ) {
    corrections.push({
      approach: 'better',
      field: 'existence',
      aiValue: 'exists',
      correctValue: 'should be null',
      reason:
        groundTruth.hasOptimizationLadder === false
          ? 'This problem does not have an optimization ladder.'
          : groundTruth.note ||
            'No intermediate approach exists for this problem',
    });
    needsCorrection = true;
  }

  if (groundTruth.better !== null && aiSolution.better === null) {
    corrections.push({
      approach: 'better',
      field: 'existence',
      aiValue: 'null',
      correctValue: 'should exist',
      reason: `Missing better approach: ${groundTruth.better.algorithm}`,
    });
    needsCorrection = true;
  }

  // Validate optimal
  if (aiSolution.optimal && groundTruth.optimal) {
    const aiTC = normalizeProblemName(aiSolution.optimal.timeComplexity || '');
    const truthTC = normalizeProblemName(groundTruth.optimal.tc);

    if (aiTC !== truthTC) {
      corrections.push({
        approach: 'optimal',
        field: 'timeComplexity',
        aiValue: aiSolution.optimal.timeComplexity,
        correctValue: groundTruth.optimal.tc,
        reason: `Ground truth from Striver's sheet: ${groundTruth.optimal.algorithm}`,
      });
      needsCorrection = true;
    }
  }

  return {
    found: true,
    groundTruth,
    corrections,
    needsCorrection,
    validated: !needsCorrection,
  };
}

/**
 * Apply ground truth corrections to AI solution
 * @param {Object} aiSolution - AI-generated solution
 * @param {Object} groundTruth - Ground truth data
 * @returns {Object} Corrected solution
 */
export function applyGroundTruthCorrections(aiSolution, groundTruth) {
  const corrected = JSON.parse(JSON.stringify(aiSolution)); // Deep clone

  // Helper to generate consistent reason
  const generateReason = (name, complexity, type, customReason) => {
    if (customReason) return customReason;
    return `The ${name} approach determines the ${type} complexity of ${complexity}.`;
  };

  // Apply brute force corrections
  if (groundTruth.bruteForce) {
    if (!corrected.bruteForce) corrected.bruteForce = {};
    corrected.bruteForce.timeComplexity = groundTruth.bruteForce.tc;
    corrected.bruteForce.spaceComplexity = groundTruth.bruteForce.sc;

    // FORCE overwrite name to match canonical ground truth name
    corrected.bruteForce.name = groundTruth.bruteForce.name;

    // FORCE overwrite reasons to prevent contradictory AI explanations
    corrected.bruteForce.timeComplexityReason = generateReason(
      groundTruth.bruteForce.name,
      groundTruth.bruteForce.tc,
      'time',
      groundTruth.bruteForce.tcReason
    );
    corrected.bruteForce.spaceComplexityReason = generateReason(
      groundTruth.bruteForce.name,
      groundTruth.bruteForce.sc,
      'space',
      groundTruth.bruteForce.scReason
    );

    // Overwrite complexityNote to match ground truth
    if (groundTruth.note) {
      corrected.bruteForce.complexityNote = groundTruth.note;
    }
  }

  // Apply better approach corrections
  if (
    groundTruth.better === null ||
    groundTruth.hasOptimizationLadder === false
  ) {
    corrected.better = null;
  } else if (groundTruth.better && corrected.better) {
    corrected.better.timeComplexity = groundTruth.better.tc;
    corrected.better.spaceComplexity = groundTruth.better.sc;

    // FORCE overwrite name
    corrected.better.name = groundTruth.better.name;

    // FORCE overwrite reasons
    corrected.better.timeComplexityReason = generateReason(
      groundTruth.better.name,
      groundTruth.better.tc,
      'time',
      groundTruth.better.tcReason
    );
    corrected.better.spaceComplexityReason = generateReason(
      groundTruth.better.name,
      groundTruth.better.sc,
      'space',
      groundTruth.better.scReason
    );

    // Overwrite complexityNote to match ground truth
    if (groundTruth.note) {
      corrected.better.complexityNote = groundTruth.note;
    }
  }

  // Apply optimal corrections
  if (groundTruth.optimal && corrected.optimal) {
    corrected.optimal.timeComplexity = groundTruth.optimal.tc;
    corrected.optimal.spaceComplexity = groundTruth.optimal.sc;

    // FORCE overwrite name
    corrected.optimal.name = groundTruth.optimal.name;

    // FORCE overwrite reasons
    corrected.optimal.timeComplexityReason = generateReason(
      groundTruth.optimal.name,
      groundTruth.optimal.tc,
      'time',
      groundTruth.optimal.tcReason
    );
    corrected.optimal.spaceComplexityReason = generateReason(
      groundTruth.optimal.name,
      groundTruth.optimal.sc,
      'space',
      groundTruth.optimal.scReason
    );

    // Overwrite complexityNote to match ground truth
    if (groundTruth.note) {
      corrected.optimal.complexityNote = groundTruth.note;
    }
  }

  // FORCE overwrite note with ground truth (AI often generates wrong notes)
  if (groundTruth.note) {
    corrected.note = groundTruth.note;
  }

  return corrected;
}
