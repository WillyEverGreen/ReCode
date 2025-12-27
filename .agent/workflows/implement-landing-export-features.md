---
description: Implement Landing Page Updates, Export Features, FAQ, and Mobile Responsiveness
---

# Implementation Plan: Landing Page + Export + Mobile UX

## Phase 1: Landing Page Pro Features Highlight ✅

### Tasks:
1. Update Features Section:
   - Add "Unlimited AI Analysis" with Crown badge
   - Add "Advanced Complexity Engine" with Crown badge
   - Add "Export Notes (PDF/Markdown)" with Crown badge
   - Update existing Pro features

2. Add Pricing Comparison Section:
   - Free Plan: 2 Get Solution, 3 Add Solution, 1 Variant per day
   - Pro Plan: Unlimited everything + advanced features

3. Update FAQ Section:
   - Add "What's included in Free vs Pro?"
   - Update pricing FAQ with correct $9/month info
   - Add "Can I export my notes?" question

## Phase 2: Export Features (PDF/Markdown) ✅

### Add to QuestionDetail.tsx (Add Solution Results):
- Add Export Dropdown button (PDF, Markdown, Text)
- Generate formatted content with:
  * Problem title
  * Code snippet
  * Complexity analysis
  * Fast recall checklist
  * AI suggestions

### Add to GetSolution.tsx (Get Solution Results):
- Add Export button for each approach
- Include all three approaches (brute, better, optimal)

### Implementation:
```typescript
// Use jsPDF for PDF generation
// Use markdown-it or direct string formatting for Markdown
```

## Phase 3: Mobile Responsiveness Audit ✅

### Components to Fix:
1. **LandingPage.tsx**:
   - Hero section: Stack buttons vertically on mobile
   - Features grid: 1 column on mobile, 2 on tablet, 3 on desktop
   - FAQ: Full width on mobile
   
2. **Dashboard.tsx**:
   - Question cards: Full width on mobile
   - Search bar: Full width on mobile
   
3. **QuestionDetail.tsx**:
   - Code blocks: Horizontal scroll on mobile
   - Tabs: Scrollable horizontal on mobile
   
4. **GetSolution.tsx**:
   - Approach cards: Stack vertically on mobile
   - Code editor: Full width, scroll

5. **Pricing.tsx**:
   - Plan cards: Stack vertically on mobile

## Phase 4: Testing Checklist

- [ ] Test all export formats (PDF, Markdown, Text)
- [ ] Test on mobile devices (iPhone, Android)
- [ ] Test tablet breakpoints (768px, 1024px)
- [ ] Test FAQ expand/collapse
- [ ] Test all Pro feature badges appear correctly
- [ ] Verify pricing info is accurate everywhere

## Files to Modify:
- `components/LandingPage.tsx`
- `components/QuestionDetail.tsx`
- `components/GetSolution.tsx`
- `components/Dashboard.tsx`
- `components/Pricing.tsx`
- `package.json` (add jsPDF dependency)
