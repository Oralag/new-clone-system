const { chromium } = require('playwright');

const BASE = 'https://nomaderp.pages.dev';
const API = BASE + '/adminapi';

async function fetchAPI(page, method, path, body) {
  return page.evaluate(async ([method, url, body]) => {
    const token = localStorage.getItem('erp_token');
    const opts = { method, headers: { 'token': token, 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(url, opts);
    return r.json();
  }, [method, API + path, body]);
}

const get = (page, path) => fetchAPI(page, 'GET', path, null);
const post = (page, path, body) => fetchAPI(page, 'POST', path, body);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Login via API
  await page.goto(BASE);
  await page.waitForTimeout(2000);

  const lr = await page.evaluate(async () => {
    const r = await fetch('https://nomaderp.pages.dev/adminapi/login/account', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: '17747344571', password: 'Oral6421', terminal: 1 })
    });
    return r.json();
  });

  const token = lr?.data?.token;
  if (!token) { console.error('NO TOKEN:', JSON.stringify(lr)); await browser.close(); return; }
  await page.evaluate(t => {
    localStorage.setItem('erp_token', t);
    localStorage.setItem('erp_default_warehouse_id', '1');
  }, token);
  console.log('Logged in OK');

  // === STEP 1: Baseline ===
  console.log('\n=== STEP 1: Baseline ===');
  const baseOutResp = await get(page, '/stock/OtherOut/index?list_rows=200');
  const baseInResp = await get(page, '/stock/OtherIn/index?list_rows=200');

  const baseOutRows = baseOutResp?.data?.rows ?? baseOutResp?.data?.data ?? [];
  const baseInRows = baseInResp?.data?.rows ?? baseInResp?.data?.data ?? [];

  const baseOutIds = new Set(baseOutRows.map(r => r.id));
  const baseInIds = new Set(baseInRows.map(r => r.id));

  console.log(`Baseline OtherOut count: ${baseOutIds.size}`);
  console.log(`Baseline OtherIn count: ${baseInIds.size}`);

  // Find the purchase order
  const orderListResp = await get(page, '/stock/PurchaseOrder/index?list_rows=999');
  const orderRows = orderListResp?.data?.rows ?? orderListResp?.data?.data ?? [];
  const order = orderRows.find(o => o.order_no === 'CG202603313284');

  if (!order) {
    console.error('Order CG202603313284 NOT FOUND!');
    console.log('Sample orders:', orderRows.slice(0, 3).map(o => o.order_no));
    await browser.close();
    return;
  }
  console.log(`\nOrder found: id=${order.id}, status=${order.status}`);

  // Ensure order is un-audited (status=0)
  if (Number(order.status) === 1) {
    console.log('Order is audited, reversing first...');
    const reverseResp = await post(page, '/stock/PurchaseOrder/audit', { id: order.id, status: 0 });
    console.log('Reverse result:', JSON.stringify(reverseResp));
    await page.waitForTimeout(2000);
  }

  // Re-check baseline after potential reverse
  const baseOutResp2 = await get(page, '/stock/OtherOut/index?list_rows=200');
  const baseInResp2 = await get(page, '/stock/OtherIn/index?list_rows=200');
  const baseOutRows2 = baseOutResp2?.data?.rows ?? baseOutResp2?.data?.data ?? [];
  const baseInRows2 = baseInResp2?.data?.rows ?? baseInResp2?.data?.data ?? [];
  const baseOutIds2 = new Set(baseOutRows2.map(r => r.id));
  const baseInIds2 = new Set(baseInRows2.map(r => r.id));
  console.log(`\nFinal Baseline OtherOut count: ${baseOutIds2.size}`);
  console.log(`Final Baseline OtherIn count: ${baseInIds2.size}`);

  // === STEP 2: Audit ===
  console.log('\n=== STEP 2: Audit order ===');
  const auditResp = await post(page, '/stock/PurchaseOrder/audit', { id: order.id, status: 1 });
  console.log('Audit result:', JSON.stringify(auditResp));
  await page.waitForTimeout(2000);

  // === STEP 3: Record new OtherOut after audit ===
  console.log('\n=== STEP 3: OtherOut/OtherIn after audit ===');
  const afterAuditOutResp = await get(page, '/stock/OtherOut/index?list_rows=200');
  const afterAuditInResp = await get(page, '/stock/OtherIn/index?list_rows=200');
  const afterAuditOutRows = afterAuditOutResp?.data?.rows ?? afterAuditOutResp?.data?.data ?? [];
  const afterAuditInRows = afterAuditInResp?.data?.rows ?? afterAuditInResp?.data?.data ?? [];
  const afterAuditOutIds = new Set(afterAuditOutRows.map(r => r.id));
  const afterAuditInIds = new Set(afterAuditInRows.map(r => r.id));
  const newOutIds = [...afterAuditOutIds].filter(id => !baseOutIds2.has(id));
  const newInIds = [...afterAuditInIds].filter(id => !baseInIds2.has(id));

  console.log(`OtherOut count after audit: ${afterAuditOutIds.size} (new: ${newOutIds.length})`);
  console.log(`OtherOut new IDs: ${JSON.stringify(newOutIds)}`);
  console.log(`OtherIn count after audit: ${afterAuditInIds.size} (new: ${newInIds.length})`);
  console.log(`OtherIn new IDs: ${JSON.stringify(newInIds)}`);

  // === STEP 4: Reverse audit ===
  console.log('\n=== STEP 4: Reverse audit ===');
  const reverseResp2 = await post(page, '/stock/PurchaseOrder/audit', { id: order.id, status: 0 });
  console.log('Reverse audit result:', JSON.stringify(reverseResp2));
  await page.waitForTimeout(2000);

  // === STEP 5: Verify cleanup ===
  console.log('\n=== STEP 5: Verify cleanup ===');
  const afterRevOutResp = await get(page, '/stock/OtherOut/index?list_rows=200');
  const afterRevInResp = await get(page, '/stock/OtherIn/index?list_rows=200');
  const afterRevOutRows = afterRevOutResp?.data?.rows ?? afterRevOutResp?.data?.data ?? [];
  const afterRevInRows = afterRevInResp?.data?.rows ?? afterRevInResp?.data?.data ?? [];
  const afterRevOutIds = new Set(afterRevOutRows.map(r => r.id));
  const afterRevInIds = new Set(afterRevInRows.map(r => r.id));

  const remainingBomIds = newOutIds.filter(id => afterRevOutIds.has(id));
  const newInAfterReverse = [...afterRevInIds].filter(id => !baseInIds2.has(id));
  const outBackToBaseline = afterRevOutIds.size === baseOutIds2.size;

  console.log('\n--- RESULTS ---');
  console.log(`OtherOut baseline: ${baseOutIds2.size}`);
  console.log(`OtherOut after audit: ${afterAuditOutIds.size} (+${newOutIds.length} BOM records)`);
  console.log(`OtherOut after reverse: ${afterRevOutIds.size}`);
  console.log(`OtherOut back to baseline: ${outBackToBaseline}`);
  console.log(`BOM records still present after reverse: ${remainingBomIds.length} (should be 0)`);
  console.log(`New OtherIn after reverse: ${newInAfterReverse.length} (should be 0)`);

  const isClean = outBackToBaseline && remainingBomIds.length === 0 && newInAfterReverse.length === 0;

  console.log(`\n=== FINAL CONCLUSION: BOM flow is ${isClean ? 'CLEAN ✓' : 'DIRTY ✗'} ===`);
  if (!isClean) {
    if (!outBackToBaseline) console.log(`  ISSUE: OtherOut not back to baseline (${afterRevOutIds.size} vs ${baseOutIds2.size})`);
    if (remainingBomIds.length > 0) console.log(`  ISSUE: BOM OtherOut records not deleted: ${JSON.stringify(remainingBomIds)}`);
    if (newInAfterReverse.length > 0) console.log(`  ISSUE: Unexpected OtherIn created: ${JSON.stringify(newInAfterReverse)}`);
  }

  await browser.close();
})();
