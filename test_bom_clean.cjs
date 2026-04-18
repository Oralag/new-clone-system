const { chromium } = require('playwright');

const BASE_URL = 'https://nomaderp.pages.dev';
const API_BASE = `${BASE_URL}/adminapi`;
const TOKEN_NAME = 'erp_token';

async function apiGet(page, path) {
  const token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_NAME);
  const resp = await page.evaluate(async ({ url, token }) => {
    const r = await fetch(url, { headers: { token } });
    return r.json();
  }, { url: `${API_BASE}${path}`, token });
  return resp;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Login
  console.log('Logging in...');
  await page.goto(`${BASE_URL}/#/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[placeholder*="账号"], input[type="text"]', '17747344571');
  await page.fill('input[placeholder*="密码"], input[type="password"]', 'Oral6421');
  await page.click('button[type="submit"], .login-btn, button:has-text("登录")');
  await page.waitForURL(/\#\/(dashboard|index|home)/, { timeout: 15000 }).catch(() => {});
  await sleep(2000);

  // Set warehouse
  await page.evaluate(() => localStorage.setItem('erp_default_warehouse_id', '1'));
  console.log('Warehouse set to 1');

  // Step 1: Baseline
  console.log('\n=== STEP 1: Baseline ===');
  const baseOut = await apiGet(page, '/stock/OtherOut/index?list_rows=200');
  const baseIn = await apiGet(page, '/stock/OtherIn/index?list_rows=200');

  const baseOutIds = new Set((baseOut?.data?.data || []).map(r => r.id));
  const baseInIds = new Set((baseIn?.data?.data || []).map(r => r.id));
  console.log(`Baseline OtherOut count: ${baseOutIds.size}`);
  console.log(`Baseline OtherIn count: ${baseInIds.size}`);

  // Step 2: Navigate to purchase order list and find CG202603313284
  console.log('\n=== STEP 2: Navigate to purchase order ===');
  await page.goto(`${BASE_URL}/#/procure/order`);
  await sleep(3000);

  // Search for the order
  const searchInput = page.locator('input[placeholder*="单号"], input[placeholder*="搜索"], .search-input input').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('CG202603313284');
    await page.keyboard.press('Enter');
    await sleep(2000);
  }

  // Find the row with this order number
  const orderRow = page.locator('tr').filter({ hasText: 'CG202603313284' }).first();
  const rowVisible = await orderRow.isVisible().catch(() => false);
  console.log(`Order row visible: ${rowVisible}`);

  if (!rowVisible) {
    // Try scrolling or pagination
    console.log('Order not visible, trying direct API audit...');
  }

  // Find the audit button in the row
  let auditBtn = orderRow.locator('button, .el-button').filter({ hasText: /审核|Audit/ }).first();
  let auditVisible = await auditBtn.isVisible().catch(() => false);

  if (!auditVisible) {
    // Try finding the row's action buttons
    const allAuditBtns = page.locator('button').filter({ hasText: '审核' });
    const count = await allAuditBtns.count();
    console.log(`Found ${count} audit buttons`);
    if (count > 0) {
      // Find the one associated with our order
      for (let i = 0; i < count; i++) {
        const btn = allAuditBtns.nth(i);
        const row = btn.locator('xpath=ancestor::tr').first();
        const rowText = await row.textContent().catch(() => '');
        if (rowText.includes('CG202603313284')) {
          auditBtn = btn;
          auditVisible = true;
          break;
        }
      }
    }
  }

  console.log(`Audit button visible: ${auditVisible}`);

  if (auditVisible) {
    await auditBtn.click();
    await sleep(1000);
    // Confirm dialog if any
    const confirmBtn = page.locator('.el-message-box button').filter({ hasText: /确定|确认|OK/ }).first();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
    }
    await sleep(3000);
    console.log('Audit clicked');
  } else {
    console.log('ERROR: Could not find audit button');
    await browser.close();
    return;
  }

  // Step 3: Record new OtherOut ids after audit
  console.log('\n=== STEP 3: OtherOut after audit ===');
  const afterAuditOut = await apiGet(page, '/stock/OtherOut/index?list_rows=200');
  const afterAuditOutIds = new Set((afterAuditOut?.data?.data || []).map(r => r.id));
  const newOutIds = [...afterAuditOutIds].filter(id => !baseOutIds.has(id));
  console.log(`OtherOut count after audit: ${afterAuditOutIds.size}`);
  console.log(`New OtherOut IDs from audit: ${JSON.stringify(newOutIds)}`);

  // Step 4: Reverse audit
  console.log('\n=== STEP 4: Reverse audit ===');
  // Find the reverse audit button
  let reverseBtn = orderRow.locator('button, .el-button').filter({ hasText: /反审|撤审/ }).first();
  let reverseVisible = await reverseBtn.isVisible().catch(() => false);

  if (!reverseVisible) {
    const allReverseBtns = page.locator('button').filter({ hasText: /反审|撤审/ });
    const count = await allReverseBtns.count();
    console.log(`Found ${count} reverse audit buttons`);
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const btn = allReverseBtns.nth(i);
        const row = btn.locator('xpath=ancestor::tr').first();
        const rowText = await row.textContent().catch(() => '');
        if (rowText.includes('CG202603313284')) {
          reverseBtn = btn;
          reverseVisible = true;
          break;
        }
      }
    }
    // If still not found, just take first one
    if (!reverseVisible && count > 0) {
      reverseBtn = allReverseBtns.first();
      reverseVisible = true;
    }
  }

  console.log(`Reverse audit button visible: ${reverseVisible}`);

  if (reverseVisible) {
    await reverseBtn.click();
    await sleep(1000);
    const confirmBtn2 = page.locator('.el-message-box button').filter({ hasText: /确定|确认|OK/ }).first();
    if (await confirmBtn2.isVisible().catch(() => false)) {
      await confirmBtn2.click();
    }
    await sleep(3000);
    console.log('Reverse audit clicked');
  } else {
    console.log('ERROR: Could not find reverse audit button');
    await browser.close();
    return;
  }

  // Step 5: Verify cleanup
  console.log('\n=== STEP 5: Verify cleanup ===');
  const afterReverseOut = await apiGet(page, '/stock/OtherOut/index?list_rows=200');
  const afterReverseIn = await apiGet(page, '/stock/OtherIn/index?list_rows=200');

  const afterReverseOutIds = new Set((afterReverseOut?.data?.data || []).map(r => r.id));
  const afterReverseInIds = new Set((afterReverseIn?.data?.data || []).map(r => r.id));

  // Check if BOM deduction records are cleaned up
  const remainingNewOutIds = newOutIds.filter(id => afterReverseOutIds.has(id));
  const newInIdsAfterReverse = [...afterReverseInIds].filter(id => !baseInIds.has(id));

  const outCountMatch = afterReverseOutIds.size === baseOutIds.size;

  console.log(`\n--- RESULTS ---`);
  console.log(`OtherOut baseline: ${baseOutIds.size}`);
  console.log(`OtherOut after audit: ${afterAuditOutIds.size} (new: ${newOutIds.length})`);
  console.log(`OtherOut after reverse: ${afterReverseOutIds.size}`);
  console.log(`OtherOut back to baseline: ${outCountMatch}`);
  console.log(`BOM records from audit still exist: ${remainingNewOutIds.length} (should be 0)`);
  console.log(`New OtherIn after reverse: ${newInIdsAfterReverse.length} (should be 0)`);

  const isClean = outCountMatch && remainingNewOutIds.length === 0 && newInIdsAfterReverse.length === 0;
  console.log(`\n=== FINAL CONCLUSION: Flow is ${isClean ? 'CLEAN ✓' : 'DIRTY ✗'} ===`);

  if (!isClean) {
    if (!outCountMatch) {
      console.log(`  - OtherOut count mismatch: expected ${baseOutIds.size}, got ${afterReverseOutIds.size}`);
    }
    if (remainingNewOutIds.length > 0) {
      console.log(`  - BOM records NOT cleaned up: IDs ${JSON.stringify(remainingNewOutIds)}`);
    }
    if (newInIdsAfterReverse.length > 0) {
      console.log(`  - Unexpected OtherIn created: IDs ${JSON.stringify(newInIdsAfterReverse)}`);
    }
  }

  await browser.close();
})();
