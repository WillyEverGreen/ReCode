/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LEETCODE README PARSER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Parses kamyu104's LeetCode-Solutions README.md to extract ALL problems
 * with their time/space complexity from the massive Markdown tables.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const README_PATH = path.join(__dirname, '../LeetCode-Solutions/README.md');
const OUTPUT_PATH = path.join(__dirname, '../utils/leetcodeGroundTruth.json');

// Regex to match table rows
// Format: |  #  | Title | Solution | Time | Space | Difficulty | Tag | Note |
const TABLE_ROW_REGEX =
  /^\|\s*(\d+)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|.*?\|\s*_([^_]+)_\s*\|\s*_([^_]+)_\s*\|\s*(\w+)/gm;

// Simpler regex for problems
const PROBLEM_REGEX = /\|\s*(\d+)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)/g;
const COMPLEXITY_REGEX = /_([^_]+)_/g;

/**
 * Parse a single line that has time/space complexity
 */
function parseProblemLine(line) {
  // Skip header rows and separators
  if (line.includes('---|') || line.includes('Title')) {
    return null;
  }

  // Split by pipes and clean
  const columns = line
    .split('|')
    .map((c) => c.trim())
    .filter((c) => c);

  // We expect 7 columns: number, title, solution, time, space, difficulty, tags (last may be split by ||)
  if (columns.length < 6) return null;

  // Column indices: 0=number, 1=title, 2=solution, 3=time, 4=space, 5=difficulty, 6+=tags
  const number = parseInt(columns[0]);
  if (isNaN(number)) return null;

  // Extract title and URL
  const titleMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(columns[1]);
  if (!titleMatch) return null;
  const title = titleMatch[1].trim();
  const url = titleMatch[2].trim();

  // Extract time complexity (can have multiple with labels like "precompute:", "runtime:")
  const timeRaw = columns[3];
  const spaceRaw = columns[4];
  const difficulty = columns[5];
  const tags = columns.length > 6 ? columns.slice(6).join(' ') : '';

  // Parse time complexity - handle multi-line and labeled complexities
  const timeComplexities = parseComplexityColumn(timeRaw);
  const spaceComplexities = parseComplexityColumn(spaceRaw);

  if (!timeComplexities.default || !spaceComplexities.default) {
    return null; // Skip if no default complexity
  }

  return {
    number,
    title,
    url,
    timeComplexities,
    spaceComplexities,
    difficulty: difficulty.trim(),
    tags: tags
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0),
  };
}

/**
 * Parse complexity column that might have multiple notations
 * Examples:
 *   "_O(n)_" → {default: "O(n)"}
 *   "precompute: _O(n)_<br>runtime: _O(log n)_" → {precompute: "O(n)", runtime: "O(log n)", default: "O(log n)"}
 */
function parseComplexityColumn(text) {
  const result = {};

  // Check for labeled complexities (precompute:, runtime:, etc.)
  const labeledMatches = text.matchAll(/(\w+):\s*_([^_]+)_/g);
  let hasLabeled = false;

  for (const match of labeledMatches) {
    const [, label, complexity] = match;
    result[label.toLowerCase()] = complexity.trim();
    hasLabeled = true;
  }

  // Extract default (unlabeled) complexity
  const defaultMatch = /_([^_]+)_/.exec(text.replace(/\w+:\s*_[^_]+_/g, '')); // Remove labeled ones first
  if (defaultMatch) {
    result.default = defaultMatch[1].trim();
  } else if (hasLabeled) {
    // If we have labeled complexities but no default, use runtime or the last one
    result.default =
      result.runtime ||
      result[Object.keys(result)[Object.keys(result).length - 1]];
  }

  // If still no default, try to extract ANY complexity notation
  if (!result.default) {
    const anyMatch = /_([^_]+)_/.exec(text);
    if (anyMatch) {
      result.default = anyMatch[1].trim();
    }
  }

  return result;
}

/**
 * Parse the entire README file
 */
