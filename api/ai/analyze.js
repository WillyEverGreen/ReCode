import { getAIConfig } from '../_lib/aiConfig.js';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, language, problemUrl, type } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    // 1. Get Configuration (Task: 'coding'/'analysis')
    const task = type === 'reconsideration' ? 'reasoning' : 'analysis';
    const config = await getAIConfig(task);

    // 2. Prepare Messages based on request type
    let messages = [];
    if (type === 'reconsideration') {
      // Logic for reconsideration (complexity analysis)
      // This matches the prompt logic formerly in frontend
      messages = [
        {
          role: 'system',
          content: 'You are a complexity analysis expert. Prioritize accuracy.',
        },
        {
          role: 'user',
          content: `Reconsider the complexity of this ${language} code:\n\n${code}\n\nTask: Return strict JSON { "finalTimeComplexity": "...", "finalSpaceComplexity": "...", "reasoning": "..." }.`,
        },
      ];
    } else {
      // Standard Code Analysis
      messages = [
        {
          role: 'system',
          content:
            'You are a structued code analysis engine. Return ONLY valid JSON.',
        },
        {
          role: 'user',
          content: `Analyze this ${language} code:\n\n${code}\n\nReturn JSON with: title, language, dsaCategory, timeComplexity, spaceComplexity, revisionNotes, problemOverview, testCases.`,
        },
      ];
    }

    // 3. Call LLM Provider (Use fetch with timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    console.log(
      `[API] Sending request to ${config.provider} (${config.model})...`
    );

    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        temperature: 0.2, // Lower temp for analysis
        max_tokens: 4000,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[API] LLM Error: ${response.status} ${errText}`);
      throw new Error(`AI Provider Error: ${response.status}`);
    }

    const data = await response.json();

    // 4. Return Data (Standardize OpenAI format)
    if (data.choices && data.choices[0]?.message?.content) {
      return res.status(200).json(data); // Pass through OpenAI format
    } else if (data.content) {
      // Handle direct content response if any
      return res.status(200).json({
        choices: [{ message: { content: data.content } }],
      });
    } else {
      throw new Error('Invalid response format from AI provider');
    }
  } catch (error) {
    console.error('[API] AI Analyze Error:', error);

    // Handle Timeouts specifically
    if (error.name === 'AbortError') {
      return res
        .status(504)
        .json({ error: 'AI service timed out. Please try again.' });
    }

    // Fallback? (Could try qwen2.5 base here if implemented)

    return res
      .status(500)
      .json({ error: error.message || 'Internal Server Error' });
  }
}
