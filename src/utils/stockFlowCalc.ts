/**
 * 根据所有出入库单据（流水）汇总每个 goods_id 的库存数量。
 * 用于替代直接读 StockAll 表的不可靠 qty 值。
 *
 * 数据来源：
 *  + 采购入库（排除退货相关）
 *  - 采购退货
 *  - 销售出库
 *  - 零售出库
 *  + 其他入库
 *  - 其他出库
 *  + 生产入库
 *  - 生产领料
 */
import http from '@/api/http'

function parseGoodsInfo(raw: any): any[] {
  if (!raw) return []
  if (typeof raw === 'string') {
    if (!raw.trim()) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return Array.isArray(raw) ? raw : []
}

/**
 * 计算所有商品基于流水的库存数量
 * @returns Record<number, number>  goods_id -> 净库存数量
 */
export async function calcStockByFlow(): Promise<Record<number, number>> {
  const fqMap: Record<number, number> = {}

  const [inhouseRes, retailRes, returnRes, saleOutRes, otherInRes, otherOutRes, prodInRes, prodOutRes] = await Promise.allSettled([
    http.get('/procure/ProcureInhouse/index', { params: { list_rows: 1000 } }),
    http.get('/retail/order/index', { params: { list_rows: 1000 } }),
    http.get('/procure/ProcureReturn/index', { params: { list_rows: 1000 } }),
    http.get('/stock/SaleOutOrder/index', { params: { list_rows: 1000, status: 1 } }),
    http.get('/stock/OtherIn/index', { params: { list_rows: 1000 } }),
    http.get('/stock/OtherOut/index', { params: { list_rows: 1000 } }),
    http.get('/production/inhouse/index', { params: { list_rows: 1000 } }),
    http.get('/production/material/index', { params: { list_rows: 1000 } }),
  ])

  // 退货单涉及的入库单 id 集合，排除
  const returnInhouseIds = new Set<number>()
  if (returnRes.status === 'fulfilled') {
    for (const r of (returnRes.value.data?.rows ?? [])) {
      const inhouseId = Number(r.inhouse_id || 0)
      if (inhouseId) returnInhouseIds.add(inhouseId)
    }
  }

  // 采购入库 +
  if (inhouseRes.status === 'fulfilled') {
    for (const r of (inhouseRes.value.data?.rows ?? [])) {
      if (returnInhouseIds.has(Number(r.id))) continue
      if (String(r.remark || '').includes('退货')) continue
      const items = parseGoodsInfo(r.goods_info)
      for (const item of items) {
        const gid = Number(item.goods_id)
        const qty = Number(item.num || 0)
        if (gid && qty) fqMap[gid] = (fqMap[gid] || 0) + qty
      }
    }
  }

  // 采购退货 -
  if (returnRes.status === 'fulfilled') {
    for (const r of (returnRes.value.data?.rows ?? [])) {
      if (r.status !== 1) continue
      const items = parseGoodsInfo(r.goods_info).filter((i: any) => !i._meta)
      for (const item of items) {
        const gid = Number(item.goods_id)
        const qty = Number(item.num || 0)
        if (gid && qty) fqMap[gid] = (fqMap[gid] || 0) - qty
      }
    }
  }

  // 销售出库 -
  if (saleOutRes.status === 'fulfilled') {
    for (const r of (saleOutRes.value.data?.rows ?? [])) {
      const items = parseGoodsInfo(r.goods_info)
      for (const item of items) {
        const gid = Number(item.goods_id)
        const qty = Number(item.num || 0)
        if (gid && qty) fqMap[gid] = (fqMap[gid] || 0) - qty
      }
    }
  }

  // 零售出库 -
  if (retailRes.status === 'fulfilled') {
    for (const r of (retailRes.value.data?.rows ?? [])) {
      const items = parseGoodsInfo(r.goods_info)
      for (const item of items) {
        const gid = Number(item.goods_id)
        const qty = Number(item.num || item.qty || 0)
        if (gid && qty) fqMap[gid] = (fqMap[gid] || 0) - qty
      }
    }
  }

  // 其他入库 +
  if (otherInRes.status === 'fulfilled') {
    for (const r of (otherInRes.value.data?.rows ?? [])) {
      if (r.status !== 1) continue
      const items = parseGoodsInfo(r.goods_info)
      for (const item of items) {
        const gid = Number(item.goods_id)
        const qty = Number(item.num || 0)
        if (gid && qty) fqMap[gid] = (fqMap[gid] || 0) + qty
      }
    }
  }

  // 其他出库 -
  if (otherOutRes.status === 'fulfilled') {
    for (const r of (otherOutRes.value.data?.rows ?? [])) {
      if (r.status !== 1) continue
      const items = parseGoodsInfo(r.goods_info)
      for (const item of items) {
        const gid = Number(item.goods_id)
        const qty = Number(item.num || 0)
        if (gid && qty) fqMap[gid] = (fqMap[gid] || 0) - qty
      }
    }
  }

  // 生产入库 +（单品记录）
  if (prodInRes.status === 'fulfilled') {
    for (const r of (prodInRes.value.data?.rows ?? [])) {
      if (r.status !== 1) continue
      const gid = Number(r.goods_id)
      const qty = Number(r.inhouse_qty || r.qty || 0)
      if (gid && qty) fqMap[gid] = (fqMap[gid] || 0) + qty
    }
  }

  // 生产领料 -
  if (prodOutRes.status === 'fulfilled') {
    for (const r of (prodOutRes.value.data?.rows ?? [])) {
      if (r.status !== 1) continue
      const items = parseGoodsInfo(r.goods_info)
      for (const item of items) {
        const gid = Number(item.goods_id)
        const qty = Number(item.num || 0)
        if (gid && qty) fqMap[gid] = (fqMap[gid] || 0) - qty
      }
    }
  }

  return fqMap
}
