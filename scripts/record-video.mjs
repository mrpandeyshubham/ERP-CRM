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

  console.log('Starting comprehensive video recording flow...');
  
  // 1. Login page
  console.log('1. Authentication & Roles: Logging in as Admin...');
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', 'admin@erp.com');
  await page.waitForTimeout(500);
  await page.fill('input[type="password"]', 'password123');
  await page.waitForTimeout(500);
  await page.click('button[type="submit"]');

  await page.waitForURL('http://localhost:5173/');
  await page.waitForTimeout(1500);

  // 2. Customer CRM Module
  console.log('2. Customer CRM Module...');
  await page.getByRole('link', { name: 'Customers', exact: true }).click();
  await page.waitForTimeout(1000);

  // Add Customer
  console.log(' -> Add Customer');
  await page.getByRole('button', { name: 'Add Customer' }).click();
  await page.waitForSelector('.fixed');
  await page.waitForTimeout(1000);
  
  const modalInputs = page.locator('.fixed input');
  await modalInputs.nth(0).fill('Acme Corp Demo');
  await modalInputs.nth(1).fill('9876543210');
  await modalInputs.nth(2).fill('contact@acme.demo');
  await modalInputs.nth(3).fill('Acme Inc');
  await page.locator('.fixed select').nth(0).selectOption('WHOLESALE');
  await modalInputs.nth(4).fill('GST123456789');
  
  await page.getByRole('button', { name: 'Add Customer', exact: true }).click();
  await page.waitForTimeout(1500);

  // Search Customer
  console.log(' -> Search Customer');
  await page.getByPlaceholder('Search customers...').fill('Acme Corp Demo');
  await page.waitForTimeout(1500);

  // Edit Customer
  console.log(' -> Edit Customer');
  await page.locator('table tbody tr:first-child button').first().click();
  await page.waitForSelector('.fixed');
  await page.waitForTimeout(1000);
  await page.locator('.fixed input').nth(0).fill('Acme Corp Demo Updated');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.waitForTimeout(1500);

  // View Customer detail page & Add follow-up notes
  console.log(' -> View Detail & Add Note');
  await page.locator('table tbody tr:first-child').click();
  await page.waitForSelector('.fixed');
  await page.waitForTimeout(1000);
  await page.getByPlaceholder('Add a note...').fill('Initial introduction call completed.');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.waitForTimeout(2000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // Clear search
  await page.getByPlaceholder('Search customers...').fill('');
  await page.waitForTimeout(1000);

  // 3. Product and Inventory Module
  console.log('3. Product and Inventory Module...');
  await page.getByRole('link', { name: 'Products', exact: true }).click();
  await page.waitForTimeout(1000);

  // Add Product
  console.log(' -> Add Product');
  await page.getByRole('button', { name: 'Add Product' }).click();
  await page.waitForSelector('.fixed');
  await page.waitForTimeout(1000);
  
  const pInputs = page.locator('.fixed input');
  await pInputs.nth(0).fill('Demo Widget Pro');
  await pInputs.nth(1).fill('DEMO-WID-01');
  await pInputs.nth(2).fill('Widgets');
  await pInputs.nth(3).fill('500');
  await pInputs.nth(4).fill('100');
  await pInputs.nth(5).fill('20');
  await pInputs.nth(6).fill('Aisle 4');
  
  await page.getByRole('button', { name: 'Add Product', exact: true }).click();
  await page.waitForTimeout(1500);

  // Edit Product
  console.log(' -> Edit Product');
  await page.getByPlaceholder('Search products...').fill('DEMO-WID-01');
  await page.waitForTimeout(1500);
  
  // 2nd button is edit
  await page.locator('table tbody tr:first-child button').nth(1).click();
  await page.waitForSelector('.fixed');
  await page.waitForTimeout(1000);
  await page.locator('.fixed input').nth(0).fill('Demo Widget Pro Max');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.waitForTimeout(1500);

  // Stock Movement Log (Adjust stock)
  console.log(' -> Adjust Stock / Movement');
  await page.locator('table tbody tr:first-child button').nth(0).click();
  await page.waitForSelector('.fixed');
  await page.waitForTimeout(1000);
  await page.locator('.fixed select').selectOption('OUT');
  await page.locator('.fixed input').nth(0).fill('5');
  await page.locator('.fixed input').nth(1).fill('Demo breakage');
  await page.getByRole('button', { name: 'Adjust' }).click();
  await page.waitForTimeout(1500);

  // Clear search
  await page.getByPlaceholder('Search products...').fill('');
  await page.waitForTimeout(1000);

  // 4. Sales Challan Module
  console.log('4. Sales Challan Module...');
  await page.getByRole('link', { name: 'Sales Challans', exact: true }).click();
  await page.waitForTimeout(1000);

  // Create Challan Flow
  console.log(' -> Create Challan');
  await page.getByRole('button', { name: 'New Challan' }).click();
  await page.waitForSelector('.fixed');
  await page.waitForTimeout(1000);

  // Select customer
  console.log(' -> Select Customer');
  await page.locator('.fixed select').first().selectOption({ index: 1 });
  await page.waitForTimeout(1000);

  // Select product
  console.log(' -> Select Products & Add Quantity');
  await page.locator('.fixed select').nth(1).selectOption({ index: 1 });
  await page.waitForTimeout(1000);

  // Set quantity
  await page.locator('.fixed input[type="number"]').fill('10');
  await page.waitForTimeout(1500);

  // Save as Draft
  console.log(' -> Save as Draft');
  await page.getByRole('button', { name: 'Save as Draft' }).click();
  await page.waitForTimeout(2000);

  // Confirm Challan
  console.log(' -> Confirm Challan & Deduct Stock');
  await page.locator('button:has-text("Confirm")').first().click();
  await page.waitForTimeout(2500);

  // Logout
  console.log('Logging out...');
  await page.getByText('Logout').click();
  await page.waitForTimeout(2000);

  await context.close();
  await browser.close();
  
  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.webm'));
  let videoFile = null;
  // Playwright creates a random string .webm. Find it.
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
