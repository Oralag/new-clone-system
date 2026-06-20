/**
 * 统一的采购订单供应商名称显示逻辑：
 * - goods_info 中有多个不同 supplier_id → "多供应商"
 * - goods_info 中只有一个 supplier_id → 对应供应商名
 * - 否则回退到订单级 supplier_name，再回退到 supplierList 查找
 */
export function getProcureOrderSupplierLabel(
  row: any,
  supplierList: any[] = []
): string {
  try {
    const items: any[] =
      typeof row.goods_info === 'string'
        ? JSON.parse(row.goods_info)
        : row.goods_info || []
    const ids = [
      ...new Set(
        items.map((i: any) => Number(i.supplier_id)).filter(Boolean)
      ),
    ]
    if (ids.length > 1) return '多供应商'
    if (ids.length === 1) {
      const itemName = items.find((i: any) => i.supplier_id)?.supplier_name
      const listName = supplierList.find((s: any) => s.id === ids[0])?.name
      return itemName || listName || row.supplier_name || '—'
    }
  } catch {}
  return (
    row.supplier_name ||
    supplierList.find((s: any) => s.id === row.supplier_id)?.name ||
    '—'
  )
}

/**
 * 取采购订单的供应商 ID：优先用订单级 supplier_id，其次从 goods_info 明细中提取（单一供应商时）
 */
export function getProcureOrderSupplierId(row: any): number {
  if (row.supplier_id) return Number(row.supplier_id)
  try {
    const items: any[] =
      typeof row.goods_info === 'string'
        ? JSON.parse(row.goods_info)
        : row.goods_info || []
    const ids = [
      ...new Set(
        items.map((i: any) => Number(i.supplier_id)).filter(Boolean)
      ),
    ]
    if (ids.length === 1) return ids[0]
  } catch {}
  return 0
}

/**
 * 付款单 → 反查对应采购订单 → 取供应商显示名
 * payRow: 付款单行；purchaseOrders: 已加载的采购订单列表；supplierList: 供应商列表
 */
export function getPayReceiptSupplierLabel(
  payRow: any,
  purchaseOrders: any[],
  supplierList: any[] = []
): string {
  // 附加费用付款：直接显示 contact_name，不反查供应商
  if (/采购附加费用/.test(String(payRow.remark || ''))) {
    return payRow.contact_name || '—'
  }
  const sn = payRow.order_sn || payRow.order_no || ''
  const remarkId = String(payRow.remark || '').match(
    /采购单(?:自动)?付款\s+#(\d+)/
  )?.[1]
  const order = purchaseOrders.find(
    (o: any) =>
      (sn && (o.order_sn === sn || o.order_no === sn)) ||
      (remarkId && String(o.id) === remarkId)
  )
  if (order) return getProcureOrderSupplierLabel(order, supplierList)
  return payRow.supplier_name || payRow.contact_name || '—'
}
