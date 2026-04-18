// Direct API test: full audit chain for PO 459 (CG202603313284)
// Simulates what Order.vue handleAudit() does
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Login
  const loginResp = await page.evaluate(async () => {
    const r = await fetch('https://nomaderp.pages.dev/adminapi/login/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: '17747344571', password: 'Oral6421' })
    });
    return await r.json();
  });
  const token = loginResp.data?.token;
  console.log('Token:', token ? 'OK' : 'MISSING');

  async function apiGet(path, params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const resp = await page.evaluate(async ({ token, url }) => {
      const r = await fetch(url, { headers: { token } });
      return await r.json();
    }, { token, url: `https://nomaderp.pages.dev/adminapi${path}${qs}` });
    return resp;
  }

  async function apiPost(path, body) {
    const resp = await page.evaluate(async ({ token, url, body }) => {
      const r = await fetch(url, {
        method: 'POST',
        headers: { token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await r.json();
    }, { token, url: `https://nomaderp.pages.dev/adminapi${path}`, body });
    return resp;
  }

  // Get PO 459
  const allPO = await apiGet('/stock/PurchaseOrder/index', { list_rows: 500 });
  const po = (allPO.data?.rows || []).find(r => r.id === 459);
  if (!po) { console.log('PO 459 not found'); await browser.close(); return; }
  console.log('\n=== PO 459 ===');
  console.log('order_no:', po.order_no, 'status:', po.status, 'warehouse_id:', po.warehouse_id);
  console.log('goods_info:', po.goods_info?.map(g => `${g.goods_name} x${g.num}`));

  // Baseline stock
  async function getStock() {
    const resp = await apiGet('/stock/StockAll/index', { list_rows: 300 });
    const rows = resp.data?.rows || [];
    const result = {};
    for (const r of rows) {
      if ([988, 989, 974, 975, 1016, 1027, 1028, 862].includes(r.goods_id) && r.warehouse_id === 0) {
        result[r.goods_id] = { qty: r.qty, name: r.goods_name };
      }
    }
    return result;
  }

  console.log('\n=== Baseline stock (warehouse_id=0) ===');
  const baseline = await getStock();
  for (const [gid, info] of Object.entries(baseline)) {
    console.log(`  goods_id:${gid} ${info.name}: ${info.qty}`);
  }

  const beforeTime = new Date();

  // Step A: Audit the PO
  console.log('\n=== Step A: auditProcureOrder id=459 status=1 ===');
  if (po.status === 1) {
    console.log('Already audited (status=1). Will test reverse first.');
    // Reverse it first
    const rev = await apiPost('/stock/PurchaseOrder/audit', { id: 459, status: 0 });
    console.log('Reverse:', rev.code === 1 ? 'OK' : 'FAILED: ' + rev.message);
    // Also find and reverse the inhouse
    const inhouseAll = await apiGet('/procure/ProcureInhouse/index', { list_rows: 2000 });
    const matchInhouse = (inhouseAll.data?.rows || []).filter(r => Number(r.purchase_order_id) === 459 && r.status === 1);
    for (const ih of matchInhouse) {
      const revIh = await apiPost('/procure/ProcureInhouse/audit', { id: ih.id, status: 0 });
      console.log('Reverse inhouse', ih.id, ':', revIh.code === 1 ? 'OK' : 'FAILED: ' + revIh.message);
    }
  }

  // Confirm status=0 now
  const po2 = await apiGet('/stock/PurchaseOrder/index', { list_rows: 500 });
  const currentPO = (po2.data?.rows || []).find(r => r.id === 459);
  console.log('PO status now:', currentPO?.status);

  console.log('\n=== AUDIT FLOW ===');

  // 1. auditProcureOrder
  const auditR = await apiPost('/stock/PurchaseOrder/audit', { id: 459, status: 1 });
  console.log('1. auditProcureOrder:', auditR.code === 1 ? 'OK' : 'FAILED: ' + auditR.message);

  // 2. Check if inhouse already exists
  const inhouseAll = await apiGet('/procure/ProcureInhouse/index', { list_rows: 2000 });
  const existRows = (inhouseAll.data?.rows || []).filter(r => Number(r.purchase_order_id) === 459);
  console.log('2. Existing inhouse records:', existRows.length, existRows.map(r => `id:${r.id} status:${r.status}`));

  let inhouseId = null;
  const defaultWh = 1; // erp_default_warehouse_id
  const warehouseResp = await apiGet('/stock/WarehouseName/index', { list_rows: 20 });
  const defaultWhName = (warehouseResp.data?.rows || []).find(w => w.id === defaultWh)?.name || '默认仓库';

  if (existRows.length === 0) {
    // Create inhouse
    const items = Array.isArray(po.goods_info) ? po.goods_info : JSON.parse(po.goods_info || '[]');
    const inhouseRes = await apiPost('/procure/ProcureInhouse/add', {
      purchase_order_id: 459,
      supplier_id: po.supplier_id,
      supplier_name: po.supplier_name,
      warehouse_id: po.warehouse_id || defaultWh,
      warehouse_name: po.warehouse_name || defaultWhName,
      admin_name: po.admin_name || '',
      in_date: (po.order_date || po.created_at || '').slice(0, 10),
      total_amount: po.total_amount,
      remark: po.remark || '',
      goods_info: items,
    });
    inhouseId = inhouseRes.data?.id ?? inhouseRes.data;
    console.log('3. createProcureInhouse:', inhouseRes.code === 1 ? 'OK id=' + inhouseId : 'FAILED: ' + inhouseRes.message);
  } else {
    // Use existing
    const sorted = [...existRows].sort((a, b) => b.id - a.id);
    inhouseId = sorted[0].id;
    console.log('3. Using existing inhouse id:', inhouseId);
  }

  // Audit inhouse
  if (inhouseId) {
    const auditIhR = await apiPost('/procure/ProcureInhouse/audit', { id: inhouseId, status: 1 });
    console.log('4. auditProcureInhouse:', auditIhR.code === 1 ? 'OK' : 'FAILED: ' + auditIhR.message);
  }

  // 5. Apply BOM stock effect (applyInhouseStockEffect)
  // Load goods list
  const goodsResp = await apiGet('/goods/ShopGoods/index', { list_rows: 2000 });
  const snToGoodsId = {};
  for (const g of goodsResp.data?.rows || []) {
    if (g.goods_sn && g.id) snToGoodsId[g.goods_sn] = g.id;
  }

  // Load BOM list
  const bomResp = await apiGet('/goods/ShopGoods/bomList', { list_rows: 500 });
  const bomSnMap = {};
  for (const b of bomResp.data?.list ?? bomResp.data?.rows ?? []) {
    if (b.goods_sn) bomSnMap[b.goods_sn] = b.id;
  }
  console.log('5. BOM list count:', Object.keys(bomSnMap).length);

  const items = Array.isArray(po.goods_info) ? po.goods_info : [];
  for (const item of items) {
    const bomId = bomSnMap[item.goods_sn || ''];
    console.log(`   Item: ${item.goods_name} goods_sn:${item.goods_sn} -> bomId:${bomId || 'none (no BOM)'}`);
  }

  // Check stock 10 seconds later
  console.log('\n=== Checking stock after audit ===');
  await new Promise(r => setTimeout(r, 3000));
  const afterAudit = await getStock();
  for (const [gid, info] of Object.entries(afterAudit)) {
    const before = baseline[gid]?.qty ?? 0;
    const diff = info.qty - before;
    const mark = diff !== 0 ? ` (${diff > 0 ? '+' : ''}${diff})` : '';
    console.log(`  goods_id:${gid} ${info.name}: ${before} → ${info.qty}${mark}`);
  }
  const exp988 = (baseline[988]?.qty ?? 0) + 2;
  const exp989 = (baseline[989]?.qty ?? 0) + 3;
  console.log('\n奶豆腐(988) expected:', exp988, 'got:', afterAudit[988]?.qty,
    afterAudit[988]?.qty === exp988 ? '✓ CORRECT' : '✗ WRONG');
  console.log('黄油(989) expected:', exp989, 'got:', afterAudit[989]?.qty,
    afterAudit[989]?.qty === exp989 ? '✓ CORRECT' : '✗ WRONG');

  // Check OtherOut/OtherIn
  async function getRecentOrders(since) {
    const results = {};
    for (const type of ['OtherOut', 'OtherIn']) {
      const resp = await apiGet(`/stock/${type}/index`, { list_rows: 20 });
      results[type] = (resp.data?.rows || []).filter(o => new Date(o.created_at || o.create_time) >= since);
    }
    return results;
  }

  const newOrders = await getRecentOrders(beforeTime);
  console.log('\n=== OtherOut/OtherIn since audit ===');
  let hasNew = false;
  for (const type of ['OtherOut', 'OtherIn']) {
    for (const o of newOrders[type]) {
      hasNew = true;
      console.log(`  ${type} id:${o.id} order_no:${o.order_no}`);
      for (const g of o.goods_info || []) console.log(`    ${g.goods_name} x${g.num}`);
    }
  }
  if (!hasNew) console.log('  (none)');

  // ── Reverse audit flow ───────────────────────────────────────────────────
  console.log('\n=== REVERSE AUDIT FLOW ===');

  // Reverse inhouse
  if (inhouseId) {
    const revIhR = await apiPost('/procure/ProcureInhouse/audit', { id: inhouseId, status: 0 });
    console.log('1. Reverse auditProcureInhouse:', revIhR.code === 1 ? 'OK' : 'FAILED: ' + revIhR.message);
  }

  // Reverse PO
  const revPOr = await apiPost('/stock/PurchaseOrder/audit', { id: 459, status: 0 });
  console.log('2. Reverse auditProcureOrder:', revPOr.code === 1 ? 'OK' : 'FAILED: ' + revPOr.message);

  await new Promise(r => setTimeout(r, 2000));
  console.log('\n=== Stock after reverse audit ===');
  const afterReverse = await getStock();
  let allOK = true;
  for (const [gid, info] of Object.entries(afterReverse)) {
    const orig = baseline[gid]?.qty ?? 0;
    const ok = info.qty === orig;
    if (!ok) allOK = false;
    console.log(`  goods_id:${gid} ${info.name}: ${info.qty} ${ok ? '✓ rolled back' : `✗ expected ${orig}`}`);
  }
  console.log('\nAll stock rolled back:', allOK ? 'YES ✓' : 'NO ✗');

  // Final check on OtherOut/OtherIn
  const finalOrders = await getRecentOrders(beforeTime);
  console.log('\n=== All OtherOut/OtherIn created during test ===');
  let totalNew = 0;
  for (const type of ['OtherOut', 'OtherIn']) {
    for (const o of finalOrders[type]) {
      totalNew++;
      console.log(`  ${type} id:${o.id} order_no:${o.order_no} created:${o.created_at}`);
      for (const g of o.goods_info || []) console.log(`    ${g.goods_name} x${g.num}`);
    }
  }
  if (totalNew === 0) console.log('  (none)');

  await browser.close();
  console.log('\n=== DONE ===');
})().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
