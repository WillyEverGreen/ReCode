import dotenv from 'dotenv';
dotenv.config();

// Unified Task Types
// reasoning:   Deep reasoning (DSA logic) -> deepseek-r1:7b
// coding:      Code generation -> qwen2.5-coder:7b
// analysis:    Code analysis -> qwen2.5-coder:7b
// explanation: Simple explanations -> qwen2.5:7b
// search:      Embeddings -> nomic-embed-text

const DEFAULTS = {
  OLLAMA_BASE_URL: "http://127.0.0.1:11434/v1",
  TIMEOUT_MS: 120000, // 120s
  MODELS: {
    reasoning: "deepseek-r1:7b",
    coding: "qwen2.5-coder:7b",
    explanation: "qwen2.5:7b",
    search: "nomic-embed-text"
  }
};

// Global warm-up guard to prevent repetitive pinging in dev mode
if (global.__OLLAMA_WARMED__ === undefined) {
  global.__OLLAMA_WARMED__ = false;
}

/**
 * Selects the best model and configuration for a given task.
 * @param {string} task - 'reasoning' | 'coding' | 'analysis' | 'dsasolution' | 'explanation'
 * @returns {Promise<object>} - { provider, baseURL, model, apiKey, timeout }
 */
export async function getAIConfig(task) {
  const provider = process.env.AI_PROVIDER || 'qubrid'; // 'ollama' | 'qubrid'
  
  // 1. Normalize Task
  let validTask = task?.toLowerCase();
  if (validTask === 'dsasolution') validTask = 'coding';
  if (validTask === 'analysis') validTask = 'coding';
  
  // 2. Configure based on Provider
  if (provider === 'ollama') {
    return await getOllamaConfig(validTask);
  } else {
    return getQubridConfig(validTask);
  }
}

async function getOllamaConfig(task) {
  const baseURL = process.env.OLLAMA_BASE_URL || DEFAULTS.OLLAMA_BASE_URL;
  
  // Map task to specific env var or default model
  let model;
  switch (task) {
    case 'reasoning':
      model = process.env.OLLAMA_MODEL_REASONING || DEFAULTS.MODELS.reasoning;
      break;
    case 'coding':
      model = process.env.OLLAMA_MODEL_CODING || DEFAULTS.MODELS.coding;
      break;
    case 'explanation':
      model = process.env.OLLAMA_MODEL_EXPLANATION || DEFAULTS.MODELS.explanation;
      break;
    case 'search':
      model = process.env.OLLAMA_MODEL_SEARCH || DEFAULTS.MODELS.search;
      break;
    default:
      model = process.env.OLLAMA_MODEL_CODING || DEFAULTS.MODELS.coding;
  }

  // Warm-up (Once)
  if (!global.__OLLAMA_WARMED__) {
    console.log(`[LLM] 🌡️ Warming up local models...`);
    try {
      // Non-blocking ping
      fetch(`${baseURL.replace('/v1', '')}/api/tags`).then(() => {
        console.log(`[LLM] ✅ Ollama is ready.`);
      }).catch(() => {
        console.warn(`[LLM] ⚠️ Ollama not reachable at ${baseURL}. Is it running?`);
      });
      global.__OLLAMA_WARMED__ = true;
    } catch (e) {
      // Ignore
    }
  }

  console.log(`[LLM] 🟢 Config: Task=${task} Provider=Ollama Model=${model}`);

  return {
    provider: 'ollama',
    baseURL, // e.g. http://localhost:11434/v1
    model,
    apiKey: 'ollama', // Not used but keeps format consistent
    timeout: parseInt(process.env.OLLAMA_TIMEOUT) || DEFAULTS.TIMEOUT_MS
  };
}

function getQubridConfig(task) {
  // Qubrid typically uses one powerful model for everything, but we can extend if needed
  const model = "Qwen/Qwen2.5-Coder-32B-Instruct"; // Or env var
  
  console.log(`[LLM] 🔵 Config: Task=${task} Provider=Qubrid Model=${model}`);

  return {
    provider: 'qubrid',
    baseURL: "https://api.qubrid.com/v1", // Adjust to actual Qubrid endpoint
    model,
    apiKey: process.env.QUBRID_API_KEY,
    timeout: 60000 // 60s for remote API
  };
}
