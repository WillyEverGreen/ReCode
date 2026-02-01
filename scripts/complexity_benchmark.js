import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeComplexityV2 } from '../utils/complexityEngineV2.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to normalize complexity strings for comparison
const normalize = (c) => {
  if (!c) return 'unknown';
  return c
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\^/g, '')
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .replace(/⁰/g, '0')
    .replace(/¹/g, '1')
    .replace(/logn/g, 'log n'); // normalize log n spacing
};

const runBenchmark = () => {
  // Silence console.log from the engine
  const originalLog = console.log;
  console.log = () => {};

  const dbPath = path.join(__dirname, '../utils/groundTruthMega.json');
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Ground Truth DB not found!');
    return;
  }

  console.log('Loading Ground Truth Database...');
  const rawData = fs.readFileSync(dbPath, 'utf-8');
  const db = JSON.parse(rawData);

  let totalWithCode = 0;
  let matchCount = 0;
  let mismatchCount = 0;
  let mismatches = [];

  const problems = db.problems || {};

  console.log(`Scanning ${Object.keys(problems).length} total problems...`);

  for (const [key, problem] of Object.entries(problems)) {
    if (!problem.code || problem.code.length < 50) continue; // Skip if no code or too short

    // Skip if verify flag is false and code is just a comment
    if (
      problem.code.trim().startsWith('//') &&
      problem.code.split('\n').length < 5
    )
      continue;

    totalWithCode++;

    // Get Expected Complexity
    const expectedTC =
      problem.complexity?.time?.worst || problem.complexity?.time?.average;
    const expectedSC =
      problem.complexity?.space?.worst || problem.complexity?.space?.average;

    if (!expectedTC) continue;

    // Run Analysis
    // We pass NULL as title to force the engine to Analyze Code, not just lookup the title again!
    // This tests the V2 Engine's actual analysis logic.
    const analysis = analyzeComplexityV2(problem.code, 'cpp', null);

    const predictedTC = analysis.worstCase.time;
    // Logic check: We want to know if the Predicted is "Good Enough"
    // Exact string match is hard (O(N) vs O(n)), so we normalize.

    const normExpected = normalize(expectedTC);
    const normPredicted = normalize(predictedTC);

    // Fuzzy match logic
    const isMatch =
      normPredicted.includes(normExpected) ||
      normExpected.includes(normPredicted);

    if (isMatch) {
      matchCount++;
    } else {
      mismatchCount++;
      mismatches.push({
        title: problem.title,
        expected: expectedTC,
        predicted: predictedTC,
        reason:
          analysis.patterns.length > 0
            ? `Pattern: ${analysis.patterns[0]}`
            : 'Loop Analysis',
      });
    }
  }

  // Restore console.log
  console.log = originalLog;

  let output = '';
  const log = (msg) => {
    console.log(msg);
    output += msg + '\n';
  };

  log('\n════════════════════════════════════════');
  log('COMPLEXITY ENGINE V2 BENCHMARK RESULTS');
  log('════════════════════════════════════════');
  log(`Total Problems with Code: ${totalWithCode}`);
  log(`Successful Matches:       ${matchCount}`);
  log(`Mismatches:               ${mismatchCount}`);
  log(
    `Accuracy Rate:            ${((matchCount / totalWithCode) * 100).toFixed(2)}%`
  );

  if (mismatches.length > 0) {
    log('\nSample Mismatches (First 20):');
    mismatches.slice(0, 20).forEach((m) => {
      log(
        `- ${m.title}: Expected '${m.expected}' (${normalize(m.expected)}), Got '${m.predicted}' (${normalize(m.predicted)}) [${m.reason}]`
      );
    });
  }

  fs.writeFileSync(
    path.join(__dirname, '../benchmark_debug.txt'),
    output,
    'utf-8'
  );
};

runBenchmark();
