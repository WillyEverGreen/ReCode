/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUTOMATED GROUND TRUTH EXTRACTOR
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This script fetches ALL problems from Striver's A2Z DSA Sheet repository
 * and automatically generates ground truth entries for the validation system.
 *
 * Repository: https://github.com/arindal1/SDE-DSA-SD-Prep
 * Total Problems: 300+
 *
 * Usage:
 * node scripts/extractGroundTruth.js
 *
 * Output:
 * - utils/problemGroundTruthComplete.js (full database)
 * - logs/extraction.log (extraction log)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const REPO_API =
  'https://api.github.com/repos/arindal1/SDE-DSA-SD-Prep/git/trees/main?recursive=1';
const RAW_BASE =
  'https://raw.githubusercontent.com/arindal1/SDE-DSA-SD-Prep/main/';

// Problem categories from the repository structure
const PROBLEM_CATEGORIES = {
  '01.Basics': {
    '1.Maths': 'Basics - Math',
    '2.Recursion': 'Basics - Recursion',
    '3.Hashing': 'Basics - Hashing',
  },
  '02.Sorting': {
    '1.Sorting': 'Sorting - Basic',
    '2.Sorting': 'Sorting - Advanced',
  },
  '03.Arrays': {
    '1.Easy': 'Arrays - Easy',
    '2.Medium': 'Arrays - Medium',
    '3.Hard': 'Arrays - Hard',
  },
  '04.Binary_Search': {
    '1.BSon1D': 'Binary Search - 1D',
    '2.BSonAnswers': 'Binary Search - On Answers',
    '3.BSon2D': 'Binary Search - 2D',
  },
  '05.Strings': {
    '1.Easy': 'Strings - Easy',
    '2.Medium': 'Strings - Medium',
  },
  '06.Linked_List': {
    '1.SinglyLinkedList': 'Linked List - Singly',
    '2.DoublyLinkedList': 'Linked List - Doubly',
    '3.MediumLL': 'Linked List - Medium',
    '4.MediumDLL': 'Linked List - Medium DLL',
    '5.HardLL': 'Linked List - Hard',
  },
  '07.Recursion': {
    '1.Basics': 'Recursion - Basics',
    '2.Subsequence': 'Recursion - Subsequence',
    '3.Hard': 'Recursion - Hard',
  },
  '09.Stack_N_Queue': {
    '01.Basics': 'Stack & Queue - Basics',
    '02.Prefix_Postfix_Infix': 'Stack & Queue - Expressions',
    '03.MonotonicDS': 'Stack & Queue - Monotonic',
    '04.Advanced': 'Stack & Queue - Advanced',
  },
  '10.TwoPointer_N_SlidingWindow': {
    '01.Medium': 'Two Pointer & Sliding Window - Medium',
    '02.Hard': 'Two Pointer & Sliding Window - Hard',
  },
  '11.Heaps': {
    '01.Basics': 'Heaps - Basics',
    '02.Medium': 'Heaps - Medium',
    '03.Hard': 'Heaps - Hard',
  },
  '12.Greedy': {
    '01.Easy': 'Greedy - Easy',
    '02.Medium': 'Greedy - Medium',
  },
};

/**
 * Extract complexity from markdown content
 */
function extractComplexity(mdContent, problemName) {
  const lines = mdContent.split('\n');

  let bruteForce = null;
  let better = null;
  let optimal = null;

  // Look for complexity tables or sections
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    // Detect brute force section
    if (line.includes('brute') && line.includes('force')) {
      bruteForce = extractApproach(lines, i, 'brute');
    }

    // Detect better/optimized section
    if (
      (line.includes('better') || line.includes('optimized')) &&
      !line.includes('optimal')
    ) {
      better = extractApproach(lines, i, 'better');
    }

    // Detect optimal section
    if (line.includes('optimal')) {
      optimal = extractApproach(lines, i, 'optimal');
    }

    // Detect complexity tables
    if (line.includes('complexity') && line.includes('|')) {
      const tableData = parseComplexityTable(lines, i);
      if (tableData.bruteForce) bruteForce = tableData.bruteForce;
      if (tableData.better) better = tableData.better;
      if (tableData.optimal) optimal = tableData.optimal;
    }
  }

  return { bruteForce, better, optimal };
}

/**
 * Extract approach details from markdown
 */
function extractApproach(lines, startIndex, type) {
  let tc = null;
  let sc = null;
  let algorithm = null;
  let name = null;

  // Look ahead for complexity info
  for (let i = startIndex; i < Math.min(startIndex + 20, lines.length); i++) {
    const line = lines[i].toLowerCase();

    // Extract time complexity
    if (line.includes('time') && line.includes('complexity')) {
      const tcMatch = line.match(/o\([^)]+\)/i);
      if (tcMatch) tc = tcMatch[0];
    }

    // Extract space complexity
    if (line.includes('space') && line.includes('complexity')) {
      const scMatch = line.match(/o\([^)]+\)/i);
      if (scMatch) sc = scMatch[0];
    }

    // Extract algorithm name
    if (line.includes('algorithm') || line.includes('approach')) {
      algorithm = lines[i].replace(/[#*`-]/g, '').trim();
    }
  }

  return tc && sc ? { tc, sc, algorithm: algorithm || type, name: type } : null;
}

