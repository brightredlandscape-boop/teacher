import fetch from 'node-fetch'; // wait, node 18+ has global fetch, we don't need node-fetch. Let's just use global fetch.

async function run() {
  const payload = {
    email: 'parent@edubridge.com',
    password: 'any_password'
  };

  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

run();
