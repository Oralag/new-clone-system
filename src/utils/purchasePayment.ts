/**
 * 采购货款的关联与展示。
 * 列表「已付」和详情「已付 / 付款账户」都走这里，只认付款单，不读采购单上的 pay_amount、fund_id。
 * 一张付款单只走一条匹配路径，避免备注、order_id、单号同时命中时把同一笔款加两次。
 */

const GOODS_PAYMENT_ID = /(?:采购单(?:自动)?付款|Purchase Order Payment)\s*#(\d+)/g
const AUTO_GENERATED_SN = /采购单([A-Za-z0-9]+)审核自动生成/
const NOT_GOODS_PAYMENT = /采购单据支出|采购运费|采购附加费用|Purchase Addon Fee/

export interface PurchasePaymentState {
  idAmounts: Record<number, number>
  snAmounts: Record<string, number>
  keyAmounts: Record<string, number>
  idFunds: Record<number, string[]>
  snFunds: Record<string, string[]>
  keyFunds: Record<string, string[]>
}

export interface MultiSupplierReceipt {
  supplier: string
  amount: number
  fundName: string
}

export function emptyPurchasePaymentState(): PurchasePaymentState {
  return {
    idAmounts: {},
    snAmounts: {},
    keyAmounts: {},
    idFunds: {},
    snFunds: {},
    keyFunds: {},
  }
}

export function purchasePayKey(orderSn: string, supplierName: string): string {
  return `${String(orderSn || '').trim()}@@${String(supplierName || '').trim()}`
}

function supplierOf(receipt: any): string {
  return String(receipt?.supplier_name || receipt?.contact_name || '').trim()
}

function fundOf(receipt: any): string {
  return String(receipt?.fund_name || '').trim()
}

function addAmount(bucket: Record<number | string, number>, key: number | string, amount: number) {
  bucket[key] = (bucket[key] || 0) + amount
}

function addFund(bucket: Record<number | string, string[]>, key: number | string, fundName: string) {
  const name = String(fundName || '').trim()
  if (!name) return
  const list = bucket[key] || (bucket[key] = [])
  if (!list.includes(name)) list.push(name)
}

function uniqueIds(remark: string): number[] {
  const ids = [...String(remark || '').matchAll(GOODS_PAYMENT_ID)].map((match) => Number(match[1]))
  return [...new Set(ids.filter((id) => Number.isSafeInteger(id) && id > 0))]
}

/** 一张付款单最多贡献一次货款。费用、运费、附加费不进货款。 */
export function collectPurchaseGoodsPayments(receipts: any[]): {
  state: PurchasePaymentState
  multiReceipts: MultiSupplierReceipt[]
} {
  const state = emptyPurchasePaymentState()
  const multiReceipts: MultiSupplierReceipt[] = []
  for (const receipt of receipts || []) {
    const amount = Number(receipt?.amount || 0)
    if (!(amount > 0)) continue
    const remark = String(receipt?.remark || '')
    if (NOT_GOODS_PAYMENT.test(remark)) continue
    const ids = uniqueIds(remark)
    const fundName = fundOf(receipt)
    if (ids.length > 1) {
      const supplier = supplierOf(receipt)
      if (supplier) multiReceipts.push({ supplier, amount, fundName })
      continue
    }
    if (ids.length === 1) {
      addAmount(state.idAmounts, ids[0], amount)
      addFund(state.idFunds, ids[0], fundName)
      continue
    }
    const orderId = Number(receipt?.order_id)
    if (Number.isSafeInteger(orderId) && orderId > 0) {
      addAmount(state.idAmounts, orderId, amount)
      addFund(state.idFunds, orderId, fundName)
      continue
    }
    const auto = remark.match(AUTO_GENERATED_SN)
    if (auto) {
      const sn = auto[1].trim()
      addAmount(state.snAmounts, sn, amount)
      addFund(state.snFunds, sn, fundName)
      continue
    }
    const orderSn = String(receipt?.order_sn || '').trim()
    const supplier = supplierOf(receipt)
    if (orderSn && supplier) {
      const key = purchasePayKey(orderSn, supplier)
      addAmount(state.keyAmounts, key, amount)
      addFund(state.keyFunds, key, fundName)
    }
  }
  return { state, multiReceipts }
}

function orderPayable(order: any): number {
  return Number(order?.after_discount) > 0 ? Number(order.after_discount) : Number(order?.total_amount ?? 0)
}

/** 一条备注里点名多张采购单时，按该供应商未付顺序拆开，每张单只分到这次的一部分。 */
export function allocateMultiSupplierPayments(
  state: PurchasePaymentState,
  orders: any[],
  multiReceipts: MultiSupplierReceipt[],
) {
  const grouped = new Map<string, MultiSupplierReceipt[]>()
  for (const receipt of multiReceipts) {
    const list = grouped.get(receipt.supplier) || []
    list.push(receipt)
    grouped.set(receipt.supplier, list)
  }
  for (const [supplier, receipts] of grouped) {
    const supplierOrders = (orders || [])
      .filter((order) => Number(order?.status) === 1 && String(order?.supplier_name || '').trim() === supplier)
      .sort((a, b) => Number(a?.id) - Number(b?.id))
    for (const receipt of receipts) {
      let remaining = receipt.amount
      for (const order of supplierOrders) {
        if (remaining <= 0) break
        const owe = Math.max(0, orderPayable(order) - paidAmountForOrder(state, order))
        const deduct = Math.min(remaining, owe)
        if (deduct > 0) {
          const id = Number(order.id)
          addAmount(state.idAmounts, id, deduct)
          addFund(state.idFunds, id, receipt.fundName)
          remaining -= deduct
        }
      }
    }
  }
}

export function paidAmountForOrder(state: PurchasePaymentState, order: any): number {
  const orderSn = String(order?.order_sn || '').trim()
  const orderNo = String(order?.order_no || '').trim()
  const supplier = String(order?.supplier_name || '').trim()
  return (state.idAmounts[Number(order?.id)] || 0)
    + (state.snAmounts[orderSn] || state.snAmounts[orderNo] || 0)
    + (state.keyAmounts[purchasePayKey(orderSn, supplier)] || state.keyAmounts[purchasePayKey(orderNo, supplier)] || 0)
}

export function fundNamesForOrder(state: PurchasePaymentState, order: any): string[] {
  const orderSn = String(order?.order_sn || '').trim()
  const orderNo = String(order?.order_no || '').trim()
  const supplier = String(order?.supplier_name || '').trim()
  const names = [
    ...(state.idFunds[Number(order?.id)] || []),
    ...(state.snFunds[orderSn] || state.snFunds[orderNo] || []),
    ...(state.keyFunds[purchasePayKey(orderSn, supplier)] || state.keyFunds[purchasePayKey(orderNo, supplier)] || []),
  ]
  return names.filter((name, index) => name && names.indexOf(name) === index)
}
