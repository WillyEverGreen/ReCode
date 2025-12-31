# Testing the Complexity Mismatch Feature

## Quick Test Guide

### Prerequisites
1. Ensure you have a valid `QUBRID_API_KEY` set in your `.env` file
2. Backend and frontend should be running

### Test Scenarios

#### Test 1: Force a Mismatch (Two-Pointer Problem)
**Problem**: "Two Sum" or "Valid Palindrome"
**Why**: LLM often mistakes two-pointer O(n) for O(n²)

**Steps**:
1. Go to "Get Solution" tab
2. Enter problem name: "Valid Palindrome"
3. Select language: Python/JavaScript
4. Click "Generate Solution"
5. Wait for solution to load (this will take longer due to the reasoning request)
6. Check the "Optimal" approach
7. Look for a **blue info box** above the complexity cards

**Expected Result**: 
- If there's a mismatch, you'll see:
  - Blue border box with AlertTriangle icon
  - Text starting with "**Engine corrected complexity:**"
  - LLM's reasoning explaining why it chose different values

#### Test 2: No Mismatch (Simple Problem)
**Problem**: "Reverse Linked List"
**Why**: LLM usually gets this right (O(n) time, O(1) space)

**Steps**:
1. Enter problem: "Reverse Linked List"
2. Generate solution
3. Check all three approaches

**Expected Result**:
- No blue mismatch box should appear
- Only the regular amber "complexityNote" might show (if better=null)

#### Test 3: Multiple Mismatches
**Problem**: "Merge Intervals"
**Why**: Arrays + sorting can confuse both TC and SC analysis

**Steps**:
1. Enter problem: "Merge Intervals"
2. Generate solution
3. Check ALL three approaches (Brute, Better, Optimal)

**Expected Result**:
- Potentially see mismatch notes on 1-3 approaches
- Each should have unique reasoning
- Generation might take 5-10 seconds longer (3 reasoning requests)

## What to Look For

### ✅ Success Indicators
- [ ] Blue info box appears when there's a mismatch
- [ ] Text includes both "Engine corrected" and "LLM's reasoning" sections
- [ ] Corrected complexity values match the complexity cards
- [ ] Markdown formatting renders correctly (bold text)
- [ ] No console errors related to reasoning requests

### ⚠️ Potential Issues
- [ ] Timeout: If LLM reasoning takes >15s, it will show generic message
- [ ] Parse errors: If LLM returns invalid JSON, reasoning will be null
- [ ] Rate limits: Multiple requests might hit API limits

## Console Logs to Monitor

When testing, open browser DevTools Console and look for:

```
[COMPLEXITY ENGINE] SOURCE=ENGINE | Corrected bruteForce: TC=O(n²) → O(n), SC=O(1) → O(1)
[LLM REASONING] Got explanation for bruteForce mismatch
```

Or on the backend (if you have access to Vercel logs or local server):

```
[COMPLEXITY ENGINE] Validating AI-generated complexity values...
[LLM REASONING] API error: 429  // (if rate limited)
```

## Testing Checklist

### Functionality Tests
- [ ] Mismatch note appears when engine corrects complexity
- [ ] LLM reasoning is displayed correctly
- [ ] Original LLM values are stored (check in browser DevTools)
- [ ] Engine values are applied to the complexity cards
- [ ] Multiple approaches can all have mismatches
- [ ] UI doesn't break if reasoning request fails

### UI/UX Tests  
- [ ] Blue box is visually distinct from amber complexity note
- [ ] Alert icon is properly aligned
- [ ] Markdown bold text renders correctly
- [ ] Box doesn't overlap with other elements
- [ ] Responsive on mobile (if applicable)

### Performance Tests
- [ ] Solution generation completes within reasonable time
- [ ] Timeout prevents hanging (test by temporarily changing timeout to 1s)
- [ ] Parallel requests don't cause race conditions

## Mock Testing (If API is Down)

If you can't use the real API, you can manually test the UI by:

1. Open browser DevTools
2. Generate a solution
3. In the Console, manually add a mismatch note:
```javascript
// After solution loads, run this in console:
const solution = document.querySelector('[data-solution]');
// This won't work in production, but you can test the UI styling separately
```

Alternatively, temporarily modify the backend to return fake mismatch data.

## Common Edge Cases

1. **All three approaches have mismatches**: Should see 3 blue boxes
2. **Only one approach has mismatch**: Only that approach shows the box
3. **LLM returns empty reasoning**: Should show generic fallback message
4. **Very long reasoning**: Should wrap text properly (test with verbose LLM response)

## Debugging Tips

### If mismatch note doesn't appear:
1. Check if `corrected.corrected === true` in logs
2. Verify `requestComplexityReasoning()` was called
3. Check if response parsing succeeded

### If reasoning is generic:
1. Check for timeout (>15s)
2. Check API key validity
3. Check rate limits
4. Review Qubrid API logs

### If UI breaks:
1. Check browser console for React errors
2. Verify MarkdownRenderer component exists
3. Check if AlertTriangle icon is imported

## Success Metrics

After implementation, track:
- **Frequency**: How often mismatches occur (should be 10-30% of requests)
- **Quality**: Are LLM explanations helpful?
- **Performance**: Average time increase per request
- **Accuracy**: Are engine corrections actually correct?

## Next Steps

Once testing is complete:
1. Document any bugs found
2. Optimize parallel reasoning requests if needed
3. Consider caching reasoning for identical mismatches
4. Gather user feedback on helpfulness of explanations
