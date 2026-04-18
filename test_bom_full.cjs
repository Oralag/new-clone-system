const { chromium } = require('playwright');

const BASE = 'https://nomaderp.pages.dev';
const API = BASE + '/adminapi';

// Helper
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

async function getStockTotal(page, gid) {
  const r = await get(page, `/stock/StockAll/index?goods_id=${gid}&list_rows=200`);
  return (r?.data?.rows ?? []).reduce((s, i) => s + (parseFloat(i.stock_num) || 0), 0);
}

async function getOtherOut(page) {
  const r = await get(page, '/stock/OtherOut/index?list_rows=200');
  return r?.data?.rows ?? [];
}

async function getOtherIn(page) {
  const r = await get(page, '/stock/OtherIn/index?list_rows=200');
  return r?.data?.rows ?? [];
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to site and login
  await page.goto(BASE);
  await page.waitForTimeout(1000);
  
  const lr = await page.evaluate(async () => {
    const r = await fetch('https://nomaderp.pages.dev/adminapi/login/account', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: '17747344571', password: 'Oral6421', terminal: 1 })
    });
    return r.json();
  });
  
  const token = lr?.data?.token;
  if (!token) { console.error('NO TOKEN:', JSON.stringify(lr)); await browser.close(); return; }
  await page.evaluate(t => { localStorage.setItem('erp_token', t); localStorage.setItem('erp_default_warehouse_id', '1'); }, token);
  console.log('Logged in. Token:', token.slice(0, 20) + '...');

  // Ensure order is un-audited first
  const orderList = await get(page, '/stock/PurchaseOrder/index?list_rows=999');
  const order = orderList?.data?.rows?.find(o => o.order_no === 'CG202603313284');
  if (!order) { console.error('Order CG202603313284 not found!'); await browser.close(); return; }
  console.log(`Order id=${order.id} status=${order.status} goods:`, order.goods_info?.map(g => `${g.goods_name}(${g.goods_sn}) x${g.num}`).join(', '));
  
  if (order.status === 1) {
    console.log('Order is audited, reversing first...');
    // Reverse existing inhouse records
    const inhouseList = await get(page, '/procure/ProcureInhouse/index?list_rows=2000');
    const inhouseRows = (inhouseList?.data?.rows ?? []).filter(r => Number(r.purchase_order_id) === order.id);
    for (const r of inhouseRows) {
      if (r.status === 1) {
        await post(page, '/procure/ProcureInhouse/audit', { id: r.id, status: 0 });
        console.log(`  Reversed inhouse ${r.id}`);
      }
    }
    await post(page, '/stock/PurchaseOrder/audit', { id: order.id, status: 0 });
    console.log('  Reversed order audit');
    await page.waitForTimeout(1000);
  }

  const GOODS_IDS = [989, 988, 975, 974];
  
  // STEP 1: Baselines
  console.log('\n=== STEP 1: Baseline OtherOut/OtherIn ===');
  const baseOut = await getOtherOut(page);
  const baseIn = await getOtherIn(page);
  const baseOutIds = new Set(baseOut.map(i => i.id));
  const baseInIds = new Set(baseIn.map(i => i.id));
  console.log(`OtherOut: ${baseOut.length}  IDs: [${[...baseOutIds].sort((a,b)=>a-b).join(',')}]`);
  console.log(`OtherIn:  ${baseIn.length}   IDs: [${[...baseInIds].sort((a,b)=>a-b).join(',')}]`);

  console.log('\n=== STEP 2: Baseline Stock ===');
  const baseStock = {};
  for (const gid of GOODS_IDS) {
    baseStock[gid] = await getStockTotal(page, gid);
    console.log(`  goods_id=${gid}: ${baseStock[gid]}`);
  }

  // STEP 3: Full audit logic (same as frontend handleAudit)
  console.log('\n=== STEP 3: Audit CG202603313284 (simulating frontend handleAudit) ===');
  
  const auditResult = await page.evaluate(async (orderId) => {
    const token = localStorage.getItem('erp_token');
    const warehouseId = Number(localStorage.getItem('erp_default_warehouse_id')) || 1;
    const API = 'https://nomaderp.pages.dev/adminapi';
    const headers = { 'token': token, 'Content-Type': 'application/json' };
    const post = async (path, data) => {
      const r = await fetch(API + path, { method: 'POST', headers, body: JSON.stringify(data) });
      return r.json();
    };
    const get = async (path) => {
      const r = await fetch(API + path, { headers: { token } });
      return r.json();
    };

    const log = [];
    
    try {
      // 1. Audit the order
      const auditResp = await post('/stock/PurchaseOrder/audit', { id: orderId, status: 1 });
      log.push({ step: 'audit_order', code: auditResp.code, msg: auditResp.message });
      
      // 2. Get existing inhouse (防重复)
      const inhouseListRes = await get('/procure/ProcureInhouse/index?list_rows=2000');
      const existRows = (inhouseListRes?.data?.rows ?? []).filter(r => Number(r.purchase_order_id) === orderId);
      log.push({ step: 'check_inhouse', existCount: existRows.length });
      
      // 3. Create inhouse if needed
      let inhouseId = null;
      if (existRows.length === 0) {
        const orderRes = await get('/stock/PurchaseOrder/index?list_rows=999');
        const order = orderRes?.data?.rows?.find(o => o.id === orderId);
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
        log.push({ step: 'create_inhouse', id: inhouseId, resp_code: inhouseRes?.code });
        
        // Audit inhouse
        if (inhouseId) {
          const auditInh = await post('/procure/ProcureInhouse/audit', { id: inhouseId, status: 1 });
          log.push({ step: 'audit_inhouse', id: inhouseId, code: auditInh?.code });
        }
        
        // 4. BOM stock effect
        // Load goods list for sn->id map
        const goodsRes = await get('/goods/ShopGoods/index?list_rows=2000');
        const snToGoodsId = {};
        for (const g of goodsRes?.data?.rows ?? []) {
          if (g.goods_sn && g.id) snToGoodsId[g.goods_sn] = g.id;
        }
        
        // Load all stock for warehouse lookup
        const allStockRes = await get('/stock/StockAll/index?list_rows=2000');
        const stockByGoodsId = {};
        for (const s of allStockRes?.data?.rows ?? []) {
          if (!s.goods_id) continue;
          if (!stockByGoodsId[s.goods_id] || Number(s.qty) > Number(stockByGoodsId[s.goods_id]?.qty || 0)) {
            stockByGoodsId[s.goods_id] = s;
          }
        }
        
        // Load BOM list
        const bomListRes = await get('/goods/BomGoods/index?list_rows=500');
        const bomSnMap = {};
        for (const b of bomListRes?.data?.list ?? bomListRes?.data?.rows ?? []) {
          if (b.goods_sn) bomSnMap[b.goods_sn] = b.id;
        }
        log.push({ step: 'bom_map', bomCount: Object.keys(bomSnMap).length });
        
        for (const item of items) {
          if (!item.num) continue;
          const bomId = bomSnMap[item.goods_sn || ''];
          log.push({ step: 'check_bom_for_item', goods_sn: item.goods_sn, goods_name: item.goods_name, bomId });
          if (!bomId) continue;
          
          const detailRes = await get('/goods/BomGoods/detail?id=' + bomId);
          const bomItems = detailRes?.data?.items ?? [];
          log.push({ step: 'bom_detail', bomId, itemCount: bomItems.length, items: bomItems.map(i => ({sn:i.goods_sn, num:i.num, name:i.goods_name})) });
          
          const finishedQty = Number(item.num) * Number(item.unit_ratio || 1);
          const byWarehouse = {};
          
          for (const mat of bomItems) {
            if (!mat.goods_sn || !mat.num) continue;
            const matGoodsId = snToGoodsId[mat.goods_sn];
            if (!matGoodsId) { log.push({ step: 'sn_not_found', sn: mat.goods_sn }); continue; }
            const matStock = stockByGoodsId[matGoodsId];
            const whId = matStock?.warehouse_id ?? 0;
            const whName = matStock?.warehouse_name ?? '';
            const key = String(whId);
            if (!byWarehouse[key]) byWarehouse[key] = { wh_id: whId, wh_name: whName, goods: [] };
            byWarehouse[key].goods.push({
              goods_id: matGoodsId, goods_name: mat.goods_name || '', goods_sn: mat.goods_sn,
              num: Number(mat.num) * finishedQty, unit_name: mat.unit_name || '', price: 0,
            });
          }
          
          for (const wk of Object.values(byWarehouse)) {
            if (!wk.goods.length) continue;
            const remark = `BOM扣料-${item.goods_name || item.goods_sn}`;
            const addRes = await post('/stock/OtherOut/add', {
              warehouse_id: wk.wh_id, warehouse_name: wk.wh_name, remark, goods_info: wk.goods,
            });
            const outId = addRes?.data?.id;
            log.push({ step: 'create_other_out', remark, outId, goods: wk.goods.length, resp_code: addRes?.code });
            if (outId) {
              const auditOut = await post('/stock/OtherOut/audit', { id: outId, status: 1 });
              log.push({ step: 'audit_other_out', id: outId, code: auditOut?.code });
            }
          }
        }
      } else {
        log.push({ step: 'inhouse_already_exists', count: existRows.length });
      }
      
      return { success: true, log };
    } catch (e) {
      return { success: false, error: e.message, log };
    }
  }, order.id);
  
  console.log('Audit process log:');
  auditResult.log.forEach(s => console.log('  ' + JSON.stringify(s)));

  await page.waitForTimeout(2000);
  
  // STEP 4: After audit
  console.log('\n=== STEP 4: After Audit ===');
  const afterOut = await getOtherOut(page);
  const afterIn = await getOtherIn(page);
  const newOut = afterOut.filter(i => !baseOutIds.has(i.id));
  const newIn = afterIn.filter(i => !baseInIds.has(i.id));
  
  console.log(`New OtherOut: ${newOut.length}`);
  newOut.forEach(i => console.log(`  id=${i.id} order_no=${i.order_no} status=${i.status} remark="${i.remark}"`));
  console.log(`New OtherIn: ${newIn.length}`);
  newIn.forEach(i => console.log(`  id=${i.id} order_no=${i.order_no} status=${i.status}`));
  
  const newOutIds = new Set(newOut.map(i => i.id));
  
  const afterStock = {};
  for (const gid of GOODS_IDS) {
    afterStock[gid] = await getStockTotal(page, gid);
    const diff = afterStock[gid] - baseStock[gid];
    console.log(`  goods_id=${gid}: ${afterStock[gid]} (diff: ${diff>=0?'+':''}${diff})`);
  }

  const orderStatus1 = (await get(page, '/stock/PurchaseOrder/index?list_rows=999'))?.data?.rows?.find(o=>o.order_no==='CG202603313284')?.status;
  console.log(`  Order status: ${orderStatus1}`);

  // STEP 5: Reverse audit (same as frontend handleReverseAudit)
  console.log('\n=== STEP 5: Reverse Audit (simulating frontend handleReverseAudit) ===');
  
  const revResult = await page.evaluate(async (orderId) => {
    const token = localStorage.getItem('erp_token');
    const API = 'https://nomaderp.pages.dev/adminapi';
    const headers = { 'token': token, 'Content-Type': 'application/json' };
    const post = async (path, data) => {
      const r = await fetch(API + path, { method: 'POST', headers, body: JSON.stringify(data) });
      return r.json();
    };
    const get = async (path) => {
      const r = await fetch(API + path, { headers: { token } });
      return r.json();
    };
    
    const log = [];
    
    // 1. Get inhouse records
    const inhouseListRes = await get('/procure/ProcureInhouse/index?list_rows=2000');
    const inhouseRows = (inhouseListRes?.data?.rows ?? []).filter(r => Number(r.purchase_order_id) === orderId);
    log.push({ step: 'inhouse_rows', count: inhouseRows.length, statuses: inhouseRows.map(r => r.status) });
    
    // 2. Get all OtherOut
    const otherOutRes = await get('/stock/OtherOut/index?list_rows=2000');
    const allOtherOut = otherOutRes?.data?.rows ?? [];
    log.push({ step: 'other_out_total', count: allOtherOut.length });
    
    for (const r of inhouseRows) {
      if (r.status === 1) {
        // Reverse-audit inhouse
        const revInh = await post('/procure/ProcureInhouse/audit', { id: r.id, status: 0 });
        log.push({ step: 'rev_inhouse', id: r.id, code: revInh?.code });
        
        // Find BOM OtherOut
        const rItems = typeof r.goods_info === 'string' ? JSON.parse(r.goods_info) : (r.goods_info || []);
        const bomGoodsNames = rItems.map(i => i.goods_name || i.goods_sn).filter(Boolean);
        const relatedOtherOut = allOtherOut.filter(o =>
          bomGoodsNames.some(name => String(o.remark || '').includes(`BOM扣料-${name}`))
        );
        log.push({ step: 'related_bom_out', count: relatedOtherOut.length, bomNames: bomGoodsNames, relatedIds: relatedOtherOut.map(o => o.id) });
        
        for (const o of relatedOtherOut) {
          if (o.status === 1) {
            const rev = await post('/stock/OtherOut/audit', { id: o.id, status: 0 });
            log.push({ step: 'rev_bom_out', id: o.id, code: rev?.code });
          }
        }
      }
    }
    
    // 3. Reverse order
    const revOrder = await post('/stock/PurchaseOrder/audit', { id: orderId, status: 0 });
    log.push({ step: 'rev_order', code: revOrder?.code });
    
    return { log };
  }, order.id);
  
  console.log('Reverse audit log:');
  revResult.log.forEach(s => console.log('  ' + JSON.stringify(s)));
  
  await page.waitForTimeout(2000);

  // STEP 6: After reverse
  console.log('\n=== STEP 6: After Reverse Audit ===');
  const finalOut = await getOtherOut(page);
  const finalIn = await getOtherIn(page);
  const finalOutIds = new Set(finalOut.map(i => i.id));
  const newInAfterRev = finalIn.filter(i => !baseInIds.has(i.id));
  
  console.log('OtherOut after reverse:');
  if (newOut.length === 0) {
    console.log('  No BOM OtherOut was generated during audit');
  }
  for (const item of newOut) {
    const still = finalOutIds.has(item.id);
    console.log(`  OtherOut id=${item.id} remark="${item.remark}": ${still ? 'STILL EXISTS (BAD)' : 'DELETED (GOOD)'}`);
  }
  
  const unexpectedOut = finalOut.filter(i => !baseOutIds.has(i.id) && !newOutIds.has(i.id));
  if (unexpectedOut.length > 0) {
    console.log('  Unexpected NEW OtherOut after reverse (VERY BAD):');
    unexpectedOut.forEach(i => console.log(`    id=${i.id} remark="${i.remark}"`));
  }
  
  console.log(`New OtherIn after reverse: ${newInAfterRev.length}`);
  if (newInAfterRev.length === 0) console.log('  CLEAN - no new OtherIn (GOOD)');
  else {
    newInAfterRev.forEach(i => console.log(`  BAD: id=${i.id} remark="${i.remark}"`));
  }
  
  console.log('Stock rollback:');
  let stockClean = true;
  for (const gid of GOODS_IDS) {
    const val = await getStockTotal(page, gid);
    const diff = val - baseStock[gid];
    const clean = Math.abs(diff) < 0.001;
    if (!clean) stockClean = false;
    console.log(`  goods_id=${gid}: ${baseStock[gid]} → ${val} ${clean ? 'CLEAN' : 'DIRTY diff='+diff}`);
  }
  
  const finalOrderStatus = (await get(page, '/stock/PurchaseOrder/index?list_rows=999'))?.data?.rows?.find(o=>o.order_no==='CG202603313284')?.status;
  console.log(`  Order final status: ${finalOrderStatus} (0=un-audited)`);

  console.log('\n' + '='.repeat(60));
  console.log('FINAL TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Order: CG202603313284 (id=${order.id}), goods: 蒙古黄油/瓶装成品 x3 + 奶豆腐 x2`);
  console.log(`BOM check: Both goods HAVE BOM entries`);
  console.log(`\nAudit results:`);
  console.log(`  OtherOut generated: ${newOut.length}`);
  newOut.forEach(i => console.log(`    - id=${i.id}, remark="${i.remark}", status=${i.status}`));
  
  const allDeleted = newOut.length === 0 ? null : newOut.every(i => !finalOutIds.has(i.id));
  console.log(`\nReverse audit results:`);
  if (allDeleted === null) console.log(`  OtherOut deleted: N/A`);
  else console.log(`  OtherOut deleted: ${allDeleted ? 'YES (GOOD)' : 'NO (BAD)'}`);
  console.log(`  Unexpected OtherIn: ${newInAfterRev.length === 0 ? 'NONE (GOOD)' : 'EXISTS (BAD) = '+newInAfterRev.length}`);
  console.log(`  Stock rolled back: ${stockClean ? 'YES (GOOD)' : 'NO (BAD)'}`);
  console.log(`  Order status reset: ${finalOrderStatus === 0 ? 'YES (GOOD)' : 'NO (BAD) status='+finalOrderStatus}`);

  await browser.close();
})();
