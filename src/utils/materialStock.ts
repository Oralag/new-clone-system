import http from '@/api/http'

export type MaterialStockDirection = 'deduct' | 'restore'

export interface MaterialStockOptions {
  direction: MaterialStockDirection
  defaultWarehouseId?: number | null
  defaultWarehouseName?: string
}

export interface MaterialStockSnapshot {
  id: number
  qty: number
}

interface StockGroup {
  key: string
  goods_id: number
  goods_sn: string
  goods_name: string
  unit_name: string
  warehouse_id: number
  warehouse_name: string
  qty: number
  avg_price: number
}

function toNumber(value: any): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function cleanText(value: any): string {
  return String(value || '').trim().replace(/\s+/g, '')
}

function pickWarehouseId(item: any, fallbackId?: number | null): number {
  return toNumber(item?.warehouse_id || fallbackId || 0)
}

function pickWarehouseName(item: any, fallbackName = ''): string {
  return String(item?.warehouse_name || fallbackName || '')
}

function groupItems(items: any[], options: MaterialStockOptions): StockGroup[] {
  const groups = new Map<string, StockGroup>()

  for (const item of items || []) {
    const qty = toNumber(item?.num ?? item?.qty)
    if (qty <= 0) continue

    const goodsId = toNumber(item?.goods_id)
    const goodsSn = cleanText(item?.goods_sn)
    const goodsName = String(item?.goods_name || item?.name || '商品').trim()
    const unitName = String(item?.unit_name || '').trim()
    const avgPrice = toNumber(item?.avg_price ?? item?.in_price ?? item?.price ?? item?.cost_price)
    if (!goodsId && !goodsSn && !goodsName) continue

    const warehouseId = pickWarehouseId(item, options.defaultWarehouseId)
    const warehouseName = pickWarehouseName(item, options.defaultWarehouseName)
    const key = `${warehouseId || warehouseName || 'default'}::${goodsSn || goodsId || goodsName}`
    const existing = groups.get(key)

    if (existing) {
      existing.qty = toNumber(existing.qty + qty)
      continue
    }

    groups.set(key, {
      key,
      goods_id: goodsId,
      goods_sn: goodsSn,
      goods_name: goodsName,
      unit_name: unitName,
      warehouse_id: warehouseId,
      warehouse_name: warehouseName,
      qty,
      avg_price: avgPrice,
    })
  }

  return [...groups.values()]
}

function goodsMatchScore(row: any, group: StockGroup) {
  const rowGoodsId = toNumber(row?.goods_id)
  const rowGoodsSn = cleanText(row?.goods_sn)
  const rowGoodsName = cleanText(row?.goods_name)
  const targetName = cleanText(group.goods_name)

  if (group.goods_sn && rowGoodsSn && rowGoodsSn === group.goods_sn) return 100
  if (group.goods_id && rowGoodsId && rowGoodsId === group.goods_id) return 90
  if (targetName && rowGoodsName && rowGoodsName === targetName) return 70
  if (targetName && rowGoodsName && (rowGoodsName.includes(targetName) || targetName.includes(rowGoodsName))) return 50
  return 0
}

function warehouseMatchScore(row: any, group: StockGroup) {
  const rowWarehouseId = toNumber(row?.warehouse_id)
  const rowWarehouseName = cleanText(row?.warehouse_name)
  const targetWarehouseName = cleanText(group.warehouse_name)

  if (group.warehouse_id && rowWarehouseId && rowWarehouseId === group.warehouse_id) return 20
  if (targetWarehouseName && rowWarehouseName && rowWarehouseName === targetWarehouseName) return 15
  if (!group.warehouse_id && !targetWarehouseName) return 5
  return 0
}

function dedupeRows(rows: any[]) {
  const map = new Map<string, any>()
  for (const row of rows || []) {
    const key = String(row?.id || `${row?.goods_sn || ''}-${row?.goods_id || ''}-${row?.warehouse_id || row?.warehouse_name || ''}`)
    if (!map.has(key)) map.set(key, row)
  }
  return [...map.values()]
}

