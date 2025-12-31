/**
 * ════════════════════════════════════════════════════════════════════════════
 * COMPLEXITY ENGINE V2 - QUICK INTEGRATION GUIDE
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * This file provides a step-by-step guide to integrate the new V2 engine
 * into your existing ReCode codebase with minimal disruption.
 */

// ════════════════════════════════════════════════════════════════════════════
// STEP 1: Update API Endpoint (server/api/solution/index.js)
// ════════════════════════════════════════════════════════════════════════════

/* 
ADD THIS IMPORT at the top:
*/
import analyzeComplexityV2 from '../../utils/complexityEngineV2.js';

/*
FIND THIS SECTION (around line 100-150):
*/
// LAYER 5: DETERMINISTIC COMPLEXITY CORRECTION
const corrected = getCorrectedComplexity(
  parsed.optimal.timeComplexity,
  parsed.optimal.spaceComplexity,
  parsed.optimal.code,
  language
);

/*
ADD THIS RIGHT AFTER the above section:
*/

// LAYER 5.5: V2 DUAL COMPLEXITY ANALYSIS
try {
  const complexityV2 = analyzeComplexityV2(
    parsed.optimal.code,
    language,
    parsed.title || problemTitle
  );
  
  // Store V2 analysis
  parsed.optimal.complexityAnalysis = complexityV2;
  
  // If V2 has high confidence and differs from V1, use V2
  if (complexityV2.confidence >= 95) {
    if (complexityV2.averageCase.time !== parsed.optimal.timeComplexity) {
      console.log('[V2 ENGINE] Overriding TC:', parsed.optimal.timeComplexity, '→', complexityV2.averageCase.time);
      parsed.optimal.llmOriginalTC = parsed.optimal.timeComplexity;
      parsed.optimal.timeComplexity = complexityV2.averageCase.time;
      parsed.optimal.complexitySource = 'EngineV2';
    }
    
    if (complexityV2.averageCase.space !== parsed.optimal.spaceComplexity) {
      console.log('[V2 ENGINE] Overriding SC:', parsed.optimal.spaceComplexity, '→', complexityV2.averageCase.space);
      parsed.optimal.llmOriginalSC = parsed.optimal.spaceComplexity;
      parsed.optimal.spaceComplexity = complexityV2.averageCase.space;
      parsed.optimal.complexitySource = 'EngineV2';
    }
  }
  
  // Do the same for brute force approach
  if (parsed.bruteForce && parsed.bruteForce.code) {
    const bruteV2 = analyzeComplexityV2(
      parsed.bruteForce.code,
      language,
      parsed.title ? `${parsed.title} (Brute Force)` : null
    );
    parsed.bruteForce.complexityAnalysis = bruteV2;
  }
  
  // And for better approach if exists
  if (parsed.better && parsed.better.code) {
    const betterV2 = analyzeComplexityV2(
      parsed.better.code,
      language,
      parsed.title ? `${parsed.title} (Better)` : null
    );
    parsed.better.complexityAnalysis = betterV2;
  }
  
} catch (error) {
  console.error('[V2 ENGINE] Error during analysis:', error);
  // Gracefully fall back to V1 engine results
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 2: Update UI Component (components/GetSolution.tsx)
// ════════════════════════════════════════════════════════════════════════════

/*
CREATE NEW COMPONENT: components/DualComplexityDisplay.tsx
*/

import React from 'react';
import type { DualComplexityAnalysis } from '../types';

interface DualComplexityDisplayProps {
  analysis: DualComplexityAnalysis;
  showDifferencesOnly?: boolean;
}

export function DualComplexityDisplay({ analysis, showDifferencesOnly = false }: DualComplexityDisplayProps) {
  const hasDifference = 
    analysis.averageCase.time !== analysis.worstCase.time ||
    analysis.averageCase.space !== analysis.worstCase.space;
  
  // If only showing differences and there are none, show simplified view
  if (showDifferencesOnly && !hasDifference) {
    return (
      <div className="complexity-simplified">
        <div className="complexity-row">
          <span className="label">Time Complexity:</span>
          <code className="complexity-value">{analysis.averageCase.time}</code>
        </div>
        <div className="complexity-row">
          <span className="label">Space Complexity:</span>
          <code className="complexity-value">{analysis.averageCase.space}</code>
        </div>
        <div className="confidence-badge">
          <span className={`badge ${analysis.confidence > 90 ? 'high' : 'medium'}`}>
            {analysis.confidence}% Confidence
          </span>
        </div>
      </div>
    );
  }
  
  // Full dual view
  return (
    <div className="dual-complexity-container">
      <div className="complexity-card average-case">
        <h4 className="case-title">
          <span className="icon">⚡</span>
          Average Case
        </h4>
        <div className="metrics">
          <div className="metric">
            <span className="metric-label">Time:</span>
            <code className="metric-value">{analysis.averageCase.time}</code>
          </div>
          <div className="metric">
            <span className="metric-label">Space:</span>
            <code className="metric-value">{analysis.averageCase.space}</code>
          </div>
        </div>
        <p className="explanation">{analysis.averageCase.explanation}</p>
      </div>
      
      {hasDifference && (
        <div className="complexity-card worst-case">
          <h4 className="case-title">
            <span className="icon">⚠️</span>
            Worst Case
          </h4>
          <div className="metrics">
            <div className="metric">
              <span className="metric-label">Time:</span>
              <code className="metric-value highlighted">
                {analysis.worstCase.time}
              </code>
            </div>
            <div className="metric">
              <span className="metric-label">Space:</span>
              <code className="metric-value highlighted">
                {analysis.worstCase.space}
              </code>
            </div>
          </div>
          <p className="explanation">{analysis.worstCase.explanation}</p>
        </div>
      )}
      
      <div className="complexity-footer">
        <div className="patterns">
          <span className="footer-label">Patterns:</span>
          {analysis.patterns.map(pattern => (
            <span key={pattern} className="pattern-tag">{pattern}</span>
          ))}
        </div>
        
        <div className="confidence">
          <span className={`confidence-badge ${
            analysis.confidence > 90 ? 'high' : 
            analysis.confidence > 75 ? 'medium' : 'low'
          }`}>
            {analysis.confidence}% Confidence
          </span>
          {analysis.source !== 'heuristic' && (
            <span className="source-badge">✓ Verified</span>
          )}
        </div>
      </div>
      
      {analysis.note && (
        <div className="complexity-note">
          <strong>Note:</strong> {analysis.note}
        </div>
      )}
    </div>
  );
}

/*
THEN UPDATE GetSolution.tsx to use it:
*/

import { DualComplexityDisplay } from './DualComplexityDisplay';

// Inside your approach rendering:
{approach.complexityAnalysis ? (
  <DualComplexityDisplay 
    analysis={approach.complexityAnalysis}
    showDifferencesOnly={true}
  />
) : (
  // Fallback to old display
  <div className="complexity-legacy">
    <div>Time: {approach.timeComplexity}</div>
    <div>Space: {approach.spaceComplexity}</div>
  </div>
)}

// ════════════════════════════════════════════════════════════════════════════
// STEP 3: Add CSS Styles
// ════════════════════════════════════════════════════════════════════════════

/*
ADD TO YOUR GLOBAL CSS OR COMPONENT STYLES:
*/

.dual-complexity-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.complexity-card {
  padding: 1.25rem;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.complexity-card.average-case {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
  border-left: 3px solid #22c55e;
}

.complexity-card.worst-case {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(251, 146, 60, 0.05) 100%);
  border-left: 3px solid #fb923c;
}

.case-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #e5e5e5;
}

