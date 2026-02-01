// Native fetch is available in Node.js 18+
const QUBRID_API_URL =
  'https://platform.qubrid.com/api/v1/qubridai/chat/completions';
const QUBRID_MODEL = 'Qwen/Qwen3-Coder-30B-A3B-Instruct';
const API_KEY =
  'k_991ae49103d0.fnuMeNIRFXExdsuk_Vio9gXyhtDcStLEOvkVzFWOJlwLgXmpffWxHw';

async function testApiKey() {
  console.log('Testing Qubrid API Key using native fetch...');
  try {
    const response = await fetch(QUBRID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: QUBRID_MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello, are you working?' },
        ],
        max_tokens: 50,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! API Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ API Error: ${response.status}`);
      console.error(JSON.stringify(errorData, null, 2));
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testApiKey();
