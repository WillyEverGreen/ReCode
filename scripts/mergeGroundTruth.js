/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MERGE GROUND TRUTH DATABASES
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Merges Striver's A2Z Sheet (369 problems) with LeetCode Solutions (1,775 problems)
 * into a single unified ground truth database.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STRIVER_DB_PATH = path.join(
  __dirname,
  '../utils/groundTruthDatabase.json'
);
const LEETCODE_DB_PATH = path.join(
  __dirname,
  '../utils/leetcodeGroundTruth.json'
);
const MERGED_DB_PATH = path.join(__dirname, '../utils/mergedGroundTruth.json');

console.log('🔄 Merging Ground Truth Databases...\n');

// Load both databases
const striverData = JSON.parse(fs.readFileSync(STRIVER_DB_PATH, 'utf-8'));
const leetcodeData = JSON.parse(fs.readFileSync(LEETCODE_DB_PATH, 'utf-8'));

console.log(`📚 Loaded databases:`);
console.log(
  `   Striver's Sheet: ${Object.keys(striverData.problems || {}).length} problems`
);
console.log(
  `   LeetCode Repo:   ${Object.keys(leetcodeData.problems || {}).length} problems\n`
);

// Merge databases - Striver takes priority as it's hand-verified
const mergedProblems = { ...leetcodeData.problems };
let overwritten = 0;

// Add/overwrite with Striver's data
Object.entries(striverData.problems || {}).forEach(([id, problem]) => {
  if (mergedProblems[id]) {
    overwritten++;
  }
  mergedProblems[id] = {
    ...problem,
    source: 'striver-priority', // Mark as Striver source for higher trust
    verified: true,
  };
});

// Create merged database
const mergedDatabase = {
  version: '2.0-mega-merged',
  generated: new Date().toISOString(),
  sources: ['Strivers-A2Z-DSA-Sheet', 'kamyu104/LeetCode-Solutions'],
  statistics: {
    total: Object.keys(mergedProblems).length,
    fromStriver: Object.keys(striverData.problems || {}).length,
    fromLeetCode: Object.keys(leetcodeData.problems || {}).length,
    overwritten,
    unique: Object.keys(mergedProblems).length,
  },
  problems: mergedProblems,
};

// Save merged database
fs.writeFileSync(MERGED_DB_PATH, JSON.stringify(mergedDatabase, null, 2));

console.log(`✅ Merged database created!\n`);
console.log(`📊 Final Statistics:`);
console.log(`   Total unique problems: ${mergedDatabase.statistics.total}`);
console.log(
  `   From Striver (priority): ${mergedDatabase.statistics.fromStriver}`
);
console.log(`   From LeetCode: ${mergedDatabase.statistics.fromLeetCode}`);
console.log(
  `   Overwrites (Striver priority): ${mergedDatabase.statistics.overwritten}`
);
console.log(`\n💾 Saved to: ${MERGED_DB_PATH}\n`);

// Calculate coverage estimate
const totalLeetCodeProblems = 3792; // As of README
const coveragePercent = (
  (mergedDatabase.statistics.total / totalLeetCodeProblems) *
  100
).toFixed(1);

console.log(`📈 Coverage:`);
console.log(
  `   ${coveragePercent}% of all LeetCode problems (${mergedDatabase.statistics.total}/${totalLeetCodeProblems})`
);
console.log(
  `\n✅ Merge complete! Your V2 engine now has access to ${mergedDatabase.statistics.total} verified problems! 🚀\n`
);
