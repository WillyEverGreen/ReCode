// Test NVIDIA NIM API connectivity
// Usage: NVIDIA_API_KEY=your_key node scripts/test-nvidia.js
import dotenv from 'dotenv';
dotenv.config();

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct';
const API_KEY = process.env.NVIDIA_API_KEY;

async function testNvidiaApi() {
  if (!API_KEY) {
    console.error('❌ NVIDIA_API_KEY not set. Add it to your .env file.');
    process.exit(1);
  }

  console.log(`Testing NVIDIA NIM API...`);
  console.log(`  Endpoint: ${NVIDIA_API_URL}`);
  console.log(`  Model:    ${NVIDIA_MODEL}`);

  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say hello in exactly 5 words.' },
        ],
        max_tokens: 50,
        temperature: 0.3,
        stream: false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '(no content)';
      console.log('\n✅ NVIDIA NIM API is working!');
      console.log('Response:', content);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(`\n❌ API Error: ${response.status}`);
      console.error(JSON.stringify(errorData, null, 2));
    }
  } catch (error) {
    console.error('\n❌ Network Error:', error.message);
  }
}

testNvidiaApi();
