/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ENHANCED LEETCODE PARSER - PARSE ALL 3,387 PYTHON SOLUTIONS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Parses individual Python solution files to extract ALL problems with complexities.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON_DIR = path.join(__dirname, '../LeetCode-Solutions/Python');
const README_DB_PATH = path.join(__dirname, '../utils/leetcodeGroundTruth.json');
const OUTPUT_PATH = path.join(__dirname, '../utils/leetcodeGroundTruthFull.json');

console.log('🚀 Parsing ALL LeetCode Python Solutions...\n');

// Load existing README data first
let readmeData = {};
try {
  const readmeDb = JSON.parse(fs.readFileSync(README_DB_PATH, 'utf-8'));
  readmeData = readmeDb.problems || {};
  console.log(`📋 Loaded ${Object.keys(readmeData).length} problems from README database\n`);
} catch (error) {
  console.log('⚠️  Could not load README database, starting fresh\n');
}

// Get all Python files
const pythonFiles = fs.readdirSync(PYTHON_DIR).filter(f => f.endsWith('.py'));
console.log(`📁 Found ${pythonFiles.length} Python solution files\n`);

const problems = {};
let parsed = 0;
let withComplexity = 0;
let fromReadme = 0;

console.log('🔄 Processing files...\n');

for (const file of pythonFiles) {
  const filePath = path.join(PYTHON_DIR, file);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract problem info from filename
    const problemId = file.replace('.py', '').toLowerCase();
    const title = problemId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    // Try to extract complexity from comments
    const timeMatch = content.match(/Time.*?O\(([^)]+)\)/i) || content.match(/Time:\s*_?O\(([^)_]+)\)_?/i);
    const spaceMatch = content.match(/Space.*?O\(([^)]+)\)/i) || content.match(/Space:\s*_?O\(([^)_]+)\)_?/i);
    
    let timeComplexity = null;
    let spaceComplexity = null;
    
    if (timeMatch) {
      timeComplexity = `O(${timeMatch[1].trim()})`;
    }
    
    if (spaceMatch) {
      spaceComplexity = `O(${spaceMatch[1].trim()})`;
    }
    
    // Fall back to README data if available
    if (readmeData[problemId]) {
      const readmeProb = readmeData[problemId];
      if (!timeComplexity && readmeProb.complexity?.time?.average) {
        timeComplexity = readmeProb.complexity.time.average;
        spaceComplexity = readmeProb.complexity.space.average;
        fromReadme++;
      }
      
      // Merge with README data
      problems[problemId] = {
        ...readmeProb,
        title: readmeProb.title || title,
        complexity: {
          time: {
            average: timeComplexity || readmeProb.complexity?.time?.average || null,
            worst: timeComplexity || readmeProb.complexity?.time?.worst || null
          },
          space: {
            average: spaceComplexity || readmeProb.complexity?.space?.average || null,
            worst: spaceComplexity || readmeProb.complexity?.space?.worst || null
          }
        },
        source: 'leetcode-kamyu104-full',
        verified: true,
        hasComplexity: !!(timeComplexity || readmeProb.complexity?.time?.average)
      };
    } else {
      // New problem not in README
      problems[problemId] = {
        title,
        url: `https://leetcode.com/problems/${problemId}/`,
        difficulty: 'Unknown',
        tags: [],
        complexity: {
          time: {
            average: timeComplexity,
            worst: timeComplexity
          },
          space: {
            average: spaceComplexity,
            worst: spaceComplexity
          }
        },
        source: 'leetcode-kamyu104-full',
        verified: !!timeComplexity,
        hasComplexity: !!timeComplexity
      };
    }
    
    parsed++;
    if (timeComplexity) withComplexity++;
    
    if (parsed % 500 === 0) {
      console.log(`   ✓ Processed ${parsed}/${pythonFiles.length} files... (${withComplexity} with complexity)`);
    }
    
  } catch (error) {
    // Skip files that can't be read
  }
}

console.log(`\n✅ Parsing complete!\n`);
console.log(`📊 Statistics:`);
console.log(`   Total files processed: ${parsed}`);
console.log(`   Problems with complexity: ${withComplexity}`);
console.log(`   Fell back to README: ${fromReadme}`);
console.log(`   Unique problems: ${Object.keys(problems).length}\n`);

// Create database
const database = {
  version: '2.0-full',
  generated: new Date().toISOString(),
  source: 'kamyu104/LeetCode-Solutions (Full Python Directory)',
  statistics: {
    total: Object.keys(problems).length,
    withComplexity,
    fromFiles: withComplexity - fromReadme,
    fromReadme,
    verified: Object.values(problems).filter(p => p.verified).length
  },
  problems
};

// Save
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(database, null, 2));
console.log(`💾 Saved to: ${OUTPUT_PATH}\n`);
console.log(`\n🎉 SUCCESS! You now have ${Object.keys(problems).length} LeetCode problems! 🚀\n`);
