const { chromium } = require('playwright');

const BASE = 'https://nomaderp.pages.dev';
const API = `${BASE}/adminapi`;
const GOODS_IDS = [989, 988, 975, 974];

async function apiGet(page, url) {
  const resp = await page.evaluate(async (u) => {
    const token = localStorage.getItem('erp_token');
    const r = await fetch(u, { headers: { token } });
    return r.json();
  }, url);
  return resp;
}

async function getStock(page, goodsIds) {
  const result = {};
  for (const id of goodsIds) {
    const r = await apiGet(page, `${API}/stock/StockAll/index?goods_id=${id}&list_rows=50`);
    if (r.data && r.data.list) {
      result[id] = r.data.list.map(item => ({
        id: item.id,
        warehouse_id: item.warehouse_id,
        goods_id: item.goods_id,
        goods_name: item.goods_name,
        stock_num: item.stock_num,
        unit: item.unit_name || item.unit,
      }));
    } else {
      result[id] = [];
    }
  }
  return result;
}

function stockSummary(stock) {
  const summary = {};
  for (const [gid, items] of Object.entries(stock)) {
    summary[gid] = items.reduce((acc, i) => acc + (parseFloat(i.stock_num) || 0), 0);
  }
  return summary;
}

async function getOtherOut(page) {
  const r = await apiGet(page, `${API}/stock/OtherOut/index?list_rows=200`);
  if (r.data && r.data.list) return r.data.list.map(i => ({ id: i.id, order_no: i.order_no, status: i.status, remark: i.remark }));
  return [];
}

