import { createExpense, deleteExpense, getExpenseList, updateExpense } from '@/api/finance'
import { createProductionInhouse, auditProductionInhouse } from '@/api/production'
import { applyMaterialStockDelta } from '@/utils/materialStock'

function toNumber(value: any) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function getResponseId(res: any, fallbackId = 0) {
  return Number(res?.data?.id || res?.data?.data?.id || res?.data || fallbackId || 0)
}

function text(value: any) {
  return String(value || '').trim()
}

export function generateProductionInhouseOrderSn() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `SCRK${ymd}${rand}`
}

export function normalizeProductionInhouseItems(items: any[], defaults?: any) {
  return (items || [])
    .map((item: any) => ({
      goods_id: item.goods_id || defaults?.goods_id || 0,
      goods_name: item.goods_name || defaults?.goods_name || '',
      goods_sn: item.goods_sn || defaults?.goods_sn || '',
      unit_name: item.unit_name || defaults?.unit_name || '',
      spec: item.spec || defaults?.spec || '',
      num: toNumber(item.num ?? item.inhouse_qty ?? defaults?.inhouse_qty),
      material_price: toNumber(item.material_price),
      process_price: toNumber(item.process_price),
      in_price: toNumber(item.in_price ?? item.avg_price ?? defaults?.in_price ?? defaults?.avg_price),
      total_cost: toNumber(item.total_cost),
      warehouse_id: item.warehouse_id || defaults?.warehouse_id || 0,
      warehouse_name: item.warehouse_name || defaults?.warehouse_name || '',
    }))
    .filter((item: any) => (item.goods_id || item.goods_sn || item.goods_name) && item.num > 0)
}

export function buildProductionInhouseGoodsInfo(items: any[], defaults?: any) {
  return JSON.stringify(normalizeProductionInhouseItems(items, defaults))
}

export function calcProductionLaborTotal(items: any[]) {
  return normalizeProductionInhouseItems(items).reduce(
    (sum: number, item: any) => sum + toNumber(item.num) * toNumber(item.process_price),
    0
  )
}

function isAutoProductionLaborExpense(row: any, orderSn: string) {
  const typeName = text(row?.type_name || row?.title || row?.expense_type || row?.name)
  const remark = text(row?.remark_clean || row?.remark)
  const rowOrderSn = text(row?.order_sn || row?.expense_no)
  return (
    rowOrderSn === orderSn &&
    /生产人工成本|人工成本/.test(typeName) &&
    /生产入库人工成本/.test(remark)
  )
}

async function getMatchedProductionLaborExpenses(orderSn: string) {
  if (!orderSn) return []
  const res = await getExpenseList({ list_rows: 1000 })
  const rows: any[] = res.data?.rows ?? res.data?.list ?? []
  return rows.filter((row: any) => isAutoProductionLaborExpense(row, orderSn))
}

export async function syncProductionLaborExpense(options: {
  order_sn?: string
  inhouse_date?: string
  admin_name?: string
  items?: any[]
  active?: boolean
}) {
  const orderSn = text(options?.order_sn)
  if (!orderSn) return

  const items = normalizeProductionInhouseItems(options?.items || [])
  const goodsSummary = items.map((item: any) => item.goods_name).filter(Boolean).join('、').slice(0, 80)
  const amount = calcProductionLaborTotal(items)
  const matched = await getMatchedProductionLaborExpenses(orderSn)

  if (options?.active === false || amount <= 0) {
    for (const row of matched) {
      if (row?.payment_status === 'paid') continue
      await deleteExpense(Number(row.id))
    }
    return
  }

  const payload = {
    type_name: '生产人工成本',
    amount,
    apply_date: options?.inhouse_date || new Date().toISOString().slice(0, 10),
    order_sn: orderSn,
    applicant_name: options?.admin_name || '',
    payment_status: matched[0]?.payment_status || 'pending',
    remark: `生产入库人工成本 - ${goodsSummary || orderSn}`,
  }

  if (!matched.length) {
    await createExpense(payload)
    return
  }

  await updateExpense({
    id: matched[0].id,
    ...payload,
  })

  for (const row of matched.slice(1)) {
    if (row?.payment_status === 'paid') continue
    await deleteExpense(Number(row.id))
  }
}

