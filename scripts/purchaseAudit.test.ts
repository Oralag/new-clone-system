import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { AUDIT_PURCHASE_ORDER_SQL } from '../functions/adminapi/stock/PurchaseOrder/auditSql.js'
import { signJwtHs256, verifyJwtHs256 } from '../functions/adminapi/stock/PurchaseOrder/jwt.js'
import {
  addDirectPurchaseStock,
  directPurchaseRemark,
  isDirectPurchaseStockFlow,
  purchaseReceivedQty,
} from '../src/utils/purchaseStock.ts'

const repairSql = readFileSync(new URL('./repair-po-683-receive.sql', import.meta.url), 'utf8')

test('审核函数在一个事务里入库、付款、改状态，并且不新建采购入库单', () => {
  assert.match(AUDIT_PURCHASE_ORDER_SQL, /CREATE OR REPLACE FUNCTION public\.audit_purchase_order/)
  assert.match(AUDIT_PURCHASE_ORDER_SQL, /FOR UPDATE/)
  assert.match(AUDIT_PURCHASE_ORDER_SQL, /INSERT INTO public\.stock_flow/)
  assert.match(AUDIT_PURCHASE_ORDER_SQL, /'procure_in'/)
  assert.match(AUDIT_PURCHASE_ORDER_SQL, /purchase_order#'/)
  assert.match(AUDIT_PURCHASE_ORDER_SQL, /INSERT INTO public\.pay_receipt/)
  assert.match(AUDIT_PURCHASE_ORDER_SQL, /finance_funds/)
  assert.match(AUDIT_PURCHASE_ORDER_SQL, /received_qty/)
  assert.match(AUDIT_PURCHASE_ORDER_SQL, /SET status = 1/)
  assert.doesNotMatch(AUDIT_PURCHASE_ORDER_SQL, /procure_inhouse/)
  const already = AUDIT_PURCHASE_ORDER_SQL.indexOf('p_status = 1 AND v_po.status = 1')
  const insertFlow = AUDIT_PURCHASE_ORDER_SQL.indexOf('INSERT INTO public.stock_flow')
  assert.ok(already > 0 && insertFlow > already)
  const guard = AUDIT_PURCHASE_ORDER_SQL.indexOf('IF NOT v_has_stock THEN')
  assert.ok(guard > 0 && guard < insertFlow)
})

test('同一张采购单的直接入库流水只计一次，历史入库单流水不混进来', () => {
  const totals = {}
  addDirectPurchaseStock(totals, [
    { type: 'procure_in', remark: directPurchaseRemark(683), goods_id: 856, qty: 10 },
    { type: 'procure_in', remark: directPurchaseRemark(683), goods_id: 856, qty: 10 },
    { type: 'procure_in', remark: '采购入库审核', goods_id: 856, qty: 5 },
    { type: 'other_in', remark: directPurchaseRemark(683), goods_id: 856, qty: 99 },
  ])
  assert.equal(totals[856], 20)
  assert.equal(isDirectPurchaseStockFlow({ type: 'procure_in', remark: '采购入库审核' }), false)
  assert.equal(purchaseReceivedQty(75, 10), 85)
  assert.equal(purchaseReceivedQty(0, '10'), 10)
})

test('补救脚本只补 683 的 +10，重复执行会跳过，并且不写付款', () => {
  assert.match(repairSql, /purchase_order#683/)
  assert.match(repairSql, /PO2026111513054946976/)
  assert.match(repairSql, /goods_id = 856/)
  assert.match(repairSql, /'procure_in', 10/)
  assert.match(repairSql, /received_qty = 10/)
  assert.match(repairSql, /已经有入库流水，跳过/)
  assert.doesNotMatch(repairSql, /pay_receipt/)
  assert.doesNotMatch(repairSql, /procure_inhouse/)
  assert.doesNotMatch(repairSql, /SET status/)
})

test('采购单审核令牌校验拒绝伪造签名', async () => {
  const secret = 'erp_secret_2024'
  const token = await signJwtHs256({ id: 1, shop_id: 1, exp: Math.floor(Date.now() / 1000) + 60 }, secret)
  const claims = await verifyJwtHs256(token, secret)
  assert.equal(claims.id, 1)
  assert.equal(claims.shop_id, 1)
  await assert.rejects(() => verifyJwtHs256(token, 'wrong-secret'))
  await assert.rejects(() => verifyJwtHs256('a.b.c', secret))
  const expired = await signJwtHs256({ id: 1, shop_id: 1, exp: Math.floor(Date.now() / 1000) - 10 }, secret)
  await assert.rejects(() => verifyJwtHs256(expired, secret))
})
