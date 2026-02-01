/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * STRIVER'S A2Z SHEET PARSER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This script parses all problems from the cloned Striver's A2Z DSA Sheet
 * and creates a ground truth database with verified complexities.
 *
 * Features:
 * - Extracts problem statement, approach, code, TC, SC from .cpp files
 * - Generates structured JSON database
 * - Creates code fingerprints for pattern matching
 * - Validates complexity notation format
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const STRIVER_SHEET_PATH = path.join(__dirname, '../Strivers-A2Z-DSA-Sheet');
const OUTPUT_PATH = path.join(__dirname, '../utils/groundTruthDatabase.json');

// Complexity patterns to extract from comments
const TC_PATTERN = /TIME COMPLEXITY\s*=\s*([O()\[\]n²³mklogαΩΘ\s\d+\-*/.,]+)/i;
const SC_PATTERN = /SPACE COMPLEXITY\s*=\s*([O()\[\]n²³mklogαΩΘ\s\d+\-*/.,]+)/i;

// Problem categories from directory structure
const CATEGORIES = {
  '01.Arrays': 'arrays',
  '02.Binary Search': 'binary-search',
  '03.Strings': 'strings',
  '04.Linked List': 'linked-list',
  '05.Recursion': 'recursion',
  '06.Bit Manipulation': 'bit-manipulation',
  '07.Stack and Queues': 'stack-queue',
  '08. Sliding Window': 'sliding-window',
  '09. Heaps': 'heaps',
  '10. Greedy Approach': 'greedy',
  '11. Binary Trees': 'binary-trees',
  '12. Binary Search Trees': 'bst',
  '13. Graphs': 'graphs',
  '14. Dynamic Programming': 'dynamic-programming',
  '15. Tries': 'tries',
  '16. Strings (Hard)': 'strings-hard',
};

/**
 * Parse a single .cpp file and extract problem metadata
 */
function parseCppFile(filePath, category) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract problem statement (between /* QUESTION:- and */)
    const questionMatch = content.match(
      /QUESTION?:-?\s*\n?([\s\S]*?)(?:\*\/|Approach:|CODE:-)/i
    );
    const problemStatement = questionMatch ? questionMatch[1].trim() : '';

    // Extract approach (between Approach: and CODE:-)
    const approachMatch = content.match(
      /Approach:?\s*\n?([\s\S]*?)(?:CODE:-|\*\/)/i
    );
    const approach = approachMatch ? approachMatch[1].trim() : '';

    // Extract code (after CODE:- or function definition)
    const codeMatch = content.match(
      /CODE:-?\s*\n?([\s\S]*?)(?:\/\/\s*TIME\s*COMPLEXITY|$)/i
    );
    const code = codeMatch ? codeMatch[1].trim() : '';

    // Extract TC and SC
    const tcMatch = content.match(TC_PATTERN);
    const scMatch = content.match(SC_PATTERN);

    const timeComplexity = tcMatch ? normalizeComplexity(tcMatch[1]) : null;
    const spaceComplexity = scMatch ? normalizeComplexity(scMatch[1]) : null;

    // Generate code fingerprint
    const fingerprint = generateCodeFingerprint(code);

    // Extract problem title from filename
    const fileName = path.basename(filePath, '.cpp');
    const title = fileName.replace(/_/g, ' ').replace(/^\d+\.\s*/, '');

    // Detect difficulty from directory structure
    const difficulty = detectDifficulty(filePath);

    // Detect algorithmic patterns
    const patterns = detectPatterns(code, approach);

    return {
      id: generateProblemId(title),
      title,
      category,
      difficulty,
      problemStatement,
      approach,
      code,
      complexity: {
        time: {
          average: timeComplexity,
          worst: timeComplexity, // Default: same as average (will be manually reviewed)
        },
        space: {
          average: spaceComplexity,
          worst: spaceComplexity,
        },
      },
      patterns,
      fingerprint,
      source: filePath,
      verified: false, // Needs manual verification
      needsReview: !timeComplexity || !spaceComplexity,
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Normalize complexity notation
 */
function normalizeComplexity(complexity) {
  if (!complexity) return null;

  return complexity
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\(N\)/gi, '(n)')
    .replace(/\(M\)/gi, '(m)')
    .replace(/\(K\)/gi, '(k)')
    .replace(/logN/gi, 'log n')
    .replace(/\*\*/g, '^')
    .replace(/²/g, '²')
    .replace(/³/g, '³');
}

/**
 * Generate code fingerprint for pattern matching
 */
