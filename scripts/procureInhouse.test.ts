import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PurchaseFlowError,
  ensurePurchaseOrderInhouse,
  inhouseRecordId,
  normalizeInhouseDate,
  receiveThenAuditPurchase,
} from '../src/utils/procureInhouse.ts'

const item = {
  goods_id: 856,
  goods_sn: 'SP0000179',
  goods_name: '科尔沁/大奶豆腐',
  num: 10,
  price: 32,
  unit_name: '张',
  unit_ratio: 1,
}

const backdatedOrder = {
  orderId: 683,
  supplier_id: 98,
  supplier_name: '科尔沁奶食品',
  warehouse_id: 189,
  warehouse_name: '牧区纯坊门店',
  admin_name: '管理员',
  order_date: '2026-11-13',
  created_at: '2026-11-15T05:07:27.327Z',
  remark: '供应商单号 XS202611130047',
  items: [item],
}

test('单据日期是日期对象时按本地年月日入库，不会切出 Fri Nov 13', () => {
  assert.equal(normalizeInhouseDate(new Date(2026, 10, 13, 13, 5, 49)), '2026-11-13')
  assert.equal(normalizeInhouseDate('2026-11-13'), '2026-11-13')
  assert.equal(normalizeInhouseDate('2026-11-13T05:07:27.327Z'), '2026-11-13')
  const fromText = normalizeInhouseDate('Fri Nov 13 2026 08:00:00 GMT+0800')
  assert.match(fromText, /^\d{4}-\d{2}-\d{2}$/)
  assert.equal(fromText.startsWith('Fri'), false)
})

test('创建入库单的返回值既可能是对象 id，也可能直接是数字 id', () => {
  assert.equal(inhouseRecordId({ data: { id: 584 } }), 584)
  assert.equal(inhouseRecordId({ data: 584 }), 584)
  assert.equal(inhouseRecordId({ data: '584' }), 584)
  assert.equal(inhouseRecordId({ data: {} }), 0)
})

test('没有入库单时先创建再审核，并用单据日期和字符串明细', async () => {
  const calls: string[] = []
  const result = await ensurePurchaseOrderInhouse({
    list: async () => ({ data: { rows: [] } }),
    create: async (data) => {
      calls.push('create')
      assert.equal(data.purchase_order_id, 683)
      assert.equal(data.in_date, '2026-11-13')
      assert.equal(data.warehouse_id, 189)
      assert.equal(typeof data.goods_info, 'string')
      assert.deepEqual(JSON.parse(data.goods_info), [item])
      assert.equal(data.total_amount, undefined)
      return { data: { id: 584 } }
    },
    audit: async (id, status) => {
      calls.push(`audit:${id}:${status}`)
      return { data: {} }
    },
  }, backdatedOrder)
  assert.deepEqual(calls, ['create', 'audit:584:1'])
  assert.deepEqual(result, { inhouseId: 584, created: true, alreadyAudited: false })
})

test('已有已审核入库单时不再创建、不再审核', async () => {
  let created = 0
  let audited = 0
  const result = await ensurePurchaseOrderInhouse({
    list: async () => ({ data: { rows: [{ id: 583, purchase_order_id: 683, status: 1 }] } }),
    create: async () => { created++; return { data: { id: 999 } } },
    audit: async () => { audited++ },
  }, backdatedOrder)
  assert.equal(created, 0)
  assert.equal(audited, 0)
  assert.deepEqual(result, { inhouseId: 583, created: false, alreadyAudited: true })
})

test('已有未审核入库单时只审核这一张，不另建', async () => {
  const result = await ensurePurchaseOrderInhouse({
    list: async () => ({ data: { rows: [{ id: 12, purchase_order_id: 683, status: 0 }] } }),
    create: async () => { throw new Error('不应再创建') },
    audit: async (id, status) => {
      assert.equal(id, 12)
      assert.equal(status, 1)
    },
  }, backdatedOrder)
  assert.equal(result.created, false)
  assert.equal(result.alreadyAudited, false)
  assert.equal(result.inhouseId, 12)
})

