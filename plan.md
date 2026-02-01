Plan: Enhance Local LLM Output Quality
Since local Ollama has no token limits, we can significantly expand the depth and breadth of both solution generation and code analysis by removing artificial constraints and adding comprehensive educational sections.

Steps
Create environment-aware AI configuration in aiConfig.js that detects local vs cloud providers and returns different token limits (16000+ for local, 6000 for cloud) and timeout values (300s+ for local, 90s for cloud)

Expand solution generation prompts in index.js:543-753 by removing sentence limits like "2-3 sentences" and "6-8 steps", allowing detailed complexity proofs, adding fields for commonMistakes, interviewTips, visualExplanation, and relatedProblems

Enhance analysis prompts in aiService.ts:220-292 by removing "brief" constraints, expanding revision notes from 5-7 to unlimited, adding detailed complexity breakdowns with mathematical justifications, and including 10+ test cases

Update API handlers in index.js:792-793 and analyze.js:53-54 to use dynamic max_tokens and timeout values from the enhanced getAIConfig function based on the active provider

Extend frontend expectations in GetSolution.tsx and AnalysisResult.tsx to handle and display new optional fields like common mistakes, interview tips, and visual explanations without breaking backward compatibility

Further Considerations
Quality vs Speed Tradeoff? Local LLMs are slower - should we add a UI toggle for "Quick Mode" (current) vs "Deep Mode" (enhanced prompts), or always use enhanced prompts locally?

Model-Specific Optimization? Different Ollama models have different strengths - should we create model-specific prompts (e.g., deepseek-r1:7b for reasoning-heavy tasks, qwen2.5-coder:7b for code generation)?

Progressive Enhancement Strategy? Should we implement changes gradually (Phase 1: token limits, Phase 2: prompt expansion, Phase 3: new fields) or all at once?
