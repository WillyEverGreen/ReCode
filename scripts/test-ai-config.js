// Test NVIDIA NIM API Configuration
// Usage: node scripts/test-ai-config.js
import dotenv from 'dotenv';
import { getAIConfig } from '../api/_lib/aiConfig.js';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testConfig() {
  console.log('═══════════════════════════════════════════════');
  console.log('         NVIDIA NIM API Configuration Test     ');
  console.log('═══════════════════════════════════════════════\n');

  const tasks = ['reasoning', 'coding', 'explanation'];

  for (const task of tasks) {
    try {
      const config = await getAIConfig(task);
      console.log(`✅ [${task.toUpperCase()}]`);
      console.log(`   Provider : ${config.provider}`);
      console.log(`   Model    : ${config.model}`);
      console.log(`   Base URL : ${config.baseURL}`);
      console.log(`   Timeout  : ${config.timeout}ms\n`);
    } catch (e) {
      console.error(`❌ [${task.toUpperCase()}] Error:`, e.message);
    }
  }

  // Test a live ping to NVIDIA NIM
  console.log('--- Testing NVIDIA NIM Connectivity ---');
  try {
    const config = await getAIConfig('coding');
    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Reply with only: OK' }],
        max_tokens: 10,
        stream: false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || '(no reply)';
      console.log(`✅ NVIDIA NIM is reachable! Reply: "${reply}"`);
    } else {
      const err = await response.json().catch(() => ({}));
      console.error(
        `❌ NVIDIA API error ${response.status}:`,
        JSON.stringify(err)
      );
    }
  } catch (e) {
    console.error('❌ Network error:', e.message);
  }
}

testConfig();