.case-title .icon {
  font-size: 1.25rem;
}

.metrics {
  display: flex;
  gap: 2rem;
  margin-bottom: 0.75rem;
}

.metric {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.metric-label {
  font-size: 0.875rem;
  color: #a3a3a3;
}

.metric-value {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 1rem;
  padding: 0.25rem 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  color: #22c55e;
}

.metric-value.highlighted {
  color: #fb923c;
  font-weight: 600;
}

.explanation {
  font-size: 0.875rem;
  color: #d4d4d4;
  line-height: 1.5;
}

.complexity-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.patterns {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.footer-label {
  font-size: 0.75rem;
  color: #a3a3a3;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pattern-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  border-radius: 12px;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.confidence-badge {
  padding: 0.375rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.confidence-badge.high {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.confidence-badge.medium {
  background: rgba(251, 146, 60, 0.2);
  color: #fb923c;
  border: 1px solid rgba(251, 146, 60, 0.3);
}

.confidence-badge.low {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.source-badge {
  padding: 0.25rem 0.75rem;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.complexity-note {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #d4d4d4;
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 4: Testing Checklist
// ════════════════════════════════════════════════════════════════════════════

/*
TEST CASES TO RUN:

1. Two Sum (HashMap)
   - Should show: Avg O(n), Worst O(n)
   - Should detect: hash-map pattern
   - Confidence: 95%+

2. Quick Sort
   - Should show: Avg O(n log n), Worst O(n²)  ← DIFFERENT!
   - Should detect: divide-conquer pattern
   - Confidence: 90%+

3. Sliding Window (Longest Substring)
   - Should show: Avg O(n), Worst O(n)
   - Should detect: sliding-window pattern
   - Confidence: 95%+

4. Backtracking (Permutations)
   - Should show: Avg O(n!), Worst O(n!)
   - Should detect: backtracking-permutations pattern
   - Confidence: 85%+

5. Binary Search
   - Should show: Avg O(log n), Worst O(log n)
   - Should detect: binary-search pattern
   - Confidence: 98%+

6. Dynamic Programming (Coin Change)
   - Should show: Avg O(n·amount), Worst O(n·amount)
   - Should detect: dp2D pattern
   - Confidence: 90%+

7. Graph BFS
   - Should show: Avg O(V+E), Worst O(V+E)
   - Should detect: bfs pattern
   - Confidence: 95%+
*/

// ════════════════════════════════════════════════════════════════════════════
// STEP 5: Rollout Strategy
// ════════════════════════════════════════════════════════════════════════════

/*
RECOMMENDED ROLLOUT:

Week 1: Backend Integration
- ✅ Integrate V2 engine in API
- ✅ Log all V2 results vs V1 results
- ✅ Monitor accuracy on 100 sample problems
- ⚠️  DO NOT display V2 in UI yet

Week 2: UI Development
- ✅ Create DualComplexityDisplay component
- ✅ Add feature flag: ENABLE_V2_COMPLEXITY
- ✅ Test UI with mock data
- ✅ A/B test with 10% of users

Week 3: Validation
- ✅ Compare V2 accuracy vs V1 on 500 problems
- ✅ Review user feedback from A/B test
- ✅ Fix any edge cases found
- ✅ Increase to 50% of users

Week 4: Full Rollout
- ✅ Enable for 100% of users
- ✅ Monitor error rates
- ✅ Collect user feedback
- ✅ Iterate on explanations

Week 5: Ground Truth Enhancement
- ✅ Manually review 347 problems missing TC/SC
- ✅ Add verified complexities to database
- ✅ Improve fingerprint matching
- ✅ Target 99%+ accuracy
*/

// ════════════════════════════════════════════════════════════════════════════
// DONE!
// ════════════════════════════════════════════════════════════════════════════

export default {
  message: 'V2 Integration Guide Complete! Follow the steps above to integrate.',
  estimatedTime: '2-3 hours for backend, 3-4 hours for UI',
  riskLevel: 'LOW (backwards compatible)',
  expectedImpact: 'HIGH (+20% accuracy, revolutionary dual complexity display)'
};
