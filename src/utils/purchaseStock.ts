/** 采购单直接入库写在 stock_flow 上的标记。历史采购入库单用的是另一套备注，两边互不重复计数。 */
export const DIRECT_PURCHASE_FLOW_TYPE = 'procure_in'
export const DIRECT_PURCHASE_REMARK_PREFIX = 'purchase_order#'

export function directPurchaseRemark(orderId: number): string {
  return `${DIRECT_PURCHASE_REMARK_PREFIX}${Number(orderId)}`
}

export function isDirectPurchaseStockFlow(row: any): boolean {
  return String(row?.type || '') === DIRECT_PURCHASE_FLOW_TYPE
    && String(row?.remark || '').startsWith(DIRECT_PURCHASE_REMARK_PREFIX)
}

/** 只累加采购单审核直接写入的流水，不把历史采购入库单的流水再加一遍。 */
export function addDirectPurchaseStock(totals: Record<number, number>, flows: any[]): void {
  for (const row of flows || []) {
    if (!isDirectPurchaseStockFlow(row)) continue
    const goodsId = Number(row.goods_id)
    const qty = Number(row.qty)
    if (!goodsId || !qty) continue
    totals[goodsId] = (totals[goodsId] || 0) + qty
  }
}

/** 列表上的入库数量 = 历史采购入库单 + 采购单直接入库。两条路径不会同时记同一张新单。 */
export function purchaseReceivedQty(inhouseQty: number, receivedQty: any): number {
  return Number(inhouseQty || 0) + Number(receivedQty || 0)
}
