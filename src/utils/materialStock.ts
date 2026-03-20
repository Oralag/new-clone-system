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
  warehouse_id: number
  warehouse_name: string
  qty: number
}

function toNumber(value: any): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
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
    const goodsSn = String(item?.goods_sn || '').trim()
    const goodsName = String(item?.goods_name || item?.name || '商品')
    if (!goodsId && !goodsSn) continue

    const warehouseId = pickWarehouseId(item, options.defaultWarehouseId)
    const warehouseName = pickWarehouseName(item, options.defaultWarehouseName)
    const key = `${warehouseId || warehouseName || 'default'}::${goodsId || goodsSn}`
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
      warehouse_id: warehouseId,
      warehouse_name: warehouseName,
      qty,
    })
  }

  return [...groups.values()]
}

function findStockRow(rows: any[], group: StockGroup) {
  return rows.find((row: any) => {
    const rowGoodsId = toNumber(row?.goods_id)
    const rowGoodsSn = String(row?.goods_sn || '').trim()
    const rowWarehouseId = toNumber(row?.warehouse_id)
    const rowWarehouseName = String(row?.warehouse_name || '').trim()

    const goodsMatched = group.goods_id
      ? rowGoodsId === group.goods_id
      : !!group.goods_sn && rowGoodsSn === group.goods_sn

    if (!goodsMatched) return false
    if (group.warehouse_id && rowWarehouseId) return rowWarehouseId === group.warehouse_id
    if (group.warehouse_name && rowWarehouseName) return rowWarehouseName === group.warehouse_name
    return true
  }) || rows[0]
}

export async function applyMaterialStockDelta(items: any[], options: MaterialStockOptions) {
  const groups = groupItems(items, options)
  const snapshots: MaterialStockSnapshot[] = []
  let changedCount = 0

  try {
    for (const group of groups) {
      const params: any = { list_rows: 50 }
      if (group.goods_sn) params.goods_sn = group.goods_sn
      else if (group.goods_id) params.goods_id = group.goods_id
      if (group.warehouse_id) params.warehouse_id = group.warehouse_id
      else if (group.warehouse_name) params.warehouse_name = group.warehouse_name

      const res = await http.get('/stock/StockAll/index', { params })
      const rows: any[] = res.data?.rows ?? res.data?.list ?? []
      const stockRow = findStockRow(rows, group)
      if (!stockRow) {
        throw new Error(`${group.goods_name}未找到库存记录`)
      }

      const currentQty = toNumber(stockRow.qty ?? stockRow.stock_num)
      const delta = options.direction === 'deduct' ? -group.qty : group.qty
      const nextQty = toNumber(currentQty + delta)
      if (nextQty < 0) {
        throw new Error(`${group.goods_name}库存不足，当前库存 ${currentQty}`)
      }

      snapshots.push({ id: toNumber(stockRow.id), qty: currentQty })
      await http.post('/stock/StockAll/edit', { id: stockRow.id, qty: nextQty })
      changedCount += 1
    }
  } catch (error) {
    if (snapshots.length) await rollbackMaterialStockDelta(snapshots)
    throw error
  }

  return { changedCount, snapshots }
}

export async function rollbackMaterialStockDelta(snapshots: MaterialStockSnapshot[]) {
  for (const snapshot of snapshots || []) {
    await http.post('/stock/StockAll/edit', { id: snapshot.id, qty: snapshot.qty })
  }
}
