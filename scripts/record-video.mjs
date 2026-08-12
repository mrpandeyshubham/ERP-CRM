import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'videos') + path.sep;
const VIEWPORT = { width: 1440, height: 900 };

fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: {
      dir: OUT_DIR,
      size: VIEWPORT
    }
  });
  
  const page = await context.newPage();
  const runId = Date.now().toString().substring(7);

  console.log('Starting exact script sequence...');
  
  // 1. Admin Login (Opening)
  console.log('1. Admin Login & Dashboard...');
  await page.goto('http://localhost:5173/login');
  
  // Inject a continuous 1px animation to force browser frame rendering during idle times
  await page.addStyleTag({ content: `
    @keyframes forceRender { 100% { transform: rotate(360deg); } }
    body::after {
      content: "";
      position: fixed;
      bottom: 0; right: 0;
      width: 1px; height: 1px;
      background: transparent;
      animation: forceRender 1s linear infinite;
      pointer-events: none;
      z-index: 9999;
    }
  `});
  
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', 'admin@erp.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:5173/');
  await page.waitForTimeout(3000); // Admin dashboard overview
  await page.locator('button:has-text("Logout")').first().click();
  await page.waitForTimeout(1500);

  // 2. Customer CRM Module (Sales Role)
  console.log('2. Sales Role - Customer CRM...');
  await page.fill('input[type="email"]', 'sales@erp.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:5173/');
  await page.waitForTimeout(1500);
  
  await page.getByRole('link', { name: 'Customers', exact: true }).click();
  await page.waitForTimeout(1500);

  // Add Customer
  console.log(' -> Add Customer');
  await page.getByRole('button', { name: 'Add Customer' }).click();
  await page.waitForSelector('.fixed.inset-0');
  await page.waitForTimeout(1000);
  
  const customerName = `Global Tech ${runId}`;
  const cInputs = page.locator('.fixed.inset-0 input');
  await cInputs.nth(0).fill(customerName);
  await cInputs.nth(1).fill(`555${runId}12`);
  await cInputs.nth(2).fill(`sales@globaltech${runId}.com`);
  await cInputs.nth(3).fill('Global Tech Ltd');
  await page.locator('.fixed.inset-0 select').nth(0).selectOption('DISTRIBUTOR');
  await cInputs.nth(4).fill(`GST${runId}XYZ`);
  
  await page.getByRole('button', { name: 'Add Customer', exact: true }).click();
  await page.waitForSelector('.fixed.inset-0', { state: 'hidden' });
  await page.waitForTimeout(1500);

  // Search Customer
  console.log(' -> Search Customer');
  await page.getByPlaceholder('Search customers...').fill(customerName);
  await page.waitForTimeout(1500);

  // Edit Customer
  console.log(' -> Edit Customer');
  await page.locator('table tbody tr:first-child button').first().click();
  await page.waitForSelector('.fixed.inset-0');
  await page.waitForTimeout(1000);
  await page.locator('.fixed.inset-0 input').nth(0).fill(`${customerName} Inc.`);
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.waitForSelector('.fixed.inset-0', { state: 'hidden' });
  await page.waitForTimeout(1500);

  // View Customer detail page & Add follow-up notes
  console.log(' -> View Detail & Add Note');
  await page.locator('table tbody tr:first-child').click();
  await page.waitForSelector('.fixed.inset-0');
  await page.waitForTimeout(1500);
  await page.getByPlaceholder('Add a note...').fill('Follow up next week for Q4 orders.');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.waitForTimeout(2000);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.fixed.inset-0', { state: 'hidden' });
  await page.waitForTimeout(1000);

  await page.locator('button:has-text("Logout")').first().click();
  await page.waitForTimeout(1500);

  // 3. Product and Inventory Module (Warehouse Role)
  console.log('3. Warehouse Role - Products & Inventory...');
  await page.fill('input[type="email"]', 'warehouse@erp.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:5173/');
  await page.waitForTimeout(1500);
  
  await page.getByRole('link', { name: 'Products', exact: true }).click();
  await page.waitForTimeout(1500);

  // Add Product
  console.log(' -> Add Product');
  await page.getByRole('button', { name: 'Add Product' }).click();
  await page.waitForSelector('.fixed.inset-0');
  await page.waitForTimeout(1000);
  
  const productSku = `SKU-${runId}`;
  const pInputs = page.locator('.fixed.inset-0 input');
  await pInputs.nth(0).fill('Premium Widget');
  await pInputs.nth(1).fill(productSku);
  await pInputs.nth(2).fill('Electronics');
  await pInputs.nth(3).fill('299.99');
  await pInputs.nth(4).fill('250');
  await pInputs.nth(5).fill('50');
  await pInputs.nth(6).fill('Section B, Rack 3');
  
  await page.getByRole('button', { name: 'Add Product', exact: true }).click();
  await page.waitForSelector('.fixed.inset-0', { state: 'hidden' });
  await page.waitForTimeout(1500);

  // Edit Product
  console.log(' -> Edit Product');
  await page.getByPlaceholder('Search products...').fill(productSku);
  await page.waitForTimeout(1500);
  
  await page.locator('table tbody tr:first-child button').nth(1).click();
  await page.waitForSelector('.fixed.inset-0');
  await page.waitForTimeout(1000);
  await page.locator('.fixed.inset-0 input').nth(3).fill('349.99'); // Change price
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.waitForSelector('.fixed.inset-0', { state: 'hidden' });
  await page.waitForTimeout(1500);

  // Stock Movement Log (Adjust stock)
  console.log(' -> Adjust Stock / Movement');
  await page.locator('table tbody tr:first-child button').nth(0).click();
  await page.waitForSelector('.fixed.inset-0');
  await page.waitForTimeout(1000);
  await page.locator('.fixed.inset-0 select').selectOption('IN');
  await page.locator('.fixed.inset-0 input').nth(0).fill('50');
  await page.locator('.fixed.inset-0 input').nth(1).fill('New shipment received');
  await page.getByRole('button', { name: 'Adjust' }).click();
  await page.waitForSelector('.fixed.inset-0', { state: 'hidden' });
  await page.waitForTimeout(2000);

  await page.locator('button:has-text("Logout")').first().click();
  await page.waitForTimeout(1500);

  // 4. Sales Challan Module (Sales Role)
  console.log('4. Sales Role - Challans...');
  await page.fill('input[type="email"]', 'sales@erp.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:5173/');
  await page.waitForTimeout(1500);

  await page.getByRole('link', { name: 'Sales Challans', exact: true }).click();
  await page.waitForTimeout(1500);

  // Challan 1: Draft
  console.log(' -> Create Draft Challan');
  await page.getByRole('button', { name: 'New Challan' }).click();
  await page.waitForSelector('.fixed.inset-0');
  await page.waitForTimeout(1000);
  await page.locator('.fixed.inset-0 select').first().selectOption({ index: 1 });
  await page.waitForTimeout(500);
  await page.locator('.fixed.inset-0 select').nth(1).selectOption({ index: 1 });
  await page.waitForTimeout(500);
  await page.locator('.fixed.inset-0 input[type="number"]').fill('15');
  await page.getByRole('button', { name: 'Save as Draft' }).click();
  await page.waitForSelector('.fixed.inset-0', { state: 'hidden' });
  await page.waitForTimeout(2000);

  // Challan 2: Confirm
  console.log(' -> Create & Confirm Challan');
  await page.getByRole('button', { name: 'New Challan' }).click();
  await page.waitForSelector('.fixed.inset-0');
  await page.waitForTimeout(1000);
  await page.locator('.fixed.inset-0 select').first().selectOption({ index: 2 });
  await page.waitForTimeout(500);
  await page.locator('.fixed.inset-0 select').nth(1).selectOption({ index: 2 });
  await page.waitForTimeout(500);
  await page.locator('.fixed.inset-0 input[type="number"]').fill('5');
  await page.getByRole('button', { name: 'Save as Draft' }).click();
  await page.waitForSelector('.fixed.inset-0', { state: 'hidden' });
  await page.waitForTimeout(2000);

  console.log(' -> Confirm Challan');
  await page.locator('button:has-text("Confirm")').first().click();
  await page.waitForTimeout(3000);

  await page.locator('button:has-text("Logout")').first().click();
  await page.waitForTimeout(1500);

  // 5. Accounts Role
  console.log('5. Accounts Role...');
  await page.fill('input[type="email"]', 'accounts@erp.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:5173/');
  await page.waitForTimeout(3000);
  await page.getByRole('link', { name: 'Sales Challans', exact: true }).click();
  await page.waitForTimeout(2500);
  await page.locator('button:has-text("Logout")').first().click();
  await page.waitForTimeout(1500);

  // 6. Admin Oversight
  console.log('6. Admin Oversight...');
  await page.fill('input[type="email"]', 'admin@erp.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:5173/');
  await page.waitForTimeout(4000);

  console.log('Waiting to ensure 2 min limit...');
  await page.waitForTimeout(5000);

  await context.close();
  await browser.close();
  
  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.webm'));
  let videoFile = null;
  for (const f of files) {
      if (f !== 'full_flow_demo.webm') {
          videoFile = f;
          break;
      }
  }

  if (videoFile) {
    const newName = 'full_flow_demo.webm';
    if (fs.existsSync(path.join(OUT_DIR, newName))) {
        fs.unlinkSync(path.join(OUT_DIR, newName));
    }
    fs.renameSync(path.join(OUT_DIR, videoFile), path.join(OUT_DIR, newName));
    
    // delete rest of videos
    const allFiles = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.webm'));
    for (const f of allFiles) {
        if (f !== newName) {
            fs.unlinkSync(path.join(OUT_DIR, f));
        }
    }

    console.log(`\nDone! Video saved as ${path.join(OUT_DIR, newName)}`);
    console.log(`Note: Playwright records in WebM format. To get MP4, you will need to convert this file using a tool like FFmpeg or an online converter.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