async function fetchStockRows(group: StockGroup) {
  const queries: any[] = []
  const baseQuery: any = { list_rows: 200 }

  if (group.goods_sn) {
    queries.push({ ...baseQuery, goods_sn: group.goods_sn, ...(group.warehouse_id ? { warehouse_id: group.warehouse_id } : {}), ...(group.warehouse_name ? { warehouse_name: group.warehouse_name } : {}) })
    queries.push({ ...baseQuery, goods_sn: group.goods_sn })
  }
  if (group.goods_id) {
    queries.push({ ...baseQuery, goods_id: group.goods_id, ...(group.warehouse_id ? { warehouse_id: group.warehouse_id } : {}), ...(group.warehouse_name ? { warehouse_name: group.warehouse_name } : {}) })
    queries.push({ ...baseQuery, goods_id: group.goods_id })
  }
  if (group.goods_name) {
    queries.push({ ...baseQuery, goods_name: group.goods_name, ...(group.warehouse_id ? { warehouse_id: group.warehouse_id } : {}), ...(group.warehouse_name ? { warehouse_name: group.warehouse_name } : {}) })
    queries.push({ ...baseQuery, keyword: group.goods_name })
  }
  queries.push({ list_rows: 2000, ...(group.warehouse_id ? { warehouse_id: group.warehouse_id } : {}), ...(group.warehouse_name ? { warehouse_name: group.warehouse_name } : {}) })
  queries.push({ list_rows: 2000 })

  const collected: any[] = []
  for (const params of queries) {
    try {
      const res = await http.get('/stock/StockAll/index', { params })
      const rows: any[] = res.data?.rows ?? res.data?.list ?? []
      collected.push(...rows)
      if (collected.length) {
        const matched = findStockRow(collected, group)
        if (matched) return dedupeRows(collected)
      }
    } catch {
      // ignore and continue fallback query
    }
  }

  return dedupeRows(collected)
}

function findStockRow(rows: any[], group: StockGroup) {
  let bestRow: any = null
  let bestScore = 0

  for (const row of rows || []) {
    const score = goodsMatchScore(row, group) + warehouseMatchScore(row, group)
    if (score > bestScore) {
      bestScore = score
      bestRow = row
    }
  }

  return bestScore > 0 ? bestRow : null
}

export async function applyMaterialStockDelta(items: any[], options: MaterialStockOptions) {
  const groups = groupItems(items, options)
  const processed: Array<{ group: StockGroup, direction: MaterialStockDirection }> = []
  let changedCount = 0

  try {
    for (const group of groups) {
      const endpoint = options.direction === 'deduct' ? '/stock/OtherOut' : '/stock/OtherIn'
      const addRes = await http.post(`${endpoint}/add`, {
        warehouse_id: group.warehouse_id || 0,
        goods_info: [{ goods_id: group.goods_id, num: group.qty, goods_name: group.goods_name, in_price: group.avg_price || 0 }],
        remark: options.direction === 'deduct' ? '生产领料出库' : '生产入库',
      })
      const orderId = toNumber(addRes?.data?.id)
      if (!orderId) throw new Error(`${group.goods_name}创建出入库单失败`)
      await http.post(`${endpoint}/audit`, { id: orderId, status: 1 })
      processed.push({ group, direction: options.direction })
      changedCount += 1
    }
  } catch (error) {
    if (processed.length) await rollbackMaterialStockDelta(processed)
    throw error
  }

  return { changedCount, snapshots: processed as any }
}

export async function rollbackMaterialStockDelta(snapshots: Array<{ group: StockGroup, direction: MaterialStockDirection }> | MaterialStockSnapshot[]) {
  for (const item of snapshots || []) {
    if ('group' in item) {
      const reverseMode = item.direction === 'deduct' ? 'restore' : 'deduct'
      const endpoint = reverseMode === 'deduct' ? '/stock/OtherOut' : '/stock/OtherIn'
      try {
        const addRes = await http.post(`${endpoint}/add`, {
          warehouse_id: item.group.warehouse_id || 0,
          goods_info: [{ goods_id: item.group.goods_id, num: item.group.qty, goods_name: item.group.goods_name }],
          remark: '库存回滚',
        })
        if (addRes?.data?.id) await http.post(`${endpoint}/audit`, { id: addRes.data.id, status: 1 })
      } catch { /* ignore rollback errors */ }
    }
  }
}
