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

async function getStockTotal(page, gid) {
  const r = await get(page, `/stock/StockAll/index?goods_id=${gid}&list_rows=200`);
  return (r?.data?.rows ?? []).reduce((s, i) => s + (parseFloat(i.stock_num) || 0), 0);
}
async function getOtherOut(page) {
  return (await get(page, '/stock/OtherOut/index?list_rows=200'))?.data?.rows ?? [];
}
async function getOtherIn(page) {
  return (await get(page, '/stock/OtherIn/index?list_rows=200'))?.data?.rows ?? [];
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
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
  await page.evaluate(t => { localStorage.setItem('erp_token', t); localStorage.setItem('erp_default_warehouse_id', '1'); }, token);
  console.log('Logged in OK');

  // Reset to clean state: ensure order status=0
  const orderListInit = await get(page, '/stock/PurchaseOrder/index?list_rows=999');
  const order = orderListInit?.data?.rows?.find(o => o.order_no === 'CG202603313284');
  console.log(`Order: id=${order.id} status=${order.status}`);
  
  if (order.status === 1) {
    const inh = await get(page, '/procure/ProcureInhouse/index?list_rows=2000');
    for (const r of (inh?.data?.rows??[]).filter(r=>Number(r.purchase_order_id)===order.id && r.status===1)) {
      await post(page, '/procure/ProcureInhouse/audit', { id: r.id, status: 0 });
    }
    await post(page, '/stock/PurchaseOrder/audit', { id: order.id, status: 0 });
    console.log('Reset order to status=0');
    await page.waitForTimeout(500);
  }

  // BASELINES
  console.log('\n=== STEP 1: Baseline OtherOut/OtherIn ===');
  const baseOut = await getOtherOut(page);
  const baseIn = await getOtherIn(page);
  const baseOutIds = new Set(baseOut.map(i => i.id));
  const baseInIds = new Set(baseIn.map(i => i.id));
  console.log(`OtherOut: ${baseOut.length}  IDs: [${[...baseOutIds].sort((a,b)=>a-b).join(',')}]`);
  console.log(`OtherIn:  ${baseIn.length}   IDs: [${[...baseInIds].sort((a,b)=>a-b).join(',')}]`);

  console.log('\n=== STEP 2: Baseline Stock (goods 989,988,975,974) ===');
  const GOODS_IDS = [989, 988, 975, 974];
  const baseStock = {};
  for (const gid of GOODS_IDS) {
    baseStock[gid] = await getStockTotal(page, gid);
    console.log(`  goods_id=${gid}: ${baseStock[gid]}`);
  }

  // FULL AUDIT WITH BOM (mirrors frontend handleAudit + applyInhouseStockEffect)
  console.log('\n=== STEP 3: Full Audit (including BOM扣料) ===');
  const auditLog = await page.evaluate(async (orderId) => {
    const token = localStorage.getItem('erp_token');
    const API = 'https://nomaderp.pages.dev/adminapi';
    const H = { 'token': token, 'Content-Type': 'application/json' };
    const post = async (path, data) => (await fetch(API+path, {method:'POST',headers:H,body:JSON.stringify(data)})).json();
    const get = async (path) => (await fetch(API+path, {headers:{token}})).json();
    const log = [];
    
    // Step 1: Audit order
    const ar = await post('/stock/PurchaseOrder/audit', {id:orderId, status:1});
    log.push({step:'audit_order', code:ar.code});
    
    // Step 2: Check/create inhouse
    const inhList = await get('/procure/ProcureInhouse/index?list_rows=2000');
    const existRows = (inhList?.data?.rows??[]).filter(r=>Number(r.purchase_order_id)===orderId);
    log.push({step:'inhouse_exist', count:existRows.length, statuses:existRows.map(r=>r.status)});
    
    let inhouseId, inhouseWarehouseId, inhouseItems;
    
    if (existRows.length === 0) {
      // Create new
      const orderRes = await get('/stock/PurchaseOrder/index?list_rows=999');
      const order = orderRes?.data?.rows?.find(o=>o.id===orderId);
      inhouseItems = typeof order.goods_info==='string' ? JSON.parse(order.goods_info) : order.goods_info;
      const wid = Number(localStorage.getItem('erp_default_warehouse_id'))||1;
      const cr = await post('/procure/ProcureInhouse/add', {
        purchase_order_id:orderId, supplier_id:order.supplier_id, supplier_name:order.supplier_name,
        warehouse_id:wid, warehouse_name:'默认仓库',
        in_date:(order.order_date||'').slice(0,10)||new Date().toISOString().slice(0,10),
        total_amount:order.total_amount, goods_info:inhouseItems,
      });
      inhouseId = cr?.data?.id;
      inhouseWarehouseId = wid;
      log.push({step:'created_inhouse', id:inhouseId});
    } else {
      // Use existing (keep latest, delete extras)
      const sorted = [...existRows].sort((a,b)=>b.id-a.id);
      inhouseId = sorted[0].id;
      inhouseWarehouseId = sorted[0].warehouse_id || Number(localStorage.getItem('erp_default_warehouse_id'))||1;
      const rItems = sorted[0].goods_info;
      inhouseItems = typeof rItems==='string' ? JSON.parse(rItems) : (rItems||[]);
      log.push({step:'using_existing_inhouse', id:inhouseId, wh:inhouseWarehouseId, status:sorted[0].status});
    }
    
    // Audit inhouse if not already
    const inhDetail = existRows.find(r=>r.id===inhouseId) || {};
    if (!inhDetail.status || inhDetail.status !== 1) {
      const air = await post('/procure/ProcureInhouse/audit', {id:inhouseId, status:1});
      log.push({step:'audit_inhouse', id:inhouseId, code:air.code});
    }
    
    // BOM effect
    const goodsRes = await get('/goods/ShopGoods/index?list_rows=2000');
    const snToId = {};
    for (const g of goodsRes?.data?.rows??[]) { if(g.goods_sn&&g.id) snToId[g.goods_sn]=g.id; }
    
    const stockRes = await get('/stock/StockAll/index?list_rows=2000');
    const stockByGid = {};
    for (const s of stockRes?.data?.rows??[]) {
      if(!s.goods_id) continue;
      if(!stockByGid[s.goods_id]||Number(s.qty)>Number(stockByGid[s.goods_id]?.qty||0)) stockByGid[s.goods_id]=s;
    }
    
    const bomListRes = await get('/goods/BomGoods/index?list_rows=500');
    const bomSnMap = {};
    for (const b of bomListRes?.data?.list??bomListRes?.data?.rows??[]) { if(b.goods_sn) bomSnMap[b.goods_sn]=b.id; }
    log.push({step:'bom_loaded', count:Object.keys(bomSnMap).length});
    
    for (const item of inhouseItems) {
      if (!item.num) continue;
      const bomId = bomSnMap[item.goods_sn||''];
      log.push({step:'item_bom_check', sn:item.goods_sn, name:item.goods_name, bomId});
      if (!bomId) continue;
      
      const detailRes = await get('/goods/BomGoods/detail?id='+bomId);
      const bomItems = detailRes?.data?.items??[];
      log.push({step:'bom_detail', bomId, matCount:bomItems.length, mats:bomItems.map(m=>({sn:m.goods_sn,num:m.num,name:m.goods_name}))});
      
      const finishedQty = Number(item.num)*Number(item.unit_ratio||1);
      const byWh = {};
      for (const mat of bomItems) {
        if(!mat.goods_sn||!mat.num) continue;
        const matGid = snToId[mat.goods_sn];
        log.push({step:'mat_lookup', sn:mat.goods_sn, matGid, found:!!matGid});
        if(!matGid) continue;
        const ms = stockByGid[matGid];
        const whId = ms?.warehouse_id??0;
        const whName = ms?.warehouse_name??'';
        const key = String(whId);
        if(!byWh[key]) byWh[key]={wh_id:whId, wh_name:whName, goods:[]};
        byWh[key].goods.push({goods_id:matGid, goods_name:mat.goods_name||'', goods_sn:mat.goods_sn, num:Number(mat.num)*finishedQty, unit_name:mat.unit_name||'', price:0});
      }
      
      for (const wk of Object.values(byWh)) {
        if(!wk.goods.length) continue;
        const remark = `BOM扣料-${item.goods_name||item.goods_sn}`;
        const addRes = await post('/stock/OtherOut/add', {warehouse_id:wk.wh_id, warehouse_name:wk.wh_name, remark, goods_info:wk.goods});
        const outId = addRes?.data?.id;
        log.push({step:'create_other_out', remark, outId, goodsCount:wk.goods.length, respCode:addRes?.code});
        if(outId) {
          const aud = await post('/stock/OtherOut/audit', {id:outId, status:1});
          log.push({step:'audit_other_out', id:outId, code:aud?.code});
        }
      }
    }
    
    return log;
  }, order.id);
  
  console.log('Audit log:');
  auditLog.forEach(s => console.log('  ' + JSON.stringify(s)));
  
  await page.waitForTimeout(2000);

  // STEP 4
  console.log('\n=== STEP 4: After Audit ===');
  const afterOut = await getOtherOut(page);
  const afterIn = await getOtherIn(page);
  const newOut = afterOut.filter(i => !baseOutIds.has(i.id));
  const newIn = afterIn.filter(i => !baseInIds.has(i.id));
  const newOutIds = new Set(newOut.map(i => i.id));
  
  console.log(`New OtherOut (BOM扣料): ${newOut.length}`);
  newOut.forEach(i => console.log(`  id=${i.id} status=${i.status} remark="${i.remark}" goods=${JSON.stringify(i.goods_info||'').slice(0,100)}`));
  console.log(`New OtherIn: ${newIn.length}`);
  
  for (const gid of GOODS_IDS) {
    const val = await getStockTotal(page, gid);
    const diff = val - baseStock[gid];
    console.log(`  goods_id=${gid}: ${val} (diff: ${diff>=0?'+':''}${diff})`);
  }
  
  const st1 = (await get(page, '/stock/PurchaseOrder/index?list_rows=999'))?.data?.rows?.find(o=>o.order_no==='CG202603313284')?.status;
  console.log(`  Order status: ${st1}`);

  // STEP 5: Reverse
  console.log('\n=== STEP 5: Reverse Audit ===');
  const revLog = await page.evaluate(async (orderId) => {
    const token = localStorage.getItem('erp_token');
    const API = 'https://nomaderp.pages.dev/adminapi';
    const H = { 'token': token, 'Content-Type': 'application/json' };
    const post = async (path, data) => (await fetch(API+path, {method:'POST',headers:H,body:JSON.stringify(data)})).json();
    const get = async (path) => (await fetch(API+path, {headers:{token}})).json();
    const log = [];
    
    // Get inhouse rows
    const inhList = await get('/procure/ProcureInhouse/index?list_rows=2000');
    const inhouseRows = (inhList?.data?.rows??[]).filter(r=>Number(r.purchase_order_id)===orderId);
    log.push({step:'inhouse_rows', count:inhouseRows.length, rows:inhouseRows.map(r=>({id:r.id,status:r.status}))});
    
    // Get OtherOut for BOM match
    const otRes = await get('/stock/OtherOut/index?list_rows=2000');
    const allOtherOut = otRes?.data?.rows??[];
    log.push({step:'other_out_loaded', count:allOtherOut.length, ids:allOtherOut.map(o=>o.id)});
    
    for (const r of inhouseRows) {
      if (r.status === 1) {
        const rev = await post('/procure/ProcureInhouse/audit', {id:r.id, status:0});
        log.push({step:'rev_inhouse', id:r.id, code:rev?.code});
        
        const rItems = typeof r.goods_info==='string' ? JSON.parse(r.goods_info) : (r.goods_info||[]);
        const bomNames = rItems.map(i=>i.goods_name||i.goods_sn).filter(Boolean);
        const related = allOtherOut.filter(o=>bomNames.some(n=>String(o.remark||'').includes(`BOM扣料-${n}`)));
        log.push({step:'bom_out_match', bomNames, relatedCount:related.length, relatedIds:related.map(o=>o.id)});
        
        for (const o of related) {
          if (o.status === 1) {
            const rv = await post('/stock/OtherOut/audit', {id:o.id, status:0});
            log.push({step:'rev_bom_out', id:o.id, code:rv?.code});
          } else {
            log.push({step:'bom_out_skip', id:o.id, status:o.status});
          }
        }
      }
    }
    
    const revOrd = await post('/stock/PurchaseOrder/audit', {id:orderId, status:0});
    log.push({step:'rev_order', code:revOrd?.code});
    return log;
  }, order.id);
  
  console.log('Reverse log:');
  revLog.forEach(s => console.log('  ' + JSON.stringify(s)));
  
  await page.waitForTimeout(2000);

  // STEP 6
  console.log('\n=== STEP 6: After Reverse Audit ===');
  const finalOut = await getOtherOut(page);
  const finalIn = await getOtherIn(page);
  const finalOutIds = new Set(finalOut.map(i => i.id));
  const newInAfterRev = finalIn.filter(i => !baseInIds.has(i.id));
  const remainingNewOut = newOut.filter(i => finalOutIds.has(i.id));
  const unexpectedOut = finalOut.filter(i => !baseOutIds.has(i.id) && !newOutIds.has(i.id));
  
  console.log('BOM OtherOut check:');
  if (newOut.length === 0) console.log('  No BOM OtherOut generated (BOM扣料 skipped)');
  for (const i of newOut) console.log(`  id=${i.id} remark="${i.remark}": ${finalOutIds.has(i.id)?'STILL EXISTS (BAD)':'DELETED (GOOD)'}`);
  
  if (unexpectedOut.length) {
    console.log('UNEXPECTED new OtherOut after reverse:');
    unexpectedOut.forEach(i => console.log(`  BAD: id=${i.id} remark="${i.remark}"`));
  }
  
  console.log(`New OtherIn after reverse: ${newInAfterRev.length} ${newInAfterRev.length===0?'(GOOD)':'(BAD)'}`);
  newInAfterRev.forEach(i => console.log(`  id=${i.id} remark="${i.remark}"`));
  
  let stockClean = true;
  for (const gid of GOODS_IDS) {
    const val = await getStockTotal(page, gid);
    const diff = val - baseStock[gid];
    const clean = Math.abs(diff) < 0.001;
    if (!clean) stockClean = false;
    console.log(`  goods_id=${gid}: ${baseStock[gid]} → ${val} ${clean?'CLEAN':'DIRTY diff='+diff}`);
  }
  
  const finalSt = (await get(page, '/stock/PurchaseOrder/index?list_rows=999'))?.data?.rows?.find(o=>o.order_no==='CG202603313284')?.status;

  console.log('\n' + '='.repeat(60));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log('Order: CG202603313284 | 蒙古黄油/瓶装成品(SP0000045) x3 + 奶豆腐(SP0000046) x2');
  console.log('Both goods have BOM entries in system');
  console.log('');
  console.log(`[审核] BOM OtherOut generated: ${newOut.length}`);
  newOut.forEach(i => console.log(`  - id=${i.id} remark="${i.remark}"`));
  console.log('');
  console.log('[反审核] Results:');
  if (newOut.length === 0) {
    console.log('  BOM OtherOut: none were created → nothing to delete');
  } else {
    console.log(`  BOM OtherOut deleted: ${newOut.every(i=>!finalOutIds.has(i.id)) ? 'YES (GOOD)' : 'NO (BAD)'}`);
  }
  console.log(`  New OtherIn produced: ${newInAfterRev.length===0 ? 'NO (GOOD)' : 'YES (BAD) count='+newInAfterRev.length}`);
  console.log(`  Stock rolled back: ${stockClean ? 'YES (GOOD)' : 'NO (BAD)'}`);
  console.log(`  Order status reset to 0: ${finalSt===0 ? 'YES (GOOD)' : 'NO status='+finalSt}`);
  
  const verdict = newOut.length === 0 ? '⚠ ISSUE: BOM扣料未触发（原材料库存为0，byWarehouse分组为空）' : 
    (newOut.every(i=>!finalOutIds.has(i.id)) && newInAfterRev.length===0 && stockClean ? '✓ CLEAN' : '✗ DIRTY');
  console.log(`\nVERDICT: ${verdict}`);

  await browser.close();
})();
