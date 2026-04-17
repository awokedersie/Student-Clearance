const accounts = [
  { type: 'student', url: 'http://localhost:3000/login', payload: { username: 'awoke123', password: 'Awok10$@' } },
  { type: 'system admin', url: 'http://localhost:3000/admin/login', payload: { username: 'system', password: 'Awok10$@' } },
  { type: 'library admin', url: 'http://localhost:3000/admin/login', payload: { username: 'library', password: 'Library10$@' } },
  { type: 'cafeteria admin', url: 'http://localhost:3000/admin/login', payload: { username: 'cafeteria', password: '12345678' } },
  { type: 'dormitory admin', url: 'http://localhost:3000/admin/login', payload: { username: 'dormitory', password: '12345678' } },
  { type: 'department admin', url: 'http://localhost:3000/admin/login', payload: { username: 'department', password: '12345678' } },
  { type: 'registrar admin', url: 'http://localhost:3000/admin/login', payload: { username: 'registrar', password: '12345678' } },
];

async function testLogins() {
  for (const acc of accounts) {
    try {
      const formBody = new URLSearchParams();
      formBody.append('username', acc.payload.username);
      formBody.append('password', acc.payload.password);
      
      // We will tell fetch NOT to follow redirects, so a 302 means successful login redirect.
      const res = await fetch(acc.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString(),
        redirect: 'manual'
      });
      
      if (res.status === 302) {
          const redirectUrl = res.headers.get('location');
          if (redirectUrl.includes('/admin/login') || redirectUrl.includes('/login')) {
              console.log(`❌ [${acc.type}] Login FAILED (redirected back to login):`, acc.payload.username);
          } else {
              console.log(`✅ [${acc.type}] Login SUCCESS:`, acc.payload.username, '->', redirectUrl);
          }
      } else if (res.status === 200) {
          const text = await res.text();
          if (text.includes('success":true')) {
             console.log(`✅ [${acc.type}] Login SUCCESS: JSON success returned`);
          } else {
             console.log(`❌ [${acc.type}] Login FAILED: Returned 200 but not a success redirect`);
          }
      } else {
          console.log(`❌ [${acc.type}] Login FAILED with status:`, res.status);
      }
    } catch (err) {
      console.log(`❌ [${acc.type}] Network error or exception:`, err.message);
    }
  }
}

testLogins();
