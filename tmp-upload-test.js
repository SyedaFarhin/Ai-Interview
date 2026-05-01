const fs = require('fs');
const fetch = global.fetch;

(async () => {
  const pdf = Buffer.from('JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwvTGluZWFyaXplZCAxL0wgNzQ0OTgvTyA2L0UgNTQ0NDEvTiAxL1QgNzQyOTgvSCBbIDk5NSA5NDQwIF0+PgplbmRvYmoKc3RhcnR4cmVmCjE1OTYKPj4K', 'base64');
  fs.writeFileSync('test.pdf', pdf);

  const email = `test_${Math.random().toString(36).slice(2, 10)}@example.com`;
  const base = 'http://localhost:3000';

  let res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testuser', email, password: 'Test1234' })
  });

  let text = await res.text();
  console.log('register', res.status, text);

  if (res.status !== 201) {
    res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Test1234' })
    });
    text = await res.text();
    console.log('login', res.status, text);
  }

  const cookie = res.headers.get('set-cookie');
  console.log('cookie', cookie);

  const formData = new FormData();
  formData.append('jobDescription', 'Test job');
  formData.append('selfDescription', 'Test self');
  formData.append('resume', new Blob([pdf], { type: 'application/pdf' }), 'test.pdf');

  const uploadRes = await fetch(`${base}/api/interview/`, {
    method: 'POST',
    headers: {
      Cookie: cookie
    },
    body: formData
  });

  const uploadText = await uploadRes.text();
  console.log('upload', uploadRes.status, uploadText);
})();
