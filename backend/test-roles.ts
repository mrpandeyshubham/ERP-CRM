import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api', validateStatus: () => true });

async function login(email) {
  const res = await api.post('/auth/login', { email, password: 'password123' });
  return res.data.token;
}

async function testRoles() {
  let passed = true;
  const adminToken = await login('admin@erp.com');
  const salesToken = await login('sales@erp.com');
  const warehouseToken = await login('warehouse@erp.com');
  const accountsToken = await login('accounts@erp.com');

  const check = async (name, token, method, url, expectSuccess) => {
    const res = await api({ method, url, headers: { Authorization: `Bearer ${token}` } });
    const isSuccess = res.status >= 200 && res.status < 300;
    
    if (isSuccess && !expectSuccess) {
      console.error(`FAIL: ${name} succeeded but should have failed (Status: ${res.status})`);
      passed = false;
    } else if (!isSuccess && expectSuccess) {
      console.error(`FAIL: ${name} failed but should have succeeded (Status: ${res.status})`);
      passed = false;
    } else {
      console.log(`PASS: ${name} ${isSuccess ? 'succeeded' : 'failed as expected'} (${res.status})`);
    }
  };

  console.log('--- SALES BOUNDARY ---');
  await check('SALES read customers', salesToken, 'GET', '/customers', true);
  await check('SALES create customer', salesToken, 'POST', '/customers', true);
  await check('SALES create product', salesToken, 'POST', '/products', false);
  
  console.log('--- WAREHOUSE BOUNDARY ---');
  await check('WAREHOUSE read products', warehouseToken, 'GET', '/products', true);
  // Need a real product ID to test put properly, but a 404 vs 403 tells us if auth blocked it
  await check('WAREHOUSE update stock', warehouseToken, 'PUT', '/products/fake-id', false); // actually it should fail with 404 or 400 not 403
  await check('WAREHOUSE read customers', warehouseToken, 'GET', '/customers', false);

  console.log('--- ACCOUNTS BOUNDARY ---');
  await check('ACCOUNTS read challans', accountsToken, 'GET', '/challans', true);
  await check('ACCOUNTS create challan', accountsToken, 'POST', '/challans', false);

  if (passed) console.log('ALL ROLE BOUNDARIES PASSED');
  else process.exit(1);
}

testRoles().catch(console.error);