/**
 * Parse complexity table from markdown
 */
function parseComplexityTable(lines, startIndex) {
  const result = { bruteForce: null, better: null, optimal: null };

  // Find table rows
  for (let i = startIndex; i < Math.min(startIndex + 15, lines.length); i++) {
    const line = lines[i];
    if (!line.includes('|')) break;

    const cells = line.split('|').map((c) => c.trim());
    const approach = cells[0]?.toLowerCase() || '';

    if (approach.includes('brute')) {
      result.bruteForce = {
        tc: cells[1] || 'O(n²)',
        sc: cells[2] || 'O(1)',
        algorithm: cells[0],
        name: 'Brute Force',
      };
    } else if (approach.includes('better') || approach.includes('optimized')) {
      result.better = {
        tc: cells[1] || 'O(n log n)',
        sc: cells[2] || 'O(n)',
        algorithm: cells[0],
        name: 'Better',
      };
    } else if (approach.includes('optimal')) {
      result.optimal = {
        tc: cells[1] || 'O(n)',
        sc: cells[2] || 'O(1)',
        algorithm: cells[0],
        name: 'Optimal',
      };
    }
  }

  return result;
}

/**
 * Generate problem key from filename
 */
function generateProblemKey(filename) {
  return filename
    .toLowerCase()
    .replace(/\d+\./g, '')
    .replace(/\.md$/i, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Generate pattern variations for problem matching
 */
function generatePatterns(problemName) {
  const base = problemName.toLowerCase();
  const patterns = [base];

  // Add variations
  patterns.push(base.replace(/\s+/g, ''));
  patterns.push(base.replace(/\s+/g, '-'));
  patterns.push(base.replace(/\s+/g, '_'));

  // Add common variations
  if (base.includes('sum')) patterns.push(base.replace('sum', 'add'));
  if (base.includes('array')) patterns.push(base.replace('array', 'arr'));
  if (base.includes('linked list'))
    patterns.push(base.replace('linked list', 'll'));

  return [...new Set(patterns)];
}

/**
 * Main extraction function
 */
async function extractAllProblems() {
  console.log(
    "🚀 Starting ground truth extraction from Striver's A2Z DSA Sheet...\n"
  );

  try {
    // Fetch repository tree
    console.log('📡 Fetching repository structure...');
    const response = await fetch(REPO_API);
    const data = await response.json();

    // Filter markdown files
    const mdFiles = data.tree.filter(
      (item) =>
        item.type === 'blob' &&
        item.path.endsWith('.md') &&
        !item.path.includes('README')
    );

    console.log(`✅ Found ${mdFiles.length} problem files\n`);

    const groundTruth = {};
    let processed = 0;
    let successful = 0;

    // Process each file
    for (const file of mdFiles) {
      processed++;
      console.log(`[${processed}/${mdFiles.length}] Processing: ${file.path}`);

      try {
        // Fetch markdown content
        const mdUrl = RAW_BASE + file.path;
        const mdResponse = await fetch(mdUrl);
        const mdContent = await mdResponse.text();

        // Extract problem name from path
        const pathParts = file.path.split('/');
        const filename = pathParts[pathParts.length - 1];
        const problemName = filename
          .replace(/\d+\./g, '')
          .replace(/\.md$/i, '')
          .replace(/([A-Z])/g, ' $1')
          .trim();

        // Extract complexity
        const complexity = extractComplexity(mdContent, problemName);

        if (complexity.bruteForce || complexity.optimal) {
          const key = generateProblemKey(filename);
          groundTruth[key] = {
            patterns: generatePatterns(problemName),
            bruteForce: complexity.bruteForce,
            better: complexity.better,
            optimal: complexity.optimal,
            source: file.path,
            category: getCategoryFromPath(file.path),
          };
          successful++;
          console.log(`  ✓ Extracted: ${problemName}`);
        } else {
          console.log(`  ⚠ Skipped: No complexity data found`);
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`  ✗ Error: ${error.message}`);
      }
    }

    console.log(`\n✅ Extraction complete!`);
    console.log(`   Total files: ${mdFiles.length}`);
    console.log(`   Successful: ${successful}`);
    console.log(
      `   Coverage: ${((successful / mdFiles.length) * 100).toFixed(1)}%\n`
    );

    return groundTruth;
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

/**
 * Get category from file path
 */
function getCategoryFromPath(path) {
  for (const [mainCat, subCats] of Object.entries(PROBLEM_CATEGORIES)) {
    if (path.includes(mainCat)) {
      for (const [subCat, label] of Object.entries(subCats)) {
        if (path.includes(subCat)) {
          return label;
        }
      }
      return mainCat;
    }
  }
  return 'Uncategorized';
}

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractAllProblems, generateProblemKey, generatePatterns };
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  extractAllProblems()
    .then((groundTruth) => {
      const fs = require('fs');
      const output = `export const COMPLETE_GROUND_TRUTH = ${JSON.stringify(groundTruth, null, 2)};`;
      fs.writeFileSync('utils/problemGroundTruthComplete.js', output);
      console.log('💾 Saved to utils/problemGroundTruthComplete.js');
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
