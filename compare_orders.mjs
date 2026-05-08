import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const browser = await chromium.launch({ headless: true });

// ===== 原网站 =====
const ctx1 = await browser.newContext();
const page1 = await ctx1.newPage();
await page1.goto('https://saas.mzth.cn/admin/#/login', { timeout: 60000, waitUntil: 'domcontentloaded' });
await page1.waitForTimeout(3000);
await page1.locator('input[type="text"]').first().fill('17747344571');
await page1.locator('input[type="password"]').fill('Oral6421');
await page1.locator('button').filter({ hasText: '登录' }).first().click();
await page1.waitForTimeout(4000);

const OT = 'fec7bda6a88723d24c9796d0e5738e6d';
const origOrders = [];
for (let p = 1; p <= 4; p++) {
  const r = await page1.evaluate(async (params) => {
    const res = await fetch(`/adminapi/purchase.Purchase/lists?page=${params.p}&pageSize=50`, { headers: { token: params.t } });
    return res.json();
  }, { p, t: OT });
  const rows = r.data?.rows || [];
  origOrders.push(...rows);
  if (rows.length < 50) break;
}

const origPayments = [];
for (let p = 1; p <= 8; p++) {
  const r = await page1.evaluate(async (params) => {
    const res = await fetch(`/adminapi/finance.CollectPay/lists?page=${params.p}&pageSize=50&pay_type=2`, { headers: { token: params.t } });
    return res.json();
  }, { p, t: OT });
  const rows = r.data?.rows || r.data?.list || [];
  origPayments.push(...rows);
  if (rows.length < 50) break;
}
await ctx1.close();
console.log('原采购单:', origOrders.length, '原付款:', origPayments.length);

// 原付款按 order_id 索引
const origPayByOrderId = {};
for (const pay of origPayments) {
  const oid = String(pay.order_id || pay.purchase_id || '');
  if (!oid) continue;
  if (!origPayByOrderId[oid]) origPayByOrderId[oid] = [];
  origPayByOrderId[oid].push(pay);
}

// ===== 我们系统 =====
const ctx2 = await browser.newContext();
const page2 = await ctx2.newPage();
await page2.goto('https://nomaderp.pages.dev/#/login', { timeout: 60000, waitUntil: 'domcontentloaded' });
await page2.waitForTimeout(4000);
await page2.locator('input').first().fill('17747344571');
await page2.locator('input[type="password"]').fill('Oral6421');
await page2.locator('button', { hasText: 'SIGN IN' }).click();
await page2.waitForTimeout(3000);
const ourToken = await page2.evaluate(() => localStorage.getItem('erp_token'));

const ourOrders = [];
for (let p = 1; p <= 15; p++) {
  const r = await page2.evaluate(async (params) => {
    const res = await fetch(`/adminapi/stock/PurchaseOrder/index?page=${params.p}&page_size=20`, { headers: { token: params.token } });
    return res.json();
  }, { p, token: ourToken });
  const rows = r.data?.rows || [];
  ourOrders.push(...rows);
  if (rows.length < 20) break;
}

const payReceipts = [];
for (let p = 1; p <= 15; p++) {
  const r = await page2.evaluate(async (params) => {
    const res = await fetch(`/adminapi/finance/PayReceipt/index?page=${params.p}&page_size=20`, { headers: { token: params.token } });
    return res.json();
  }, { p, token: ourToken });
  const rows = r.data?.rows || [];
  payReceipts.push(...rows);
  if (rows.length < 20) break;
}
await ctx2.close();
await browser.close();
console.log('我们采购单:', ourOrders.length, '我们PayReceipts:', payReceipts.length);