function parseLeetCodeReadme() {
  console.log('🚀 Parsing LeetCode README...\n');

  if (!fs.existsSync(README_PATH)) {
    console.error('❌ README not found at:', README_PATH);
    return;
  }

  const content = fs.readFileSync(README_PATH, 'utf-8');
  const lines = content.split('\n');

  console.log(`📄 Total lines in README: ${lines.length}\n`);

  const problems = [];
  const errors = [];
  let linesProcessed = 0;
  let linesWithPipes = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip if not a table row with problem
    if (!line.includes('|')) {
      continue;
    }

    linesWithPipes++;

    if (!line.match(/^\s*\d+\s*\|/)) {
      continue;
    }

    linesProcessed++;

    try {
      const problem = parseProblemLine(line);
      if (problem) {
        problems.push(problem);
        if (problems.length <= 5) {
          console.log(`   ✓ Parsed: #${problem.number} - ${problem.title}`);
        }
      }
    } catch (error) {
      if (errors.length < 5) {
        errors.push(`Line ${i}: ${error.message}`);
      }
    }
  }

  console.log(`\n📊 Processing stats:`);
  console.log(`   Lines with pipes: ${linesWithPipes}`);
  console.log(`   Lines starting with number|: ${linesProcessed}`);
  console.log(`   Successfully parsed: ${problems.length}\n`);

  if (errors.length > 0) {
    console.log('⚠️  Sample errors:');
    errors.forEach((err) => console.log(`   ${err}`));
    console.log();
  }

  console.log(
    `✅ Successfully parsed ${problems.length} problems with TC/SC\n`
  );

  // Statistics
  const stats = {
    total: problems.length,
    byDifficulty: {},
    byComplexityClass: {},
    hasDualComplexity: 0,
  };

  problems.forEach((p) => {
    stats.byDifficulty[p.difficulty] =
      (stats.byDifficulty[p.difficulty] || 0) + 1;

    // Classify by time complexity
    const tc = p.timeComplexities.default;
    if (tc.includes('log'))
      stats.byComplexityClass['logarithmic'] =
        (stats.byComplexityClass['logarithmic'] || 0) + 1;
    else if (tc.includes('n²') || tc.includes('n^2'))
      stats.byComplexityClass['quadratic'] =
        (stats.byComplexityClass['quadratic'] || 0) + 1;
    else if (tc.includes('2^n'))
      stats.byComplexityClass['exponential'] =
        (stats.byComplexityClass['exponential'] || 0) + 1;
    else if (tc.includes('n!'))
      stats.byComplexityClass['factorial'] =
        (stats.byComplexityClass['factorial'] || 0) + 1;
    else if (tc.includes('n') && !tc.includes('log'))
      stats.byComplexityClass['linear'] =
        (stats.byComplexityClass['linear'] || 0) + 1;
    else if (tc.includes('1'))
      stats.byComplexityClass['constant'] =
        (stats.byComplexityClass['constant'] || 0) + 1;
  });

  // Create database structure
  const database = {
    version: '2.0-mega',
    generated: new Date().toISOString(),
    source: 'kamyu104/LeetCode-Solutions',
    statistics: stats,
    problems: problems.reduce((acc, p) => {
      const id = generateProblemId(p.title);

      // Determine average and worst case from available complexities
      const getAvgWorst = (complexities) => {
        // If we have labeled complexities, use them intelligently
        if (complexities.precompute && complexities.runtime) {
          // Precompute is typically worst-case, runtime is average
          return {
            average: normalizeComplexity(complexities.runtime),
            worst: normalizeComplexity(complexities.precompute),
          };
        } else if (complexities.average && complexities.worst) {
          return {
            average: normalizeComplexity(complexities.average),
            worst: normalizeComplexity(complexities.worst),
          };
        } else {
          // No distinction - use default for both
          return {
            average: normalizeComplexity(complexities.default),
            worst: normalizeComplexity(complexities.default),
          };
        }
      };

      const timeAvgWorst = getAvgWorst(p.timeComplexities);
      const spaceAvgWorst = getAvgWorst(p.spaceComplexities);

      acc[id] = {
        number: p.number,
        title: p.title,
        url: p.url,
        difficulty: p.difficulty,
        tags: p.tags,
        complexity: {
          time: timeAvgWorst,
          space: spaceAvgWorst,
          hasDistinctCases:
            timeAvgWorst.average !== timeAvgWorst.worst ||
            spaceAvgWorst.average !== spaceAvgWorst.worst,
        },
        verified: true,
        source: 'leetcode-kamyu104',
      };
      return acc;
    }, {}),
  };

  // Save to file
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(database, null, 2));
  console.log(`💾 LeetCode database saved to: ${OUTPUT_PATH}\n`);

  // Print statistics
  console.log('📊 Statistics:');
  console.log(`   Total Problems: ${stats.total}`);
  console.log('\n   By Difficulty:');
  Object.entries(stats.byDifficulty).forEach(([diff, count]) => {
    console.log(`     ${diff.padEnd(10)} ${count}`);
  });

  console.log('\n   By Complexity Class:');
  Object.entries(stats.byComplexityClass)
    .sort(([, a], [, b]) => b - a)
    .forEach(([cls, count]) => {
      console.log(`     ${cls.padEnd(15)} ${count}`);
    });

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} problems missing TC/SC annotations`);
    if (errors.length <= 10) {
      errors.forEach((err) => console.log(err));
    } else {
      errors.slice(0, 5).forEach((err) => console.log(err));
      console.log(`   ... and ${errors.length - 5} more`);
    }
  }

  console.log('\n✅ LeetCode parsing complete!\n');

  return database;
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
 * Normalize complexity notation
 */
function normalizeComplexity(complexity) {
  if (!complexity) return 'O(1)';

  return complexity
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/O\(/g, 'O(')
    .replace(/\)/g, ')')
    .replace(/\(N\)/gi, '(n)')
    .replace(/\(M\)/gi, '(m)')
    .replace(/\(K\)/gi, '(k)')
    .replace(/logN/gi, 'log n')
    .replace(/\*\*/g, '^')
    .replace(/²/g, '²')
    .replace(/³/g, '³');
}

// Run parser
parseLeetCodeReadme();
