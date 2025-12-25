(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/solution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionName: 'Two Sum',
        language: 'javascript',
        problemDescription: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.'
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
})();
