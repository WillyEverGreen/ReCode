import dotenv from 'dotenv';
import { getAIConfig } from '../api/_lib/aiConfig.js';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testConfig() {
  console.log('--- Testing AI Config Loading ---');
  const tasks = ['reasoning', 'coding', 'explanation'];

  for (const task of tasks) {
    try {
      const config = await getAIConfig(task);
      console.log(`[${task.toUpperCase()}]`);
      console.log(`  Provider: ${config.provider}`);
      console.log(`  Model: ${config.model}`);
      console.log(`  BaseURL: ${config.baseURL}`);
    } catch (e) {
      console.error(`Error loading config for ${task}:`, e.message);
    }
  }

  console.log('\n--- Testing Ollama Connectivity ---');
  // Only test if provider is ollama
  const config = await getAIConfig('coding');
  if (config.provider === 'ollama') {
    try {
      const url = config.baseURL.replace('/v1', '') + '/api/tags';
      console.log(`Pinging ${url}...`);
      const res = await fetch(url);
      if (res.ok) {
        console.log('✅ Ollama is Reachable!');
        const data = await res.json();
        const models = data.models.map((m) => m.name);
        console.log('Available Models:', models.join(', '));

        // Verify we have the models we need
        const required = [
          process.env.OLLAMA_MODEL_REASONING || 'deepseek-r1:7b',
          process.env.OLLAMA_MODEL_CODING || 'qwen2.5-coder:7b',
        ];

        const missing = required.filter(
          (r) => !models.some((m) => m.includes(r.split(':')[0]))
        );
        // loose matching on name part

        if (missing.length > 0) {
          console.warn(
            '⚠️  Warning: Some configured models might be missing:',
            missing
          );
        } else {
          console.log('✅ All required models appear to be present.');
        }
      } else {
        console.error('❌ Ollama responded but with error:', res.status);
      }
    } catch (e) {
      console.error('❌ Could not reach Ollama:', e.message);
      console.error(
        "   Ensure 'ollama serve' is running in a separate terminal."
      );
    }
  } else {
    console.log('Skipping connectivity test (Provider is not Ollama)');
  }
}

testConfig();
