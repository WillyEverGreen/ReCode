/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FINAL MEGA MERGE - Create 3,700+ Problem Database
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STRIVER_PATH = path.join(__dirname, '../utils/groundTruthDatabase.json');
const LEETCODE_FULL_PATH = path.join(__dirname, '../utils/leetcodeGroundTruthFull.json');
const FINAL_PATH = path.join(__dirname, '../utils/groundTruthMega.json');

console.log('🔥 Creating MEGA Ground Truth Database...\n');

// Load all databases
const striverData = JSON.parse(fs.readFileSync(STRIVER_PATH, 'utf-8'));
const leetcodeData = JSON.parse(fs.readFileSync(LEETCODE_FULL_PATH, 'utf-8'));

console.log(`📚 Loaded:`);
console.log(`   Striver's Sheet: ${Object.keys(striverData.problems || {}).length} problems`);
console.log(`   LeetCode Full:   ${Object.keys(leetcodeData.problems || {}).length} problems\n`);

// Merge - Striver takes priority, then LeetCode full
const mergedProblems = { ...leetcodeData.problems };
let overwritten = 0;
let striverAdded = 0;

// Add/overwrite with Striver's data (higher quality, hand-verified)
Object.entries(striverData.problems || {}).forEach(([id, problem]) => {
  if (mergedProblems[id]) {
    overwritten++;
    // Preserve LeetCode complexity if Striver doesn't have it
    if (!problem.complexity?.time?.average && mergedProblems[id].complexity?.time?.average) {
      problem.complexity = mergedProblems[id].complexity;
    }
  } else {
    striverAdded++;
  }
  
  mergedProblems[id] = {
    ...mergedProblems[id],
    ...problem,
    source: problem.source || 'striver-priority',
    verified: true
  };
});

// Statistics
const withComplexity = Object.values(mergedProblems).filter(p => p.complexity?.time?.average).length;

const megaDatabase = {
  version: '3.0-mega',
  generated: new Date().toISOString(),
  sources: ['Strivers-A2Z-DSA-Sheet', 'kamyu104/LeetCode-Solutions-Full'],
  statistics: {
    total: Object.keys(mergedProblems).length,
    withComplexity,
    coveragePercent: ((withComplexity / Object.keys(mergedProblems).length) * 100).toFixed(1),
    fromStriver: Object.keys(striverData.problems || {}).length,
    fromLeetCode: Object.keys(leetcodeData.problems || {}).length,
    overwritten,
    unique: Object.keys(mergedProblems).length
  },
  problems: mergedProblems
};

// Save
fs.writeFileSync(FINAL_PATH, JSON.stringify(megaDatabase, null, 2));

console.log(`✅ MEGA Database Created!\n`);
console.log(`📊 Final Statistics:`);
console.log(`   Total Unique Problems: ${megaDatabase.statistics.total}`);
console.log(`   With TC/SC Complexity: ${megaDatabase.statistics.withComplexity}`);
console.log(`   Coverage: ${megaDatabase.statistics.coveragePercent}%`);
console.log(`   From Striver (priority): ${megaDatabase.statistics.fromStriver}`);
console.log(`   From LeetCode: ${megaDatabase.statistics.fromLeetCode}`);
console.log(`   Overwrites: ${megaDatabase.statistics.overwritten}\n`);

console.log(`💾 Saved to: ${FINAL_PATH}\n`);
console.log(`\n🚀 YOU NOW HAVE ${megaDatabase.statistics.total} LEETCODE PROBLEMS! 🎉\n`);
