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
  
  const validCustomer = { name: 'Test', mobile: '1234567890', customerType: 'RETAIL' };
  const resSalesCreate = await api.post('/customers', validCustomer, { headers: { Authorization: `Bearer ${salesToken}` } });
  if (resSalesCreate.status >= 200 && resSalesCreate.status < 300) {
    console.log(`PASS: SALES create customer succeeded (${resSalesCreate.status})`);
  } else {
    console.error(`FAIL: SALES create customer failed (Status: ${resSalesCreate.status})`);
    passed = false;
  }
  
  await check('SALES create product', salesToken, 'POST', '/products', false);
  
  console.log('--- WAREHOUSE BOUNDARY ---');
  await check('WAREHOUSE read products', warehouseToken, 'GET', '/products', true);
  
  const productsRes = await api.get('/products?limit=1', { headers: { Authorization: `Bearer ${warehouseToken}` } });
  const realProductId = productsRes.data.data?.[0]?.id;
  if (realProductId) {
    // We expect this to SUCCEED for warehouse
    const res = await api.post(`/products/${realProductId}/stock`, { quantity: 1, movementType: 'IN', reason: 'Test' }, { headers: { Authorization: `Bearer ${warehouseToken}` } });
    if (res.status >= 200 && res.status < 300) {
      console.log(`PASS: WAREHOUSE update stock succeeded on real product (${res.status})`);
    } else {
      console.error(`FAIL: WAREHOUSE update stock failed on real product (Status: ${res.status})`);
      passed = false;
    }
  } else {
    console.error('Could not fetch a real product ID for WAREHOUSE test');
    passed = false;
  }
  
  // Also verify WAREHOUSE hits a 403 on customers, not a 404
  const custRes = await api.get('/customers', { headers: { Authorization: `Bearer ${warehouseToken}` } });
  if (custRes.status === 403) {
    console.log(`PASS: WAREHOUSE read customers blocked unambiguously by RBAC (403)`);
  } else {
    console.error(`FAIL: WAREHOUSE read customers returned ${custRes.status}, expected 403`);
    passed = false;
  }

  console.log('--- ACCOUNTS BOUNDARY ---');
  await check('ACCOUNTS read challans', accountsToken, 'GET', '/challans', true);
  await check('ACCOUNTS create challan', accountsToken, 'POST', '/challans', false);

  if (passed) console.log('ALL ROLE BOUNDARIES PASSED');
  else process.exit(1);
}

testRoles().catch(console.error);
