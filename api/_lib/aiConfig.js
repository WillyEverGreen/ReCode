import dotenv from 'dotenv';
dotenv.config();

// ═══════════════════════════════════════════════════════════════════════════════
// AI PROVIDER CONFIGURATION — NVIDIA NIM (OpenAI-compatible API)
// Model: meta/llama-3.3-70b-instruct
//   • Powerful general-purpose instruction model by Meta
//   • High-quality reasoning, code generation, and structured output
//   • Fast, reliable, and active model
// ═══════════════════════════════════════════════════════════════════════════════

// Primary model for all tasks
const NVIDIA_MODEL = 'meta/llama-3.3-70b-instruct';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_TIMEOUT_MS = 180000; // 180 seconds

/**
 * Returns the NVIDIA NIM configuration for any task.
 * @param {string} task - 'reasoning' | 'coding' | 'analysis' | 'dsasolution' | 'explanation'
 * @returns {object} { provider, baseURL, model, apiKey, timeout }
 */
export async function getAIConfig(task) {
  const model = process.env.NVIDIA_MODEL || NVIDIA_MODEL;
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    throw new Error(
      '[AI] NVIDIA_API_KEY is not set. Add it to your environment variables.'
    );
  }

  console.log(`[AI] ✅ Provider=NVIDIA  Model=${model}  Task=${task}`);

  return {
    provider: 'nvidia',
    baseURL: NVIDIA_BASE_URL,
    model,
    apiKey,
    timeout: parseInt(process.env.NVIDIA_TIMEOUT_MS) || NVIDIA_TIMEOUT_MS,
  };
}