// 我们系统 PayReceipt 索引（by order_id 和 remark）
const prByOrderId = {};
const prByRemark = {};
for (const pr of payReceipts) {
  if (pr.order_id) {
    if (!prByOrderId[pr.order_id]) prByOrderId[pr.order_id] = [];
    prByOrderId[pr.order_id].push(pr);
  }
  const m = pr.remark?.match(/采购单付款 #(\d+)/);
  if (m) {
    if (!prByRemark[m[1]]) prByRemark[m[1]] = [];
    prByRemark[m[1]].push(pr);
  }
}

// 我们系统订单按原单号索引
const ourByOrigCode = {};
for (const o of ourOrders) {
  const m = (o.remark || '').match(/原单号:(CG\d+)/);
  if (m) ourByOrigCode[m[1]] = o;
}

// ===== 对账 =====
const result = [];
for (const orig of origOrders) {
  const origId   = String(orig.id);
  const origCode = orig.code || '';                      // 正确字段: code
  const origTotal = parseFloat(orig.total_amount || orig.total_price || 0);
  const origPaid  = parseFloat(orig.pay_price || orig.receipt_money || 0); // 正确字段: pay_price
  const origPayStatus = origPaid >= origTotal - 0.01 ? '已付清' : origPaid > 0 ? '部分付' : '未付款';
  const origPays = origPayByOrderId[origId] || [];
  const origAccts = [...new Set(origPays.map(p => p.settlement_name || p.account_name || ''))].filter(Boolean).join('、') || '—';
  const origSupplier = orig.apply_name || orig.apply?.apply_name || '';

  const ourOrder = ourByOrigCode[origCode];
  let ourPayStatus = '无单据';
  let ourPaidAmt = 0;
  let ourAccts = '—';
  if (ourOrder) {
    ourPaidAmt = parseFloat(ourOrder.pay_amount || 0);
    const ourTotal = parseFloat(ourOrder.total_amount || 0);
    ourPayStatus = ourPaidAmt >= ourTotal - 0.01 ? '已付清' : ourPaidAmt > 0 ? '部分付' : '未付款';
    const prs = [...(prByOrderId[ourOrder.id] || []), ...(prByRemark[String(ourOrder.id)] || [])];
    ourAccts = [...new Set(prs.map(p => p.fund_name || ''))].filter(Boolean).join('、') || '—';
  }

  const flag = (ourPayStatus !== origPayStatus && ourPayStatus !== '无单据') ? '⚠️状态' :
               (ourAccts !== '—' && origAccts !== '—' && ourAccts !== origAccts) ? '⚠️账户' : '';
  result.push({ origCode, origSupplier, origTotal, origPaid, origPayStatus, origAccts, ourPayStatus, ourPaidAmt, ourAccts, flag });
}

writeFileSync('/tmp/compare_full.json', JSON.stringify(result, null, 2));

const noOrder    = result.filter(r => r.ourPayStatus === '无单据');
const statusDiff = result.filter(r => r.flag === '⚠️状态');
const acctDiff   = result.filter(r => r.flag === '⚠️账户');
const allOk      = result.filter(r => !r.flag && r.ourPayStatus !== '无单据');

console.log(`\n共 ${result.length} 条`);
console.log(`✓ 完全一致: ${allOk.length}`);
console.log(`⚠️ 状态不符: ${statusDiff.length}`);
console.log(`⚠️ 账户不符: ${acctDiff.length}`);
console.log(`— 无单据: ${noOrder.length} (含已付款:${noOrder.filter(r=>r.origPaid>0).length} 含未付款:${noOrder.filter(r=>r.origPaid===0).length})`);

if (statusDiff.length) {
  console.log('\n【付款状态不符】');
  for (const r of statusDiff) {
    console.log(`  ${r.origCode} ${r.origSupplier} ¥${r.origTotal} | 原:${r.origPayStatus}(¥${r.origPaid})[${r.origAccts}] → 我们:${r.ourPayStatus}(¥${r.ourPaidAmt})[${r.ourAccts}]`);
  }
}
if (acctDiff.length) {
  console.log('\n【付款账户不符】');
  for (const r of acctDiff) {
    console.log(`  ${r.origCode} ${r.origSupplier} | 原:[${r.origAccts}] → 我们:[${r.ourAccts}]`);
  }
}
const paidNoOrder = noOrder.filter(r => r.origPaid > 0);
if (paidNoOrder.length) {
  console.log('\n【无单据 + 原已付款】');
  for (const r of paidNoOrder) {
    console.log(`  ${r.origCode} ${r.origSupplier} 总¥${r.origTotal} 已付¥${r.origPaid} [${r.origAccts}]`);
  }
}