test('创建成功但响应没有 id 时，按采购单再查一次，查不到就停止', async () => {
  let creates = 0
  await assert.rejects(
    () => ensurePurchaseOrderInhouse({
      list: async () => ({ data: { rows: [] } }),
      create: async () => { creates++; return { data: {} } },
      audit: async () => { throw new Error('不应审核') },
    }, backdatedOrder),
    (error: any) => error instanceof PurchaseFlowError && error.code === 'INHOUSE_FAILED' && /单号/.test(error.message),
  )
  assert.equal(creates, 1)
})

test('创建响应丢了 id，但库里已经有未审核入库单时，审核这一张', async () => {
  let listed = 0
  const result = await ensurePurchaseOrderInhouse({
    list: async () => {
      listed++
      return listed === 1
        ? { data: { rows: [] } }
        : { data: { rows: [{ id: 590, purchase_order_id: 683, status: 0 }] } }
    },
    create: async () => ({ data: null }),
    audit: async (id) => { assert.equal(id, 590) },
  }, backdatedOrder)
  assert.equal(result.inhouseId, 590)
  assert.equal(result.created, true)
})

test('查询入库单失败时不创建，并抛出可识别的入库失败', async () => {
  let created = 0
  await assert.rejects(
    () => ensurePurchaseOrderInhouse({
      list: async () => { throw new Error('服务器繁忙') },
      create: async () => { created++; return { data: { id: 1 } } },
      audit: async () => {},
    }, backdatedOrder),
    (error: any) => error instanceof PurchaseFlowError && error.code === 'INHOUSE_FAILED' && /服务器繁忙/.test(error.message),
  )
  assert.equal(created, 0)
})

test('没有仓库或没有可入库商品时不请求接口', async () => {
  let calls = 0
  const api = {
    list: async () => { calls++; return { data: { rows: [] } } },
    create: async () => ({ data: { id: 1 } }),
    audit: async () => {},
  }
  await assert.rejects(() => ensurePurchaseOrderInhouse(api, { ...backdatedOrder, warehouse_id: 0 }))
  await assert.rejects(() => ensurePurchaseOrderInhouse(api, { ...backdatedOrder, items: [{ goods_id: 0, num: 10 }] }))
  assert.equal(calls, 0)
})

test('保存并审核：入库失败时不审核采购单，因此不会先付款', async () => {
  let audited = 0
  await assert.rejects(
    () => receiveThenAuditPurchase({
      payAmount: 320,
      fundId: 7,
      ensureInhouse: async () => { throw new PurchaseFlowError('创建采购入库单失败', 'INHOUSE_FAILED') },
      auditOrder: async () => { audited++ },
    }),
    (error: any) => error.code === 'INHOUSE_FAILED',
  )
  assert.equal(audited, 0)
})

test('保存并审核：入库成功且付清时才返回财务成功；审核失败要标明货已入库', async () => {
  const paid = await receiveThenAuditPurchase({
    payAmount: 320,
    fundId: 7,
    ensureInhouse: async () => {},
    auditOrder: async () => {},
  })
  assert.equal(paid, 'inhouse_and_finance')

  const unpaid = await receiveThenAuditPurchase({
    payAmount: 0,
    fundId: 0,
    ensureInhouse: async () => {},
    auditOrder: async () => {},
  })
  assert.equal(unpaid, 'inhouse')

  await assert.rejects(
    () => receiveThenAuditPurchase({
      payAmount: 320,
      fundId: 7,
      ensureInhouse: async () => {},
      auditOrder: async () => { throw new Error('资金账户不存在') },
    }),
    (error: any) => error instanceof PurchaseFlowError
      && error.code === 'AUDIT_AFTER_INHOUSE'
      && /资金账户不存在/.test(error.message),
  )
})