async function getOtherIn(page) {
  const r = await apiGet(page, `${API}/stock/OtherIn/index?list_rows=200`);
  if (r.data && r.data.list) return r.data.list.map(i => ({ id: i.id, order_no: i.order_no, status: i.status, remark: i.remark }));
  return [];
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  // Login
  console.log('=== Step 0: Login ===');
  await page.goto(`${BASE}/#/login`);
  await page.waitForTimeout(2000);
  await page.fill('input[placeholder*="账号"], input[type="text"]', '17747344571');
  await page.fill('input[placeholder*="密码"], input[type="password"]', 'Oral6421');
  await page.click('button[type="submit"], .login-btn, button:has-text("登录")');
  await page.waitForTimeout(3000);

  // Set warehouse
  await page.evaluate(() => {
    localStorage.setItem('erp_default_warehouse_id', '1');
  });
  console.log('localStorage erp_default_warehouse_id set to 1');

  const token = await page.evaluate(() => localStorage.getItem('erp_token'));
  console.log('Token present:', !!token);

  // Step 1: Baseline OtherOut/OtherIn
  console.log('\n=== Step 1: Baseline OtherOut/OtherIn IDs ===');
  const baseOtherOut = await getOtherOut(page);
  const baseOtherIn = await getOtherIn(page);
  const baseOtherOutIds = new Set(baseOtherOut.map(i => i.id));
  const baseOtherInIds = new Set(baseOtherIn.map(i => i.id));
  console.log('Baseline OtherOut count:', baseOtherOut.length, '  IDs:', [...baseOtherOutIds].join(','));
  console.log('Baseline OtherIn count:', baseOtherIn.length, '  IDs:', [...baseOtherInIds].join(','));

  // Step 2: Record stock
  console.log('\n=== Step 2: Baseline Stock ===');
  const baseStock = await getStock(page, GOODS_IDS);
  const baseStockSum = stockSummary(baseStock);
  for (const [gid, items] of Object.entries(baseStock)) {
    console.log(`  goods_id=${gid}: total=${baseStockSum[gid]}`);
    items.forEach(i => console.log(`    warehouse=${i.warehouse_id} stock_num=${i.stock_num}`));
  }

  // Step 3: Navigate to procure order and find CG202603313284
  console.log('\n=== Step 3: Navigate to CG202603313284 ===');
  await page.goto(`${BASE}/#/procure/order`);
  await page.waitForTimeout(3000);

  // Search for the order
  const searchInput = await page.$('input[placeholder*="单号"], input[placeholder*="搜索"], .search-input input');
  if (searchInput) {
    await searchInput.fill('CG202603313284');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
  } else {
    // Try to find the order in the list
    console.log('No search input found, looking for order in list...');
  }

  // Find the row with CG202603313284
  const orderRow = await page.$('tr:has-text("CG202603313284"), .table-row:has-text("CG202603313284")');
  if (!orderRow) {
    console.log('WARNING: Could not find order CG202603313284 in table, taking screenshot...');
    await page.screenshot({ path: '/tmp/screenshot_order_list.png' });

    // Try clicking audit directly via API
    console.log('Trying to find order via API...');
    const orderList = await apiGet(page, `${API}/stock/PurchaseOrder/index?list_rows=50&order_no=CG202603313284`);
    console.log('API search result:', JSON.stringify(orderList).slice(0, 500));
  }

  await page.screenshot({ path: '/tmp/screenshot_step3.png' });

  // Look for audit button in the order row
  let auditBtn = null;

  // Try finding audit button
  const rows = await page.$$('tr, .el-table__row');
  for (const row of rows) {
    const text = await row.innerText().catch(() => '');
    if (text.includes('CG202603313284')) {
      console.log('Found row with order number');
      auditBtn = await row.$('button:has-text("审核"), .audit-btn, [class*="audit"]');
      if (!auditBtn) {
        // Maybe need to click a detail or action button first
        const btns = await row.$$('button');
        for (const btn of btns) {
          const btnText = await btn.innerText().catch(() => '');
          console.log('  Button in row:', btnText);
        }
      }
      break;
    }
  }

  if (!auditBtn) {
    // Try looking for audit button anywhere on page
    auditBtn = await page.$('button:has-text("审核")');
  }

  if (auditBtn) {
    console.log('Clicking audit button...');
    await auditBtn.click();
    await page.waitForTimeout(1000);

    // Confirm dialog
    const confirmBtn = await page.$('.el-message-box__btns .el-button--primary, button:has-text("确定"), button:has-text("确认")');
    if (confirmBtn) {
      await confirmBtn.click();
      console.log('Confirmed audit');
      await page.waitForTimeout(3000);
    } else {
      console.log('WARNING: No confirm button found');
      await page.screenshot({ path: '/tmp/screenshot_audit_dialog.png' });
    }
  } else {
    console.log('WARNING: No audit button found');
    await page.screenshot({ path: '/tmp/screenshot_no_audit.png' });
  }

  // Step 4: After audit
  console.log('\n=== Step 4: After Audit ===');
  const afterAuditOtherOut = await getOtherOut(page);
  const afterAuditOtherIn = await getOtherIn(page);

  const newOtherOut = afterAuditOtherOut.filter(i => !baseOtherOutIds.has(i.id));
  const newOtherIn = afterAuditOtherIn.filter(i => !baseOtherInIds.has(i.id));

  console.log('New OtherOut after audit:', JSON.stringify(newOtherOut, null, 2));
  console.log('New OtherIn after audit:', JSON.stringify(newOtherIn, null, 2));

  const afterAuditStock = await getStock(page, GOODS_IDS);
  const afterAuditStockSum = stockSummary(afterAuditStock);
  console.log('\nStock after audit:');
  for (const [gid, items] of Object.entries(afterAuditStock)) {
    const diff = (afterAuditStockSum[gid] || 0) - (baseStockSum[gid] || 0);
    console.log(`  goods_id=${gid}: total=${afterAuditStockSum[gid]} (diff: ${diff > 0 ? '+' : ''}${diff})`);
  }

  // Step 5: Reverse audit
  console.log('\n=== Step 5: Reverse Audit ===');
  await page.goto(`${BASE}/#/procure/order`);
  await page.waitForTimeout(2000);

  if (searchInput || true) {
    const si = await page.$('input[placeholder*="单号"], input[placeholder*="搜索"]');
    if (si) {
      await si.fill('CG202603313284');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }
  }

  // Find reverse audit button
  let reverseAuditBtn = null;
  const rows2 = await page.$$('tr, .el-table__row');
  for (const row of rows2) {
    const text = await row.innerText().catch(() => '');
    if (text.includes('CG202603313284')) {
      console.log('Found order row for reverse audit');
      const btns = await row.$$('button');
      for (const btn of btns) {
        const btnText = await btn.innerText().catch(() => '');
        console.log('  Button:', btnText);
        if (btnText.includes('反审') || btnText.includes('撤审') || btnText.includes('取消审核')) {
          reverseAuditBtn = btn;
        }
      }
      break;
    }
  }

  if (!reverseAuditBtn) {
    reverseAuditBtn = await page.$('button:has-text("反审"), button:has-text("撤审"), button:has-text("取消审核")');
  }

  if (reverseAuditBtn) {
    await reverseAuditBtn.click();
    await page.waitForTimeout(1000);
    const confirmBtn2 = await page.$('.el-message-box__btns .el-button--primary, button:has-text("确定")');
    if (confirmBtn2) {
      await confirmBtn2.click();
      console.log('Confirmed reverse audit');
      await page.waitForTimeout(3000);
    }
  } else {
    console.log('WARNING: No reverse audit button found');
    await page.screenshot({ path: '/tmp/screenshot_no_reverse.png' });
  }

  // Step 6: After reverse audit
  console.log('\n=== Step 6: After Reverse Audit ===');
  const afterRevOtherOut = await getOtherOut(page);
  const afterRevOtherIn = await getOtherIn(page);

  const afterRevOtherOutIds = new Set(afterRevOtherOut.map(i => i.id));
  const afterRevOtherInIds = new Set(afterRevOtherIn.map(i => i.id));

  // Check if new OtherOut from step 4 were deleted
  console.log('\nChecking if audit-generated OtherOut were deleted:');
  for (const item of newOtherOut) {
    const stillExists = afterRevOtherOutIds.has(item.id);
    console.log(`  OtherOut id=${item.id} order_no=${item.order_no}: ${stillExists ? 'STILL EXISTS (BAD)' : 'DELETED (GOOD)'}`);
  }

  // Check for new OtherIn (should not exist)
  const newOtherInAfterRev = afterRevOtherIn.filter(i => !baseOtherInIds.has(i.id));
  console.log('\nNew OtherIn after reverse audit (should be empty):');
  if (newOtherInAfterRev.length === 0) {
    console.log('  CLEAN - no new OtherIn (GOOD)');
  } else {
    console.log('  WARNING - unexpected OtherIn:', JSON.stringify(newOtherInAfterRev, null, 2));
  }

  // Check stock rollback
  const afterRevStock = await getStock(page, GOODS_IDS);
  const afterRevStockSum = stockSummary(afterRevStock);
  console.log('\nStock after reverse audit vs baseline:');
  let stockClean = true;
  for (const gid of GOODS_IDS) {
    const base = baseStockSum[gid] || 0;
    const afterRev = afterRevStockSum[gid] || 0;
    const diff = afterRev - base;
    const clean = Math.abs(diff) < 0.001;
    if (!clean) stockClean = false;
    console.log(`  goods_id=${gid}: baseline=${base}, after_rev=${afterRev}, diff=${diff > 0 ? '+' : ''}${diff} ${clean ? '(CLEAN)' : '(DIRTY - NOT ROLLED BACK)'}`);
  }

  // Summary
  console.log('\n======== SUMMARY ========');
  console.log(`Audit generated OtherOut: ${newOtherOut.length} records`);
  newOtherOut.forEach(i => console.log(`  - id=${i.id}, order_no=${i.order_no}`));
  console.log(`After reverse audit:`);
  console.log(`  OtherOut deleted: ${newOtherOut.every(i => !afterRevOtherOutIds.has(i.id)) ? 'YES (GOOD)' : 'NO (BAD)'}`);
  console.log(`  New OtherIn produced: ${newOtherInAfterRev.length === 0 ? 'NO (GOOD)' : 'YES (BAD)'}`);
  console.log(`  Stock rolled back cleanly: ${stockClean ? 'YES (GOOD)' : 'NO (BAD)'}`);

  await page.screenshot({ path: '/tmp/screenshot_final.png' });
  await browser.close();
})();