function buildAuditStockItems(row: any) {
  const goodsInfo = (() => {
    try {
      return normalizeProductionInhouseItems(JSON.parse(row?.goods_info || '[]'), row)
    } catch {
      return []
    }
  })()

  if (goodsInfo.length) {
    return goodsInfo.map((item: any) => ({
      ...item,
      avg_price: toNumber(item.in_price || item.avg_price),
    }))
  }

  return normalizeProductionInhouseItems([{
    goods_id: row.goods_id || 0,
    goods_name: row.goods_name || '',
    goods_sn: row.goods_sn || '',
    unit_name: row.unit_name || '',
    avg_price: toNumber(row.in_price || row.avg_price || 0),
    num: toNumber(row.inhouse_qty || row.num || 0),
    warehouse_id: row.warehouse_id || 0,
    warehouse_name: row.warehouse_name || '',
  }]).map((item: any) => ({
    ...item,
    avg_price: toNumber(item.in_price || item.avg_price),
  }))
}

async function syncAuditAndStock(row: any, status: 0 | 1) {
  await auditProductionInhouse(row.id, status)

  const items = buildAuditStockItems(row)
  if (!items.length) return { changedCount: 0 }

  try {
    return await applyMaterialStockDelta(items, {
      direction: status === 1 ? 'restore' : 'deduct',
      defaultWarehouseId: row.warehouse_id,
      defaultWarehouseName: row.warehouse_name || '',
    })
  } catch (error) {
    try {
      await auditProductionInhouse(row.id, status === 1 ? 0 : 1)
    } catch {}
    throw error
  }
}

export async function createProductionInhouseAndAutoAudit(options: {
  plan_id: number
  plan_no?: string
  inhouse_date: string
  warehouse_id: number
  warehouse_name?: string
  admin_name?: string
  remark?: string
  inhouse_no?: string
  items: any[]
}) {
  const sharedOrderSn = options.inhouse_no || generateProductionInhouseOrderSn()
  const basePayload = {
    plan_id: options.plan_id,
    plan_no: options.plan_no || '',
    inhouse_date: options.inhouse_date,
    warehouse_id: options.warehouse_id || 0,
    warehouse_name: options.warehouse_name || '',
    admin_name: options.admin_name || '',
    remark: options.remark || '',
    inhouse_no: sharedOrderSn,
  }

  const savedRows: any[] = []
  for (const item of options.items || []) {
    const normalizedItems = normalizeProductionInhouseItems([item], {
      warehouse_id: options.warehouse_id,
      warehouse_name: options.warehouse_name || '',
    })
    const goodsInfo = buildProductionInhouseGoodsInfo(normalizedItems)
    const createPayload = {
      ...basePayload,
      goods_id: item.goods_id || 0,
      goods_name: item.goods_name || '',
      inhouse_qty: toNumber(item.num || item.inhouse_qty || 0),
      goods_info: goodsInfo,
    }
    if (!createPayload.inhouse_qty) continue
    const res = await createProductionInhouse(createPayload)
    savedRows.push({
      ...createPayload,
      id: getResponseId(res),
      order_sn: text(res?.data?.order_sn || res?.data?.data?.order_sn || sharedOrderSn),
      goods_sn: item.goods_sn || '',
      unit_name: item.unit_name || '',
      in_price: toNumber(item.in_price || item.avg_price || 0),
    })
  }

  const auditedRows: any[] = []
  try {
    for (const row of savedRows) {
      await syncAuditAndStock(row, 1)
      auditedRows.push(row)
    }
  } catch (error) {
    for (const row of [...auditedRows].reverse()) {
      try {
        await syncAuditAndStock(row, 0)
      } catch {}
    }
    throw error
  }

  await syncProductionLaborExpense({
    order_sn: text(savedRows[0]?.order_sn || sharedOrderSn),
    inhouse_date: options.inhouse_date,
    admin_name: options.admin_name || '',
    items: options.items || [],
    active: true,
  })

  return { rows: savedRows, changedCount: auditedRows.length }
}