function generateCodeFingerprint(code) {
  if (!code) return [];

  const fingerprints = [];

  // Extract key patterns
  const patterns = [
    // Data structures
    /unordered_map<[^>]+>/g,
    /unordered_set<[^>]+>/g,
    /vector<[^>]+>/g,
    /priority_queue<[^>]+>/g,
    /stack<[^>]+>/g,
    /queue<[^>]+>/g,

    // Loops
    /for\s*\([^)]+\)/g,
    /while\s*\([^)]+\)/g,

    // Common functions
    /sort\s*\(/g,
    /binary_search\s*\(/g,
    /lower_bound\s*\(/g,
    /upper_bound\s*\(/g,

    // Key operations
    /\.find\s*\(/g,
    /\.insert\s*\(/g,
    /\.push_back\s*\(/g,
    /\.push\s*\(/g,
    /\.pop\s*\(/g,
  ];

  patterns.forEach((pattern) => {
    const matches = code.match(pattern);
    if (matches) {
      fingerprints.push(...matches.slice(0, 3)); // Top 3 matches per pattern
    }
  });

  return fingerprints;
}

/**
 * Detect difficulty from directory structure
 */
function detectDifficulty(filePath) {
  const pathLower = filePath.toLowerCase();
  if (pathLower.includes('easy') || pathLower.includes('1.easy')) return 'easy';
  if (pathLower.includes('medium') || pathLower.includes('2.medium'))
    return 'medium';
  if (pathLower.includes('hard') || pathLower.includes('3.hard')) return 'hard';
  return 'unknown';
}

/**
 * Detect algorithmic patterns from code and approach
 */
function detectPatterns(code, approach) {
  const patterns = [];
  const combined = (code + ' ' + approach).toLowerCase();

  // Pattern detection
  const patternMap = {
    'hash-map': /unordered_map|hashmap|map/,
    'hash-set': /unordered_set|hashset|set/,
    'two-pointers': /two pointer|left.*right|start.*end/,
    'sliding-window': /sliding window|window|shrink|expand/,
    'binary-search': /binary search|mid.*=|low.*high/,
    'dynamic-programming': /dp\[|memoization|tabulation|dynamic programming/,
    recursion: /recursive|recursion|backtrack/,
    backtracking: /backtrack|permutation|combination/,
    greedy: /greedy|local optimal/,
    'divide-conquer': /divide.*conquer|merge sort|quick sort/,
    dfs: /dfs|depth.*first/,
    bfs: /bfs|breadth.*first|level.*order/,
    'monotonic-stack': /monotonic stack|next greater|next smaller/,
    'union-find': /union find|disjoint set|dsu/,
    trie: /trie|prefix tree/,
    heap: /priority_queue|heap|heapify/,
    sorting: /\.sort\(|Arrays\.sort|sorting/,
  };

  for (const [pattern, regex] of Object.entries(patternMap)) {
    if (regex.test(combined)) {
      patterns.push(pattern);
    }
  }

  return patterns;
}

/**
 * Generate problem ID from title
 */
function generateProblemId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Recursively find all .cpp files
 */
function findAllCppFiles(dir, category = null) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Check if this is a category directory
      const newCategory = CATEGORIES[file] || category;
      results = results.concat(findAllCppFiles(filePath, newCategory));
    } else if (file.endsWith('.cpp')) {
      results.push({ path: filePath, category: category || 'general' });
    }
  }

  return results;
}

/**
 * Main parser function
 */
function parseStriverSheet() {
  console.log("🚀 Starting Striver's A2Z Sheet Parser...\n");

  if (!fs.existsSync(STRIVER_SHEET_PATH)) {
    console.error("❌ Error: Striver's sheet directory not found!");
    console.error(`   Expected path: ${STRIVER_SHEET_PATH}\n`);
    return;
  }

  // Find all .cpp files
  console.log('📁 Scanning for .cpp files...');
  const cppFiles = findAllCppFiles(STRIVER_SHEET_PATH);
  console.log(`   Found ${cppFiles.length} problems\n`);

  // Parse all files
  console.log('🔍 Parsing problems...');
  const problems = [];
  const errors = [];

  for (const { path: filePath, category } of cppFiles) {
    const problem = parseCppFile(filePath, category);
    if (problem) {
      problems.push(problem);
      if (problem.needsReview) {
        errors.push(`   ⚠️  ${problem.title} - Missing TC/SC`);
      }
    }
  }

  console.log(`   ✅ Successfully parsed ${problems.length} problems\n`);

  // Statistics
  const stats = {
    total: problems.length,
    byCategory: {},
    byDifficulty: {},
    byPattern: {},
    needsReview: problems.filter((p) => p.needsReview).length,
  };

  problems.forEach((p) => {
    stats.byCategory[p.category] = (stats.byCategory[p.category] || 0) + 1;
    stats.byDifficulty[p.difficulty] =
      (stats.byDifficulty[p.difficulty] || 0) + 1;
    p.patterns.forEach((pattern) => {
      stats.byPattern[pattern] = (stats.byPattern[pattern] || 0) + 1;
    });
  });

  // Create database structure
  const database = {
    version: '2.0',
    generated: new Date().toISOString(),
    source: "Striver's A2Z DSA Sheet",
    statistics: stats,
    problems: problems.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {}),
  };

  // Save to file
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(database, null, 2));
  console.log(`💾 Database saved to: ${OUTPUT_PATH}\n`);

  // Print statistics
  console.log('📊 Statistics:');
  console.log(`   Total Problems: ${stats.total}`);
  console.log(`   Needs Review: ${stats.needsReview}`);
  console.log('\n   By Category:');
  Object.entries(stats.byCategory)
    .sort(([, a], [, b]) => b - a)
    .forEach(([cat, count]) => {
      console.log(`     ${cat.padEnd(25)} ${count}`);
    });

  console.log('\n   By Difficulty:');
  Object.entries(stats.byDifficulty).forEach(([diff, count]) => {
    console.log(`     ${diff.padEnd(10)} ${count}`);
  });

  console.log('\n   Top Patterns:');
  Object.entries(stats.byPattern)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([pattern, count]) => {
      console.log(`     ${pattern.padEnd(25)} ${count}`);
    });

  // Print errors/warnings
  if (errors.length > 0) {
    console.log('\n⚠️  Problems needing review:');
    errors.slice(0, 10).forEach((err) => console.log(err));
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more`);
    }
  }

  console.log('\n✅ Parsing complete!\n');
}

// Run parser
parseStriverSheet();
