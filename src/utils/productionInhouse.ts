import { createProductionInhouse, auditProductionInhouse } from '@/api/production'
import { applyMaterialStockDelta } from '@/utils/materialStock'

function toNumber(value: any) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function getResponseId(res: any, fallbackId = 0) {
  return Number(res?.data?.id || res?.data?.data?.id || res?.data || fallbackId || 0)
}

function buildAuditStockItems(row: any) {
  return [{
    goods_id: row.goods_id || 0,
    goods_name: row.goods_name || '',
    goods_sn: row.goods_sn || '',
    unit_name: row.unit_name || '',
    avg_price: toNumber(row.in_price || row.avg_price || 0),
    num: toNumber(row.inhouse_qty || row.num || 0),
    warehouse_id: row.warehouse_id || 0,
    warehouse_name: row.warehouse_name || '',
  }].filter((item: any) => (item.goods_id || item.goods_sn || item.goods_name) && item.num > 0)
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
  const basePayload = {
    plan_id: options.plan_id,
    plan_no: options.plan_no || '',
    inhouse_date: options.inhouse_date,
    warehouse_id: options.warehouse_id || 0,
    warehouse_name: options.warehouse_name || '',
    admin_name: options.admin_name || '',
    remark: options.remark || '',
    inhouse_no: options.inhouse_no || '',
  }

  const savedRows: any[] = []
  for (const item of options.items || []) {
    const createPayload = {
      ...basePayload,
      goods_id: item.goods_id || 0,
      goods_name: item.goods_name || '',
      inhouse_qty: toNumber(item.num || item.inhouse_qty || 0),
    }
    if (!createPayload.inhouse_qty) continue
    const res = await createProductionInhouse(createPayload)
    savedRows.push({
      ...createPayload,
      id: getResponseId(res),
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

  return { rows: savedRows, changedCount: auditedRows.length }
}
