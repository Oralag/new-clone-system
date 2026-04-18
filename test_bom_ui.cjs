const { chromium } = require('playwright');

const BASE = 'https://nomaderp.pages.dev';
const API = `${BASE}/adminapi`;
const GOODS_IDS = [989, 988, 975, 974];

async function apiGet(page, path) {
  return page.evaluate(async (url) => {
    const token = localStorage.getItem('erp_token');
    const r = await fetch(url, { headers: { token } });
    return r.json();
  }, API + path);
}

async function getStock(page, gid) {
  const r = await apiGet(page, `/stock/StockAll/index?goods_id=${gid}&list_rows=200`);
  const rows = r?.data?.rows ?? r?.data?.list ?? [];
  return rows.reduce((s, i) => s + (parseFloat(i.stock_num) || 0), 0);
}

async function getOtherOut(page) {
  const r = await apiGet(page, '/stock/OtherOut/index?list_rows=200');
  return r?.data?.rows ?? r?.data?.list ?? [];
}

async function getOtherIn(page) {
  const r = await apiGet(page, '/stock/OtherIn/index?list_rows=200');
  return r?.data?.rows ?? r?.data?.list ?? [];
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  // Login
  console.log('=== Login ===');
  await page.goto(`${BASE}/#/login`);
  await page.waitForTimeout(2000);
  
  // Set token via API
  const loginResp = await page.evaluate(async () => {
    const r = await fetch('https://nomaderp.pages.dev/adminapi/login/account', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: '17747344571', password: 'Oral6421', terminal: 1 })
    });
    return r.json();
  });
  const token = loginResp?.data?.token;
  if (!token) { console.error('Login FAILED'); await browser.close(); return; }
  
  await page.evaluate((t) => {
    localStorage.setItem('erp_token', t);
    localStorage.setItem('erp_default_warehouse_id', '1');
  }, token);
  console.log('Logged in OK');

  // Step 1: Baselines
  console.log('\n=== STEP 1: Baseline OtherOut/OtherIn ===');
  const baseOut = await getOtherOut(page);
  const baseIn = await getOtherIn(page);
  const baseOutIds = new Set(baseOut.map(i => i.id));
  const baseInIds = new Set(baseIn.map(i => i.id));
  console.log(`OtherOut: ${baseOut.length} records  IDs: ${[...baseOutIds].sort().join(',')}`);
  console.log(`OtherIn:  ${baseIn.length} records   IDs: ${[...baseInIds].sort().join(',')}`);

  console.log('\n=== STEP 2: Baseline Stock ===');
  const baseStock = {};
  for (const gid of GOODS_IDS) {
    baseStock[gid] = await getStock(page, gid);
    console.log(`  goods_id=${gid}: ${baseStock[gid]}`);
  }

  // Step 3: Navigate and audit via UI
  console.log('\n=== STEP 3: Navigate to CG202603313284 and Audit ===');
  await page.goto(`${BASE}/#/procure/order`);
  await page.waitForTimeout(4000);

  // Find search input and search
  const allInputs = await page.$$('input');
  let searched = false;
  for (const inp of allInputs) {
    const ph = await inp.getAttribute('placeholder').catch(() => '');
    if (ph && (ph.includes('单号') || ph.includes('合同号') || ph.includes('搜索'))) {
      await inp.fill('CG202603313284');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      searched = true;
      console.log(`Searched via input placeholder="${ph}"`);
      break;
    }
  }
  if (!searched) console.log('WARNING: no search input found');

  // Find audit button for this row
  let auditBtn = null;
  const rows = await page.$$('tr');
  for (const row of rows) {
    const text = await row.innerText().catch(() => '');
    if (text.includes('CG202603313284')) {
      console.log('Found row with order number');
      const btns = await row.$$('button');
      for (const btn of btns) {
        const t = await btn.innerText().catch(() => '');
        if (t.trim() === '审核') { auditBtn = btn; break; }
      }
      if (!auditBtn) {
        console.log('  Buttons in row:', (await Promise.all(btns.map(b => b.innerText().catch(() => '')))).map(t=>t.trim()).filter(Boolean).join(', '));
      }
      break;
    }
  }

  if (!auditBtn) {
    // Try page-level audit button
    auditBtn = await page.$('button:has-text("审核"):not(:has-text("反"))');
    if (auditBtn) console.log('Found audit button at page level');
  }

  if (auditBtn) {
    await auditBtn.click();
    console.log('Clicked audit button');
    await page.waitForTimeout(1000);
    // Confirm dialog
    try {
      const conf = await page.waitForSelector('.el-message-box__btns .el-button--primary', { timeout: 5000 });
      await conf.click();
      console.log('Confirmed dialog');
    } catch { console.log('No confirm dialog'); }
    await page.waitForTimeout(4000);
  } else {
    console.log('ERROR: No audit button found - order may already be audited or not visible');
    // Print current page text
    const pgText = await page.innerText('body').catch(() => '');
    console.log('Page snippet:', pgText.slice(0, 500));
  }

  // Step 4: After audit
  console.log('\n=== STEP 4: After Audit ===');
  const afterOut = await getOtherOut(page);
  const afterIn = await getOtherIn(page);
  const newOut = afterOut.filter(i => !baseOutIds.has(i.id));
  const newIn = afterIn.filter(i => !baseInIds.has(i.id));
  console.log(`New OtherOut: ${newOut.length}`);
  newOut.forEach(i => console.log(`  id=${i.id} order_no=${i.order_no} status=${i.status} remark=${(i.remark||'').slice(0,80)}`));
  console.log(`New OtherIn: ${newIn.length}`);
  newIn.forEach(i => console.log(`  id=${i.id} order_no=${i.order_no} status=${i.status}`));

  const afterStock = {};
  for (const gid of GOODS_IDS) {
    afterStock[gid] = await getStock(page, gid);
    const diff = afterStock[gid] - baseStock[gid];
    console.log(`  goods_id=${gid}: ${afterStock[gid]} (diff: ${diff>=0?'+':''}${diff})`);
  }

  // Check order status
  const orderCheck = await apiGet(page, '/stock/PurchaseOrder/index?list_rows=999');
  const orders = orderCheck?.data?.rows ?? [];
  const target = orders.find(o => o.order_no === 'CG202603313284');
  console.log(`  Order status after audit: ${target?.status} (1=audited)`);

  // Step 5: Reverse audit via UI
  console.log('\n=== STEP 5: Reverse Audit ===');
  await page.goto(`${BASE}/#/procure/order`);
  await page.waitForTimeout(3000);

  const allInputs2 = await page.$$('input');
  for (const inp of allInputs2) {
    const ph = await inp.getAttribute('placeholder').catch(() => '');
    if (ph && (ph.includes('单号') || ph.includes('合同号') || ph.includes('搜索'))) {
      await inp.fill('CG202603313284');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      break;
    }
  }

  let revBtn = null;
  const rows2 = await page.$$('tr');
  for (const row of rows2) {
    const text = await row.innerText().catch(() => '');
    if (text.includes('CG202603313284')) {
      const btns = await row.$$('button');
      for (const btn of btns) {
        const t = await btn.innerText().catch(() => '');
        if (t.trim() === '反审核' || t.includes('反审')) { revBtn = btn; break; }
      }
      if (!revBtn) {
        const btnTexts = await Promise.all(btns.map(b => b.innerText().catch(() => '')));
        console.log('Buttons in row:', btnTexts.map(t=>t.trim()).filter(Boolean).join(', '));
      }
      break;
    }
  }

  if (revBtn) {
    await revBtn.click();
    console.log('Clicked reverse audit button');
    await page.waitForTimeout(1000);
    // Multiple confirm dialogs possible
    for (let i = 0; i < 3; i++) {
      try {
        const conf = await page.waitForSelector('.el-message-box__btns .el-button--primary', { timeout: 3000 });
        const txt = await conf.innerText().catch(() => '');
        await conf.click();
        console.log(`Confirmed dialog ${i+1}: ${txt}`);
        await page.waitForTimeout(1000);
      } catch { break; }
    }
    await page.waitForTimeout(4000);
  } else {
    console.log('ERROR: No reverse audit button found');
  }

  // Step 6: After reverse audit
  console.log('\n=== STEP 6: After Reverse Audit ===');
  const finalOut = await getOtherOut(page);
  const finalIn = await getOtherIn(page);
  const finalOutIds = new Set(finalOut.map(i => i.id));
  const finalInIds = new Set(finalIn.map(i => i.id));
  const newInAfterRev = finalIn.filter(i => !baseInIds.has(i.id));

  console.log('Checking audit-generated OtherOut deleted:');
  if (newOut.length === 0) {
    console.log('  No OtherOut was generated during audit');
  }
  for (const item of newOut) {
    const still = finalOutIds.has(item.id);
    console.log(`  OtherOut id=${item.id}: ${still ? 'STILL EXISTS (BAD)' : 'DELETED (GOOD)'}`);
  }

  console.log(`New OtherIn after reverse (should be 0): ${newInAfterRev.length}`);
  if (newInAfterRev.length === 0) console.log('  CLEAN - no new OtherIn (GOOD)');
  else newInAfterRev.forEach(i => console.log(`  BAD: id=${i.id} order_no=${i.order_no} remark=${(i.remark||'').slice(0,80)}`));

  console.log('Stock rollback check:');
  let stockClean = true;
  for (const gid of GOODS_IDS) {
    const val = await getStock(page, gid);
    const diff = val - baseStock[gid];
    const clean = Math.abs(diff) < 0.001;
    if (!clean) stockClean = false;
    console.log(`  goods_id=${gid}: baseline=${baseStock[gid]} → after_rev=${val} ${clean?'CLEAN':'DIRTY diff='+diff}`);
  }

  const orderCheck2 = await apiGet(page, '/stock/PurchaseOrder/index?list_rows=999');
  const target2 = (orderCheck2?.data?.rows??[]).find(o => o.order_no === 'CG202603313284');
  console.log(`  Order status after reverse: ${target2?.status} (0=un-audited)`);

  console.log('\n======== FINAL SUMMARY ========');
  console.log(`Audit-generated OtherOut: ${newOut.length} records`);
  newOut.forEach(i => console.log(`  - id=${i.id}, order_no=${i.order_no}, remark=${(i.remark||'').slice(0,80)}`));
  if (newOut.length > 0) {
    const allDel = newOut.every(i => !finalOutIds.has(i.id));
    console.log(`OtherOut deleted after reverse: ${allDel ? 'YES (GOOD)' : 'NO (BAD)'}`);
  } else {
    console.log('OtherOut deleted: N/A (none generated)');
  }
  console.log(`New OtherIn after reverse: ${newInAfterRev.length === 0 ? 'NONE (GOOD)' : 'EXISTS BAD - ' + newInAfterRev.length}`);
  console.log(`Stock rolled back cleanly: ${stockClean ? 'YES (GOOD)' : 'NO (BAD)'}`);

  await browser.close();
})();
