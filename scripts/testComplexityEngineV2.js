/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TEST COMPLEXITY ENGINE V2 WITH REAL PROBLEMS
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { analyzeComplexityV2 } from '../utils/complexityEngineV2.js';

console.log('🧪 Testing Complexity Engine V2\n');
console.log('═'.repeat(80));

// Test Case 1: Two Sum (should hit ground truth)
console.log('\n📌 Test 1: Two Sum\n');
const twoSumCode = `
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}
`;

const result1 = analyzeComplexityV2(twoSumCode, 'javascript', 'Two Sum');
console.log('\n✅ Result:');
console.log(
  `   Average Case: Time=${result1.averageCase.time}, Space=${result1.averageCase.space}`
);
console.log(
  `   Worst Case:   Time=${result1.worstCase.time}, Space=${result1.worstCase.space}`
);
console.log(`   Confidence: ${result1.confidence}%`);
console.log(`   Source: ${result1.source}`);

// Test Case 2: Merge Sort (should detect pattern)
console.log('\n═'.repeat(80));
console.log('\n📌 Test 2: Merge Sort\n');
const mergeSortCode = `
function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    
    return merge(left, right);
}

function merge(left, right) {
    const result = [];
    let i = 0, j = 0;
    
    while (i < left.length && j < right.length) {
        if (left[i] < right[j]) {
            result.push(left[i++]);
        } else {
            result.push(right[j++]);
        }
    }
    
    return result.concat(left.slice(i)).concat(right.slice(j));
}
`;

const result2 = analyzeComplexityV2(mergeSortCode, 'javascript');
console.log('\n✅ Result:');
console.log(
  `   Average Case: Time=${result2.averageCase.time}, Space=${result2.averageCase.space}`
);
console.log(
  `   Worst Case:   Time=${result2.worstCase.time}, Space=${result2.worstCase.space}`
);
console.log(`   Confidence: ${result2.confidence}%`);
console.log(`   Patterns: ${result2.patterns.join(', ')}`);

// Test Case 3: Coin Change (should hit ground truth if available)
console.log('\n═'.repeat(80));
console.log('\n📌 Test 3: Coin Change (DP)\n');
const coinChangeCode = `
function coinChange(coins, amount) {
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    
    for (let i = 1; i <= amount; i++) {
        for (const coin of coins) {
            if (i >= coin) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
    }
    
    return dp[amount] === Infinity ? -1 : dp[amount];
}
`;

const result3 = analyzeComplexityV2(
  coinChangeCode,
  'javascript',
  'Coin Change'
);
console.log('\n✅ Result:');
console.log(
  `   Average Case: Time=${result3.averageCase.time}, Space=${result3.averageCase.space}`
);
console.log(
  `   Worst Case:   Time=${result3.worstCase.time}, Space=${result3.worstCase.space}`
);
console.log(`   Confidence: ${result3.confidence}%`);
console.log(`   Source: ${result3.source}`);

console.log('\n═'.repeat(80));
console.log('\n✅ All tests complete!\n');
