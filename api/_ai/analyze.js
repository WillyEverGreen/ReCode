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
    // 1. Get Configuration (task: 'reasoning' for reconsideration, 'coding' for analysis)
    const task = type === 'reconsideration' ? 'reasoning' : 'coding';
    const config = await getAIConfig(task);

    // 2. Prepare Messages
    let messages = [];
    if (type === 'reconsideration') {
      messages = [
        {
          role: 'system',
          content: 'You are a complexity analysis expert. Prioritize accuracy.',
        },
        {
          role: 'user',
          content: `Reconsider the complexity of this ${language} code:\n\n${code}\n\nReturn strict JSON { "finalTimeComplexity": "...", "finalSpaceComplexity": "...", "reasoning": "..." }.`,
        },
      ];
    } else {
      messages = [
        {
          role: 'system',
          content:
            'You are a structured code analysis engine. Return ONLY valid JSON.',
        },
        {
          role: 'user',
          content: `Analyze this ${language} code:\n\n${code}\n\nReturn JSON with: title, language, dsaCategory, timeComplexity, spaceComplexity, revisionNotes, problemOverview, testCases.`,
        },
      ];
    }

    // 3. Call AI Provider with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    console.log(
      `[NVIDIA] Sending request: task=${task}, model=${config.model}`
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
        max_tokens: 4000,
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

    // 4. Extract content (standard OpenAI format)
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
