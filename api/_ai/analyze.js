import { getAIConfig } from '../_lib/aiConfig.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, language, problemUrl, type } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const task = type === 'reconsideration' ? 'reasoning' : 'coding';
    const config = await getAIConfig(task);

    let messages = [];

    if (type === 'reconsideration') {
      // Reconsideration: a second-pass complexity analysis when engine disagrees
      messages = [
        {
          role: 'system',
          content:
            'You are a world-class algorithm complexity expert. Analyze code rigorously and return ONLY valid JSON.',
        },
        {
          role: 'user',
          content: `Reconsider the time and space complexity of this ${language} code.

CODE:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

Return ONLY this JSON (no markdown fences):
{
  "finalTimeComplexity": "O(...)",
  "finalSpaceComplexity": "O(...)",
  "reasoning": "2-3 sentence rigorous explanation citing specific code constructs"
}`,
        },
      ];
    } else {
      // Main code analysis — produces all fields the frontend displays
      messages = [
        {
          role: 'system',
          content: `You are an expert DSA code reviewer and educator. Analyze submitted code deeply and return structured JSON that covers:
- What the code does and what problem it solves
- Exact complexity analysis with clear reasoning
- Key DSA patterns used
- Practical revision notes for future recall
- Verified test cases with correct expected outputs
- Inline logic walkthrough for the trickiest part

Always return ONLY valid JSON. Never truncate. Never use placeholder text like "...".`,
        },
        {
          role: 'user',
          content: `Analyze this ${language} code submission:

\`\`\`${language.toLowerCase()}
${code}
\`\`\`

${problemUrl ? `Problem URL: ${problemUrl}` : ''}

Return ONLY this JSON (no markdown fences, no extra text):
{
  "title": "Exact problem name (e.g., Two Sum, LRU Cache, Merge K Sorted Lists)",
  "language": "${language}",
  "dsaCategory": "Primary category: Arrays & Hashing | Two Pointers | Sliding Window | Stack | Binary Search | Linked List | Trees | Tries | Heap | Graphs | DP | Greedy | Backtracking | Bit Manipulation",
  "pattern": "Primary pattern: Two Pointers | Sliding Window | BFS/DFS | Monotonic Stack | Hash Map | Binary Search | Recursion | Memoization | etc.",
  "timeComplexity": "O(...) — best fit for the submitted code",
  "timeComplexityReason": "2-3 sentences citing specific loops, recursion depth, or data structure operations",
  "spaceComplexity": "O(...)",
  "spaceComplexityReason": "2-3 sentences explaining auxiliary space used",
  "problemOverview": "3-4 sentences: what problem this solves, key constraints, and what the code returns",
  "coreLogic": {
    "pattern": "Name of the core algorithmic pattern applied",
    "trick": "The single key insight or non-obvious trick that makes this solution work",
    "approach": "2-3 sentences explaining HOW the algorithm works step by step",
    "whyItWorks": "2-3 sentences explaining WHY this approach is correct (invariant, mathematical basis, etc.)"
  },
  "testCases": [
    "Input: [2,7,11,15], target=9 → Output: [0,1] (explanation: nums[0]+nums[1]=9)",
    "Input: [3,2,4], target=6 → Output: [1,2]",
    "Include 3-4 verified test cases. Trace the output through the ACTUAL code logic."
  ],
  "edgeCases": [
    "Empty input: [] → Output: [] (why: early return guard)",
    "Single element: [5] → Output: -1 (why: no pair possible)",
    "Include 3-4 edge cases with specific inputs/outputs based on real problem constraints"
  ],
  "syntaxNotes": [
    "Language-specific note 1 (e.g., 'dict.get(key, default) avoids KeyError in Python')",
    "Language-specific note 2",
    "Include 2-3 notes about ${language}-specific syntax or idioms used in this code"
  ],
  "revisionNotes": [
    "Concise bullet: what pattern to recognize next time",
    "Key invariant or property exploited",
    "Common mistake to avoid",
    "Include 4-5 short revision bullets optimized for spaced repetition"
  ],
  "improvementMarkdown": "## Suggestions\\n\\n1. **Improvement 1**: [description]\\n2. **Improvement 2**: [description]\\n\\n## Already Well Done\\n- [What the submitted code already does correctly]"
}`,
        },
      ];
    }

    // Call NVIDIA NIM
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    console.log(
      `[NVIDIA] Sending analyze request: task=${task}, model=${config.model}`
    );

    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.2,
        max_tokens: 4096,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[NVIDIA] Error: ${response.status} ${errText}`);
      throw new Error(`AI Provider Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.choices?.[0]?.message?.content) {
      return res.status(200).json(data);
    } else {
      console.error(
        '[NVIDIA] Unexpected response structure:',
        JSON.stringify(data).slice(0, 300)
      );
      throw new Error('Invalid response format from AI provider');
    }
  } catch (error) {
    console.error('[NVIDIA] AI Analyze Error:', error);

    if (error.name === 'AbortError') {
      return res
        .status(504)
        .json({ error: 'AI service timed out. Please try again.' });
    }

    return res
      .status(500)
      .json({ error: error.message || 'Internal Server Error' });
  }
}
