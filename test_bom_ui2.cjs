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

async function setToken(page, token) {
  await page.evaluate((t) => {
    localStorage.setItem('erp_token', t);
    localStorage.setItem('erp_default_warehouse_id', '1');
  }, token);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  // Step 1: Login
  console.log('=== Login ===');
  await page.goto(BASE);
  await page.waitForTimeout(2000);
  
  const loginResp = await page.evaluate(async () => {
    const r = await fetch('https://nomaderp.pages.dev/adminapi/login/account', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: '17747344571', password: 'Oral6421', terminal: 1 })
    });
    return r.json();
  });
  const token = loginResp?.data?.token;
  if (!token) { console.error('Login FAILED:', JSON.stringify(loginResp)); await browser.close(); return; }
  await setToken(page, token);
  console.log('Token set OK');
  
  // Navigate to ERP (hash router) - set token first, then navigate
  await page.goto(`${BASE}/#/procure/order`);
  await page.waitForTimeout(2000);
  // Check if redirected to login
  const url = page.url();
  console.log('URL after nav:', url);
  if (url.includes('login') || url.includes('sign')) {
    // Set token again after navigation
    await setToken(page, token);
    await page.goto(`${BASE}/#/procure/order`);
    await page.waitForTimeout(2000);
    console.log('URL after retry:', page.url());
  }

  // Step 2: Baselines via API (works regardless of page)
  console.log('\n=== STEP 1: Baseline OtherOut/OtherIn ===');
  const baseOut = await getOtherOut(page);
  const baseIn = await getOtherIn(page);
  const baseOutIds = new Set(baseOut.map(i => i.id));
  const baseInIds = new Set(baseIn.map(i => i.id));
  console.log(`OtherOut: ${baseOut.length} records  IDs: [${[...baseOutIds].sort((a,b)=>a-b).join(',')}]`);
  console.log(`OtherIn:  ${baseIn.length} records   IDs: [${[...baseInIds].sort((a,b)=>a-b).join(',')}]`);

  console.log('\n=== STEP 2: Baseline Stock ===');
  const baseStock = {};
  for (const gid of GOODS_IDS) {
    baseStock[gid] = await getStock(page, gid);
    console.log(`  goods_id=${gid}: ${baseStock[gid]}`);
  }

  // Look for the order in the DOM
  await page.screenshot({ path: '/tmp/ss_procure.png' });
  const bodyText = await page.innerText('body').catch(() => '');
  console.log(`\nPage loaded. Has order CG202603313284: ${bodyText.includes('CG202603313284')}`);
  console.log('Page snippet:', bodyText.slice(0, 200));

  // If page has the ERP table, find audit button
  let auditClicked = false;
  const rows = await page.$$('tr');
  console.log(`Table rows found: ${rows.length}`);
  
  for (const row of rows) {
    const text = await row.innerText().catch(() => '');
    if (text.includes('CG202603313284')) {
      console.log('Found order row');
      const btns = await row.$$('button');
      const btnTexts = await Promise.all(btns.map(b => b.innerText().catch(() => '')));
      console.log('Buttons:', btnTexts.map(t=>t.trim()).filter(Boolean).join(', '));
      for (let i = 0; i < btns.length; i++) {
        if (btnTexts[i].trim() === '审核') {
          await btns[i].click();
          auditClicked = true;
          console.log('Clicked 审核 button');
          break;
        }
      }
      break;
    }
  }

  if (!auditClicked) {
    console.log('\nFallback: Running full audit logic via page.evaluate (simulating frontend)');
    // Simulate the frontend audit logic directly
    const auditResult = await page.evaluate(async () => {
      const token = localStorage.getItem('erp_token');
      const warehouseId = Number(localStorage.getItem('erp_default_warehouse_id')) || 1;
      const headers = { 'token': token, 'Content-Type': 'application/json' };
      
      const post = async (path, data) => {
        const r = await fetch(`https://nomaderp.pages.dev/adminapi${path}`, {
          method: 'POST', headers, body: JSON.stringify(data)
        });
        return r.json();
      };
      const get = async (path) => {
        const r = await fetch(`https://nomaderp.pages.dev/adminapi${path}`, { headers: { token } });
        return r.json();
      };
      
      // 1. Audit the purchase order
      const auditResp = await post('/stock/PurchaseOrder/audit', { id: 459, status: 1 });
      if (!auditResp || auditResp.code !== 1) return { step: 'audit', error: JSON.stringify(auditResp) };
      
      // 2. Check for existing inhouse records
      const inhouseListRes = await get('/procure/ProcureInhouse/index?list_rows=2000');
      const inhouseRows = (inhouseListRes?.data?.rows ?? []).filter(r => Number(r.purchase_order_id) === 459);
      
      // 3. Create inhouse if not exists
      let inhouseId = null;
      if (inhouseRows.length === 0) {
        const orderListRes = await get('/stock/PurchaseOrder/index?list_rows=999');
        const order = orderListRes?.data?.rows?.find(o => o.order_no === 'CG202603313284');
        if (!order) return { step: 'find_order', error: 'order not found' };
        
        const items = typeof order.goods_info === 'string' ? JSON.parse(order.goods_info) : order.goods_info;
        const inhouseRes = await post('/procure/ProcureInhouse/add', {
          purchase_order_id: order.id,
          supplier_id: order.supplier_id,
          supplier_name: order.supplier_name,
          warehouse_id: warehouseId,
          warehouse_name: '默认仓库',
          in_date: (order.order_date || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
          total_amount: order.total_amount,
          remark: order.remark || '',
          goods_info: items,
        });
        inhouseId = inhouseRes?.data?.id ?? inhouseRes?.data;
        if (!inhouseId) return { step: 'create_inhouse', error: JSON.stringify(inhouseRes), inhouseRows };
        
        // Audit inhouse
        const auditInhouseResp = await post('/procure/ProcureInhouse/audit', { id: inhouseId, status: 1 });
        
        // 4. Apply BOM - check if goods have BOM recipes
        // For each inhouse item, fetch BOM and create OtherOut
        const bomResults = [];
        for (const item of items) {
          const bomRes = await get(`/goods/GoodsBom/index?goods_id=${item.goods_id}&list_rows=50`);
          bomResults.push({ goods_id: item.goods_id, goods_name: item.goods_name, bom: JSON.stringify(bomRes).slice(0, 200) });
        }
        
        return { 
          step: 'done', 
          auditResp, inhouseId, 
          auditInhouseResp,
          bomResults
        };
      } else {
        return { step: 'inhouse_exists', inhouseRows: inhouseRows.length };
      }
    });
    
    console.log('Audit result:', JSON.stringify(auditResult, null, 2));
  }

  // Wait for any async operations
  await page.waitForTimeout(3000);

  // Step 4: After audit
  console.log('\n=== STEP 4: After Audit ===');
  const afterOut = await getOtherOut(page);
  const afterIn = await getOtherIn(page);
  const newOut = afterOut.filter(i => !baseOutIds.has(i.id));
  const newIn = afterIn.filter(i => !baseInIds.has(i.id));
  
  console.log(`New OtherOut: ${newOut.length}`);
  newOut.forEach(i => console.log(`  id=${i.id} order_no=${i.order_no} status=${i.status} remark=${(i.remark||'').slice(0,100)}`));
  console.log(`New OtherIn: ${newIn.length}`);
  newIn.forEach(i => console.log(`  id=${i.id} order_no=${i.order_no} status=${i.status} remark=${(i.remark||'').slice(0,100)}`));
  
  const afterStock = {};
  for (const gid of GOODS_IDS) {
    afterStock[gid] = await getStock(page, gid);
    const diff = afterStock[gid] - baseStock[gid];
    console.log(`  goods_id=${gid}: ${afterStock[gid]} (diff: ${diff>=0?'+':''}${diff})`);
  }

  const orderCheck = await apiGet(page, '/stock/PurchaseOrder/index?list_rows=999');
  const orderStatus = (orderCheck?.data?.rows??[]).find(o=>o.order_no==='CG202603313284')?.status;
  console.log(`  Order status: ${orderStatus} (1=audited)`);

  // Step 5: Reverse audit via evaluate
  console.log('\n=== STEP 5: Reverse Audit ===');
  const revResult = await page.evaluate(async () => {
    const token = localStorage.getItem('erp_token');
    const headers = { 'token': token, 'Content-Type': 'application/json' };
    const post = async (path, data) => {
      const r = await fetch(`https://nomaderp.pages.dev/adminapi${path}`, {
        method: 'POST', headers, body: JSON.stringify(data)
      });
      return r.json();
    };
    const get = async (path) => {
      const r = await fetch(`https://nomaderp.pages.dev/adminapi${path}`, { headers: { token } });
      return r.json();
    };

    // 1. Find inhouse records and reverse-audit them
    const inhouseListRes = await get('/procure/ProcureInhouse/index?list_rows=2000');
    const inhouseRows = (inhouseListRes?.data?.rows ?? []).filter(r => Number(r.purchase_order_id) === 459 && r.status === 1);
    
    // 2. Get all OtherOut for BOM rollback check
    const otherOutRes = await get('/stock/OtherOut/index?list_rows=2000');
    const allOtherOut = otherOutRes?.data?.rows ?? [];
    
    const steps = [];
    
    for (const r of inhouseRows) {
      // Reverse audit inhouse
      const revInhouse = await post('/procure/ProcureInhouse/audit', { id: r.id, status: 0 });
      steps.push({ action: 'rev_inhouse', id: r.id, resp: revInhouse });
      
      // Find related BOM OtherOut
      const rItems = typeof r.goods_info === 'string' ? JSON.parse(r.goods_info) : (r.goods_info || []);
      const bomGoodsNames = rItems.map(i => i.goods_name || i.goods_sn).filter(Boolean);
      const relatedOtherOut = allOtherOut.filter(o =>
        bomGoodsNames.some(name => String(o.remark || '').includes(`BOM扣料-${name}`))
      );
      steps.push({ action: 'related_bom_out', count: relatedOtherOut.length, names: bomGoodsNames, relatedIds: relatedOtherOut.map(o=>o.id) });
      
      for (const o of relatedOtherOut) {
        if (o.status === 1) {
          const rev = await post('/stock/OtherOut/audit', { id: o.id, status: 0 });
          steps.push({ action: 'rev_bom_out', id: o.id, resp: rev });
        }
      }
    }
    
    // 3. Reverse audit the purchase order
    const revOrder = await post('/stock/PurchaseOrder/audit', { id: 459, status: 0 });
    steps.push({ action: 'rev_order', resp: revOrder });
    
    return { steps, inhouseRowsCount: inhouseRows.length };
  });
  
  console.log('Reverse audit steps:', JSON.stringify(revResult, null, 2));

  await page.waitForTimeout(2000);

  // Step 6: Final check
  console.log('\n=== STEP 6: After Reverse Audit ===');
  const finalOut = await getOtherOut(page);
  const finalIn = await getOtherIn(page);
  const finalOutIds = new Set(finalOut.map(i => i.id));
  const newInAfterRev = finalIn.filter(i => !baseInIds.has(i.id));

  console.log('Audit-generated OtherOut deleted check:');
  if (newOut.length === 0) {
    console.log('  No OtherOut was generated during audit — BOM扣料 not triggered');
  }
  for (const item of newOut) {
    const still = finalOutIds.has(item.id);
    console.log(`  OtherOut id=${item.id}: ${still ? 'STILL EXISTS (BAD)' : 'DELETED (GOOD)'}`);
  }

  console.log(`New OtherIn after reverse: ${newInAfterRev.length}`);
  if (newInAfterRev.length === 0) console.log('  CLEAN - no new OtherIn (GOOD)');
  else newInAfterRev.forEach(i => console.log(`  BAD: id=${i.id} remark=${(i.remark||'').slice(0,80)}`));

  console.log('Stock rollback:');
  let stockClean = true;
  for (const gid of GOODS_IDS) {
    const val = await getStock(page, gid);
    const diff = val - baseStock[gid];
    const clean = Math.abs(diff) < 0.001;
    if (!clean) stockClean = false;
    console.log(`  goods_id=${gid}: ${baseStock[gid]} → ${val} ${clean?'CLEAN':'DIRTY diff='+diff}`);
  }

  const orderCheck2 = await apiGet(page, '/stock/PurchaseOrder/index?list_rows=999');
  const finalOrderStatus = (orderCheck2?.data?.rows??[]).find(o=>o.order_no==='CG202603313284')?.status;
  console.log(`  Order status after reverse: ${finalOrderStatus} (0=un-audited)`);

  console.log('\n======== FINAL SUMMARY ========');
  console.log(`Audit-generated OtherOut: ${newOut.length}`);
  newOut.forEach(i => console.log(`  - id=${i.id}, order_no=${i.order_no}, remark=${(i.remark||'').slice(0,80)}`));
  const allDel = newOut.length > 0 ? newOut.every(i => !finalOutIds.has(i.id)) : null;
  console.log(`OtherOut deleted: ${allDel === null ? 'N/A (none generated)' : allDel ? 'YES (GOOD)' : 'NO (BAD)'}`);
  console.log(`New OtherIn after reverse: ${newInAfterRev.length === 0 ? 'NONE (GOOD)' : 'EXISTS BAD - ' + newInAfterRev.length}`);
  console.log(`Stock rolled back cleanly: ${stockClean ? 'YES (GOOD)' : 'NO (BAD)'}`);

  await browser.close();
})();
