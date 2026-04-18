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
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  // Login via direct API call to avoid UI issues
  console.log('=== Step 0: Login via API ===');
  await page.goto(BASE);
  await page.waitForTimeout(2000);

  const loginResp = await page.evaluate(async () => {
    const r = await fetch('https://nomaderp.pages.dev/adminapi/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: '17747344571', password: 'Oral6421' })
    });
    return r.json();
  });
  console.log('Login response:', JSON.stringify(loginResp).slice(0, 200));

  const token = loginResp.data && loginResp.data.token;
  if (!token) {
    console.error('Login failed!');
    await browser.close();
    return;
  }

  await page.evaluate((t) => {
    localStorage.setItem('erp_token', t);
    localStorage.setItem('erp_default_warehouse_id', '1');
  }, token);
  console.log('Token set:', token.slice(0, 20) + '...');

  // Step 1: Baseline OtherOut/OtherIn
  console.log('\n=== Step 1: Baseline OtherOut/OtherIn IDs ===');
  const baseOtherOut = await getOtherOut(page);
  const baseOtherIn = await getOtherIn(page);
  const baseOtherOutIds = new Set(baseOtherOut.map(i => i.id));
  const baseOtherInIds = new Set(baseOtherIn.map(i => i.id));
  console.log('Baseline OtherOut count:', baseOtherOut.length);
  console.log('Baseline OtherIn count:', baseOtherIn.length);

  // Step 2: Record stock
  console.log('\n=== Step 2: Baseline Stock ===');
  const baseStock = await getStock(page, GOODS_IDS);
  const baseStockSum = stockSummary(baseStock);
  for (const [gid, items] of Object.entries(baseStock)) {
    console.log(`  goods_id=${gid}: total=${baseStockSum[gid]}`);
    items.forEach(i => console.log(`    warehouse=${i.warehouse_id} stock_num=${i.stock_num} name=${i.goods_name}`));
  }

  // Step 3: Navigate to procure order and audit
  console.log('\n=== Step 3: Navigate to CG202603313284 and Audit ===');
  await page.goto(`${BASE}/#/procure/order`);
  await page.waitForTimeout(3000);

  // Take screenshot to understand layout
  await page.screenshot({ path: '/tmp/ss_procure_list.png' });

  // Search for order
  const searchInputs = await page.$$('input');
  console.log('Found inputs:', searchInputs.length);
  for (let i = 0; i < Math.min(searchInputs.length, 5); i++) {
    const ph = await searchInputs[i].getAttribute('placeholder').catch(() => '');
    console.log(`  input[${i}] placeholder="${ph}"`);
  }

  // Find search field and enter order number
  let searched = false;
  for (const inp of searchInputs) {
    const ph = await inp.getAttribute('placeholder').catch(() => '');
    if (ph && (ph.includes('单号') || ph.includes('搜索') || ph.includes('编号'))) {
      await inp.fill('CG202603313284');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      searched = true;
      console.log('Searched for CG202603313284');
      break;
    }
  }

  if (!searched) {
    // Try clicking search button
    const searchBtns = await page.$$('button');
    for (const btn of searchBtns) {
      const t = await btn.innerText().catch(() => '');
      if (t.includes('搜索') || t.includes('查询')) {
        console.log('Found search button, but need to fill first');
        break;
      }
    }
  }

  await page.screenshot({ path: '/tmp/ss_after_search.png' });

  // Find all buttons on page
  const allBtns = await page.$$('button');
  console.log('Total buttons:', allBtns.length);
  for (const btn of allBtns) {
    const t = await btn.innerText().catch(() => '');
    if (t.trim()) console.log(`  button: "${t.trim()}"`);
  }

  // Find the row and audit button
  const pageContent = await page.content();
  const hasCG = pageContent.includes('CG202603313284');
  console.log('Page contains CG202603313284:', hasCG);

  // Look for audit in table rows
  let auditClicked = false;
  const trs = await page.$$('tr');
  for (const tr of trs) {
    const text = await tr.innerText().catch(() => '');
    if (text.includes('CG202603313284')) {
      console.log('Found TR with order. Row text snippet:', text.slice(0, 200));
      const btns = await tr.$$('button');
      for (const btn of btns) {
        const t = await btn.innerText().catch(() => '');
        console.log('  Row button:', t);
        if (t.includes('审核') && !t.includes('反')) {
          await btn.click();
          auditClicked = true;
          console.log('Clicked audit button');
          break;
        }
      }
      break;
    }
  }

  if (!auditClicked) {
    // Maybe audit is in a detail view - try clicking the row first
    const trs2 = await page.$$('tr');
    for (const tr of trs2) {
      const text = await tr.innerText().catch(() => '');
      if (text.includes('CG202603313284')) {
        // Try clicking a link or detail button
        const links = await tr.$$('a, .el-link');
        for (const link of links) {
          const lt = await link.innerText().catch(() => '');
          console.log('  Link:', lt);
        }
        break;
      }
    }
    console.log('Could not find audit button directly, trying API audit...');
    // Try API-based audit
    const orderListResp = await apiGet(page, `${API}/stock/PurchaseOrder/index?list_rows=50`);
    if (orderListResp.data && orderListResp.data.list) {
      const targetOrder = orderListResp.data.list.find(o => o.order_no === 'CG202603313284');
      if (targetOrder) {
        console.log('Found order via API:', JSON.stringify(targetOrder).slice(0, 300));
        // Audit via API
        const auditResp = await page.evaluate(async (orderId) => {
          const token = localStorage.getItem('erp_token');
          const r = await fetch('https://nomaderp.pages.dev/adminapi/stock/PurchaseOrder/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', token },
            body: JSON.stringify({ id: orderId })
          });
          return r.json();
        }, targetOrder.id);
        console.log('API Audit response:', JSON.stringify(auditResp));
        auditClicked = true;
      } else {
        console.log('Order not in first page of list');
        console.log('Orders:', orderListResp.data.list.map(o => o.order_no).join(', '));
      }
    }
  }

  if (auditClicked) {
    // Wait for confirm dialog or response
    await page.waitForTimeout(1000);
    // Try confirm dialog
    try {
      const confirmBtn = await page.waitForSelector('.el-message-box__btns .el-button--primary, .el-popconfirm__action .el-button--primary', { timeout: 3000 });
      await confirmBtn.click();
      console.log('Confirmed dialog');
      await page.waitForTimeout(3000);
    } catch (e) {
      console.log('No dialog (may have used API directly)');
    }
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
  for (const gid of GOODS_IDS) {
    const diff = (afterAuditStockSum[gid] || 0) - (baseStockSum[gid] || 0);
    console.log(`  goods_id=${gid}: total=${afterAuditStockSum[gid]} (diff: ${diff > 0 ? '+' : ''}${diff})`);
  }

  // Step 5: Reverse audit
  console.log('\n=== Step 5: Reverse Audit ===');
  let reverseAuditDone = false;

  await page.goto(`${BASE}/#/procure/order`);
  await page.waitForTimeout(2000);

  // Search again
  const searchInputs2 = await page.$$('input');
  for (const inp of searchInputs2) {
    const ph = await inp.getAttribute('placeholder').catch(() => '');
    if (ph && (ph.includes('单号') || ph.includes('搜索') || ph.includes('编号'))) {
      await inp.fill('CG202603313284');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      break;
    }
  }

  // Find reverse audit button
  const trs3 = await page.$$('tr');
  for (const tr of trs3) {
    const text = await tr.innerText().catch(() => '');
    if (text.includes('CG202603313284')) {
      const btns = await tr.$$('button');
      for (const btn of btns) {
        const t = await btn.innerText().catch(() => '');
        console.log('  Row button:', t);
        if (t.includes('反审') || t.includes('撤审') || t.includes('取消审')) {
          await btn.click();
          reverseAuditDone = true;
          console.log('Clicked reverse audit button');
          break;
        }
      }
      break;
    }
  }

  if (!reverseAuditDone) {
    // Try API
    const orderListResp2 = await apiGet(page, `${API}/stock/PurchaseOrder/index?list_rows=50`);
    if (orderListResp2.data && orderListResp2.data.list) {
      const targetOrder = orderListResp2.data.list.find(o => o.order_no === 'CG202603313284');
      if (targetOrder) {
        const revResp = await page.evaluate(async (orderId) => {
          const token = localStorage.getItem('erp_token');
          const r = await fetch('https://nomaderp.pages.dev/adminapi/stock/PurchaseOrder/antiAudit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', token },
            body: JSON.stringify({ id: orderId })
          });
          return r.json();
        }, targetOrder.id);
        console.log('API Reverse Audit response:', JSON.stringify(revResp));
        reverseAuditDone = true;
      }
    }
  }

  if (reverseAuditDone) {
    await page.waitForTimeout(1000);
    try {
      const confirmBtn2 = await page.waitForSelector('.el-message-box__btns .el-button--primary', { timeout: 3000 });
      await confirmBtn2.click();
      console.log('Confirmed reverse audit dialog');
      await page.waitForTimeout(3000);
    } catch (e) {
      console.log('No dialog for reverse audit');
    }
  }

  // Step 6: After reverse audit
  console.log('\n=== Step 6: After Reverse Audit ===');
  const afterRevOtherOut = await getOtherOut(page);
  const afterRevOtherIn = await getOtherIn(page);
  const afterRevOtherOutIds = new Set(afterRevOtherOut.map(i => i.id));
  const afterRevOtherInIds = new Set(afterRevOtherIn.map(i => i.id));

  console.log('\nChecking if audit-generated OtherOut were deleted:');
  for (const item of newOtherOut) {
    const stillExists = afterRevOtherOutIds.has(item.id);
    console.log(`  OtherOut id=${item.id} order_no=${item.order_no}: ${stillExists ? 'STILL EXISTS (BAD)' : 'DELETED (GOOD)'}`);
  }

  const newOtherInAfterRev = afterRevOtherIn.filter(i => !baseOtherInIds.has(i.id));
  console.log('\nNew OtherIn after reverse audit (should be empty):');
  if (newOtherInAfterRev.length === 0) {
    console.log('  CLEAN - no new OtherIn (GOOD)');
  } else {
    console.log('  WARNING - unexpected OtherIn:', JSON.stringify(newOtherInAfterRev, null, 2));
  }

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
    console.log(`  goods_id=${gid}: baseline=${base}, after_rev=${afterRev}, diff=${diff > 0 ? '+' : ''}${diff} ${clean ? '(CLEAN)' : '(DIRTY)'}`);
  }

  console.log('\n======== FINAL SUMMARY ========');
  console.log(`Audit generated OtherOut count: ${newOtherOut.length}`);
  newOtherOut.forEach(i => console.log(`  - id=${i.id}, order_no=${i.order_no}, status=${i.status}`));
  const otherOutDeleted = newOtherOut.length > 0 ? newOtherOut.every(i => !afterRevOtherOutIds.has(i.id)) : 'N/A (none generated)';
  console.log(`OtherOut deleted after reverse: ${otherOutDeleted}`);
  console.log(`New OtherIn after reverse: ${newOtherInAfterRev.length === 0 ? 'NONE (GOOD)' : 'EXISTS (BAD) - ' + newOtherInAfterRev.length}`);
  console.log(`Stock rolled back cleanly: ${stockClean ? 'YES (GOOD)' : 'NO (BAD)'}`);

  await page.screenshot({ path: '/tmp/ss_final.png' });
  await browser.close();
})();
