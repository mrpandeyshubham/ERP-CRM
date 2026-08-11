/**
 * Captures a consistent set of screenshots at a fixed viewport size, so all
 * images end up the same dimensions (as required by the submission).
 *
 * Requires the backend running on http://localhost:4000 and the frontend on
 * http://localhost:5173, seeded via `npx prisma db seed`.
 *
 * Usage:
 *   npm install -D playwright
 *   npx playwright install chromium
 *   node scripts/take-screenshots.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'screenshots') + path.sep;
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const VIEWPORT = { width: 1440, height: 900 };

fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT });

  const shot = async (name) => {
    await page.screenshot({ path: `${OUT_DIR}${name}.png` });
    console.log(`saved ${name}.png`);
  };

  // 1. Login page
  await page.goto(BASE_URL + '/login');
  await page.waitForSelector('text=Sign in to your account');
  await shot('01-login');

  // 2. Log in as Admin, land on Dashboard
  await page.fill('input[placeholder="Email address"]', 'admin@erp.com');
  await page.fill('input[placeholder="Password"]', 'password123');
  await page.click('button[type=submit]');
  await page.waitForSelector('text=Dashboard');
  await shot('02-dashboard');

  // 3. Customers list
  await page.click('text=Customers');
  await page.waitForSelector('table');
  await shot('03-customers-list');

  // 4. Customer detail (click first row)
  await page.waitForSelector('table tbody tr.cursor-pointer');
  await page.click('table tbody tr.cursor-pointer:first-child');
  await page.waitForSelector('text=Follow-up notes');
  await shot('04-customer-detail');
  await page.keyboard.press('Escape');

  // 5. Products list
  await page.click('text=Products');
  await page.waitForSelector('table');
  await shot('05-products-list');

  // 6. Low stock filter
  await page.click('text=Low stock only');
  await page.waitForTimeout(500);
  await shot('06-products-lowstock');

  // 7. Challans list
  await page.click('text=Challans');
  await page.waitForSelector('table');
  await shot('07-challans-list');

  // 8. New challan form
  await page.click('text=+ New Challan');
  await page.waitForSelector('text=New Sales Challan');
  await shot('08-challan-create-form');
  await page.keyboard.press('Escape');

  await browser.close();
  console.log(`\nDone — screenshots saved to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
